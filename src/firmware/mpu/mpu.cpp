#include "mpu.h"
#include <Wire.h>
#include <Adafruit_MPU6050.h>
#include <Adafruit_Sensor.h>

Adafruit_MPU6050 mpu;

void configurarMPU() {

  // Inicializa o MPU-6500 no endereço padrão 0x68 e atrela ao barramento Wire já existente
  if (!mpu.begin(0x68, &Wire)) {
    Serial.println("Falha ao encontrar o chip MPU-6500! Verifique as conexões.");
    while (1) {
      delay(10); // Trava o sistema caso o sensor falhe
    }
  }
  
  Serial.println("MPU-6500 inicializado com sucesso!\n");

  // Configuração das escalas (Ajustadas para dinâmica de robôs de solo)
  mpu.setAccelerometerRange(MPU6050_RANGE_4_G); // Escala de até 4G de aceleração
  mpu.setGyroRange(MPU6050_RANGE_500_DEG);      // Escala de até 500 graus/s de rotação
  
  // Filtro passa-baixa para remover ruído de vibração dos motores
  mpu.setFilterBandwidth(MPU6050_BAND_21_HZ); 
  
  delay(100); // Pequeno tempo para o sensor estabilizar
}

void lerExibirMPU() {

  // Objetos para armazenar os eventos do sensor
  sensors_event_t a, g, temp;

  /* 
  
  a - guarda as forças lineares:

    a.acceleration.x = força linear no eixo X (m/s^2) 
    a.acceleration.y = força linear no eixo Y (m/s^2)
    a.acceleration.z = força linear no eixo Z (m/s^2)

  */

  /* 
  
  g - guarda a velocidade angular (giro) em rad/s:

    g.gyro.x = velocidade angular no eixo X (rad/s) 
    g.gyro.y = velocidade angular no eixo Y (rad/s)
    g.gyro.z = velocidade angular no eixo Z (rad/s)

    multiplicando por 57.2958 convertemos de rad/s para graus/s

  */

  // temp - temperatura do sensor 
  
  // Captura os dados mais recentes
  mpu.getEvent(&a, &g, &temp);

  // Converte a rotação Z de rad/s para graus/s
  float giroZ_graus = g.gyro.z * 57.2958; // podemos tirar isso caso seja necessário

  // Exibe a Aceleração X e Y (em m/s^2)
  Serial.print("Acel X: ");
  Serial.print(a.acceleration.x);
  Serial.print(" m/s^2 \t|\t Y: ");
  Serial.print(a.acceleration.y);
  
  // Exibe a Rotação (Velocidade Angular) no Eixo Z
  Serial.print(" m/s^2 \t|\t Giro Z (Yaw): ");
  Serial.print(giroZ_graus);
  Serial.println(" deg/s");
}