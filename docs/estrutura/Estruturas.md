# Plano de Pesquisa Estrutural: Desenvolvimento do Micromouse

## 1. Introdução
Este documento descreve o plano de trabalho para o desenvolvimento da estrutura do protótipo Micromouse. O foco está na otimização da performance mecânica e na integração eficiente dos componentes eletrônicos ao chassi.

## 2. Estudo de Estabilidade e Centro de Gravidade (CG)
O objetivo deste tópico é garantir que o robô mantenha o equilíbrio dinâmico durante acelerações e frenagens bruscas nas células do labirinto.

* **Pesquisa:** Métodos de cálculo de centro de massa para sistemas com múltiplos componentes (Motores N20, bateria LiPo, chassi e eletrônica).
* **Cálculos:** Determinação das coordenadas $(x, y, z)$ do CG em relação ao eixo de rotação das rodas.
* **Análise:** Simulação da transferência de carga para definir a altura máxima permitida do chassi sem risco de capotamento.

## 3. Estudo de Tração Diferencial e Cinemática
Análise do modelo de movimento baseado na rotação independente das duas rodas ativas.

* **Pesquisa:** Modelos cinemáticos de robôs diferenciais.
* **Cálculos:** Relação entre a velocidade angular das rodas e o raio de curvatura. Cálculo da velocidade linear máxima com base no diâmetro das rodas.
* **Análise:** Impacto da largura de via na precisão de manobras de $90^{\circ}$ e $180^{\circ}$.

## 4. Estudo da Seleção de Materiais
Comparação técnica para otimizar a relação entre peso total e rigidez estrutural.

| Material | Vantagens | Desvantagens |
| :--- | :--- | :--- |
| **Acrílico** | Rigidez e facilidade de corte a laser | Fragilidade a impactos |
| **PLA / PETG (3D)** | Liberdade geométrica para suportes | Menor resistência térmica |

*Tabela 1: Comparação de materiais para o chassi.*

## 5. Estudo da Altura dos Sensores (Erro de Paralaxe e Campo de Visão)
Definição da geometria de visão para garantir leituras precisas das paredes.

* **Pesquisa:** Efeito de paralaxe em sensores de infravermelho e *Time-of-Flight*.
* **Cálculos:** Determinação do *Field of View* (FOV) útil e cálculo do ângulo de incidência em relação à distância da parede.
* **Análise:** Definição da altura ideal para evitar que o sensor detecte o chão ou ignore as paredes de 5 cm de altura.

## 6. Estudo da Gestão de Vibração e Ruído Mecânico
Minimização de interferências nos sensores e proteção do sistema eletrônico.

* **Pesquisa:** Fontes de vibração (motores N20 em alta rotação e irregularidades da pista).
* **Cálculos:** Frequência natural de vibração da estrutura proposta.
* **Análise:** Avaliação de métodos de amortecimento, como o uso de coxins de borracha ou juntas elásticas na fixação dos motores.