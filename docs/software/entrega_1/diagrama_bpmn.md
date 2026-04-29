# Diagrama BPMN

## 1. Introdução

Este documento descreve o modelo BPMN (*Business Process Model and Notation*) do sistema Micromouse, mapeando atores, atividades, insumos e resultados ao longo de uma corrida — desde o posicionamento físico do robô até o armazenamento e a consulta histórica dos dados.

O mapeamento adota o nível **Descritivo**: foco na distribuição de responsabilidades e no fluxo geral, sem detalhar exceções de baixo nível.

> **Conceitos BPMN usados:**
> - **Pool**: participante autônomo (ator ou sistema) com fluxo próprio. Pools se comunicam apenas por **fluxos de mensagem** (setas tracejadas).
> - **Lane**: subdivisão interna de um Pool. Lanes do mesmo Pool são conectadas por **fluxos de sequência** (setas contínuas).
> - **Gateway**: ponto de decisão (Exclusivo / XOR) ou de paralelismo (Paralelo / +).
> - **Data Object**: insumo ou resultado concreto, ligado às atividades por linhas de associação (pontilhadas).
>
> Os rótulos numéricos (Pool 1, Lane 3A, etc.) são usados apenas para referência cruzada no texto e não fazem parte da notação BPMN.

---

## 2. Pools, Lanes e Data Objects

### Pools

| Pool | Participante | Descrição |
|---|---|---|
| **Pool 1** | Operador | Inicia a corrida, monitora telemetria e consulta históricos |
| **Pool 2** | Micromouse (Firmware) | Sistema embarcado no ESP32 que executa a navegação autônoma e envia telemetria |
| **Pool 3** | Sistema Web | Aplicação que recebe, processa, exibe e persiste os dados da corrida |

### Lanes do Pool 3

| Lane | Área | Responsabilidade |
|---|---|---|
| **Lane 3A** | Backend (FastAPI) | Recebe telemetria, processa, retransmite ao frontend e persiste no SQLite |
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

> **Nota:** O SQLite não é um Pool, e sim um Data Object persistente acessado apenas pelo Backend.

---

## 3. Atividades por Pool e Lane

### 3.1 Pool 1 — Operador

Ator humano. Atua nos momentos de início e de consulta; durante a corrida apenas observa, pois o robô é totalmente autônomo.

1. **Selecionar o labirinto** (4×4, 8×8 ou 16×16).
2. **Posicionar o micromouse** na célula de partida (beco sem saída em um canto).
3. **Iniciar a corrida** via botão físico no robô. A partir daí, qualquer intervenção humana é vedada.
4. **Monitorar a telemetria** pela interface web: trajeto, velocidade média, bateria, tempo e status.
5. **Consultar histórico** *(opcional)*: filtra por labirinto ou exibe todas as corridas.

**Mensagens enviadas:** Sinal de início → Firmware.

---

### 3.2 Pool 2 — Micromouse (Firmware)

Após o início, toda a inteligência opera no ESP32, sem comandos externos. O processo tem duas fases sequenciais:

- **Fase 1 — Exploração (CT-15):** navega devagar célula a célula, construindo o mapa via Flood Fill.
- **Fase 2 — Corrida (CT-16):** com o mapa pronto, percorre o caminho mais curto em velocidade máxima.

**Atividades:**

1. **Inicializar o sistema** ao receber o sinal de início: ativa sensores (IR e encoders), define posição inicial e prepara a matriz do mapa (assumindo três paredes na célula de partida).
2. **Ler os sensores** a cada ciclo (≤ 10 ms) para detectar paredes adjacentes.
3. **Atualizar o mapa** na memória interna do ESP32.
4. **Executar Flood Fill** para calcular a direção de menor custo até a sala central.
5. **Controlar os motores (PID)** para velocidade, direção e centralização no corredor.
6. **Detectar o objetivo** (sala central 2×2): encerra a fase, salva o mapa e — se for a segunda passagem — emite o sinal de conclusão.

> **Gateway Paralelo (divisão):** logo após a inicialização, o fluxo se divide entre o loop de navegação (itens 2–6) e o envio contínuo de telemetria (item 7).

7. **Enviar pacotes de telemetria** via Wi-Fi/WebSocket (≥ 1 pacote/s), contendo posição (X, Y), velocidade média, bateria e status.

> **Gateway Paralelo (reunião):** os dois caminhos só convergem após a detecção do objetivo e o envio do sinal de conclusão.

**Mensagens enviadas:** Pacotes de telemetria e Sinal de conclusão → Backend.

---

### 3.3 Pool 3 — Sistema Web

Atividades das duas Lanes são conectadas por fluxos de sequência (cruzam livremente as Lanes dentro do mesmo Pool).

#### Lane 3A — Backend (FastAPI)

1. **Receber pacotes de telemetria** em endpoint WebSocket aberto continuamente.
2. **Validar e processar os dados**: verifica schema; pacotes inválidos são rejeitados (400 Bad Request) sem derrubar o servidor.
3. **Retransmitir ao Frontend** via WebSocket (≤ 1 s), **antes** da persistência.
4. **Detectar encerramento**: ao receber o sinal de conclusão, compila o resumo final (tempo total, trajeto, velocidade média, bateria, status). Desconexões abruptas sem flag não geram registro.
5. **Retransmitir o resumo final** ao Frontend **antes** de gravar no banco — regra obrigatória do CT-19, para que a exibição do resultado não dependa da latência de I/O.
6. **Persistir** o resumo no SQLite com todos os campos exigidos pelo projeto.
7. **Responder a consultas históricas**: filtra por labirinto ou retorna todas as corridas. Banco vazio retorna `[]` com status 200.

#### Lane 3B — Frontend (HTML/CSS/JS)

1. **Estabelecer conexão WebSocket** automaticamente ao abrir o Dashboard, com reconexão automática em caso de queda.
2. **Renderizar o painel** com os 6 campos obrigatórios: tipo do labirinto, trajeto (grid), bateria, velocidade média, tempo decorrido e status (S/N).
3. **Atualizar o mapa do labirinto** conforme os dados chegam, mostrando o caminho percorrido e as paredes descobertas.
4. **Detectar conclusão e exibir resultado final**: ao receber a flag, transita automaticamente para a tela consolidada.
5. **Exibir consultas históricas** com filtro por labirinto ou todas as corridas.

**Mensagens recebidas:** Pacotes de telemetria e Sinal de conclusão (do Firmware → Lane 3A).

---

## 4. Fluxo Geral

`→ [mensagem] →` representa fluxo de mensagem entre Pools; `→` representa fluxo de sequência interno.

1. **[Operador]** Seleciona labirinto → posiciona o robô → aciona início. `→ [Sinal de início] →` **[Firmware]**
2. **[Firmware]** Inicializa → *Gateway Paralelo (divisão)*:
   - **Caminho A — Fase 1 (Exploração):** lê sensores → atualiza mapa → Flood Fill → controla motores → *Objetivo atingido?* Não: repete loop; Sim: salva mapa → inicia Fase 2.
   - **Caminho A — Fase 2 (Corrida):** recalcula caminho mínimo → percorre em velocidade máxima → detecta objetivo → emite sinal de conclusão.
   - **Caminho B — Telemetria:** monta pacote `→ [Pacote] →` **[Backend]** → próximo ciclo.
   - *Gateway Paralelo (reunião):* convergência após objetivo + sinal de conclusão. `→ [Sinal de conclusão] →` **[Backend]**
3. **[Backend]** Valida pacote → *Pacote válido?* Sim: processa e retransmite ao **[Frontend]** (Operador monitora); Não: rejeita com erro e segue aguardando.
4. **[Backend]** Recebe sinal de conclusão → *Flag presente?* Sim: compila resumo → retransmite ao **[Frontend]** → persiste no SQLite (nessa ordem — CT-19); Não: descarta, sem registro.
5. **[Frontend]** Detecta flag → exibe tela consolidada → **[Operador]** visualiza o resultado.
6. *(Opcional)* **[Operador]** solicita histórico → **[Backend]** consulta banco → retorna registros (ou `[]` 200) → **[Frontend]** exibe.

---

## 5. Eventos Principais

| Tipo de Evento | Pool/Lane | Descrição |
|---|---|---|
| Início (Genérico) | Operador | Decisão de iniciar a corrida |
| Início (Mensagem) | Firmware | Recebe sinal de início |
| Início (Mensagem) | Backend | Aguarda conexão WebSocket |
| Intermediário (Mensagem — envio) | Firmware | Envia pacote de telemetria |
| Intermediário (Mensagem — recepção) | Backend | Recebe pacote de telemetria |
| Intermediário (Mensagem — envio) | Firmware | Envia sinal de conclusão |
| Intermediário (Mensagem — recepção) | Backend | Recebe sinal de conclusão |
| Intermediário (Erro) | Backend | Desconexão abrupta — corrida descartada |
| Fim (sucesso) | Firmware | Sala central detectada — desafio cumprido |
| Fim (falha) | Firmware | Tentativas esgotadas sem atingir o objetivo |
| Fim | Backend | Dados finais gravados no banco |
| Fim | Operador | Sessão encerrada após visualizar resultados |

---

## 6. Gateways

| Gateway | Tipo | Pool/Lane | Condições |
|---|---|---|---|
| Divisão navegação + telemetria | Paralelo (+) | Firmware | Divide em loop de navegação e envio de telemetria |
| Reunião navegação + telemetria | Paralelo (+) | Firmware | Sincroniza após objetivo + sinal de conclusão |
| Caminho livre à frente? | XOR | Firmware | Sim → avança; Não → testa direções alternativas |
| Objetivo atingido? | XOR | Firmware | Sim → encerra fase; Não → repete loop |
| Pacote válido? | XOR | Backend | Sim → processa e retransmite; Não → rejeita com 400 |
| Flag de conclusão presente? | XOR | Backend | Sim → resumo + retransmite + persiste (CT-19); Não → descarta |
| Corrida finalizada? | XOR | Frontend | Sim → tela consolidada; Não → mantém telemetria em tempo real |
| Consulta por labirinto ou todos? | XOR | Backend | Específico → filtra; Todos → retorna tudo; Vazio → `[]` 200 |

---

## 7. Objetos de Conexão

| Tipo | Entre | Descrição |
|---|---|---|
| Fluxo de Sequência (contínua) | Atividades do mesmo Pool | Conecta atividades, eventos e gateways |
| Fluxo de Mensagem (tracejada) | Operador → Firmware | Sinal de início |
| Fluxo de Mensagem (tracejada) | Firmware → Backend | Pacotes de telemetria (Wi-Fi/WebSocket) |
| Fluxo de Mensagem (tracejada) | Firmware → Backend | Sinal de conclusão |
| Associação (pontilhada) | Atividades ↔ Data Objects | Liga atividades a seus insumos e resultados |

---

## 8. Resumo SIPOC

| Fornecedor | Entrada | Processo | Saída | Cliente |
|---|---|---|---|---|
| Operador | Sinal de início, seleção do labirinto | Navegação autônoma | Mapa, sinal de conclusão, telemetria | Backend |
| Sensores IR / Encoders | Distância e deslocamento | Atualização do mapa e PID | Comandos aos motores, posição | Motores, Flood Fill |
| Firmware | Telemetria, sinal de conclusão | Recepção, validação, retransmissão | Dados em tempo real, resumo gravado | Frontend, Banco |
| Backend | Dados processados | Renderização da interface | Painel, resultado final | Operador |
| Backend | Resumo final | Persistência em SQLite | Registro histórico | Operador (consulta futura) |

---

## Referências

GARCIA, Diogo C.; RODRIGUES, Juliana P.; NERI, Hilmer Rodrigues; HABL, Lui T. C.; PEREIRA, Bruno L.
**MicroMouse Project**
*Universidade de Brasília (UnB), Faculdade do Gama (FCTE), 2026.*

TRIBUNAL DE CONTAS DA UNIÃO. Instituto Serzedello Corrêa.
**Curso de Mapeamento de Processos de Trabalho com BPMN e Bizagi — Aulas 1 a 4.**
*Brasília: TCU, janeiro de 2013. Conteudista: Patricia Armond de Almeida.*
Disponível em: [www.tcu.gov.br](http://www.tcu.gov.br)

---

## Histórico de versões

| Versão | Data | Descrição | Autor(es) | Revisor(es) | Descrição da Revisão |
| :----: | :--------: | :-------: | :-------: | :---------: | :--------------------: |
| `1.0` | 27/04/2026 | Criação do documento de descrição textual do Diagrama BPMN | [Arthur Moreira](https://github.com/arthurrochamoreira) | Pendente | |
| `1.1` | 29/04/2026 | Melhoria da estrutura do documento | [Arthur Moreira](https://github.com/arthurrochamoreira) | Pendente | |