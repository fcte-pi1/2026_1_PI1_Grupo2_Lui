// Firmware de telemetria — micromouse SIMULADO com a MESMA lógica do
// simulador do dashboard (src/frontend/src/useMazeSimulator.js):
// labirinto aleatório (DFS backtracker + loops), exploração por flood fill,
// descoberta de paredes com inferência de becos (checkDeadEnd).
//
// A corrida inicia ao receber "start <4|8|16>" (botão Iniciar do dashboard,
// repassado pela ponte bt_bridge.py). Paredes descobertas aparecem ao vivo.
//
// Build:  pio run -e telemetria -t upload
#include <Arduino.h>
#include "telemetria/telemetria.h"

static const float BAT_INICIAL_V = 8.0f;
static const float BAT_FINAL_V   = 7.1f;

// ============================================================================
// Lógica idêntica a useMazeSimulator.js (mesmos nomes e ordem de operações)
// ============================================================================
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

// DFS backtracker + área do objetivo aberta + 15% de loops
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

    getGoals(size);
    for (uint8_t g = 0; g < 4; g++) {
        for (uint8_t d = 0; d < 4; d++) {
            int nx = goalsXY[g][0] + DX[d], ny = goalsXY[g][1] + DY[d];
            if (nx >= 0 && nx < size && ny >= 0 && ny < size && isGoal(nx, ny))
                truthWalls[goalsXY[g][0]][goalsXY[g][1]][d] = false;
        }
    }

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

// ----------------------------- máquina de estados -----------------------------
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
    generateMaze(size);          // labirinto novo a cada corrida (igual "Novo")
    initRobotMemory(size);
    getGoals(size);
    floodFill(size);

    robot.x = 0; robot.y = size - 1; robot.dir = 0;
    stepsCount = 0;
    g_battery_v = BAT_INICIAL_V;
    g_speed = CELL_SIZE_MM * 1000.0f / STEP_MS;

    float cx = (size / 2) * CELL_SIZE_MM;
    float cy = (size / 2) * CELL_SIZE_MM;
    telemetry_set_objective(cx, cy, 9.81f);

    telemetry_start_race();
    publicar_posicao();
    senseWalls(size);            // sente a célula inicial
    floodFill(size);
    publicar_paredes(size);
    telemetry_send_event("start_race",
                         "Corrida iniciada: Robô em movimento.",
                         g_battery_v, g_speed);
    g_last_step_ms = millis();
    g_state = RACING;
    Serial.printf("[bancada] corrida %ux%u iniciada\n", size, size);
}

// step(): UMA iteração, idêntica ao step() do simulador.
// Retorna: 0 = seguindo, 1 = centro alcançado, 2 = preso
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

    // Reiniciar (dashboard): aborta a corrida atual (nada é persistido) e
    // volta a aguardar um novo 'start'.
    if (tem_reset) {
        if (g_state == RACING) {
            telemetry_send_error("Corrida reiniciada pelo dashboard", g_battery_v);
        }
        telemetry_set_status(RACE_READY);
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
