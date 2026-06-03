# Memorial de Cálculo e Design Estrutural: Micromouse

## 1. Descrição do Projeto
Este documento detalha a otimização do Centro de Gravidade (CG) e a organização dos componentes para o Micromouse com chassi de **12 x 12 cm** e placa de fenolite de **10 x 10 cm**.

---

## 2. Configuração Estrutural
*   **Andar Inferior:** Contém motores N20, com as rodas S20, bateria (posicionada entre os motores), 5 sensores Sharp na frente e roda boba.
*   **Andar Superior:** Placa de fenolite com ESP32, Ponte H DRV8833, Regulador MP1584 e Giroscópio MPU6500.
*   **Otimização de Massa:** O chassi será vazado acima dos motores para alívio de peso e sólido acima da roda boba para garantir pressão de contato e estabilidade dos sensores.

---

## 3. Cálculo do Centro de Gravidade (CG)
Considerando o eixo $X=0$ no centro das rodas motoras, $Z=0$ no solo e as massas estimadas dos componentes:

### 3.1 Coordenadas Longitudinais ($X$)
O objetivo é manter o CG levemente à frente do eixo motor ($0 < \bar{x} < 2$ cm) para garantir tração e estabilidade da roda boba.

$$\bar{x} = \frac{\sum (m_i \cdot x_i)}{\sum m_i}$$

**Massas e posições consideradas:**
*   **Motores e Rodas ($m_1 \approx 86$g):** Localizados no eixo motor ($x_1 = 0$ cm).
*   **Bateria ($m_2 \approx 100$g):** Posicionada entre os motores ($x_2 \approx 0$ cm).
*   **Placa Fenolite e Eletrônica ($m_3 \approx 45$g):** Centralizada no chassi ($x_3 \approx 2$ cm).
*   **Sensores Sharp ($m_4 \approx 25$g):** Localizados na extremidade frontal ($x_4 \approx 10$ cm).
*   **Roda Boba ($m_5 \approx 18$g):** Localizada na frente ($x_5 \approx 9$ cm).

**Aplicação dos valores:**
$$\bar{x} = \frac{(86 \cdot 0) + (100 \cdot 0) + (45 \cdot 2) + (25 \cdot 10) + (18 \cdot 9)}{86 + 100 + 45 + 25 + 18}$$

$$\bar{x} = \frac{0 + 0 + 90 + 250 + 162}{274} = \frac{502}{274} \approx 1,83 \text{ cm}$$

### 3.2 Análise de Estabilidade Longitudinal
O CG calculado em **18,3 mm** à frente do eixo motor é ideal para a configuração com roda boba na frente. Este posicionamento garante:
1.  **Tração:** Aproximadamente $80\%$ do peso permanece sobre as rodas motoras.
2.  **Aderência Frontal:** Peso suficiente na roda boba para evitar oscilações nos sensores Sharp durante a aceleração.
3.  **Agilidade:** O baixo momento de inércia longitudinal permite curvas rápidas sem subesterço excessivo.

### 3.3 Coordenadas Verticais ($Z$)
Para evitar o tombamento em curvas, o limite de equilíbrio estático para a altura do CG é dado por:

$$Z_{max} = \frac{L \cdot g}{2 \cdot a_c}$$

Onde:
*   $L = 0,12$ m (largura da bitola);
*   $g \approx 9,81$ m/s² (gravidade);
*   $a_c$ é a aceleração lateral máxima.

Considerando uma aceleração de $1,5g$ ($14,7$ m/s²):
$$Z_{max} = \frac{0,12 \cdot 9,81}{2 \cdot 14,7} \approx 0,04 \text{ m}$$

### 3.4 Conclusão do Dimensionamento
A altura máxima permitida para o CG é de **40 mm**. Estima-se que o CG real ficará entre **25 mm e 30 mm**, garantindo uma boa margem de segurança.

---

## 4. Dimensionamento da Altura entre Andares
*   **Altura Ideal:** 30 mm a 35 mm.
*   **Justificativa:** Permite o alojamento da bateria no nível inferior e mantém a eletrônica próxima ao solo, minimizando o braço de alavanca.

---

## 5. Tabela de Componentes e Posicionamento

| Componente | Massa Est. (g) | Andar | Posição Sugerida |
| :--- | :--- | :--- | :--- |
| Bateria | 50 | Inferior | Entre os motores ($x \approx 0$) |
| Motores N20 | 40 (par) | Inferior | Eixo Central ($x = 0$) |
| Sensores Sharp | 25 (total) | Inferior | Frente ($x \approx 10$) |
| ESP32 | 10 | Superior | Centro ($x \approx 2$) |
| MPU6500 | 2 | Superior | Origem ($x=0, y=0$) |