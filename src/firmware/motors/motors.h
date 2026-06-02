#ifndef MOTORS_H
#define MOTORS_H

#include <Arduino.h>

static constexpr uint32_t MOTOR_PWM_FREQ       = 20000; // 20 kHz — acima da faixa audível
static constexpr uint8_t  MOTOR_PWM_RESOLUTION = 8;     // 8 bits → duty 0–255

static constexpr uint8_t CH_MOT1_IN1 = 0;
static constexpr uint8_t CH_MOT1_IN2 = 1;
static constexpr uint8_t CH_MOT2_IN1 = 2;
static constexpr uint8_t CH_MOT2_IN2 = 3;

/**
 * @brief Inicializa os canais LEDC e vincula aos pinos definidos em pins.h.
 * Deve ser chamada uma vez em setup().
 */
void motors_init();

/**
 * @brief Converte um valor de potência em percentagem (0 a 100) para sinal PWM (0 a 255).
 * @param percentual Valor de 0 a 100. Valores fora desta faixa serão limitados.
 * @return Valor PWM correspondente (0 a 255).
 */
int converter_percentual_para_pwm(int percentual);

/**
 * @brief Controla o Motor Esquerdo (M1 / AIN).
 * @param velocidade  −255 = ré máxima · 0 = parado · +255 = frente máxima
 */
void motor_esquerdo_set(int velocidade);

/**
 * @brief Controla o Motor Direito (M2 / BIN).
 * @param velocidade  −255 = ré máxima · 0 = parado · +255 = frente máxima
 */
void motor_direito_set(int velocidade);

/**
 * @brief Para ambos os motores com frenagem ativa (brake).
 * Ambos os pinos em HIGH → DRV8833 trava eletricamente.
 * Usar para parada precisa nas células do labirinto.
 */
void motors_stop_all();

/**
 * @brief Para ambos os motores em modo coast (parada livre).
 * Ambos os pinos em LOW → motor desacelera por inércia.
 * Usar em desacelerações graduais e transições suaves.
 */
void motors_coast_all();

#endif