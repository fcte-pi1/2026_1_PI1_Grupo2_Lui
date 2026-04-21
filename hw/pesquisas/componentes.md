# Componentes Eletrônicos Essenciais de um Micromouse com ESP32

## Objetivo

Este documento apresenta os principais componentes eletrônicos utilizados em um robô micromouse baseado em ESP32, com foco no mapeamento dos elementos necessários ao sistema e suas respectivas funções.

---

## 1. Microcontrolador

O microcontrolador é responsável pelo processamento central do sistema, realizando a leitura dos sensores e o controle dos atuadores.

### Componentes
- ESP32 DevKit V1 [¹](#bib1).
- ESP32-DevKitC V4  [²](#bib2).
- [ESP WROOM 32](./datasheet/ESP-WROOM-32.PDF) [³](#bib3).

### Funções
- Processamento de dados  
- Controle de sensores e motores  
- Comunicação (I2C, SPI, UART)  

---

## 2. Drivers de Motor

Os drivers realizam a interface entre o microcontrolador e os motores.

### Componentes
- [L298N](./datasheet/L298N.PDF) [⁴](#bib4)
- [TB6612FNG](./datasheet/TB6612FNG.PDF) [⁵](#bib5)
- [DRV8833](./datasheet/DRV8833.PDF) [⁶](#bib6)
- [DRV8835](./datasheet/DRV8835.PDF) [⁷](#bib7)

### Funções
- Controle de direção (ponte H)  
- Controle de velocidade via PWM  
- Fornecimento de corrente aos motores  

---

## 3. Motores DC

Responsáveis pela locomoção do robô.

### Componentes
- Motores DC com caixa de redução 
- Motores DC com encoder integrado  

### Funções
- Conversão de energia elétrica em movimento  
- Controle de velocidade e torque  

---

## 4. Sensores de Distância

Permitem a percepção do ambiente.

### Componentes

**Sensores Infravermelho**
- [TCRT5000](./datasheet/TCRT5000.PDF) [⁸](#bib8)
- [QTR-1A](./datasheet/QTR-1A.PDF) [⁹](#bib9)
- [QTR-8A](./datasheet/QTR-8X.PDF) [¹⁰](#bib10)

**Sensores ToF**
- [VL53L0X](./datasheet/VL53L0X.PDF) [¹¹](#bib11)
- [VL53L1X](./datasheet/VL53L1X.PDF) [¹²](#bib12)
- [VL53L4CD](./datasheet/VL53L4CD.PDF) [¹³](#bib13)

**Sensores Ultrassônicos**
- [HC-SR04](./datasheet/HC-SR04.PDF) [¹⁴](#bib14)

### Funções
- Detecção de paredes  
- Medição de distância  
- Apoio à navegação  

---

## 5. Encoders

Utilizados para controle de movimento e realimentação do sistema.

### Componentes
- Encoder magnético [AS5600](./datasheet/AS5600.PDF) [¹⁵](#bib15)
- Encoder óptico [KY-040](./datasheet/KY-040.PDF) [¹⁶](#bib16)
- Magnetic Encoder Kit (Pololu) [¹⁷](#bib17)

### Tipos
- Encoders incrementais  
- Encoders ópticos  
- Encoders magnéticos  

### Funções
- Medir rotação das rodas  
- Auxiliar no controle de velocidade  
- Melhorar a precisão do deslocamento  

---

## 6. Fonte de Energia

Responsável pela alimentação do sistema.

> **Nota:** Este é um levantamento preliminar de componentes. A versão completa deve ser desenvolvida pelo núcleo de energia.

### Componentes
- Bateria LiPo 1S (3.7V)  
- Bateria LiPo 2S (7.4V)  
- Bateria 18650  

### Componentes auxiliares
- [TP4056 ](./datasheet/TP4056.PDF)(módulo de carga) [¹⁸](#bib18)
- Módulos de proteção de bateria  

### Função
- Fornecer energia ao sistema
- Auxiliar alimentação energética do sistema

---

## 7. Reguladores de Tensão

Garantem a alimentação adequada dos componentes.

### Componentes

**Conversores Buck**
- [LM2596](./datasheet/LM2596.PDF) [¹⁹](#bib19)
- [MP1584](./datasheet/MP1584.PDF) [²⁰](#bib20)
- [TPS62172](./datasheet/TPS6217X.PDF) [²¹](#bib21)

**Reguladores LDO**
- [AMS1117](./datasheet/AMS1117.PDF) [²²](#bib22)
- [MCP1700](./datasheet/MCP1700.PDF) [²³](#bib23)

### Funções
- Redução de tensão  
- Estabilização da alimentação  
- Proteção dos circuitos  

---

## 8. Eletrônica Auxiliar

Componentes de suporte ao funcionamento do sistema.

### Componentes
- Capacitores de desacoplamento (100nF, 10µF)  
- Resistores pull-up (I2C)  
- Resistores divisores de tensão  
- Protoboard  
- Jumpers  

### Funções
- Estabilização elétrica  
- Garantia de comunicação  
- Facilitação de montagem  

---

## Cobertura do Sistema

Os componentes apresentados cobrem os módulos essenciais do robô:

- Processamento  
- Percepção  
- Atuação  
- Controle  
- Alimentação  

---

## Referências

- https://www.espressif.com/en/products/socs/esp32  
- https://www.pololu.com/product/713  
- https://www.ti.com/product/DRV8833  
- https://www.ti.com/product/DRV8835  
- https://www.st.com/en/imaging-and-photonics-solutions/vl53l0x.html  
- https://www.st.com/en/imaging-and-photonics-solutions/vl53l1x.html  
- https://www.st.com/en/imaging-and-photonics-solutions/vl53l4cd.html  
- https://www.pololu.com/category/60/micro-metal-gearmotors  
- https://www.ti.com/product/LM2596  

## Bibliografia

<a id="bib1"></a>
[1] ANDRADE, Eder. ESP32 DevKitC v1. Disponível em: https://includemicro.com/esp32-devkitcv1/. Acesso em: 18 abr. 2026.

<a id="bib2"></a>
[2] ESPRESSIF SYSTEMS. ESP32-DevKitC V4 – User Guide. Disponível em: https://docs.espressif.com/projects/esp-dev-kits/en/latest/esp32/esp32-devkitc/user_guide.html. Acesso em: 18 abr. 2026.

<a id="bib3"></a>
[3] ESPRESSIF SYSTEMS (SHANGHAI) CO., LTD. ESP-WROOM-32 Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/pdf/1179101/ESPRESSIF/ESP-WROOM-32.html
. Acesso em: 18 abr. 2026.

<a id="bib4"></a>
[4] STMICROELECTRONICS. L298N – Dual Full-Bridge Driver Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/22440/STMICROELECTRONICS/L298N.html. Acesso em: 18 abr. 2026.

<a id="bib5"></a>
[5] TOSHIBA. TB6612FNG – Driver IC for Dual DC Motor Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/807693/TOSHIBA/TB6612FNG.html. Acesso em: 18 abr. 2026.

<a id="bib6"></a>
[6] TEXAS INSTRUMENTS. DRV8833 – Dual H-Bridge Motor Driver Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/437529/TI1/DRV8833.html. Acesso em: 18 abr. 2026.

<a id="bib7"></a>
[7] TEXAS INSTRUMENTS. DRV8835 – Dual Low Voltage H-Bridge IC Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/457246/TI/DRV8835.html. Acesso em: 18 abr. 2026.

<a id="bib8"></a>
[8] VISHAY SEMICONDUCTORS. TCRT5000 – Reflective Optical Sensor Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/26406/VISHAY/TCRT5000.html. Acesso em: 21 abr. 2026.

<a id="bib9"></a>
[9] POLOLU. QTR-1A – Reflectance Sensor Datasheet. Disponível em: https://octopart.com/pt/datasheet/pololu/QTR-1A. Acesso em: 21 abr. 2026.

<a id="bib10"></a>
[10] POLOLU. QTR-8A – Reflectance Sensor Array Datasheet. Disponível em: https://www.pololu.com/docs/pdf/0j12/qtr-8x.pdf. Acesso em: 21 abr. 2026.

<a id="bib11"></a>
[11] STMICROELECTRONICS. VL53L0X – ToF Ranging Sensor Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/948120/STMICROELECTRONICS/VL53L0X.html. Acesso em: 21 abr. 2026.

<a id="bib12"></a>
[12] STMICROELECTRONICS. VL53L1X – ToF Ranging Sensor Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/1131878/STMICROELECTRONICS/VL53L1X.html. Acesso em: 21 abr. 2026.

<a id="bib13"></a>
[13] STMICROELECTRONICS. VL53L4CD – ToF Ranging Sensor Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/1444679/STMICROELECTRONICS/VL53L4CD.html. Acesso em: 21 abr. 2026.

<a id="bib14"></a>
[14] ELEC FREAKS. HC-SR04 – Ultrasonic Ranging Sensor Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/1132204/ETC2/HCSR04.html. Acesso em: 21 abr. 2026.

<a id="bib15"></a>
[15] AMS (ams AG). AS5600 – Magnetic Rotary Position Sensor Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/621657/AMSCO/AS5600.html. Acesso em: 21 abr. 2026.

<a id="bib16"></a>
[16] KY-040 – Rotary Encoder Datasheet. Disponível em: https://www.rcscomponents.kiev.ua/datasheets/ky-040-datasheet.pdf. Acesso em: 21 abr. 2026.

<a id="bib17"></a>
[17] POLOLU. Magnetic Encoder Kit Datasheet. Disponível em: https://www.pololu.com/product/2598/resources. Acesso em: 21 abr. 2026.

<a id="bib18"></a>
[18] ASIC. TP4056 – Lithium-ion Battery Charger Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/1132405/ASIC/TP4056.html. Acesso em: 21 abr. 2026.

<a id="bib19"></a>
[19] ONSEMI. LM2596 – Step-Down Switching Regulator Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/2032213/ONSEMI/LM2596.html. Acesso em: 21 abr. 2026.

<a id="bib20"></a>
[20] MPS (MONOLITHIC POWER SYSTEMS). MP1584 – Step-Down Converter Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/551592/MPS/MP1584.html. Acesso em: 21 abr. 2026.

<a id="bib21"></a>
[21] TEXAS INSTRUMENTS. TPS62172 – Step-Down Converter Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/849881/TI1/TPS62172.html. Acesso em: 21 abr. 2026.

<a id="bib22"></a>
[22] ADVANCED MONOLITHIC SYSTEMS. AMS1117 – Low Dropout Regulator Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/49118/ADMOS/AMS1117.html. Acesso em: 21 abr. 2026.

<a id="bib23"></a>
[23] MICROCHIP. MCP1700 – Low Dropout Regulator Datasheet. Disponível em: https://www.alldatasheet.com/datasheet-pdf/download/115220/MICROCHIP/MCP1700.html. Acesso em: 21 abr. 2026.