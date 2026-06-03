#include <Wire.h>
#include "Adafruit_VL53L0X.h"
#include "BluetoothSerial.h" 

// Verifica se o Bluetooth está configurado corretamente no core do ESP32
#if !defined(CONFIG_BT_ENABLED) || !defined(CONFIG_BLUEDROID_ENABLED)
#error Bluetooth is not enabled! Please run `make menuconfig` to enable it
#endif

// Objeto para controle do Bluetooth
BluetoothSerial ESP_BT;

// Quantidade de sensores
#define NUM_SENSORS 3

// Definição dos pinos XSHUT no ESP32
const int xshutPins[NUM_SENSORS] = {13, 14, 27}; 

// Endereços I2C customizados (o padrão de fábrica é 0x29)
const int sensorAddresses[NUM_SENSORS] = {0x30, 0x31, 0x32};

// Array de objetos dos sensores
Adafruit_VL53L0X sensors[NUM_SENSORS];

// Nomes para facilitar o log no monitor serial
const char* sensorNames[NUM_SENSORS] = {"Esquerda", "Frontal ", "Direita "};

void initToFSensors() {
  // 1. Configura todos os pinos XSHUT como saída e desliga os sensores
  for (int i = 0; i < NUM_SENSORS; i++) {
    pinMode(xshutPins[i], OUTPUT);
    digitalWrite(xshutPins[i], LOW);
  }
  delay(10); // Garante o reset de todos

  // 2. Inicializa e muda o endereço de cada um sequencialmente
  for (int i = 0; i < NUM_SENSORS; i++) {
    // Liga o sensor atual mantendo o pino em HIGH
    digitalWrite(xshutPins[i], HIGH);
    delay(10); 

    // Inicializa o sensor passando o novo endereço escolhido
    if (!sensors[i].begin(sensorAddresses[i])) {
      Serial.printf("Erro crítico: Falha ao iniciar o sensor %s (End: 0x%X)\n", sensorNames[i], sensorAddresses[i]);
      while (1); // Trava o boot se houver falha de hardware
    }
    
    Serial.printf("Sensor %s configurado com sucesso no endereço: 0x%X\n", sensorNames[i], sensorAddresses[i]);
    delay(10);
  }
}

void setup() {
  Serial.begin(115200);
  
  // Inicializa o barramento I2C nativo do ESP32 (Pins 21 e 22)
  Wire.begin(); 

  // Inicializa o Bluetooth com o nome que aparecerá na busca do celular
  ESP_BT.begin("Micromouse_ToF"); 

  Serial.println("\n--- Iniciando Setup do Micromouse ---");
  initToFSensors();
  Serial.println("--- Todos os sensores ToF online ---\n");
}

void loop() {
  VL53L0X_RangingMeasurementData_t measure;
  
  // Só envia os dados se houver algum dispositivo conectado ao Bluetooth
  if (ESP_BT.hasClient()) {
    
    // Varre os sensores e envia uma string formatada via Bluetooth
    for (int i = 0; i < NUM_SENSORS; i++) {
      sensors[i].rangingTest(&measure, false);

      // ESP_BT.printf funciona igual ao Serial.printf, mas envia pro celular/PC
      ESP_BT.printf("%s: ", sensorNames[i]);
      if (measure.RangeStatus != 4) {
        ESP_BT.printf("%4dmm | ", measure.RangeMilliMeter);
      } else {
        ESP_BT.print("Erro   | ");
      }
    }
    ESP_BT.println(); // Quebra de linha no terminal do Bluetooth
    
  }

  // Varre o array de sensores lendo a distância de cada um
  for (int i = 0; i < NUM_SENSORS; i++) {
    sensors[i].rangingTest(&measure, false);

    Serial.printf("%s: ", sensorNames[i]);
    if (measure.RangeStatus != 4) { // Status 4 = erro/fora de alcance
      Serial.printf("%4d mm  | ", measure.RangeMilliMeter);
    } else {
      Serial.print("Fora Alc. | ");
    }
  }
  Serial.println(); // Quebra de linha para a próxima varredura

  delay(60); // Ajuste fino para a taxa de atualização do loop do robô
}