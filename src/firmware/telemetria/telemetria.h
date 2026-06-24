// Telemetria via Bluetooth Classic (SPP), conforme src/contrato_telemetria.md.
//
// O ESP32 envia 1 pacote JSON por linha (NDJSON) pelo Bluetooth (e eco no USB).
// No notebook, scripts/bt_bridge.py lê a porta serial, carimba o timestamp
// ISO 8601 e repassa cada pacote como POST /telemetria. Comandos do dashboard
// (botão Iniciar) chegam pela mesma serial via telemetry_poll_command().
//
// Uso típico (ver main_telemetria.cpp):
//   telemetry_init();                      // no setup()
//   telemetry_set_maze(8);                 // tamanho vindo do comando "start 8"
//   telemetry_start_race();
//   telemetry_set_position(x, y, z, ori);  // sempre que a odometria atualizar
//   telemetry_push_path_point(x, y, z);    // a cada célula nova
//   telemetry_set_wall(x, y, dir, true);   // parede descoberta -> vai ao vivo
//   telemetry_loop(bateria_v, vel_mm_s);   // TODA iteração do loop(); envia a
//                                          // cada TELEMETRY_PERIOD_MS sem travar
//   telemetry_send_finished(success, bat); // pacote final (dispara persistência)
//   telemetry_send_error("motivo", bat);   // em falha grave
#ifndef TELEMETRY_H
#define TELEMETRY_H

#include <Arduino.h>
#include "../config/telemetria_config.h"

// Capacidade do caminho percorrido
#define TELEMETRY_MAX_PATH 512

enum RaceStatus { RACE_READY, RACE_RUNNING, RACE_PAUSED, RACE_FINISHED, RACE_ERROR };

struct PathPoint { float x; float y; float z; };

// --- ciclo de vida -----------------------------------------------------------
void telemetry_init();
bool telemetry_client_connected();   // true se o notebook está pareado/conectado

// --- estado da corrida -------------------------------------------------------
void telemetry_set_maze(uint8_t size);                    // 4, 8 ou 16
uint8_t telemetry_maze_size();
void telemetry_start_race();                              // zera cronômetro/caminho
void telemetry_set_status(RaceStatus s);
void telemetry_set_position(float x_mm, float y_mm, float z_ms2, float orientation_deg);
void telemetry_push_path_point(float x_mm, float y_mm, float z_ms2);
void telemetry_set_objective(float x_mm, float y_mm, float z_ms2);
// Marca/limpa paredes descobertas (dir 0=N, 1=L, 2=S, 3=O). Paredes novas são
// incluídas automaticamente no próximo pacote periódico (dashboard ao vivo).
void telemetry_set_wall(uint8_t cell_x, uint8_t cell_y, uint8_t dir, bool present);

// --- envio -------------------------------------------------------------------
// Chamar em TODA iteração do loop(); envia pacote "running" a cada
// TELEMETRY_PERIOD_MS usando millis() — nunca bloqueia o movimento.
void telemetry_loop(float battery_v, float speed_mm_s);

// Envia evento imediato (prioridade alta no contrato)
void telemetry_send_event(const char* event, const char* message,
                          float battery_v, float speed_mm_s);

// Pacote final: race_status=finished + success + caminho completo + known_walls
void telemetry_send_finished(bool success, float battery_v);

// Falha grave: race_status=error (backend descarta o buffer)
void telemetry_send_error(const char* motivo, float battery_v);

// --- comandos ----------------------------------------------------------------
// Lê comandos por linha vindos do USB ou do Bluetooth (ex.: "start 8" enviado
// pelo botão Iniciar do dashboard via bt_bridge.py). Chamar no loop();
// retorna true quando uma linha completa chegou em `out`.
bool telemetry_poll_command(char* out, size_t out_len);

#endif // TELEMETRY_H
