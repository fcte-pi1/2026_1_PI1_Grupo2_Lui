#ifndef ENCODER_H
#define ENCODER_H

#include <Arduino.h>

// ── ATENÇÃO: ajustar conforme datasheet do motor ──────
// Verificar quantos pulsos a fase A gera por volta completa da roda.
// Valor típico para motores N20: 7 a 20 PPR (antes do redutor).
#define ENCODER_PPR  20  // TODO: confirmar na datasheet

// ── Inicialização ─────────────────────────────────────
void encoders_init();

// ── Leitura de contagem acumulada (thread-safe) ───────
long encoder_esquerdo_get();
long encoder_direito_get();

// ── Zera os contadores ────────────────────────────────
void encoder_esquerdo_reset();
void encoder_direito_reset();

// ── Sentido de rotação: +1 = frente, -1 = ré ─────────
int encoder_esquerdo_sentido();
int encoder_direito_sentido();

#endif // ENCODER_H
