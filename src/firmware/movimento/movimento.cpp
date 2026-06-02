#include "movimento.h"
#include "../motors/motors.h"

void mover_frente(int velocidade, unsigned long tempo_ms) {
    motor_esquerdo_set(velocidade);
    motor_direito_set(velocidade);
    delay(tempo_ms);
    motors_stop_all();
}

void mover_tras(int velocidade, unsigned long tempo_ms) {
    motor_esquerdo_set(-velocidade);
    motor_direito_set(-velocidade);
    delay(tempo_ms);
    motors_stop_all();
}

void girar_esquerda(int velocidade, unsigned long tempo_ms) {
    motor_esquerdo_set(-velocidade); 
    motor_direito_set(velocidade);   
    delay(tempo_ms);
    motors_stop_all();
}

void girar_direita(int velocidade, unsigned long tempo_ms) {
    motor_esquerdo_set(velocidade);   
    motor_direito_set(-velocidade);  
    delay(tempo_ms);
    motors_stop_all();
}