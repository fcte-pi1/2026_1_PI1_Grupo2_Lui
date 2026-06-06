#ifndef DISTANCE_SENSOR_H
#define DISTANCE_SENSOR_H

#include <Arduino.h>

struct ToFSensorReading {
    uint16_t distEsq;
    uint16_t distFrente;
    uint16_t distDir;
    bool erroEsq;
    bool erroFrente;
    bool erroDir;
};

// Inicializa os sensores de Distância ToF
void configurarSensoresToF();

// Lê os valores dos sensores ToF e exibe
void lerExibirSensoresToF();

// Lê todos os sensores e retorna as leituras agrupadas (usado principalmente em testes)
ToFSensorReading lerTodosSensores();

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