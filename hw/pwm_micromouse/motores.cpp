#include "motors.h"
#include <Arduino.h> // Necessário para as funções de hardware

Motors::Motors(int _pinIN1_R, int _pinIN1_L, int _chn_R, int _chn_L, int _freq, int _res)
    : pinIN1_R(_pinIN1_R), pinIN1_L(_pinIN1_L), chn_R(_chn_R), chn_L(_chn_L), freq(_freq), res(_res)
{
    config();
}

void Motors::config() {
    // Para a versão 2.x do ESP32, usamos Setup + AttachPin
    ledcSetup(chn_R, freq, res);
    ledcAttachPin(pinIN1_R, chn_R);
    
    ledcSetup(chn_L, freq, res);
    ledcAttachPin(pinIN1_L, chn_L);
}

void Motors::setRightSpeed(int velocity) {
    // Importante: No framework 2.x, o ledcWrite usa o CANAL (0 ou 1)
    ledcWrite(chn_R, velocity);
}

void Motors::setLeftSpeed(int velocity) {
    ledcWrite(chn_L, velocity);
}

void Motors::setSpeeds(int velocity_R, int velocity_L) {
    setRightSpeed(velocity_R);
    setLeftSpeed(velocity_L);
}