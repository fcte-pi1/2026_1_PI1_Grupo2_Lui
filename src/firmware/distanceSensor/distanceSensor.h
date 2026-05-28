#ifndef DISTANCE_SENSOR_H
#define DISTANCE_SENSOR_H

#include <Arduino.h>

// Inicializa os sensores de Distância ToF (VL53L0X) conectados ao barramento I2C compartilhado
void configurarSensoresToF();

// Lê os valores dos sensores ToF e exibe
void lerExibirSensoresToF();

#endif

/*

Quando For implementar a main.cpp

void setup() {
  Serial.begin(115200);
  // Outras configurações...
Serial.println("[Micromouse] Configurando sensores ToF VL53L0X...");
configurarSensoresToF();
Serial.println("[Micromouse] Sensores configurados e prontos!");
}

void loop() {
  // Outras lógicas...
  lerExibirSensoresToF();
  // Outras lógicas...
  //divisor
  Serial.println("--------------------------------------------------");
}

*/