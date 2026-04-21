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
- TCRT5000  
- QTR-1A  
- QTR-8A  

**Sensores ToF**
- VL53L0X  
- VL53L1X  
- VL53L4CD  

**Sensores Ultrassônicos**
- HC-SR04  

### Funções
- Detecção de paredes  
- Medição de distância  
- Apoio à navegação  

---

## 5. Encoders

Utilizados para controle de movimento e realimentação do sistema.

### Componentes
- Encoder magnético AS5600  
- Encoder óptico KY-040  
- Magnetic Encoder Kit (Pololu)  
- Motores DC com encoder integrado  

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

### Componentes
- Bateria LiPo 1S (3.7V)  
- Bateria LiPo 2S (7.4V)  
- Bateria 18650  

### Componentes auxiliares
- TP4056 (módulo de carga)  
- Módulos de proteção de bateria  

### Função
- Fornecer energia ao sistema  

---

## 7. Reguladores de Tensão

Garantem a alimentação adequada dos componentes.

### Componentes

**Conversores Buck**
- LM2596  
- MP1584  
- TPS62172  

**Reguladores LDO**
- AMS1117  
- MCP1700  

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