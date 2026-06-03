# Relatório de pesquisa PI1: Seleção de materiais para o chassi

## 1 INTRODUÇÃO
O presente relatório tem como objetivo apresentar a análise, o comparativo e a
seleção final do material estrutural adequado para a fabricação do chassi de um
microrrobô móvel autônomo (micromouse). O chassi atua como a espinha
dorsal do projeto, desempenhando o papel crítico de integrar de forma segura e
rígida todos os subsistemas essenciais, incluindo a protoboard de testes, o
microcontrolador ESP32, os micromotores N20 e a bateria LiPo de 7.4V, como
já comentado nos últimos relatórios de pesquisa.
O ambiente de operação do robô — um labirinto com células padronizadas de
18 cm — impõe restrições físicas e dinâmicas ao projeto estrutural. Para
garantir manobras ágeis e prevenir o engastamento das laterais durante a
navegação, é mandatório que a largura total do micromouse seja mantida
estritamente inferior a 12 cm. Além disso, para suportar o arranjo dos
componentes sem exceder os limites espaciais, o design estrutural adotará uma
configuração geométrica em formato de "D" (oblongo) dividida em um arranjo
de duplo deck (dois andares). Isso tudo demandam um material que ofereça uma
excelente relação entre leveza e rigidez estrutural, visando manter a estimativa
de massa total do projeto na faixa de 300g a 400g.
Neste contexto, este documento avaliará as principais opções de manufatura e
materiais aplicáveis à robótica móvel de pequeno porte — especificamente o
Acrílico, o MDF, o Alumínio e os polímeros para Manufatura Aditiva
(Impressão 3D, como PLA e PETG). A seleção levará em conta propriedades
mecânicas como densidade e rigidez, bem como a facilidade de usinagem ou
prototipagem para viabilizar as especificidades geométricas do projeto, como a
perfuração sob medida e o desnível pré-calculado para o alinhamento perfeito
do vão livre entre as rodas.

## 2 ANÁLISE COMPARATIVA E SELEÇÃO DO MATERIAL
A escolha do material do chassi afeta diretamente a inércia do robô, a
estabilidade do Centro de Gravidade (CG) e a complexidade de montagem. Para
a estrutura do micromouse, cujo peso total estimado deve ficar restrito entre
300g e 400g, avaliar a relação entre a densidade e a rigidez do material é
fundamental.
Com base nas opções de manufatura aplicáveis à robótica móvel, a Tabela 1
apresenta o comparativo das principais propriedades e métodos de fabricação
dos candidatos avaliados:

### 2.1 Detalhamento Técnico e Viabilidade
Abaixo, detalham-se os pontos fortes e as limitações de cada material frente às
necessidades geométricas e dinâmicas específicas do micromouse em questão:
- MDF (3mm):
    1. Vantagens: Apresenta baixa densidade, sendo um material extremamente
leve e de baixo custo, facilmente processado por máquinas de corte a
laser
    2. Desvantagens: Sua rigidez é apenas média, o que pode gerar flexões no
chassi quando submetido a vibrações dos motores. Além disso, por ser
uma fabricação restrita ao plano 2D (chapas planas), a solução do
desnível estrutural de 2 mm entre a Roda Boba e as rodas de tração
exigiria a adoção de calços ou espaçadores adicionais, dificultando a
montagem e o alinhamento.

- Acrílico (3mm):
    1. Vantagens: Possui alta rigidez e densidade média, conferindo um
excelente acabamento superficial e precisão no corte a laser. É uma opção
recomendada para garantir a firmeza da estrutura.
    2. Desvantagens: Embora estruturalmente superior ao MDF, o acrílico é um
material quebradiço e suscetível a trincas sob impacto. Similar ao MDF,
sua natureza em chapa plana não permite a criação de rebaixos nativos
em diferentes alturas, tornando a correção do vão livre e do CG menos
eficiente.

- Alumínio 6061:
    1. Vantagens: Garante rigidez altíssima e durabilidade excepcional. É o
material utilizado em plataformas móveis comerciais robustas, como a
base AIRAT2.
    2. Desvantagens: Sua alta densidade poderia facilmente extrapolar a meta de
peso total (300g a 400g). Adicionalmente, a manufatura exige usinagem
CNC de alto custo, tornando o projeto menos acessível para prototipagem
rápida.

- Polímeros de Impressão 3D (PLA / PETG):
    1. Vantagens: Este processo une alta rigidez estrutural a uma densidade
variável. No software de fatiamento 3D, é possível alterar a porcentagem
de preenchimento (infill) interno das peças, aliviando o peso de acordo
com a necessidade. O maior benefício, no entanto, é a liberdade
volumétrica: a impressão 3D permite projetar o chassi com os berços de
fixação dos motores N20 e da Roda Boba já com o desnível exato de 2
mm pré-calculado. Isso elimina a necessidade de peças de adaptação e
facilita o alinhamento minucioso dos furos de todos os sensores e placas
de forma nativa.

### 2.2 Conclusão da Seleção
Diante do comparativo, a Impressão 3D (utilizando filamentos como PLA ou
PETG) destaca-se como o método ideal para a fabricação do chassi do
micromouse.
A escolha justifica-se pela possibilidade exclusiva de usufruir de densidade
variável, otimizando o peso total do projeto, aliada à capacidade técnica de
moldar o chassi com a espessura tridimensional necessária. Esta característica
resolve diretamente o desafio mecânico do nivelamento entre as rodas, além de
permitir o desenho em "D" com furações complexas para suportar o arranjo de
duplo deck sem exceder o limite crítico de 12 cm de largura.

## 3 JUSTIFICATIVA DO DESIGN GEOMÉTRICO
### 3.1. Tipo de Filamento e Gerenciamento de Massa
Para a fabricação do chassi via impressão 3D, os filamentos mais indicados são
o PLA ou o PETG. A justificativa para a escolha desses polímeros baseia-se na
sua característica de entregar uma rigidez estrutural alta, o que é essencial para
criar uma espinha dorsal firme que suporte as vibrações dos motores e integre as
placas sem flexões.
Sobre a quantidade de gramas do filamento (a massa do chassi, representada por
mchassi), os cálculos preliminares do projeto estipulam que a massa total do
micromouse (Mtotal) deve ser limitada à margem de 300g a 400g. Como a
massa total é a soma de todos os componentes
(Mtotal=mchassi+mmotores+mbateria+meletronica+mrodas), o peso exato da
impressão será determinado para equilibrar essa equação. A grande vantagem
do PLA e do PETG neste cenário é a densidade variável: alterando a
porcentagem de preenchimento interno (infill) no fatiador 3D, você pode aliviar
o peso da peça. Isso garante que o chassi consuma apenas a fração de massa
estritamente necessária para a amarração mecânica, reservando a maior parte
dos 400g de limite para os componentes densos, como os motores N20 e a
bateria LiPo.

### 3.2 Geometria em Formato de "D" (Oblongo)
O ambiente do labirinto exige que formatos com quinas vivas sejam evitados
para prevenir o risco de engastamento do robô durante colisões laterais. A
escolha do formato em "D" (ou oblongo) atende a dois requisitos simultâneos:
A frente plana facilita a fixação e o alinhamento adequado dos sensores
infravermelhos que precisam varrer as paredes.
A traseira arredondada otimiza o raio de giro, permitindo que o robô faça
manobras evasivas e rotacione sobre o próprio eixo nas curvas sem prender o
chassi nas paredes de 18 cm.

## 4 NTEGRAÇÃO CINEMÁTICA
A seleção de materiais e a definição da arquitetura do chassi são pilares que
determinam o sucesso navegacional de um micromouse. A conclusão desta
análise estabelece que a adoção da Manufatura Aditiva (Impressão 3D com PLA
ou PETG) é a escolha tecnicamente superior frente a materiais laminados (como
Acrílico ou MDF) e usinados (como Alumínio). Essa superioridade se dá pela
liberdade de preenchimento variável (infill), que permite controlar a fração
exata de massa do chassi (mchassi) para manter o robô dentro da meta ideal de
300g a 400g, e pela capacidade de modelagem tridimensional nativa de berços e
encaixes.

### 4.1. Resolução Cinemática e Nivelamento
A integração entre o chassi impresso em 3D e o sistema de rodagem é o que
garante a estabilidade cinemática do robô. A navegação precisa requer que a
base do chassi esteja rigorosamente paralela ao piso. O projeto utilizará as rodas
StickyMAX S20 macias, que possuem diâmetro externo de 32 mm. Isso
posiciona o centro do eixo dos motores N20 a exatos 16 mm do solo. Como a
roda de apoio (Roda Boba Esfera) possui uma altura de 14 mm, cria-se um
desnível natural de 2 mm.
A grande vantagem conclusiva do uso do PLA/PETG em impressoras 3D é que
a compensação desse desnível de 2 mm não exigirá calços de adaptação. O
chassi será modelado com os berços dos motores N20 rebaixados de forma
precisa, permitindo que a face inferior do micromouse deslize perfeitamente
nivelada a um vão livre de 14 mm, maximizando a área de contato das rodas
StickyMAX e garantindo tração integral e aderência máxima.

### 4.2. Síntese do Layout Geométrico e Restrições Físicas
Para que o micromouse consiga realizar curvas de alta velocidade dentro das
células de 18 cm do labirinto padrão, o design em formato de "D" (ou oblongo)
se mostra a geometria mais eficiente. A seção traseira arredondada oferece o
melhor raio de giro, impedindo que o robô engaste nas paredes ao rotacionar
sobre o próprio eixo. Simultaneamente, a seção frontal plana acomoda sem
angulações indesejadas os sensores infravermelhos Sharp20, mantendo a largura
do chassi em um limite estrito inferior a 12 cm.
Por fim, a adoção da arquitetura de duplo deck (dois andares) consolida a
organização de componentes. A limitação de espaço exigida pela protoboard e
demais módulos no plano horizontal é resolvida empilhando a eletrônica de
processamento no deck superior. O deck inferior, rebaixado a 14 mm do solo,
atua como âncora gravitacional, abrigando a bateria LiPo de 7.4V (2000mAh)
posicionada entre os motores N20 traseiros.
Essa configuração rebaixa o Centro de Gravidade (CG) drasticamente e
concentra a massa máxima exatamente sobre o eixo imaginário das rodas
StickyMAX. O resultado cinemático é a conversão direta de peso em força de
atrito (tração) sobre o silicone, conferindo extrema estabilidade direcional ao
chassi em formato de "D" e imunidade contra capotamentos ou derrapagens
durante manobras evasivas nas células de 18 cm.

## 5 CONCLUSÃO
Considerando que o projeto contará com apenas uma versão impressa do chassi
e que o micromouse não estará sujeito a impactos significativos durante sua
operação, conclui-se que o PLA é o material mais adequado para a fabricação
da estrutura. Esse material apresenta boa rigidez, baixo custo, facilidade de
impressão e precisão dimensional satisfatória, características importantes para
garantir o correto posicionamento dos motores, sensores e demais componentes.
Além disso, por possuir menor dificuldade de fabricação em comparação ao
PETG, o PLA reduz riscos de falhas de impressão e contribui para a obtenção
de uma estrutura leve e funcional dentro das limitações do projeto.

### Tabela: comparação PLA e PETG

| Material | Preço médio | Facilidade de impressão | Resistência |
| :--- | :--- | :--- | :--- |
| PLA | R$ 90 – R$ 150 | Alta (fácil) | Média |  
| PETG | R$ 120 – R$ 200 | Média | Alta |  
