# Relatório de Pesquisa: Rodas e Eixos para Micromouse

Este documento apresenta uma pesquisa inicial sobre os componentes mecânicos de rodagem para o projeto integrador de Micromouse, focando em materiais, dimensionamento e configurações do conjunto de rodagem.

---

## 1. Materiais e Composição

O conjunto de rodagem é fundamental para o equilíbrio entre tração e inércia.  
Ele é dividido em núcleo (aro) e banda de rodagem (pneu).

### 1.1 Núcleo (Aro)

- **Alumínio (7075 ou 6061):**  
  Padrão para competição por ser leve e oferecer excelente rigidez, evitando a flambagem do eixo.  
  A liga 7075 é mais dura, reduzindo o desgaste do furo do eixo.

- **Impressão 3D (PLA/ABS/PETG):**  
  Ideal para prototipagem rápida. PETG é preferível pela resistência.  
  Pode haver excentricidade, causando vibrações.

- **Nylon/Delrin:**  
  Alta resistência ao impacto e baixo atrito, porém difícil de trabalhar.

### 1.2 Banda de Rodagem (Pneu)

- **Silicone de Alta Aderência:**  
  Maior coeficiente de atrito. Moldado no aro.  
  Desvantagem: acumula poeira rapidamente.

- **Borracha de Poliuretano:**  
  Mais durável, porém com menor aderência.

- **Espuma:**  
  Muito leve e com ótima tração inicial.  
  Desgasta rapidamente.

### Comparação de Materiais

| Material              | Tração        | Peso   | Manutenção              |
|----------------------|--------------|--------|-------------------------|
| Borracha Comum       | Média        | Médio  | Baixa                  |
| Silicone Moldado     | Altíssima    | Médio  | Alta (acumula poeira)  |
| Mini-Z (Borracha)    | Alta         | Baixo  | Média                  |
| Espuma               | Alta         | Mínimo | Troca frequente        |

---

## 2. Dimensionamento

- **Diâmetro da Roda:**  
  Rodas maiores → maior velocidade final  
  Rodas menores → melhor torque e estabilidade  
  Faixa comum: **30mm a 45mm**

- **Largura da Roda:**  
  Entre **3mm e 10mm**  
  Maior largura → mais tração, porém mais peso

---

## 3. Física

- **Momento de Inércia:**  
  `I = k · m · r²`  
  Rodas menores facilitam controle de aceleração.

- **Aceleração:**  
  Pode ultrapassar **1G** em robôs de alto desempenho.  
  Exige alto coeficiente de atrito.

- **Centro de Massa (CoM):**  
  Deve ser baixo para evitar perda de tração ou “empinar”.

---

## 4. Transmissão e Eixos

- **Acoplamento Direto:**  
  Roda fixada diretamente no motor  
  ✔ Simples e leve  
  ✖ Pode danificar o motor

- **Eixo com Rolamento Externo:**  
  Usa engrenagens/correias  
  ✔ Mais estável e protege o motor

### Materiais de Eixos

- **Aço Inoxidável:** resistente, mas pesado  
- **Titânio:** excelente relação peso/resistência  
- **Fibra de Carbono:** muito leve, porém frágil

---

## 5. Configurações de Rodas

Sistema padrão: **direção diferencial**

### 5.1 Duas Rodas + Castor

Configuração mais comum.

- **Ball Caster:**  
  Esfera → movimento suave, mas mais pesada

- **Slider (Teflon/Nylon):**  
  Mais leve, porém pode gerar vibração

### 5.2 Quatro Rodas

- Todas motorizadas  
- ✔ Alta aceleração  
- ✖ Mais complexo e pesado  
- ✖ Pode causar instabilidade se mal alinhado

---

## 6. Exemplos de Componentes

### StickyMAX S20
- Diâmetro: 22mm  
- Largura: 16mm  
- Material: Silicone  
- Peso: 8,5g  
- Link: https://www.robocore.net/roda/roda-stickymax-s20-22mm

### Pololu Wheel
- Dimensão: 32x7mm  
- Encaixe: eixo em “D” (3mm)  
- Peso: ~3,1g  
- Link: https://www.pololu.com/product/1087

### Ball Caster W420
- Esfera: 15mm  
- Material: aço e nylon  
- Peso: 18g  
- Link: https://www.mamuteeletronica.com.br/roda-boba-esfera-deslizante-w420-22587

---

## 7. Referências

- CASTRO, Matheus Maurício Pereira. *Desenvolvimento de microrrobô móvel autônomo*. USP, 2007.  
- FEI – Centro Universitário. *Robótica e Micromouse*, 2021.  
- FingerTech Robotics. *Snap Wheels Technical Specifications*.  
- GOMES, Felipe Cardoso et al. *Integração Hardware-Software dedicada a robô micromouse*, 2023.  
- HARRISON, P. *Micromouse Wheel Design and Tyres*, 2017.  
- IEEE Spectrum. *Micromouse Competition: High-Speed Robotics*.  

---
