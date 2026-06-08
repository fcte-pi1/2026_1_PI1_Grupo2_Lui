#ifndef MOTORS_H
#define MOTORS_H

#include <Arduino.h>

class Motors {
private:
    // Mantemos apenas o que está soldado fisicamente
    int pinIN1_R, pinIN1_L; 
    int chn_R, chn_L;
    int freq;
    int res;

    /**
     * @brief Configura os periféricos de PWM do ESP32.
     */
    void config();

public:
    /**
     * @brief Construtor para 2 pinos (conforme sua soldagem atual).
     * Passamos 6 argumentos: 2 pinos, 2 canais, frequência e resolução.
     */
    Motors(int _pinIN1_R, int _pinIN1_L,
           int _chn_R, int _chn_L,
           int _freq, int _res);

    void setRightSpeed(int velocity);
    void setLeftSpeed(int velocity);
    void setSpeeds(int velocity_R, int velocity_L);
};

#endif