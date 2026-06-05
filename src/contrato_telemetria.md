# Contrato de Telemetria

O contrato de telemetria define o padrão de comunicação entre o firmware (ESP32), o backend (FastAPI) e o frontend (Dashboard), assegurando que todos os componentes operem sob a mesma especificação de dados. Este documento detalha os campos, tipos, obrigatoriedade e a lógica de eventos necessária para o monitoramento em tempo real da corrida.

## 1. Especificação Técnica do Pacote JSON

Os dados são transmitidos em pacotes estruturados em JSON. A tabela a seguir consolida a especificação de cada campo.

| Campo | Tipo de Dado | Obrigatório | Descrição |
| :--- | :--- | :---: | :--- |
| `robot_id` | `string` | Sim | Identificador único do robô (ex: `micromouse_01`). |
| `timestamp` | `string` | Sim | Data e hora no formato ISO 8601 (`YYYY-MM-DDTHH:MM:SSZ`). |
| `maze_type` | `string` | Sim | Configuração do labirinto (`4x4`, `8x8`, `16x16`, `custom`). |
| `current_position` | `object` | Sim | Posição atual: `x` (`float`), `y` (`float`), `z` (`float`) e `orientation` (`float`). O campo `z` representa a aceleração no eixo vertical em m/s², proveniente do MPU-6500. |
| `path_traversed` | `array` | Sim | Lista de coordenadas `{x, y, z}` percorridas desde o início. O campo `z` registra a aceleração vertical no momento de cada posição. |
| `battery_voltage_v`| `float` | Sim | Tensão da bateria em Volts (V). |
| `speed_mm_s` | `float` | Sim | Velocidade atual em milímetros por segundo (mm/s). |
| `elapsed_time_ms` | `int` | Sim | Tempo de corrida acumulado em milissegundos (ms). |
| `race_status` | `string` | Sim | Estado da corrida (`ready`, `running`, `paused`, `finished`, `error`). |
| `event` | `string` | Não | Identificador de evento especial (ver seção 3). |
| `message` | `string` | Não | Mensagem descritiva associada ao evento ou erro. |
| `objective_location`| `object` | Não | Coordenadas `{x, y, z}` do centro do labirinto (objetivo). |

## 2. Protocolo de Transmissão, Frequência e Persistência

### 2.1 Transmissão Contínua

Para garantir a fidelidade da visualização no dashboard, o fluxo de dados deve respeitar as seguintes regras:

- **Frequência de Envio:** O firmware deve realizar o envio periódico com frequência mínima de **1 pacote por segundo (1Hz)** durante a navegação ativa, conforme definido pelo RE-02.
- **Prioridade de Eventos:** Mensagens de evento possuem prioridade alta e devem ser disparadas imediatamente após a detecção do gatilho lógico.

### 2.2 Política de Persistência

A persistência dos dados é **diferida**: os pacotes recebidos durante a corrida são mantidos **exclusivamente em memória** (buffer de sessão no backend) e **não são gravados no banco de dados** enquanto `race_status` for `running` ou `paused`.

A gravação no banco de dados ocorre **uma única vez**, de forma atômica, quando o backend recebe um pacote com `race_status = "finished"` ou o evento `race_ended`. **O pacote de finalização deve obrigatoriamente incluir o `path_traversed` completo** com todas as coordenadas `{x, y, z}` percorridas desde o início da corrida — é a partir dele que o backend persiste o trajeto integral. Nesse momento, o backend consolida o buffer de sessão, calcula os dados derivados (tempo total, velocidade média, consumo de bateria) e persiste o registro completo da corrida.

Em caso de `race_status = "error"`, o buffer de sessão é descartado e **nenhum dado é persistido**.

| Situação | Ação do Backend |
| :--- | :--- |
| `race_status = "running"` ou `"paused"` | Repassa ao dashboard via stream; armazena em buffer de memória. |
| `race_status = "finished"` / evento `race_ended` | Persiste o registro completo no banco (exige `path_traversed` completo); limpa o buffer. |
| `race_status = "error"` | Descarta o buffer; nenhuma escrita no banco. |

## 3. Eventos Especiais e Mensagens

Eventos especiais são sinalizações de mudanças de estado ou marcos atingidos durante a corrida. Cada evento deve incluir uma mensagem amigável para exibição no dashboard.

| Evento | Mensagem Exemplo | Gatilho Lógico |
| :--- | :--- | :--- |
| `start_race` | "Corrida iniciada: Robô em movimento." | Início da execução do algoritmo de busca. |
| `objective_found` | "Objetivo localizado no centro do labirinto!" | Detecção das coordenadas da célula alvo. |
| `error_occurred` | "Erro crítico: Falha na leitura dos sensores." | Interrupção por falha de hardware ou software. |
| `race_ended` | "Corrida finalizada com sucesso!" | Chegada e parada total na célula objetivo. **Dispara a persistência.** |

## 4. Exemplo de Pacote Válido

### Transmissão Contínua (Navegação Ativa)
A seguir, apresentamos um exemplo do pacote transmitido de forma contínua, contendo exclusivamente os campos obrigatórios.

```json
{
  "robot_id": "micromouse_01",
  "timestamp": "2026-06-04T13:30:15Z",
  "maze_type": "4x4",
  "current_position": {
    "x": 60.2,
    "y": 15.0,
    "z": 9.81,
    "orientation": 90.0
  },
  "path_traversed": [
    { "x": 0.0, "y": 0.0, "z": 9.80 },
    { "x": 30.0, "y": 0.0, "z": 9.78 },
    { "x": 60.2, "y": 15.0, "z": 9.81 }
  ],
  "battery_voltage_v": 7.32,
  "speed_mm_s": 120.5,
  "elapsed_time_ms": 5000,
  "race_status": "running"
}
```

### Evento Especial (Objetivo Localizado)
Abaixo, um exemplo de pacote transmitido no momento em que o robô localiza o objetivo central. Note os campos `z` presentes em `current_position`, `path_traversed` e `objective_location`.

```json
{
  "robot_id": "micromouse_01",
  "timestamp": "2026-06-04T13:31:00Z",
  "maze_type": "4x4",
  "current_position": {
    "x": 120.5,
    "y": 45.0,
    "z": 9.81,
    "orientation": 90.0
  },
  "path_traversed": [
    { "x": 0.0,   "y": 0.0,  "z": 9.80 },
    { "x": 50.0,  "y": 0.0,  "z": 9.79 },
    { "x": 120.5, "y": 45.0, "z": 9.81 }
  ],
  "battery_voltage_v": 7.4,
  "speed_mm_s": 150.0,
  "elapsed_time_ms": 15000,
  "race_status": "running",
  "event": "objective_found",
  "message": "Objetivo localizado no centro do labirinto!",
  "objective_location": {
    "x": 120.5,
    "y": 45.0,
    "z": 9.81
  }
}
```

## 5. Exemplo de Pacote de Finalização (Dispara Persistência)

O pacote abaixo exemplifica a mensagem que encerra a corrida e aciona a gravação no banco de dados.

```json
{
  "robot_id": "micromouse_01",
  "timestamp": "2026-06-04T13:31:20Z",
  "maze_type": "4x4",
  "current_position": {
    "x": 120.5,
    "y": 45.0,
    "z": 9.81,
    "orientation": 0.0
  },
  "path_traversed": [
    { "x": 0.0,   "y": 0.0,  "z": 9.80 },
    { "x": 50.0,  "y": 0.0,  "z": 9.79 },
    { "x": 120.5, "y": 45.0, "z": 9.81 }
  ],
  "battery_voltage_v": 7.1,
  "speed_mm_s": 0.0,
  "elapsed_time_ms": 20000,
  "race_status": "finished",
  "event": "race_ended",
  "message": "Corrida finalizada com sucesso!",
  "objective_location": {
    "x": 120.5,
    "y": 45.0,
    "z": 9.81
  }
}
```



