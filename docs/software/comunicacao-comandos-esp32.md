# Arquitetura de comunicação bidirecional (Backend → ESP32)

## Opções avaliadas

| Opção | Tempo real | Bidirecional | Infra extra | Conforme RE-02 |
| :--- | :---: | :---: | :---: | :---: |
| HTTP Server no ESP32 | Médio | Não | Servidor no ESP32 | Parcial |
| **WebSocket persistente** | **Sim** | **Sim** | **Nenhuma** | **Sim** |
| Polling no Backend | Não (latência alta) | Não | Nenhuma | Parcial |
| MQTT | Sim | Sim | Broker | Não |

## Decisão adotada

**WebSocket persistente sobre Wi-Fi, com o ESP32 como cliente.** O robô conecta-se à LAN e mantém uma conexão WebSocket aberta com o backend; o backend empurra os comandos por ela em tempo real. É a opção mais simples que cumpre o **RE-02** (Wi-Fi + WebSocket), reaproveitando a mesma tecnologia já usada entre backend e dashboard, sem broker nem servidor embarcado.

*Já implementado no projeto: o canal de comandos via Bluetooth serial (ponte no backend), que permanece como fallback para cenários sem Wi-Fi.*

## Fluxo de comunicação

```text
Dashboard --POST /comando--> Backend --(WebSocket, Wi-Fi)--> ESP32
   ^                                                            |
   +-- WebSocket /ws/dashboard <-- telemetria (confirmação) <---+
```

O frontend só fala com o backend (HTTP); o backend empurra o comando ao robô pela conexão WebSocket; o ESP32 executa e confirma pela telemetria.

## Contrato dos comandos

| Comando | Payload | Efeito |
| :--- | :--- | :--- |
| Iniciar | `start` ou `start 4` / `start 8` / `start 16` | Inicia a corrida no tamanho indicado. |
| Resetar | `reset` | Volta ao estado de espera. |

**Frontend → Backend:** `POST /comando` com `{ "command": "start 8" }`.

**Resposta de confirmação (dois níveis):**

1. **HTTP `200`** = comando aceito e enviado ao robô (`422` se inválido).
2. **Telemetria** = o evento `start_race` / mudança de `race_status` confirma que o robô executou. A UI deve usar este nível.
