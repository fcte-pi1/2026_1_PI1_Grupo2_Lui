# Energia 

# Memorial de Cálculo: Autonomia e Consumo Energético - Micromouse

Este documento detalha o cálculo da demanda energética do protótipo Micromouse para a Issue #22, visando garantir a autonomia necessária para a realização de três tentativas em cada um dos três labirintos da competição.

## 1. Identificação dos Subsistemas Elétricos

Os componentes do sistema foram identificados com base na lista de materiais provisória, registrando-se as tensões e correntes médias de operação:

* **ESP32:** Microcontrolador principal operando com Wi-Fi ativo para telemetria.
* **Motores N20 (x2):** Atuadores de locomoção com encoder.
* **Sensores ToF e IR:** Sensores VL53L0X e TCRT5000 para mapeamento e detecção de paredes.
* **Giroscópio MPU6500:** Responsável pela precisão angular nas curvas.

## 2. Tabela de Consumo Nominal e de Pico

Abaixo, detalha-se a corrente média (regime constante) e a corrente de pico (cenário de torque máximo/stall) de cada componente:

| Componente | Qtd | Corrente Média (mA) | Corrente de Pico (mA) |
| :--- | :---: | :--- | :--- |
| **ESP32** | 1 | 240 | 300 |
| **Motores N20** | 2 | 200 (Total) | 1000 (Stall) |
| **Sensores IR** | 4 | 40 (Total) | 80 (Total) |
| **Sensor ToF** | 1 | 15 | 40 |
| **Giroscópio** | 1 | 5 | 10 |
| **TOTAL DO SISTEMA** | - | **505 mA** | **1440 mA** |
*(Dados baseados nos subsistemas do projeto)*

## 3. Cálculo de Autonomia

Considerando o tempo total de operação (**t**) de **1800 segundos** (**30 minutos**) e a tensão nominal da bateria de **7.4V**:

* **Energia Consumida (E):**

  $E=V\times I\times t=7,4V\times 0,505A\times 1800s=6726,6~J$

* **Conversão para Watt-hora:** **1,87 Wh**.
* **Capacidade em mAh:**

  $C = I \times t = 505\text{mA} \times 0,5\text{h} = 252,5\text{ mAh}$

## 4. Escolha da Fonte e Margem de Segurança

Para compensar perdas térmicas e garantir que a tensão não caia abaixo do limite crítico do ESP32 durante picos de corrente, aplica-se uma margem de segurança de **100%**:

* **Capacidade Mínima Recomendada:** **505 mAh**.
* **Fonte Escolhida:** Bateria Li-ion 14500 **7.4V** de **1000mAh**.

A bateria selecionada supre a demanda teórica com uma folga de aproximadamente **300%**, sendo adequada para as condições de competição e testes de longa duração.