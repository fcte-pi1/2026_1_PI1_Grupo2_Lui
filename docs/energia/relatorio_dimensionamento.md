# Relatório de Dimensionamento Energético - Projeto Micromouse PI1

Este documento formaliza a análise técnica para a escolha do subsistema de alimentação do robô Micromouse, atendendo aos requisitos de autonomia do nosso projeto.

## 1. Identificação dos Subsistemas Elétricos
Com base na lista de componentes provisória, o sistema é composto pelos seguintes itens principais:
* **Microcontrolador:** ESP32 (3.3V / 240mA médio com Wi-Fi ativo para telemetria).
* **Motores:** 2x N20 6V com Encoder (100mA nominal cada / 500mA stall cada).
* **Sensores:** 4x Sensores IR (TCRT5000/VL53L0X) e 1x Giroscópio MPU6500.
* **Driver de Motor:** Ponte H TB6612FNG.

## 2. Cálculo de Autonomia e Consumo 
O cálculo de autonomia segue as diretrizes de dimensionamento, considerando um tempo de operação de 30 minutos (1800 segundos), suficiente para cobrir as 3 tentativas em cada um dos 3 labirintos da competição.

| Componente | Corrente Nominal (mA) | Corrente de Pico (mA) |
| :--- | :---: | :---: |
| **ESP32** | 240 | 300 |
| **Motores (2x)** | 200 | 1000 |
| **Sensores e Lógica**| 65 | 170 |
| **Total do Sistema** | **505 mA** | **1470 mA** |
*(Tabela de consumo)*

**Capacidade Mínima Necessária:** O consumo total é de aproximadamente 252,5 mAh para o percurso. Aplicando uma margem de segurança para evitar quedas bruscas de tensão que possam reiniciar o ESP32, a capacidade recomendada é de 500mAh ou superior.

## 3. Tabela Comparativa de Baterias 
A análise técnica prioriza o equilíbrio entre C-Rating (taxa de descarga) e o peso final do chassi, fator crítico para a inércia em curvas de 90 graus.

| Modelo | Voltagem | Capacidade | Peso Estimado | Preço (Bateria+Carregador) |
| :--- | :--- | :--- | :--- | :--- |
| LiPo 2S High-C (Tattu/Gens Ace) | 7.4V | 450mAh | ~28g | R$ 150 - R$ 200 |
| Li-ion 14500 (Pack Azul) | 7.4V | 1000mAh| ~40g | R$ 65 - R$ 85 |
| **Li-ion 18650 (ESCOLHIDA)** | **7.4V** | **2000mAh**| **~100g** | **R$ 40 - R$ 60** |
*(Tabela comparativa ajustada)*

## 4. Justificativa da Decisão Técnica
A opção homologada pelo grupo é a **Bateria Li-ion 18650 7.4V de 2000mAh**. Esta decisão fundamenta-se nos seguintes pontos:
* **Autonomia e Estabilidade:** A capacidade de 2000mAh oferece uma folga de segurança massiva para testes prolongados de bancada, eliminando a necessidade de recargas frequentes. Além disso, garante tolerância ao pico de 1440mA, não causando afundamento crítico de tensão (*voltage sag*).
* **Custo-Benefício:** O conjunto é altamente acessível, não exigindo carregador balanceador caro.
* **Peso como Trade-off:** Embora o peso seja maior (~100g), o grupo optou por priorizar a segurança elétrica e a margem energética em detrimento da extrema leveza mecânica.

## 5. Planejamento do Circuito e Proteções
Para gerenciar as oscilações de tensão e proteger o microcontrolador, o planejamento inclui:
* **Regulação:** Buck Converter MP1584 para estabilizar a tensão de 5V.
* **Filtragem:** Uso de capacitores de desacoplamento de 100nF e 10µF próximos ao driver de motor e sensores para mitigar ruídos das escovas dos motores DC.
* **Proteção:** Chave Geral física e monitoramento de tensão via software para evitar a descarga profunda das células de Lítio.

*Link para a Bateria adotada:* https://www.mercadolivre.com.br/up/MLBU601726856?pdp_filters=item_id:MLB2202054107&matt_tool=38524122#origin=share&sid=share&wid=MLB2202054107&action=copy