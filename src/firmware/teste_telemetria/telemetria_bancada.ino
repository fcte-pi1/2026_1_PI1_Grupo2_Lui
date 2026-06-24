// ----------------------------------------------------------------------------
// telemetria_bancada.ino 
// Simulador rodando direto no ESP32 pra gente testar o dashboard na bancada
// sem precisar botar o robô na pista de verdade.
// Basicamente um port do useMazeSimulator.js (DFS + flood fill).
// Comunica por BT igual o firmware oficial (ou USB se quiser debugar).
//
// Como usar:
// 1. Grava no ESP32 (precisa da lib ArduinoJson 7). Monitor serial em 921600.
// 2. Roda a API: python scripts/run_backend.py
// 3. Roda a ponte: python scripts/bt_bridge.py --port COMx (troca pro seu port)
// 4. Vai na aba do mapa no dashboard, escolhe o tamanho e manda iniciar!
// ----------------------------------------------------------------------------

#include <Arduino.h>
#include <BluetoothSerial.h>
#include <ArduinoJson.h>

#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error "Bluetooth Classic nao esta habilitado neste build do ESP32."
#endif

// configs basicas
#define BT_DEVICE_NAME       "MICROMOUSE"
#define ROBOT_ID             "micromouse_01"
#define MAZE_SIZE_MAX        16      // max q roda na ram do esp
#define TELEMETRY_PERIOD_MS  150     // mandando a ~6.7 Hz (contrato pede 1hz no min)
#define STEP_MS              250     // ms por quadradinho, o robô virtual anda meio devagar
#define SERIAL_BAUD          921600  // tem q bater com o baud rate do bridge.py
#define CELL_SIZE_MM         180.0f  // tamanho padrao da celula
#define TELEMETRY_MAX_PATH   512

// bota 1 aqui pra printar os jsons no cabo usb tb, util pra ver oq ta saindo
#define USB_TELEMETRY        0

static const float BAT_INICIAL_V = 8.0f;
static const float BAT_FINAL_V   = 7.1f;

// ----------------------------------------------------------------------------
// MANDANDO OS DADOS PRO PC (meio copiado do firmware oficial)
// ----------------------------------------------------------------------------
static BluetoothSerial SerialBT;

enum RaceStatus { RACE_READY, RACE_RUNNING, RACE_PAUSED, RACE_FINISHED, RACE_ERROR };
struct PathPoint { float x; float y; float z; };

static RaceStatus  g_status = RACE_READY;
static float       g_pos_x = 0, g_pos_y = 0, g_pos_z = 9.81f, g_orientation = 0;
static PathPoint   g_path[TELEMETRY_MAX_PATH];
static uint16_t    g_path_len = 0;
static bool        g_walls[MAZE_SIZE_MAX][MAZE_SIZE_MAX][4] = {};
static bool        g_walls_dirty = false;
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

void telemetry_init() {
    SerialBT.begin(BT_DEVICE_NAME);
    Serial.printf("[telemetry] Bluetooth iniciado como \"%s\"\n", BT_DEVICE_NAME);
}

bool telemetry_client_connected() { return SerialBT.hasClient(); }

void telemetry_set_maze(uint8_t size) {
    if (size != 4 && size != 8 && size != 16) size = 4;
    g_maze_size = size;
    snprintf(g_maze_type, sizeof(g_maze_type), "%ux%u", size, size);
    memset(g_walls, 0, sizeof(g_walls));
    g_walls_dirty = false;
}

void telemetry_start_race() {
    g_race_start_ms = millis();
    g_last_send_ms  = 0;
    g_path_len      = 0;
    g_status        = RACE_RUNNING;
}

void telemetry_set_position(float x, float y, float z, float ori) {
    g_pos_x = x; g_pos_y = y; g_pos_z = z; g_orientation = ori;
}

void telemetry_push_path_point(float x, float y, float z) {
    if (g_path_len < TELEMETRY_MAX_PATH) g_path[g_path_len++] = { x, y, z };
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

static void emit(JsonDocument& doc) {
    if (SerialBT.hasClient()) {
        serializeJson(doc, SerialBT);
        SerialBT.write('\n');
    }
#if USB_TELEMETRY
    serializeJson(doc, Serial);  // cospe no usb tbm pra debug
    Serial.write('\n');
#endif
}

void telemetry_loop(float battery_v, float speed_mm_s) {
    if (g_status != RACE_RUNNING && g_status != RACE_PAUSED) return;
    uint32_t now = millis();
    if (now - g_last_send_ms < TELEMETRY_PERIOD_MS) return;
    g_last_send_ms = now;

    JsonDocument doc;
    fill_common(doc, battery_v, speed_mm_s);
    if (g_walls_dirty) {           // so envia os arrays de parede se o mouse achar coisa nova
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
                             : "Robô preso: sem caminho até o objetivo.";
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
        else len = 0;
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

// ----------------------------------------------------------------------------
// LÓGICA DO RATO VIRTUAL (gambiarra pra rodar igual o JS do app)
// ----------------------------------------------------------------------------
static const int8_t DX[4] = { 0, 1, 0, -1 };   // 0=N 1=L 2=S 3=O
static const int8_t DY[4] = { -1, 0, 1, 0 };

static uint8_t SIZE_ = 4;
static bool    truthWalls[MAZE_SIZE_MAX][MAZE_SIZE_MAX][4];
static bool    knownWalls[MAZE_SIZE_MAX][MAZE_SIZE_MAX][4];
static bool    wallInspected[MAZE_SIZE_MAX][MAZE_SIZE_MAX][4];
static uint8_t distances[MAZE_SIZE_MAX][MAZE_SIZE_MAX];
static uint8_t goalsXY[4][2];
static struct { uint8_t x, y, dir; } robot;
static uint16_t stepsCount = 0;

// pega os 4 quadrados do meio que o rato tem q chegar
static void getGoals(uint8_t size) {
    uint8_t mid = size / 2;
    goalsXY[0][0] = mid - 1; goalsXY[0][1] = mid - 1;
    goalsXY[1][0] = mid;     goalsXY[1][1] = mid - 1;
    goalsXY[2][0] = mid - 1; goalsXY[2][1] = mid;
    goalsXY[3][0] = mid;     goalsXY[3][1] = mid;
}

static bool isGoal(uint8_t x, uint8_t y) {
    for (uint8_t g = 0; g < 4; g++)
        if (goalsXY[g][0] == x && goalsXY[g][1] == y) return true;
    return false;
}

// gera o mapa: usa DFS, faz o meio ser 2x2 aberto e taca uns loops aleatorios
static void generateMaze(uint8_t size) {
    for (uint8_t x = 0; x < size; x++)
        for (uint8_t y = 0; y < size; y++)
            for (uint8_t d = 0; d < 4; d++)
                truthWalls[x][y][d] = true;

    static uint16_t stack_[MAZE_SIZE_MAX * MAZE_SIZE_MAX];
    static bool visited[MAZE_SIZE_MAX][MAZE_SIZE_MAX];
    memset(visited, 0, sizeof(visited));

    int top = 0;
    uint8_t startY = size - 1;
    stack_[top++] = (uint16_t)(0 * 16 + startY);
    visited[0][startY] = true;

    while (top > 0) {
        uint16_t cur = stack_[top - 1];
        uint8_t cx = cur / 16, cy = cur % 16;

        uint8_t opts[4]; uint8_t nopts = 0;
        for (uint8_t d = 0; d < 4; d++) {
            int nx = cx + DX[d], ny = cy + DY[d];
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && !visited[nx][ny])
                opts[nopts++] = d;
        }

        if (nopts > 0) {
            uint8_t d = opts[random(nopts)];
            uint8_t nx = cx + DX[d], ny = cy + DY[d];
            truthWalls[cx][cy][d] = false;
            truthWalls[nx][ny][(d + 2) % 4] = false;
            visited[nx][ny] = true;
            stack_[top++] = (uint16_t)(nx * 16 + ny);
        } else {
            top--;
        }
    }

    // tira as paredes do miolinho 2x2 do objetivo
    getGoals(size);
    for (uint8_t g = 0; g < 4; g++) {
        for (uint8_t d = 0; d < 4; d++) {
            int nx = goalsXY[g][0] + DX[d], ny = goalsXY[g][1] + DY[d];
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && isGoal(nx, ny))
                truthWalls[goalsXY[g][0]][goalsXY[g][1]][d] = false;
        }
    }

    // bota uns loops extras senao o labirinto fica só uma arvore facil
    uint16_t loops = (uint16_t)(size * size * 0.15f);
    for (uint16_t i = 0; i < loops; i++) {
        uint8_t rx = random(size - 2) + 1;
        uint8_t ry = random(size - 2) + 1;
        uint8_t rd = random(4);
        int nx = rx + DX[rd], ny = ry + DY[rd];
        truthWalls[rx][ry][rd] = false;
        truthWalls[nx][ny][(rd + 2) % 4] = false;
    }
}

// comeca sabendo nada, só q as bordas externas existem
static void initRobotMemory(uint8_t size) {
    for (uint8_t x = 0; x < size; x++)
        for (uint8_t y = 0; y < size; y++) {
            knownWalls[x][y][0] = wallInspected[x][y][0] = (y == 0);
            knownWalls[x][y][1] = wallInspected[x][y][1] = (x == size - 1);
            knownWalls[x][y][2] = wallInspected[x][y][2] = (y == size - 1);
            knownWalls[x][y][3] = wallInspected[x][y][3] = (x == 0);
            distances[x][y] = 255;
        }
}

// o velho flood fill basico a partir do centro
static void floodFill(uint8_t size) {
    for (uint8_t x = 0; x < size; x++)
        for (uint8_t y = 0; y < size; y++)
            distances[x][y] = 255;

    static uint16_t queue_[MAZE_SIZE_MAX * MAZE_SIZE_MAX];
    int head = 0, tail = 0;
    for (uint8_t g = 0; g < 4; g++) {
        distances[goalsXY[g][0]][goalsXY[g][1]] = 0;
        queue_[tail++] = (uint16_t)(goalsXY[g][0] * 16 + goalsXY[g][1]);
    }

    while (head < tail) {
        uint16_t cur = queue_[head++];
        uint8_t cx = cur / 16, cy = cur % 16;
        for (uint8_t d = 0; d < 4; d++) {
            if (knownWalls[cx][cy][d]) continue;
            int nx = cx + DX[d], ny = cy + DY[d];
            if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
            if (distances[nx][ny] == 255) {
                distances[nx][ny] = distances[cx][cy] + 1;
                queue_[tail++] = (uint16_t)(nx * 16 + ny);
            }
        }
    }
}

// achou um lugar sem saida (3 paredes)? ja bloqueia e propaga
static void checkDeadEnd(uint8_t x, uint8_t y, uint8_t size) {
    uint8_t walls = 0;
    for (uint8_t i = 0; i < 4; i++)
        if (knownWalls[x][y][i]) walls++;

    if (walls == 3) {
        for (uint8_t i = 0; i < 4; i++) {
            if (!wallInspected[x][y][i]) {
                knownWalls[x][y][i] = true;
                wallInspected[x][y][i] = true;
                int nx = x + DX[i], ny = y + DY[i];
                if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                    knownWalls[nx][ny][(i + 2) % 4] = true;
                    wallInspected[nx][ny][(i + 2) % 4] = true;
                    checkDeadEnd((uint8_t)nx, (uint8_t)ny, size);
                }
                break;
            }
        }
    }
}

// olha as paredes da celula atual, retorna true se tiver parede surpresa
static bool senseWalls(uint8_t size) {
    bool changed = false;
    uint8_t rx = robot.x, ry = robot.y;

    for (uint8_t d = 0; d < 4; d++) {
        wallInspected[rx][ry][d] = true;
        if (truthWalls[rx][ry][d] && !knownWalls[rx][ry][d]) {
            knownWalls[rx][ry][d] = true;
            changed = true;
            int nx = rx + DX[d], ny = ry + DY[d];
            if (nx >= 0 && nx < size && ny >= 0 && ny < size) {
                knownWalls[nx][ny][(d + 2) % 4] = true;
                wallInspected[nx][ny][(d + 2) % 4] = true;
                checkDeadEnd((uint8_t)nx, (uint8_t)ny, size);
            }
        }
    }
    return changed;
}

// escolhe o proximo passo pelo floodfill. desempate igual o do js
static int8_t getBestNeighbor(uint8_t size) {
    int8_t bestDir = -1;
    uint16_t minVal = 0xFFFF;
    uint8_t rDir = robot.dir;
    const uint8_t checkOrder[4] = {
        (uint8_t)((rDir + 3) % 4),  // Esquerda
        (uint8_t)((rDir + 2) % 4),  // Trás
        (uint8_t)((rDir + 1) % 4),  // Direita
        rDir                        // Frente
    };

    for (uint8_t i = 0; i < 4; i++) {
        uint8_t d = checkOrder[i];
        if (knownWalls[robot.x][robot.y][d]) continue;
        int nx = robot.x + DX[d], ny = robot.y + DY[d];
        if (nx < 0 || nx >= size || ny < 0 || ny >= size) continue;
        if (distances[nx][ny] <= minVal) {
            minVal = distances[nx][ny];
            bestDir = (int8_t)d;
        }
    }
    return bestDir;
}

// manda as info das paredes pra struct q vai pro json
static void publicar_paredes(uint8_t size) {
    for (uint8_t x = 0; x < size; x++)
        for (uint8_t y = 0; y < size; y++)
            for (uint8_t d = 0; d < 4; d++)
                telemetry_set_wall(x, y, d, knownWalls[x][y][d]);
}

static void publicar_posicao() {
    float x_mm = robot.x * CELL_SIZE_MM + CELL_SIZE_MM / 2;
    float y_mm = robot.y * CELL_SIZE_MM + CELL_SIZE_MM / 2;
    float z = 9.81f;
    telemetry_set_position(x_mm, y_mm, z, robot.dir * 90.0f);
    telemetry_push_path_point(x_mm, y_mm, z);
}

// ------------------------- MAQUINA DE ESTADOS -------------------------------
enum BenchState { WAIT_START, RACING, DONE };
static BenchState g_state = WAIT_START;
static uint32_t   g_last_step_ms = 0;
static float      g_battery_v = BAT_INICIAL_V;
static float      g_speed = 0;

static float bateria_atual(uint8_t size) {
    float prog = (float)stepsCount / (float)(size * size * 2);
    if (prog > 1.0f) prog = 1.0f;
    return BAT_INICIAL_V + (BAT_FINAL_V - BAT_INICIAL_V) * prog;
}

static void iniciar_corrida(uint8_t size) {
    SIZE_ = size;
    telemetry_set_maze(size);
    generateMaze(size);          // reseta mapa toda vez q aperta start
    initRobotMemory(size);
    getGoals(size);
    floodFill(size);

    robot.x = 0; robot.y = size - 1; robot.dir = 0;
    stepsCount = 0;
    g_battery_v = BAT_INICIAL_V;
    g_speed = CELL_SIZE_MM * 1000.0f / STEP_MS;

    // objetivo: centro geométrico da área 2x2 central
    float cx = (size / 2) * CELL_SIZE_MM;
    float cy = (size / 2) * CELL_SIZE_MM;
    telemetry_set_objective(cx, cy, 9.81f);

    telemetry_start_race();
    publicar_posicao();
    senseWalls(size);            // ja olha ao redor antes de mover
    floodFill(size);
    publicar_paredes(size);
    telemetry_send_event("start_race",
                         "Corrida iniciada: Robô em movimento.",
                         g_battery_v, g_speed);
    g_last_step_ms = millis();
    g_state = RACING;
    Serial.printf("[bancada] corrida %ux%u iniciada\n", size, size);
}

// o loop principal. da um passinho do rato.
// retorna 0 se dboa, 1 se chegou no gol, 2 se ficou preso msm
static uint8_t step_simulador() {
    bool changed = senseWalls(SIZE_);
    if (changed) floodFill(SIZE_);
    publicar_paredes(SIZE_);

    if (isGoal(robot.x, robot.y)) return 1;

    int8_t moveDir = getBestNeighbor(SIZE_);
    if (moveDir < 0) return 2;

    if ((uint8_t)moveDir != robot.dir) robot.dir = (uint8_t)moveDir;
    robot.x += DX[robot.dir];
    robot.y += DY[robot.dir];
    stepsCount++;
    g_battery_v = bateria_atual(SIZE_);

    publicar_posicao();
    return 0;
}

void setup() {
    Serial.begin(SERIAL_BAUD);
    delay(1000);
    randomSeed(micros());
    Serial.println("\n=== TELEMETRIA — MICROMOUSE SIMULADO (logica do dashboard) ===");
    telemetry_init();
    telemetry_set_maze(4);
    Serial.println("[bancada] Aguardando 'start <4|8|16>' (botao Iniciar do dashboard).");
}

void loop() {
    char cmd[32];
    bool tem_start = false, tem_reset = false;
    uint8_t start_size = 4;
    if (telemetry_poll_command(cmd, sizeof(cmd))) {
        if (strncmp(cmd, "start", 5) == 0) {
            tem_start = true;
            int s = atoi(cmd + 5);   // "start 8" -> 8; "start" -> 0
            if (s == 8 || s == 16) start_size = (uint8_t)s;
        } else if (strcmp(cmd, "reset") == 0) {
            tem_reset = true;
        }
    }

    // se mandar reset pelo front a gente dropa tudo e fica esperando novo start
    if (tem_reset) {
        if (g_state == RACING) {
            telemetry_send_error("Corrida reiniciada pelo dashboard", g_battery_v);
        }
        g_status = RACE_READY;
        g_state = WAIT_START;
        g_speed = 0;
        Serial.println("[bancada] Reset recebido — aguardando novo 'start'.");
        return;
    }

    switch (g_state) {
        case WAIT_START:
            if (tem_start) iniciar_corrida(start_size);
            break;

        case RACING:
            if (millis() - g_last_step_ms >= STEP_MS) {
                g_last_step_ms = millis();
                uint8_t r = step_simulador();
                if (r == 1) {
                    g_speed = 0;
                    telemetry_send_event("objective_found",
                                         "Objetivo localizado no centro do labirinto!",
                                         g_battery_v, 0.0f);
                    telemetry_send_finished(true, g_battery_v);
                    Serial.println("[bancada] Centro alcancado! FINISHED enviado.");
                    g_state = DONE;
                } else if (r == 2) {
                    g_speed = 0;
                    telemetry_send_finished(false, g_battery_v);
                    Serial.println("[bancada] Robo preso! FINISHED (success=false).");
                    g_state = DONE;
                }
            }
            telemetry_loop(g_battery_v, g_speed);
            break;

        case DONE:
            if (tem_start) iniciar_corrida(start_size);
            break;
    }
}
