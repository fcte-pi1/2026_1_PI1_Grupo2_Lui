#include <Arduino.h>
#include "motors/motors.h"

static constexpr int VEL_TESTE = 150; 

void setup() {

    Serial.begin(115200);
    delay(2000);
    
    Serial.println("\n=======================================");
    Serial.println(" BOOT Micromouse");
    Serial.println("=======================================\n");

    Serial.println("[BOOT 1/5] Inicializando Barramento I2C...");
    Wire.begin(PIN_I2C_SDA, PIN_I2C_SCL);
    Wire.setClock(400000);
    Serial.println("-> I2C pronto nos pinos SDA(21) e SCL(22) @ 400kHz.\n");
    delay(200);

    Serial.println("[BOOT 2/5] Inicializando sensor de distânca VL53L0X...");
    configurarSensoresToF();
    Serial.println("-> Sensor VL53L0X inicializado.\n");
    delay(200);

    Serial.println("[BOOT 3/5] Inicializando MPU-6500...");
    configurarMPU();
    Serial.println("-> MPU-6500 inicializado.\n");
    delay(200);

    Serial.println("[BOOT 4/5] Configurando encoders dos motores...");
    encoders_init();
    Serial.println("-> Encoders configurados nos pinos 32, 33 (motor esquerdo) e 34, 35 (motor direito).\n");
    delay(200);

    Serial.println("[BOOT 5/5] Configurando motores...");
    motors_init();
    Serial.println("-> PWM: 20 kHz, resolucao 8 bits.");
    Serial.println("-> Motores inicializados em estado de parada.\n");
    delay(2000);

    Serial.println("\n=======================================");
    Serial.println(" BOOT Completo ");
    Serial.println("=======================================\n");

}

void loop() {

    Serial.println("MPU-6500:\n");
    lerExibirMPU();
    Serial.println("--------------------------------------------------\n");
    
    Serial.println("Sensores:\n");
    lerExibirSensoresToF();
    Serial.println("--------------------------------------------------\n");

}