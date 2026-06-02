#include "motors.h"
#include "../pins.h"

static void motor_set(uint8_t chFwd, uint8_t chBwd, int velocidade) {
    velocidade = constrain(velocidade, -255, 255);
    if (velocidade > 0) {
        ledcWrite(chFwd,  velocidade);
        ledcWrite(chBwd,  0);
    } else if (velocidade < 0) {
        ledcWrite(chFwd,  0);
        ledcWrite(chBwd, -velocidade);
    } else {
        ledcWrite(chFwd, 0);
        ledcWrite(chBwd, 0);
    }
}

void motors_init() {
    ledcSetup(CH_MOT1_IN1, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION);
    ledcAttachPin(PIN_MOT1_IN1, CH_MOT1_IN1);

    ledcSetup(CH_MOT1_IN2, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION);
    ledcAttachPin(PIN_MOT1_IN2, CH_MOT1_IN2);

    ledcSetup(CH_MOT2_IN1, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION);
    ledcAttachPin(PIN_MOT2_IN1, CH_MOT2_IN1);

    ledcSetup(CH_MOT2_IN2, MOTOR_PWM_FREQ, MOTOR_PWM_RESOLUTION);
    ledcAttachPin(PIN_MOT2_IN2, CH_MOT2_IN2);

    motors_stop_all();
}

void motor_esquerdo_set(int velocidade) {
    motor_set(CH_MOT1_IN1, CH_MOT1_IN2, velocidade);
}

void motor_direito_set(int velocidade) {
    motor_set(CH_MOT2_IN1, CH_MOT2_IN2, velocidade);
}

void motors_stop_all() {
    // Brake ativo: ambos os pinos em HIGH → DRV8833 trava o motor eletricamente
    // Necessário para parada precisa nas células do labirinto
    ledcWrite(CH_MOT1_IN1, 255);
    ledcWrite(CH_MOT1_IN2, 255);
    ledcWrite(CH_MOT2_IN1, 255);
    ledcWrite(CH_MOT2_IN2, 255);
}

void motors_coast_all() {
    // Coast: ambos os pinos em LOW → motor desacelera por inércia
    // Usar em desacelerações graduais e transições suaves
    ledcWrite(CH_MOT1_IN1, 0);
    ledcWrite(CH_MOT1_IN2, 0);
    ledcWrite(CH_MOT2_IN1, 0);
    ledcWrite(CH_MOT2_IN2, 0);
}