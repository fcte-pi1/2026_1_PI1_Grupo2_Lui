# Diagrama BPMN

O diagrama modela o fluxo principal de uma corrida do Micromouse em notação BPMN 2.0, do acionamento do robô até a consulta de histórico. O nível adotado é **Descritivo**: foco nas responsabilidades e no fluxo geral.

<!-- TODO: inserir o diagrama quando disponível -->
<!-- ![Diagrama BPMN 2.0 do fluxo principal](./assets/diagrama_bpmn.svg) -->

## Pools, Lanes e Data Objects

### Pools

| Pool | Participante | Descrição |
|---|---|---|
| **Pool 1** | Operador | Inicia a corrida, monitora telemetria e consulta histórico |
| **Pool 2** | Micromouse (Firmware) | Sistema embarcado no ESP32 que navega de forma autônoma e envia telemetria |
| **Pool 3** | Sistema Web | Recebe, processa, exibe e persiste os dados da corrida |

### Lanes do Pool 3

| Lane | Área | Responsabilidade |
|---|---|---|
| **Lane 3A** | Backend (FastAPI) | Recebe telemetria, valida, retransmite ao frontend e persiste no SQLite |
| **Lane 3B** | Frontend (HTML/CSS/JS) | Renderiza o painel e exibe os dados em tempo real |

### Data Objects

| Data Object | Produzido por | Consumido por |
|---|---|---|
| Pacote de Telemetria | Firmware | Backend |
| Sinal de Conclusão | Firmware | Backend |
| Dados Processados em Tempo Real | Backend | Frontend |
| Resumo Final da Corrida | Backend | Frontend, Banco SQLite |
| Registros Históricos | Banco SQLite | Backend → Frontend |
| Mapa do Labirinto (memória interna) | Firmware | Firmware (uso interno) |
| Leituras dos Sensores IR | Sensores físicos | Firmware |

> O SQLite não é um Pool, e sim um Data Object persistente acessado apenas pelo Backend.

## Atividades por Pool e Lane

### Pool 1 — Operador

Ator humano. Atua no início e na consulta; durante a corrida apenas observa, pois o robô é autônomo.

1. Selecionar o labirinto (4×4, 8×8 ou 16×16).
2. Posicionar o micromouse na célula de partida.
3. Iniciar a corrida via botão físico. A partir daqui, qualquer intervenção é vedada.
4. Monitorar a telemetria pela interface web.
5. Consultar histórico *(opcional)*: filtra por labirinto ou exibe todas as corridas.

**Mensagens enviadas:** Sinal de início → Firmware.

### Pool 2 — Micromouse (Firmware)

Após o início, toda a inteligência opera no ESP32, sem comandos externos. O processo tem duas fases:

- **Fase 1 — Exploração:** navega devagar célula a célula, construindo o mapa via Flood Fill.
- **Fase 2 — Corrida:** com o mapa pronto, percorre o caminho mais curto em velocidade máxima.

**Atividades:**

1. Inicializar o sistema: ativa sensores (IR e encoders), define posição inicial e prepara a matriz do mapa.
2. Ler os sensores a cada ciclo (≤ 10 ms) para detectar paredes adjacentes.
3. Atualizar o mapa na memória interna.
4. Executar Flood Fill para calcular a direção de menor custo até a sala central.
5. Controlar os motores (PID) para velocidade, direção e centralização.
6. Detectar o objetivo (sala central 2×2): encerra a fase e, se for a segunda passagem, emite o sinal de conclusão.

> **Gateway Paralelo (divisão):** após a inicialização, o fluxo se divide entre o loop de navegação (2–6) e o envio contínuo de telemetria (7).

7. Enviar pacotes de telemetria via Wi-Fi/WebSocket (≥ 1 pacote/s): posição (X, Y), velocidade média, bateria e status.

> **Gateway Paralelo (reunião):** os dois caminhos convergem após a detecção do objetivo e o envio do sinal de conclusão.

**Mensagens enviadas:** Pacotes de telemetria e Sinal de conclusão → Backend.

### Pool 3 — Sistema Web

#### Lane 3A — Backend (FastAPI)

1. Receber pacotes de telemetria em endpoint WebSocket.
2. Validar e processar os dados: pacotes inválidos são rejeitados (400) sem derrubar o servidor.
3. Retransmitir ao Frontend via WebSocket (≤ 1 s), **antes** da persistência.
4. Detectar encerramento: ao receber o sinal de conclusão, compila o resumo final. Desconexões abruptas sem flag não geram registro.
5. Retransmitir o resumo final ao Frontend **antes** de gravar no banco.
6. Persistir o resumo no SQLite.
7. Responder a consultas históricas: filtra por labirinto ou retorna todas as corridas. Banco vazio retorna `[]` com status 200.

#### Lane 3B — Frontend (HTML/CSS/JS)

1. Estabelecer conexão WebSocket automaticamente ao abrir o Dashboard, com reconexão automática em caso de queda.
2. Renderizar o painel com os 6 campos obrigatórios: tipo do labirinto, trajeto, bateria, velocidade média, tempo e status (S/N).
3. Atualizar o mapa do labirinto conforme os dados chegam.
4. Detectar conclusão e exibir resultado final: transita automaticamente para a tela consolidada.
5. Exibir consultas históricas com filtro por labirinto ou todas as corridas.

## Fluxo Geral

`→ [mensagem] →` = fluxo de mensagem entre Pools; `→` = fluxo de sequência interno.

1. **[Operador]** Seleciona labirinto → posiciona o robô → aciona início. `→ [Sinal de início] →` **[Firmware]**
2. **[Firmware]** Inicializa → *Gateway Paralelo (divisão)*:
   - **Caminho A — Exploração:** lê sensores → atualiza mapa → Flood Fill → controla motores → *Objetivo atingido?* Não: repete; Sim: salva mapa → inicia Corrida.
   - **Caminho A — Corrida:** recalcula caminho mínimo → percorre em velocidade máxima → detecta objetivo → emite sinal de conclusão.
   - **Caminho B — Telemetria:** monta pacote `→ [Pacote] →` **[Backend]** → próximo ciclo.
   - *Gateway Paralelo (reunião)* `→ [Sinal de conclusão] →` **[Backend]**
3. **[Backend]** Valida pacote → *Válido?* Sim: processa e retransmite ao **[Frontend]**; Não: rejeita.
4. **[Backend]** Recebe sinal de conclusão → *Flag presente?* Sim: compila resumo → retransmite ao **[Frontend]** → persiste no SQLite; Não: descarta.
5. **[Frontend]** Detecta flag → exibe tela consolidada → **[Operador]** visualiza o resultado.
6. *(Opcional)* **[Operador]** solicita histórico → **[Backend]** consulta banco → **[Frontend]** exibe.

## Eventos Principais

| Tipo de Evento | Pool/Lane | Descrição |
|---|---|---|
| Início (Genérico) | Operador | Decisão de iniciar a corrida |
| Início (Mensagem) | Firmware | Recebe sinal de início |
| Início (Mensagem) | Backend | Aguarda conexão WebSocket |
| Intermediário (Envio) | Firmware | Envia pacote de telemetria |
| Intermediário (Recepção) | Backend | Recebe pacote de telemetria |
| Intermediário (Envio) | Firmware | Envia sinal de conclusão |
| Intermediário (Recepção) | Backend | Recebe sinal de conclusão |
| Intermediário (Erro) | Backend | Desconexão abrupta — corrida descartada |
| Fim (sucesso) | Firmware | Sala central detectada |
| Fim (falha) | Firmware | Tentativas esgotadas |
| Fim | Backend | Dados finais gravados |
| Fim | Operador | Sessão encerrada |

## Gateways

| Gateway | Tipo | Pool/Lane | Condições |
|---|---|---|---|
| Divisão navegação + telemetria | Paralelo (+) | Firmware | Divide em loop de navegação e envio de telemetria |
| Reunião navegação + telemetria | Paralelo (+) | Firmware | Sincroniza após objetivo + sinal de conclusão |
| Objetivo atingido? | XOR | Firmware | Sim → encerra fase; Não → repete loop |
| Pacote válido? | XOR | Backend | Sim → processa e retransmite; Não → rejeita com 400 |
| Flag de conclusão presente? | XOR | Backend | Sim → resumo + retransmite + persiste; Não → descarta |
| Corrida finalizada? | XOR | Frontend | Sim → tela consolidada; Não → mantém telemetria |

## Objetos de Conexão

| Tipo | Entre | Descrição |
|---|---|---|
| Fluxo de Sequência (contínua) | Atividades do mesmo Pool | Conecta atividades, eventos e gateways |
| Fluxo de Mensagem (tracejada) | Operador → Firmware | Sinal de início |
| Fluxo de Mensagem (tracejada) | Firmware → Backend | Pacotes de telemetria (Wi-Fi/WebSocket) |
| Fluxo de Mensagem (tracejada) | Firmware → Backend | Sinal de conclusão |
| Associação (pontilhada) | Atividades ↔ Data Objects | Liga atividades a seus insumos e resultados |

---

## Histórico de versões

| Versão | Data | Descrição | Autor(es) | Revisor(es) | Descrição da Revisão |
| :----: | :--------: | :-------: | :-------: | :---------: | :--------------------: |
| `1.0` | 27/04/2026 | Criação do documento de descrição textual do Diagrama BPMN | [Arthur Moreira](https://github.com/arthurrochamoreira) | Pendente | |
| `1.1` | 29/04/2026 | Melhoria da estrutura do documento | [Arthur Moreira](https://github.com/arthurrochamoreira) | Pendente | |