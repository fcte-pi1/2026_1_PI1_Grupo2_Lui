#include <Arduino.h>
#include <motors.h>
#include "BluetoothSerial.h"

BluetoothSerial SerialBT;

// --- Configurações de Hardware ---
#define FREQ 50000
#define RES 8

// Pinos dos Encoders
#define ENCODER_CHN_A_L 36
#define ENCODER_CHN_B_L 39
#define ENCODER_CHN_A_R 35
#define ENCODER_CHN_B_R 34

// Pinos de PWM (Motores)
#define IN1_R 32 
#define IN1_L 33
#define CHN_R 0
#define CHN_L 1

Motors motors(IN1_R, IN1_L, CHN_R, CHN_L, FREQ, RES);

// --- Variáveis de Controle ---
volatile long encoderLeft = 0;
volatile long encoderRight = 0;

long lastEncoderLeft = 0;
long lastEncoderRight = 0;

unsigned long ultimaMensagem = 0;
const int intervaloTelemetria = 100; // Envia dados a cada 100ms pelo Bluetooth

float pwmTargetL = 0;
float pwmTargetR = 0;

// --- Interrupções dos Encoders ---
void IRAM_ATTR readEncoderL() {
  bool pinA = digitalRead(ENCODER_CHN_A_L);
  bool pinB = digitalRead(ENCODER_CHN_B_L);
  if (pinA == pinB) encoderLeft--;
  else encoderLeft++;
}

void IRAM_ATTR readEncoderR() {
  bool pinA = digitalRead(ENCODER_CHN_A_R);
  bool pinB = digitalRead(ENCODER_CHN_B_R);
  if (pinA == pinB) encoderRight++;
  else encoderRight--;
}

void setup() {
  Serial.begin(115200);
  
  // Inicia o Bluetooth
  SerialBT.begin("Motor_Encoder_Teste"); 
  Serial.println("Bluetooth Iniciado. Pronto para parear!");

  // Configuração dos Pinos dos Encoders
  pinMode(ENCODER_CHN_A_L, INPUT);
  pinMode(ENCODER_CHN_B_L, INPUT);
  pinMode(ENCODER_CHN_A_R, INPUT);
  pinMode(ENCODER_CHN_B_R, INPUT);

  attachInterrupt(digitalPinToInterrupt(ENCODER_CHN_A_L), readEncoderL, CHANGE);
  attachInterrupt(digitalPinToInterrupt(ENCODER_CHN_A_R), readEncoderR, CHANGE);

  // Garante que os motores comecem parados
  motors.setSpeeds(0, 0);
}

void loop() {
  unsigned long currentTime = millis();

  // --- 1. RECEBENDO PWM VIA BLUETOOTH ---
  // Se houver dados no Bluetooth, ele lê até a quebra de linha.
  if (SerialBT.available()) {
    String comando = SerialBT.readStringUntil('\n');
    comando.trim();
    
    // Espera receber no formato: "PWM_ESQ,PWM_DIR" (ex: "150,-150")
    int separador = comando.indexOf(',');
    if (separador > 0) {
      pwmTargetL = comando.substring(0, separador).toFloat();
      pwmTargetR = comando.substring(separador + 1).toFloat();
      
      // Proteção: Limita o PWM para não estourar a resolução de 8 bits
      pwmTargetL = constrain(pwmTargetL, -255, 255);
      pwmTargetR = constrain(pwmTargetR, -255, 255);
    }
  }

  // --- 2. APLICAÇÃO DO PWM NOS MOTORES ---
  // Envia os valores para a sua biblioteca. Valores negativos invertem a rotação.
  motors.setSpeeds(pwmTargetR, pwmTargetL);

  // --- 3. ENVIANDO LEITURAS VIA BLUETOOTH ---
  if (currentTime - ultimaMensagem >= intervaloTelemetria) {
    // Calcula quantos pulsos o encoder girou no último intervalo de tempo
    long deltaL = encoderLeft - lastEncoderLeft;
    long deltaR = encoderRight - lastEncoderRight;
    
    // Envia a telemetria formatada para o celular
    SerialBT.printf("PWM[E:%.0f D:%.0f] | Pulsos/100ms[E:%ld D:%ld] | Total[E:%ld D:%ld]\n", 
                    pwmTargetL, pwmTargetR, deltaL, deltaR, encoderLeft, encoderRight);

    // Atualiza as variáveis para a próxima checagem
    lastEncoderLeft = encoderLeft;
    lastEncoderRight = encoderRight;
    ultimaMensagem = currentTime;
  }
}