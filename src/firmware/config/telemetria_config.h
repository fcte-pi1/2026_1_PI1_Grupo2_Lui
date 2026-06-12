// Configuração da telemetria — edite aqui, sem tocar no código.
// Como o transporte é Bluetooth Classic (SPP), não há senha de Wi-Fi.
#ifndef TELEMETRY_CONFIG_H
#define TELEMETRY_CONFIG_H

// Nome que o ESP32 anuncia no pareamento Bluetooth
#define BT_DEVICE_NAME   "MICROMOUSE"

// Identificação do robô (contrato: robot_id). O tamanho do labirinto é
// definido em runtime pelo comando "start <4|8|16>" vindo do dashboard.
#define ROBOT_ID         "micromouse_01"
#define MAZE_SIZE_MAX    16

// Período de envio da telemetria (contrato exige >= 1 Hz; usamos ~6.7 Hz)
#define TELEMETRY_PERIOD_MS  150

// Tempo simulado por célula na corrida de bancada
#define STEP_MS          250

// Baud do USB serial — precisa bater com o --baud da ponte (bt_bridge.py).
// 115200 não comporta mapas 16x16 a ~7 Hz.
#define SERIAL_BAUD      921600

// Tamanho da célula do labirinto em mm (igual ao fake_robot.py)
#define CELL_SIZE_MM     180.0f

// 1 = telemetria/comandos também pelo cabo USB; 0 = SÓ Bluetooth
// (com 0, o USB serve apenas para alimentação e logs de debug)
#define USB_TELEMETRY    0

#endif // TELEMETRY_CONFIG_H
