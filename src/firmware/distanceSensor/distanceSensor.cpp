#include "distanceSensor.h"
#include <Wire.h>
#include <VL53L0X.h>
#include "pins.h"

// Criando os objetos para cada sensor
VL53L0X sensorEsq;
VL53L0X sensorFrente;
VL53L0X sensorDir;

// Definindo os novos endereços I2C (7-bit)
#define ENDERECO_TOF_ESQ    0x30
#define ENDERECO_TOF_FRENTE 0x31
#define ENDERECO_TOF_DIR    0x32

void configurarSensoresToF() {

  // Configurar os pinos XSHUT como saída
  pinMode(PIN_TOF1_XSHUT, OUTPUT);
  pinMode(PIN_TOF2_XSHUT, OUTPUT);
  pinMode(PIN_TOF3_XSHUT, OUTPUT);

  // Desligar todos os sensores (Reset) puxando XSHUT para LOW
  digitalWrite(PIN_TOF1_XSHUT, LOW);
  digitalWrite(PIN_TOF2_XSHUT, LOW);
  digitalWrite(PIN_TOF3_XSHUT, LOW);
  delay(10); // Aguarda os sensores desligarem completamente

  // Inicializar Sensor Esquerdo (TOF1)
  digitalWrite(PIN_TOF1_XSHUT, HIGH);
  delay(10); // Tempo para o sensor ligar
  sensorEsq.setTimeout(500);
  if (!sensorEsq.init()) {
    Serial.println("Falha ao iniciar o Sensor Esquerdo!");
  } else {
    sensorEsq.setAddress(ENDERECO_TOF_ESQ);
    sensorEsq.setMeasurementTimingBudget(20000); // Reduz o tempo de captura para 20ms
    sensorEsq.startContinuous(20); // Configura para modo de alta velocidade (leitura a cada 20ms)
  }

  // Inicializar Sensor Frontal (TOF2)
  digitalWrite(PIN_TOF2_XSHUT, HIGH);
  delay(10); // Tempo para o sensor ligar
  sensorFrente.setTimeout(500);
  if (!sensorFrente.init()) {
    Serial.println("Falha ao iniciar o Sensor Frontal!");
  } else {
    sensorFrente.setAddress(ENDERECO_TOF_FRENTE);
    sensorFrente.setMeasurementTimingBudget(20000); // Reduz o tempo de captura para 20ms
    sensorFrente.startContinuous(20); // Configura para modo de alta velocidade (leitura a cada 20ms)
  }

  // Inicializar Sensor Direito (TOF3)
  digitalWrite(PIN_TOF3_XSHUT, HIGH);
  delay(10); // Tempo para o sensor ligar
  sensorDir.setTimeout(500);
  if (!sensorDir.init()) {
    Serial.println("Falha ao iniciar o Sensor Direito!");
  } else {
    sensorDir.setAddress(ENDERECO_TOF_DIR);
    sensorDir.setMeasurementTimingBudget(20000); // Reduz o tempo de captura para 20ms
    sensorDir.startContinuous(20); // Configura para modo de alta velocidade (leitura a cada 20ms)
  }
}

ToFSensorReading lerTodosSensores() {
  ToFSensorReading reading;

  reading.distEsq = sensorEsq.readRangeContinuousMillimeters();
  reading.distFrente = sensorFrente.readRangeContinuousMillimeters();
  reading.distDir = sensorDir.readRangeContinuousMillimeters();

  reading.erroEsq = sensorEsq.timeoutOccurred();
  reading.erroFrente = sensorFrente.timeoutOccurred();
  reading.erroDir = sensorDir.timeoutOccurred();

  return reading;
}

void lerExibirSensoresToF() {

  // Lê os valores de distância em milímetros
  uint16_t distEsq = sensorEsq.readRangeContinuousMillimeters();
  uint16_t distFrente = sensorFrente.readRangeContinuousMillimeters();
  uint16_t distDir = sensorDir.readRangeContinuousMillimeters();

  // Verifica se houve Timeout
  bool erro = false;
  if (sensorEsq.timeoutOccurred()) { Serial.print("ERRO_ESQ "); erro = true; }
  if (sensorFrente.timeoutOccurred()) { Serial.print("ERRO_FRENTE "); erro = true; }
  if (sensorDir.timeoutOccurred()) { Serial.print("ERRO_DIR "); erro = true; }

  // Se deu erro quebra a linha para não bagunçar o terminal
  if (erro) {
    Serial.println();
  }
  else {
    // Exibição e tratamento do "Fora de Alcance" (> 8000)
    Serial.print("Esq: ");
    if (distEsq > 8000) Serial.print(">Max"); else Serial.print(distEsq);

    Serial.print(" mm\t|\tFrente: ");
    if (distFrente > 8000) Serial.print(">Max"); else Serial.print(distFrente);

    Serial.print(" mm\t|\tDir: ");
    if (distDir > 8000) Serial.print(">Max"); else Serial.print(distDir);

    Serial.println(" mm");
  }

  // Delay para testes, podemos tirar depois para ter leituras mais rápidas
  delay(50);
}