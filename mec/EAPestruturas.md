# EAP - Estrutura Analítica do Projeto
**Equipe:** Estruturas  
**Projeto:** Micromouse

Para a efetivação do projeto Micromouse, a equipe de estruturas deve garantir um compromisso rigoroso entre leveza e rigidez, iniciando pela seleção estratégica de materiais que envolve a análise do coeficiente de atrito de pneus para tração máxima e a escolha entre materiais de prototipagem rápida, com redução de massa, para a construção do modelo do chassi. 

O desenvolvimento segue com a modelagem CAD para criar um chassi compacto com furações e suportes otimizados, acompanhado de um estudo de Centro de Gravidade (CG) para mantê-lo próximo ao solo e centralizado, além de uma dinâmica de balanço de peso que realoca componentes como a bateria para assegurar força normal nas rodas e evitar deslizes em curvas. 

Paralelamente, a equipe deve mitigar vibrações mecânicas para proteger os dados da IMU, projetar suportes rígidos e anteparos para sensores IR a fim de evitar erros de paralaxe, enquanto assegura o alinhamento de eixos para eliminar atrito interno. Finalmente, a entrega exige a realização de testes de estresse estático no chassi, a validação da tração em superfície real com o hardware montado e a calibração precisa do posicionamento dos sensores para a navegação final.

---

## 1. Seleção de Materiais e Componentes
A base do projeto exige um compromisso entre leveza e rigidez.

* **Seleção de Rodas:** Análise do coeficiente de atrito para pneus de borracha ou silicone, garantindo tração máxima para os motores N20.
* **Materiais do Chassi:** Discussão entre o uso de polímeros (impressão 3D) para prototipagem rápida ou fibra de carbono/alumínio para redução de peso e aumento da rigidez.

## 2. Modelagem CAD e Geometria do Chassi
O modelo de chassi deve ser compacto para navegar no labirinto sem colisões.

* **Construção no CAD:** Desenvolvimento detalhado das furações, suportes de motores e encaixes de bateria.
* **Estudo de CG (Centro de Gravidade):** Determinação do CG via software e verificação analítica para garantir que o ponto de massa esteja o mais próximo possível do solo e centralizado entre as rodas motrizes.

## 3. Dinâmica e Balanço de Peso
* **Otimização da Distribuição de Peso:** Realocação de componentes pesados (como a bateria) para otimizar o balanço de carga nas rodas.
* **Estudo de Tração:** Verificação da força normal em cada roda para evitar o deslizamento em curvas de alta velocidade.

## 4. Problemas Estruturais e Sensoriais
* **Vibrações Mecânicas:** Identificar fontes de vibração (motores em alta rotação ou irregularidades na pista). A estrutura deve ser capaz de amortecer essas vibrações para não gerar ruído nos dados da IMU (Giroscópio/Acelerômetro) e dos sensores de distância.
* **Erro de Paralaxe:** A equipe de estruturas deve projetar suportes rígidos para os sensores IR. Se o sensor estiver desalinhado ou se mover com a trepidação, ocorrerá o erro de paralaxe: o sensor indicará que o robô está reto quando, na verdade, ele está angulado em relação à parede. Criar anteparos estruturais que impeçam que a luz de um sensor interfira na leitura do outro (*cross-talk*) ou que a luz ambiente cause leituras falsas.
* **Atrito Interno:** Garantir que o alinhamento dos eixos e motores não gere atrito mecânico desnecessário, o que desperdiçaria a energia da bateria e aqueceria os motores.

## 5. Requisitos para Operação Efetiva
Para o Micromouse andar efetivamente, quando montado, a equipe de estruturas deverá:

1.  Realizar testes de estresse estático no chassi.
2.  Montar o hardware e validar a tração em superfície real.
3.  Calibrar o posicionamento dos sensores para navegação final.