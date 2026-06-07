#include <Wire.h>
#include <MPU6050_6Axis_MotionApps20.h>

// Instancia o objeto do sensor. O endereço padrão costuma ser 0x68.
// Se falhar, tente alterar para MPU6050 mpu(0x69);
MPU6050 mpu;

// Define o pino de interrupção no ESP32
#define PINO_INTERRUPCAO 15

// Variáveis de controle de status e dados do DMP
bool dmpPronto = false;  // Fica true se a inicialização do DMP der certo
uint8_t statusDMP;       // Armazena o código de retorno da biblioteca
uint16_t tamanhoPacote;  // Tamanho esperado do pacote FIFO
uint16_t fifoContagem;   // Contagem de bytes atualmente no FIFO
uint8_t fifoBuffer[64];  // O buffer de armazenamento do pacote de dados

// Variáveis de geometria e orientação matemática
Quaternion q;           // [w, x, y, z]         Container dos Quaternions
VectorFloat gravidade;  // [x, y, z]            Vetor de gravidade
float ypr[3];           // [yaw, pitch, roll]   Container dos ângulos finais

// Flag volátil para a Rotina de Interrupção (ISR)
volatile bool interrupcaoAcionada = false;

// Função chamada automaticamente quando o pino INT recebe o pulso do sensor
void IRAM_ATTR dmpDataReady() {
    interrupcaoAcionada = true;
}

void setup() {
    Serial.begin(115200);
    Wire.begin();
    Wire.setClock(400000); // Acelera o I2C para 400kHz, ideal para o DMP

    Serial.println("Inicializando dispositivos I2C...");
    mpu.initialize();
    pinMode(PINO_INTERRUPCAO, INPUT);

    Serial.println("Testando conexao do MPU6500...");
    if (mpu.testConnection()) {
        Serial.println("Conexao com MPU6500 bem sucedida!");
    } else {
        Serial.println("Falha na conexao. Verifique o cabeamento.");
        //while (1); // Trava o sistema caso o sensor falhe
    }

    Serial.println("Inicializando DMP interno...");
    statusDMP = mpu.dmpInitialize();

    // Se a inicialização for bem sucedida, retorna 0
    if (statusDMP == 0) {
        // Opcional: Aqui você pode inserir os offsets depois de calibrar o sensor
        // mpu.setXGyroOffset(220);
        // mpu.setYGyroOffset(76);
        // mpu.setZGyroOffset(-85);
        // mpu.setZAccelOffset(1788); 

        Serial.println("Habilitando DMP...");
        mpu.setDMPEnabled(true);

        Serial.println("Ativando interrupcao no pino...");
        attachInterrupt(digitalPinToInterrupt(PINO_INTERRUPCAO), dmpDataReady, RISING);
        
        dmpPronto = true;
        tamanhoPacote = mpu.dmpGetFIFOPacketSize();
        Serial.println("DMP pronto! Aguardando a primeira interrupcao...");
    } else {
        // Erro 1 = falha no carregamento inicial da memoria
        // Erro 2 = falha nas atualizacoes de configuracao do DMP
        Serial.print("Erro no DMP (codigo ");
        Serial.print(statusDMP);
        Serial.println(")");
    }
}

void loop() {
    // Se o DMP falhou no setup, não faz nada
    if (!dmpPronto) return;

    // Aguarda até que o sensor avise (via pino INT) que há dados prontos
    if (interrupcaoAcionada && mpu.dmpGetCurrentFIFOPacket(fifoBuffer)) {
        
        // Zera a flag da interrupção para o próximo ciclo
        interrupcaoAcionada = false;

        // Extrai a matemática do processador do MPU
        mpu.dmpGetQuaternion(&q, fifoBuffer);
        mpu.dmpGetGravity(&gravidade, &q);
        mpu.dmpGetYawPitchRoll(ypr, &q, &gravidade);

        // Converte radianos para graus e imprime o Eixo Z (Yaw)
        float yaw = ypr[0] * 180 / M_PI;
        
        Serial.print("YAW (Giro no eixo Z): \t");
        Serial.print(yaw);
        Serial.print(" °");

        // --- Leitura da Temperatura (Opcional) ---
        // Descomente o bloco abaixo para monitorar a temperatura térmica do chip
        int16_t tempBruta = mpu.getTemperature();
        float tempCelsius = (tempBruta / 333.87) + 21.0;
        Serial.print(" \t | Temp: ");
        Serial.print(tempCelsius);
        Serial.print(" °C");
        

        Serial.println();
    }
}
