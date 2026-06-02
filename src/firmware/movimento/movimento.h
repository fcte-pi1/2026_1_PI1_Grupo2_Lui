#ifndef MOVIMENTO_H
#define MOVIMENTO_H

#include <Arduino.h>

void mover_frente(int velocidade, unsigned long tempo_ms);
void mover_tras(int velocidade, unsigned long tempo_ms);
void girar_esquerda(int velocidade, unsigned long tempo_ms);
void girar_direita(int velocidade, unsigned long tempo_ms);

#endif