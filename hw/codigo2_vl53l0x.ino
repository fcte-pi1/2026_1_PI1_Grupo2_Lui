#include <Wire.h>
#include <VL53L0X.h>

// Quantidade total de sensores
#define NUM_SENSORS 3

// Arrays contendo as configurações de hardware e I2C
const int xshutPins[NUM_SENSORS] = {13, 14, 27};
const uint8_t sensorAddresses[NUM_SENSORS] = {0x30, 0x31, 0x32};

// Array de objetos para os sensores (substitui sensor1, sensor2, sensor3)
VL53L0X sensors[NUM_SENSORS];

const int offsetCalibracao[NUM_SENSORS] = {-65, 0, 0};

void setup() {
  Serial.begin(115200);
  Wire.begin();

  // 1. Configura os pinos XSHUT como saída e desliga todos os sensores (LOW)
  for (int i = 0; i < NUM_SENSORS; i++) {
    pinMode(xshutPins[i], OUTPUT);
    digitalWrite(xshutPins[i], LOW);
  }

  delay(50);

  // 2. Inicialização sequencial no barramento I2C
  for (int i = 0; i < NUM_SENSORS; i++) {
    // Liga apenas o sensor da iteração atual
    digitalWrite(xshutPins[i], HIGH);
    delay(50); // Tempo necessário para o boot do sensor

    // Tenta inicializar o sensor
    if (!sensors[i].init()) {
      Serial.print("Erro ao iniciar Sensor ");
      Serial.println(i + 1);
      while (1); // Trava a execução em caso de falha de hardware
    }

    // Troca o endereço padrão (0x29) para o novo endereço definido no array
    sensors[i].setAddress(sensorAddresses[i]);
    sensors[i].setTimeout(500);
  }

  Serial.println("Todos os sensores VL53L0X inicializados com sucesso!");
}

void loop() {
  // 3. Leitura e impressão dos dados

  for (int i = 0; i < NUM_SENSORS; i++) {
    // Lê a distância bruta e aplica a calibração daquele sensor
    int distanciaBruta = sensors[i].readRangeSingleMillimeters();
    int distanciaCorrigida = distanciaBruta + offsetCalibracao[i];

    // Evita valores negativos caso o sensor falhe ou leia algo muito perto
    if (distanciaCorrigida < 0) {
        distanciaCorrigida = 0;
    }

    Serial.print("Sensor ");
    Serial.print(i + 1);
    Serial.print(": ");
    Serial.print(distanciaCorrigida); // Imprime o valor já corrigido
    Serial.print(" mm");
  
    // Adiciona o separador visual, exceto no último sensor
    if (i < NUM_SENSORS - 1) {
      Serial.print("    ||    ");
    }
  }
  
  // Quebra a linha após imprimir a leitura de todos os sensores daquele ciclo
  Serial.println(); 
  
  delay(200);
}