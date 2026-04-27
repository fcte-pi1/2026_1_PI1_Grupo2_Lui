# Diagrama BPMN

## 1. Introdução

Este documento descreve o modelo de processos de negócio (BPMN — *Business Process Model and Notation*) do sistema Micromouse. O objetivo é representar, de forma clara e estruturada, os principais atores do sistema, as atividades que cada um executa, os insumos necessários e os resultados produzidos ao longo de uma corrida.

O processo completo engloba desde o posicionamento físico do robô até o armazenamento dos dados finais em banco de dados e a consulta histórica dessas informações.

O mapeamento é feito no nível **Descritivo**: alto nível, com foco na distribuição de responsabilidades e no entendimento geral do fluxo, sem detalhar exceções de baixo nível.

---

## 2. Estrutura Swimlanes: Pools e Lanes

O modelo BPMN é organizado em **três Pools**, cada um representando um participante distinto com processo próprio. Os participantes se comunicam por meio de **fluxos de mensagem** (linhas tracejadas entre Pools). Atividades dentro de um mesmo Pool são conectadas por **fluxos de sequência** (setas contínuas).

O Pool do Sistema Web é subdividido em duas **Lanes** internas, representando as duas áreas funcionais responsáveis por partes distintas do mesmo processo.

> **Conceitos BPMN usados neste documento:**
> - **Pool**: representa um participante autônomo do processo (organização, sistema ou ator) com seu próprio fluxo interno. Participantes diferentes se comunicam por **fluxos de mensagem** (linhas tracejadas entre pools), nunca por fluxos de sequência.
> - **Lane**: subdivisão interna de um pool, usada para separar responsabilidades dentro do mesmo participante (ex.: duas áreas de um sistema). Atividades dentro de lanes do mesmo pool são conectadas por **fluxos de sequência** (setas contínuas).
> - **Gateway**: ponto de decisão ou sincronização no fluxo — Exclusivo (XOR, losango vazio) para ramificações alternativas e Paralelo (+) para atividades concorrentes.
> - **Data Object**: artefato que representa um insumo ou resultado concreto de uma atividade, conectado a ela por uma linha de associação (pontilhada).
>
> Para facilitar as referências cruzadas no texto, os pools são numerados (**Pool 1**, **Pool 2**, **Pool 3**) e as lanes do Pool 3 recebem letras (**Lane 3A**, **Lane 3B**). Esses rótulos numéricos não fazem parte da notação BPMN padrão; no diagrama gráfico, cada elemento aparecerá apenas com seu nome descritivo.

### Pools

| Pool | Participante | Descrição |
|---|---|---|
| **Pool 1** | Operador | Ator humano responsável por iniciar a corrida, acompanhar a telemetria e consultar históricos |
| **Pool 2** | Micromouse (Firmware) | Sistema embarcado no ESP32 que executa a navegação autônoma e emite pacotes de telemetria |
| **Pool 3** | Sistema Web | Aplicação que recebe, processa, exibe e persiste os dados da corrida |

### Lanes do Pool 3 — Sistema Web

| Lane | Área | Descrição |
|---|---|---|
| **Lane 3A** | Backend (FastAPI) | Responsável por receber a telemetria do firmware, processar os dados, retransmiti-los ao frontend e gravá-los no banco de dados |
| **Lane 3B** | Frontend (HTML/CSS/JS) | Responsável por renderizar a interface web e exibir os dados em tempo real para o operador |

### Data Objects (Artefatos)

Os Data Objects representam os insumos e resultados concretos que entram e saem das atividades. Na notação BPMN, são representados por ícones de documento conectados às atividades por linhas de associação.

| Data Object | Produzido por | Consumido por |
|---|---|---|
| **Pacote de Telemetria** | Firmware (Pool 2) | Backend (Lane 3A) |
| **Sinal de Conclusão** | Firmware (Pool 2) | Backend (Lane 3A) |
| **Dados Processados em Tempo Real** | Backend (Lane 3A) | Frontend (Lane 3B) |
| **Resumo Final da Corrida** | Backend (Lane 3A) | Frontend (Lane 3B), Banco de Dados SQLite |
| **Registros Históricos** | Banco de Dados SQLite | Backend (Lane 3A) → Frontend (Lane 3B) |
| **Mapa do Labirinto (memória interna)** | Firmware (Pool 2) | Firmware (Pool 2) — uso interno |
| **Leituras dos Sensores IR** | Sensores físicos | Firmware (Pool 2) |

> **Nota:** O banco de dados SQLite não é um Pool (participante com processo próprio), mas um **Data Object** persistente acessado exclusivamente pelo Backend (Lane 3A). Não executa processo autônomo — apenas armazena e responde a consultas disparadas pelo backend.

---

## 3. Descrição das Atividades por Pool e Lane

### 3.1 Pool 1 — Operador

O Operador é o ator humano que interage com o sistema nos momentos de início e de consulta. Durante a corrida em si, sua participação é apenas de observação, pois o micromouse opera de forma totalmente autônoma.

**Atividades (conectadas por fluxos de sequência):**

1. **Selecionar o labirinto**: O operador escolhe qual dos três labirintos (4×4, 8×8 ou 16×16) será utilizado na corrida e informa essa configuração ao sistema antes do início.
2. **Posicionar o micromouse**: O operador coloca fisicamente o robô na célula de partida (beco sem saída em um canto do labirinto).
3. **Iniciar a corrida**: O operador aciona o início da corrida por meio de um comando físico no robô (botão ou sinal). A partir desse momento, qualquer intervenção humana é vedada pelas regras da competição.
4. **Monitorar a telemetria**: O operador acompanha em tempo real, pela interface web, os dados transmitidos pelo micromouse: trajeto percorrido, velocidade média, nível de bateria, tempo de corrida e status do desafio.
5. **Consultar histórico** *(opcional)*: Após o encerramento da corrida, o operador acessa a seção de consulta do sistema web para visualizar os dados finais armazenados, filtrando por labirinto específico ou exibindo todas as corridas.

**Fluxos de mensagem saindo deste Pool:** Sinal de início da corrida → Pool 2 (Firmware).

**Insumos (Data Objects recebidos):** Painel de telemetria exibido pelo Frontend (Lane 3B), resultado final da corrida.

**Resultados (Data Objects produzidos):** Seleção do labirinto, comando de início.

---

### 3.2 Pool 2 — Micromouse (Firmware)

O Firmware é o núcleo autônomo do sistema. Uma vez iniciada a corrida, toda a inteligência de navegação e decisão opera exclusivamente no ESP32, sem receber comandos externos.

O processo do firmware opera em duas fases sequenciais, separadas por uma transição de modo após o primeiro alcance do objetivo:

- **Fase 1 — Exploração (CT-15):** O robô navega devagar, célula a célula, construindo o mapa. Usa o Flood Fill para decidir para onde ir e recalcula ao encontrar novas paredes. Objetivo: chegar ao centro sem bater.
- **Fase 2 — Corrida (CT-16):** Com o mapa completo na memória, o robô percorre o caminho mais curto em velocidade máxima, ignorando becos já mapeados.

**Atividades (conectadas por fluxos de sequência):**

1. **Inicializar o sistema**: Ao receber o sinal de início (fluxo de mensagem do Pool 1), o firmware inicializa os sensores (IR e encoders), define a posição inicial como a célula de partida e prepara a estrutura de dados do mapa (assumindo três paredes na célula inicial, conforme a regra do beco sem saída).
2. **Ler os sensores**: A cada ciclo de controle (≤ 10 ms), o firmware lê os três sensores de distância (frente, esquerda, direita) para detectar paredes adjacentes.
3. **Atualizar o mapa do labirinto**: Com base nas leituras, o firmware registra as paredes descobertas na matriz interna de representação do labirinto armazenada na memória do ESP32.
4. **Executar o algoritmo de navegação (Flood Fill)**: O firmware calcula a direção de menor custo em direção à sala central com base no mapa parcialmente construído. Recalcula os pesos ao descobrir novas paredes.
5. **Controlar os motores (PID)**: O firmware envia comandos de velocidade e direção aos motores, com correção PID para centralização no corredor e prevenção de colisões.
6. **Detectar o objetivo**: O firmware verifica continuamente se a posição atual corresponde à sala central (área 2×2). Ao detectar, encerra a fase de exploração, salva o mapa e, se for a segunda passagem, emite o sinal de conclusão.

> **Gateway Paralelo (divisão):** As atividades de navegação (itens 2 a 6, em loop) e de envio de telemetria (item 7) ocorrem **em paralelo** durante toda a corrida. Um Gateway Paralelo (símbolo "+") divide o fluxo em dois caminhos concorrentes logo após a inicialização.

7. **Enviar pacotes de telemetria**: Em paralelo ao loop de navegação, o firmware transmite pacotes de telemetria via Wi-Fi (WebSocket), com frequência mínima de 1 pacote/segundo, contendo: posição atual (X, Y), velocidade média, nível de bateria e status do desafio.

> **Gateway Paralelo (reunião):** Os dois caminhos (navegação e telemetria) se reúnem em um Gateway Paralelo de sincronização somente após a detecção do objetivo e o envio do sinal de conclusão.

**Fluxos de mensagem saindo deste Pool:** Pacotes de telemetria → Lane 3A (Backend); Sinal de conclusão → Lane 3A (Backend).

**Insumos (Data Objects recebidos):** Leituras dos sensores IR, leituras dos encoders, sinal de início do Operador.

**Resultados (Data Objects produzidos):** Mapa interno do labirinto, pacotes de telemetria, sinal de conclusão da corrida.

---

### 3.3 Pool 3 — Sistema Web

O Sistema Web possui duas Lanes internas. As atividades das duas Lanes são conectadas por **fluxos de sequência** que cruzam livremente os limites da Lane dentro do mesmo Pool.

#### Lane 3A — Backend (FastAPI)

1. **Receber pacotes de telemetria**: O backend mantém um endpoint WebSocket aberto que recebe continuamente os pacotes enviados pelo firmware (fluxo de mensagem vindo do Pool 2).
2. **Validar e processar os dados**: Os dados brutos recebidos são verificados quanto ao schema (campos obrigatórios e tipos). Pacotes válidos são convertidos ao formato interno; pacotes inválidos são rejeitados com resposta de erro (ex.: 400 Bad Request) sem interromper o servidor.
3. **Retransmitir dados ao Frontend**: Os dados processados são enviados em tempo real à Lane 3B via WebSocket, garantindo atualização a cada ≤ 1 segundo. A retransmissão ocorre **antes** da persistência.
4. **Detectar o encerramento da corrida**: Ao receber o sinal de conclusão do firmware (fluxo de mensagem vindo do Pool 2), o backend compila o resumo final da corrida (tempo total, trajeto completo, velocidade média, consumo de bateria, status do desafio cumprido). Conexões encerradas abruptamente sem flag de conclusão **não geram registro**.
5. **Retransmitir o resumo final ao Frontend**: O resumo consolidado é enviado à Lane 3B **antes** da escrita no banco. Essa ordem é obrigatória — a exibição do resultado para o operador não deve ficar condicionada à latência de I/O do banco — e estende ao momento do encerramento a mesma regra "retransmitir antes de persistir" já aplicada ao stream contínuo (atividade 3). O cumprimento dessa ordem é validado pelo CT-19.
6. **Persistir os dados finais**: Após a retransmissão da atividade 5, o resumo final é gravado no banco de dados SQLite (Data Object persistente), incluindo todos os campos exigidos pelo projeto.
7. **Responder a consultas históricas**: O backend expõe endpoints de leitura que consultam o banco de dados e retornam registros à Lane 3B. Retorna lista vazia (`[]` com status 200) quando não há corridas cadastradas. Suporta filtro por labirinto específico ou exibição de todas as corridas.

#### Lane 3B — Frontend (HTML/CSS/JS)

1. **Estabelecer conexão WebSocket**: Ao ser acessado no navegador, o Dashboard inicia automaticamente a conexão WebSocket com o servidor, sem interação manual do usuário. Em caso de queda, reconecta automaticamente.
2. **Renderizar o painel de telemetria**: A interface exibe, em tempo real, os 6 campos obrigatórios: tipo do labirinto, trajeto percorrido (grid), consumo de bateria, velocidade média, tempo decorrido e status do desafio (S/N).
3. **Atualizar o mapa do labirinto**: À medida que os dados chegam da Lane 3A, o grid do labirinto é atualizado visualmente, mostrando o caminho percorrido e as paredes descobertas.
4. **Detectar encerramento e exibir resultado final**: Ao receber o pacote com flag de conclusão, a interface transita automaticamente da exibição em tempo real para a tela de dados consolidados, sem ação manual do usuário.
5. **Exibir consultas históricas**: A interface oferece uma seção de histórico onde o operador pode filtrar por labirinto ou visualizar todas as corridas, com os dados retornados pela Lane 3A.

**Fluxos de mensagem chegando a este Pool:** Pacotes de telemetria (do Pool 2 → Lane 3A); Sinal de conclusão (do Pool 2 → Lane 3A).

**Insumos (Data Objects recebidos):** Pacotes de telemetria do firmware, sinal de conclusão, parâmetros de consulta do operador.

**Resultados (Data Objects produzidos):** Painel de telemetria em tempo real (para o Operador), dados finais gravados no banco de dados, respostas às consultas históricas.

---

## 4. Fluxo Geral do Processo

O processo completo segue a sequência abaixo. Fluxos de mensagem entre Pools: `→ [mensagem] →`; fluxos de sequência internos: `→`.

1. **[Operador]** Seleciona o labirinto → posiciona o micromouse → aciona o início.
   - `→ [Sinal de início] →` **[Firmware]**
2. **[Firmware]** Inicializa o sistema → *Gateway Paralelo (divisão)*:
   - **Caminho A (loop de navegação — Fase 1 Exploração):** Lê sensores → atualiza mapa → executa Flood Fill → controla motores → *Gateway Exclusivo:* objetivo atingido? → Não: retorna ao início do loop; Sim: salva mapa → inicia Fase 2.
   - **Caminho A continuação (Fase 2 — Corrida):** Recalcula caminho mínimo → percorre em velocidade máxima → detecta objetivo → emite sinal de conclusão.
   - **Caminho B (telemetria contínua):** Monta pacote → `→ [Pacote de telemetria] →` **[Backend]** → aguarda próximo ciclo (loop paralelo).
   - *Gateway Paralelo (reunião):* ambos os caminhos convergem após detecção do objetivo e envio do sinal de conclusão.
   - `→ [Sinal de conclusão] →` **[Backend]**
3. **[Backend]** Recebe pacote → valida → *Gateway Exclusivo: pacote válido?* → Sim: processa e retransmite ao **[Frontend]** → **[Frontend]** atualiza painel → **[Operador]** monitora; Não: rejeita com erro, continua aguardando.
4. **[Backend]** Recebe sinal de conclusão → *Gateway Exclusivo: flag de conclusão presente?* → Sim: compila resumo → retransmite resumo à **[Frontend]** → persiste no banco SQLite (nessa ordem, conforme CT-19); Não (desconexão abrupta): descarta, nenhum registro gerado.
5. **[Frontend]** Detecta flag de conclusão → transita para tela de dados consolidados → **[Operador]** visualiza resultado.
6. *(Opcional)* **[Operador]** solicita consulta histórica → **[Frontend]** envia requisição → **[Backend]** consulta banco → retorna registros (ou lista vazia com status 200) → **[Frontend]** exibe histórico.

---

## 5. Eventos Principais

| Tipo de Evento | Pool/Lane | Descrição |
|---|---|---|
| **Evento de Início (Genérico)** | Pool 1 — Operador | Início do processo: operador decide realizar a corrida |
| **Evento de Início (Mensagem)** | Pool 2 — Firmware | Firmware recebe o sinal de início do Operador |
| **Evento de Início (Mensagem)** | Lane 3A — Backend | Backend inicia aguardando conexão WebSocket do Firmware |
| **Evento Intermediário (Mensagem — envio)** | Pool 2 — Firmware | Firmware transmite pacote de telemetria ao Backend |
| **Evento Intermediário (Mensagem — recepção)** | Lane 3A — Backend | Backend recebe pacote de telemetria do Firmware |
| **Evento Intermediário (Mensagem — envio)** | Pool 2 — Firmware | Firmware transmite sinal de conclusão ao Backend |
| **Evento Intermediário (Mensagem — recepção)** | Lane 3A — Backend | Backend recebe sinal de conclusão do Firmware |
| **Evento Intermediário (Erro)** | Lane 3A — Backend | Desconexão abrupta sem flag de conclusão — corrida descartada |
| **Evento de Fim (sucesso)** | Pool 2 — Firmware | Firmware detecta a sala central: desafio cumprido |
| **Evento de Fim (falha)** | Pool 2 — Firmware | Micromouse esgota tentativas sem atingir o objetivo |
| **Evento de Fim** | Lane 3A — Backend | Dados finais gravados com sucesso no banco de dados |
| **Evento de Fim** | Pool 1 — Operador | Operador encerra a sessão após visualizar os resultados |

---

## 6. Gateways

| Gateway | Tipo | Pool/Lane | Condições |
|---|---|---|---|
| **Divisão navegação + telemetria** | Paralelo (+) | Pool 2 — Firmware | Divide o fluxo em dois caminhos concorrentes: loop de navegação e envio de telemetria |
| **Reunião navegação + telemetria** | Paralelo (+) | Pool 2 — Firmware | Sincroniza os dois caminhos; fluxo prossegue somente quando ambos concluírem |
| **Caminho livre à frente?** | Exclusivo (XOR) | Pool 2 — Firmware | Sim → avança; Não → verifica direções alternativas (esquerda, direita, meia-volta) |
| **Objetivo atingido?** | Exclusivo (XOR) | Pool 2 — Firmware | Sim → encerra fase atual; Não → retorna ao início do loop |
| **Pacote válido?** | Exclusivo (XOR) | Lane 3A — Backend | Sim → processa e retransmite ao frontend; Não → rejeita com erro 400, servidor continua |
| **Flag de conclusão presente?** | Exclusivo (XOR) | Lane 3A — Backend | Sim → compila resumo, retransmite ao Frontend e persiste no banco (nessa ordem — CT-19); Não (desconexão abrupta) → descarta, nenhum registro |
| **Corrida finalizada?** | Exclusivo (XOR) | Lane 3B — Frontend | Sim → transita para tela de dados consolidados; Não → continua exibindo telemetria em tempo real |
| **Consulta por labirinto ou todos?** | Exclusivo (XOR) | Lane 3A — Backend | Labirinto específico → filtra por tipo; Todos → retorna registros completos; Banco vazio → retorna `[]` com status 200 |

---

## 7. Objetos de Conexão

| Tipo | Entre | Descrição |
|---|---|---|
| **Fluxo de Sequência** (seta contínua) | Atividades dentro do mesmo Pool | Conecta atividades, eventos e gateways dentro de Pool 1, Pool 2 e Pool 3 |
| **Fluxo de Mensagem** (seta tracejada) | Pool 1 → Pool 2 | Sinal de início da corrida |
| **Fluxo de Mensagem** (seta tracejada) | Pool 2 → Lane 3A (Backend) | Pacotes de telemetria transmitidos via Wi-Fi/WebSocket |
| **Fluxo de Mensagem** (seta tracejada) | Pool 2 → Lane 3A (Backend) | Sinal de conclusão da corrida |
| **Associação** (linha pontilhada) | Atividades → Data Objects | Liga as atividades aos seus insumos e resultados concretos |

---

## 8. Resumo SIPOC

A tabela SIPOC (Fornecedor — Entrada — Processo — Saída — Cliente) consolida a visão macro do processo:

| Fornecedor (Supplier) | Entrada (Input) | Processo (Process) | Saída (Output) | Cliente (Customer) |
|---|---|---|---|---|
| Operador | Sinal de início, seleção do labirinto | Navegação autônoma no labirinto | Mapa construído, sinal de conclusão, pacotes de telemetria | Backend (Lane 3A) |
| Sensores IR / Encoders | Leituras de distância e deslocamento | Atualização do mapa e controle PID | Comandos aos motores, posição atual | Motores, algoritmo Flood Fill |
| Firmware (Pool 2) | Pacotes de telemetria, sinal de conclusão | Recepção, validação, processamento e retransmissão | Dados em tempo real, resumo final gravado | Frontend (Lane 3B), Banco de Dados |
| Backend (Lane 3A) | Dados processados em tempo real | Renderização da interface web | Painel de telemetria, resultado final | Operador |
| Backend (Lane 3A) | Resumo final da corrida | Persistência em SQLite | Registro histórico da corrida | Operador (via consulta futura) |

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
