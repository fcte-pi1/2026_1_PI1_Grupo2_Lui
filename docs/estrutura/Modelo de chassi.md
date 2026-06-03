# Relatório de Pesquisa: Design e Geometria do Chassi para Micromouse

## 1. Introdução
Este documento detalha o dimensionamento e a seleção de materiais para o chassi do microrrobô móvel autônomo. O chassi atua como a espinha dorsal do projeto, integrando a protoboard, o microcontrolador ESP32, os motores N20 e o sistema de alimentação.

## 2. Geometria e Formato
Para a navegação em labirintos, formatos com quinas vivas são evitados para prevenir o engastamento em colisões laterais.

* **Circular / Oval:** Oferece o melhor raio de giro, permitindo que o robô rotacione sobre o próprio eixo sem colidir com as paredes.
* **Formato em D / Oblongo:** Facilita o alinhamento dos sensores frontais e a acomodação da protoboard retangular, mantendo a traseira arredondada para manobras.

## 3. Materiais Propostos

| Material | Densidade | Rigidez | Processo |
| :--- | :--- | :--- | :--- |
| Acrílico (3mm) | Média | Alta | Corte a Laser |
| MDF (3mm) | Baixa | Média | Corte a Laser |
| PLA / PETG | Variável | Alta | Impressão 3D |
| Alumínio 6061 | Alta | Altíssima | Usinagem/CNC |

## 4. Dimensionamento e Componentes
Será discutida a possibilidade da criação de um deck superior no micromouse para facilitar a organização dos componentes eletrônicos e o balanço do Centro de Gravidade (CG). Como a parte eletrônica considera a utilização de protoboard, o micromouse precisa seguir uma limitação de comprimento e largura por conta das curvas dentro do labirinto, visto que o arranjo protoboard-bateria-motor seria difícil de alcançar em uma só chapa de chassi.

### 4.1 Arranjo de Componentes (Layout)
O posicionamento dos componentes foi definido para otimizar o Centro de Gravidade (CG):

1.  **Motores N20:** Fixados na parte de trás do chassi.
2.  **Sensores:** Posicionados na base, na frente da bateria.
3.  **Bateria LiPo 7.4V:** Posicionada na base, na frente dos motores, para baixar o CG.
4.  **Eletrônica:** Poderão ser montados em um nível superior (deck duplo) para facilitar a prototipagem e o balanço do CG (algumas partes eletrônicas podem, eventualmente, ser instaladas no deck inferior).

## 5. Cálculos Preliminares de Massa
Considerando os componentes selecionados:

$$M_{total} = m_{chassi} + m_{motores} + m_{bateria} + m_{eletronica} + m_{rodas}$$

**Estimativa inicial:** $M_{total} \approx 300g \text{ a } 400g$.

## 6. Conclusão
O chassi será desenvolvido preferencialmente em **Impressão 3D ou Acrílico** para garantir leveza e facilidade de furação (no caso da impressão 3D, em que já seria possível dimensionar cada furo) e uma boa rigidez para os componentes. O foco principal será manter a largura total inferior a **12cm** para garantir folga nas células do labirinto (padrão 18cm).

## 7. Referências
* **CASTRO, Matheus Maurício Pereira.** *Desenvolvimento de microrrobô móvel autônomo*. 2007.
* **FEI - CENTRO UNIVERSITÁRIO.** *Robótica e Micromouse: Desafios da Engenharia*. 2021.