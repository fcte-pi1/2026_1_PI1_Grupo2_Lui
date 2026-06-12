#include "telemetria.h"
#include <BluetoothSerial.h>
#include <ArduinoJson.h>

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error "Bluetooth Classic nao esta habilitado neste build do ESP32."
#endif

static BluetoothSerial SerialBT;

// ----------------------------- estado interno --------------------------------
static RaceStatus  g_status = RACE_READY;
static float       g_pos_x = 0, g_pos_y = 0, g_pos_z = 9.81f, g_orientation = 0;
static PathPoint   g_path[TELEMETRY_MAX_PATH];
static uint16_t    g_path_len = 0;
static bool        g_walls[MAZE_SIZE_MAX][MAZE_SIZE_MAX][4] = {};
static bool        g_walls_dirty = false;   // paredes novas desde o último envio
static uint8_t     g_maze_size = 4;
static char        g_maze_type[8] = "4x4";
static bool        g_has_objective = false;
static float       g_obj_x = 0, g_obj_y = 0, g_obj_z = 9.81f;
static uint32_t    g_race_start_ms = 0;
static uint32_t    g_last_send_ms = 0;

static const char* status_str(RaceStatus s) {
    switch (s) {
        case RACE_READY:    return "ready";
        case RACE_RUNNING:  return "running";
        case RACE_PAUSED:   return "paused";
        case RACE_FINISHED: return "finished";
        default:            return "error";
    }
}

// ----------------------------- ciclo de vida ---------------------------------
void telemetry_init() {
    SerialBT.begin(BT_DEVICE_NAME);  // ESP32 vira servidor SPP visível p/ pareamento
    Serial.printf("[telemetry] Bluetooth iniciado como \"%s\"\n", BT_DEVICE_NAME);
    Serial.println("[telemetry] Pareie no notebook e rode scripts/bt_bridge.py");
}

bool telemetry_client_connected() {
    return SerialBT.hasClient();
}

// ----------------------------- estado da corrida -----------------------------
// Define o labirinto em que o robô vai operar (seletor de matriz do dashboard)
void telemetry_set_maze(uint8_t size) {
    if (size != 4 && size != 8 && size != 16) size = 4;
    g_maze_size = size;
    snprintf(g_maze_type, sizeof(g_maze_type), "%ux%u", size, size);
    memset(g_walls, 0, sizeof(g_walls));
    g_walls_dirty = false;
}

uint8_t telemetry_maze_size() { return g_maze_size; }

void telemetry_start_race() {
    g_race_start_ms = millis();
    g_last_send_ms  = 0;
    g_path_len      = 0;
    g_status        = RACE_RUNNING;
}

void telemetry_set_status(RaceStatus s) { g_status = s; }

void telemetry_set_position(float x, float y, float z, float ori) {
    g_pos_x = x; g_pos_y = y; g_pos_z = z; g_orientation = ori;
}

void telemetry_push_path_point(float x, float y, float z) {
    if (g_path_len < TELEMETRY_MAX_PATH) {
        g_path[g_path_len++] = { x, y, z };
    }
}

void telemetry_set_objective(float x, float y, float z) {
    g_has_objective = true;
    g_obj_x = x; g_obj_y = y; g_obj_z = z;
}

void telemetry_set_wall(uint8_t cx, uint8_t cy, uint8_t dir, bool present) {
    if (cx < g_maze_size && cy < g_maze_size && dir < 4) {
        if (g_walls[cx][cy][dir] != present) g_walls_dirty = true;
        g_walls[cx][cy][dir] = present;
    }
}

// ----------------------------- montagem do JSON ------------------------------
// Campos obrigatórios do contrato. O timestamp ISO 8601 é carimbado pela ponte
// (bt_bridge.py) na chegada — o ESP32 não tem relógio de parede sem NTP.
static void fill_common(JsonDocument& doc, float battery_v, float speed_mm_s) {
    doc["robot_id"]  = ROBOT_ID;
    doc["maze_type"] = g_maze_type;
    doc["source"]    = "real";

    JsonObject pos = doc["current_position"].to<JsonObject>();
    pos["x"] = g_pos_x;
    pos["y"] = g_pos_y;
    pos["z"] = g_pos_z;
    pos["orientation"] = g_orientation;

    JsonArray path = doc["path_traversed"].to<JsonArray>();
    for (uint16_t i = 0; i < g_path_len; i++) {
        JsonObject p = path.add<JsonObject>();
        p["x"] = g_path[i].x;
        p["y"] = g_path[i].y;
        p["z"] = g_path[i].z;
    }

    doc["battery_voltage_v"] = battery_v;
    doc["speed_mm_s"]        = speed_mm_s;
    doc["elapsed_time_ms"]   = (uint32_t)(millis() - g_race_start_ms);
    doc["race_status"]       = status_str(g_status);
}

static void add_objective(JsonDocument& doc) {
    if (!g_has_objective) return;
    JsonObject o = doc["objective_location"].to<JsonObject>();
    o["x"] = g_obj_x; o["y"] = g_obj_y; o["z"] = g_obj_z;
}

static void add_known_walls(JsonDocument& doc) {
    JsonArray walls = doc["known_walls"].to<JsonArray>();
    for (uint8_t x = 0; x < g_maze_size; x++) {
        JsonArray col = walls.add<JsonArray>();
        for (uint8_t y = 0; y < g_maze_size; y++) {
            JsonArray cell = col.add<JsonArray>();
            for (uint8_t d = 0; d < 4; d++) cell.add(g_walls[x][y][d]);
        }
    }
}

// Envia o documento como uma linha NDJSON pelo Bluetooth
// (com USB_TELEMETRY=1, também ecoa pelo cabo USB)
static void emit(JsonDocument& doc) {
    if (SerialBT.hasClient()) {
        serializeJson(doc, SerialBT);
        SerialBT.write('\n');
    }
#if USB_TELEMETRY
    serializeJson(doc, Serial);
    Serial.write('\n');
#endif
}

// ----------------------------- envio -----------------------------------------
void telemetry_loop(float battery_v, float speed_mm_s) {
    if (g_status != RACE_RUNNING && g_status != RACE_PAUSED) return;
    uint32_t now = millis();
    if (now - g_last_send_ms < TELEMETRY_PERIOD_MS) return;  // não bloqueia
    g_last_send_ms = now;

    JsonDocument doc;
    fill_common(doc, battery_v, speed_mm_s);
    if (g_walls_dirty) {           // paredes recém-descobertas vão junto, ao vivo
        add_known_walls(doc);
        g_walls_dirty = false;
    }
    emit(doc);
}

void telemetry_send_event(const char* event, const char* message,
                          float battery_v, float speed_mm_s) {
    JsonDocument doc;
    fill_common(doc, battery_v, speed_mm_s);
    doc["event"]   = event;
    doc["message"] = message;
    if (strcmp(event, "objective_found") == 0) add_objective(doc);
    emit(doc);
}

void telemetry_send_finished(bool success, float battery_v) {
    g_status = RACE_FINISHED;
    JsonDocument doc;
    fill_common(doc, battery_v, 0.0f);
    doc["event"]   = "race_ended";
    doc["message"] = success ? "Corrida finalizada com sucesso!"
                             : "Corrida encerrada sem atingir o objetivo.";
    doc["success"] = success;
    add_objective(doc);
    add_known_walls(doc);
    emit(doc);
}

void telemetry_send_error(const char* motivo, float battery_v) {
    g_status = RACE_ERROR;
    JsonDocument doc;
    fill_common(doc, battery_v, 0.0f);
    doc["event"]   = "error_occurred";
    doc["message"] = motivo;
    emit(doc);
}

// ----------------------------- comandos --------------------------------------
static bool ler_linha(Stream& s, char* buf, uint8_t& len, char* out, size_t out_len) {
    while (s.available()) {
        char c = (char)s.read();
        if (c == '\r') continue;
        if (c == '\n') {
            buf[len] = '\0';
            strncpy(out, buf, out_len - 1);
            out[out_len - 1] = '\0';
            len = 0;
            return out[0] != '\0';
        }
        if (len < 31) buf[len++] = c;
        else len = 0;  // linha longa demais: descarta
    }
    return false;
}

bool telemetry_poll_command(char* out, size_t out_len) {
    static char buf_bt[32]; static uint8_t len_bt = 0;
#if USB_TELEMETRY
    static char buf_usb[32]; static uint8_t len_usb = 0;
    if (ler_linha(Serial, buf_usb, len_usb, out, out_len)) return true;
#endif
    if (ler_linha(SerialBT, buf_bt, len_bt, out, out_len)) return true;
    return false;
}
