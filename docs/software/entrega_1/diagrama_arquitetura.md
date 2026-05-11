# Diagrama de Arquitetura

## 1. Introdução

### 1.1 Propósito

Este documento descreve a arquitetura macro da solução de software do projeto Micromouse. Seu objetivo é apresentar as decisões arquiteturais adotadas, a stack tecnológica utilizada e as visões estruturais do sistema: lógica, processos, implementação, implantação e dados, de forma a orientar o desenvolvimento e facilitar a avaliação do projeto.

O software do sistema possui dois blocos principais que operam em conjunto:

- **Firmware embarcado (Micromouse):** responsável pelo controle autônomo do robô, incluindo navegação, detecção de paredes, mapeamento do labirinto e transmissão de telemetria em tempo real.
- **Sistema web (Backend + Frontend):** responsável por receber, processar e exibir os dados de telemetria, além de persistir os resultados de cada corrida em banco de dados para consultas posteriores.

### 1.2 Escopo

A arquitetura descrita neste documento abrange exclusivamente o software do projeto, cobrindo os artefatos definidos nos requisitos funcionais (US01–US14), não-funcionais (RNF-01–RNF-12) e restrições de ambiente (RE-01–RE-11).

## 2. Representação Arquitetural

O projeto adota uma **arquitetura em camadas com estilo cliente-servidor** para a parte web, integrada a um **sistema embarcado** que atua como produtor de dados.


<div class="svg-embed-container" 
       data-svg-path="../../../assets/images/diagramaImplantacao.svg" 
       data-title="Figura 1 - Representação Arquitetural do Sistema Micromouse" 
       style="height: 600px; width: 100%;"> </div>

A escolha desse estilo é motivada pelos seguintes fatores:

- **Separação de responsabilidades:** o firmware cuida exclusivamente da navegação e coleta de dados; o backend gerencia recepção, validação e persistência; o frontend apresenta os dados ao operador.
- **Comunicação em tempo real:** o uso de WebSocket entre backend e frontend (RE-04) atende ao requisito de latência ≤ 500 ms (RNF-01) e taxa de atualização ≤ 1 s (RNF-02).
- **Execução local:** toda a solução roda em rede local (LAN), sem dependência de infraestrutura em nuvem, garantindo confiabilidade durante as apresentações (RE-04, RE-05).
- **Baixo acoplamento:** cada camada pode ser desenvolvida, testada e corrigida de forma independente.

## 3. Stack Tecnológica

| Camada | Tecnologia | Versão mínima | Justificativa |
|---|---|---|---|
| Firmware | ESP32 (C/C++ Arduino/ESP-IDF) | Arduino Core 2.0 / ESP-IDF 5.0 | Wi-Fi nativo, GPIOs suficientes, amplo ecossistema para motores e sensores |
| Comunicação | Wi-Fi IEEE 802.11 b/g/n + UDP ou WebSocket | — | UDP: baixa latência para telemetria; WS: bidirecional para controle remoto |
| Backend | Python 3.10 + FastAPI | Python 3.10 | Suporte nativo a WebSocket, assíncrono, familiar para a equipe |
| ORM / DB driver | SQLAlchemy ou sqlite3 | — | Abstração do banco; facilita migração futura |
| Banco de dados | SQLite 3 | 3.35+ | Arquivo local, sem servidor dedicado, suficiente para ≤ 100 corridas |
| Frontend | HTML5 + CSS3 + JavaScript ES6+ | — | Sem build step; WebSocket e Fetch API nativos do navegador |
| Navegadores suportados | Chrome ≥ 110, Firefox ≥ 110, Edge ≥ 110 | — | Cobertura de todos os equipamentos de laboratório |


## 4. Diagrama de Alto Nível

Os quatro componentes principais e seus relacionamentos são:

- **Firmware → Backend:** envio de pacotes de telemetria (posição, paredes, velocidade, bateria, timestamp) via Wi-Fi UDP ou WebSocket, a uma frequência mínima de 1 pacote/segundo (RE-02, RNF-04).
- **Backend → Frontend:** retransmissão dos dados em tempo real via WebSocket (CT-19); notificação de conclusão de corrida.
- **Backend → SQLite:** escrita do resumo final da corrida somente após recebimento da flag de conclusão do firmware (CT-20, CT-21, US13).
- **Frontend → Backend (REST):** consultas ao histórico de corridas, com filtro por tipo de labirinto (CT-22, CT-23, US14).

## 5. Visões Arquiteturais

### 5.1 Visão Lógica

A visão lógica descreve os principais componentes de software e suas responsabilidades.

#### 5.1.1 Firmware (ESP32)

| Módulo | Responsabilidade |
|---|---|
| `sensor_reader` | Leitura periódica dos sensores IR/US (frente, esquerda, direita) e dos encoders |
| `map_manager` | Manutenção da matriz de paredes (16×16 máximo) e registro da posição atual (X, Y) |
| `flood_fill` | Cálculo e recálculo da rota mais curta até o centro do labirinto |
| `motion_controller` | Controle PID dos motores; execução de avanço, curvas de 90° e meia-volta |
| `state_machine` | Máquina de estados principal: Boot → Verificação → Descoberta → Rota Otimizada → [Final] |
| `telemetry_sender` | Serialização e envio dos pacotes de telemetria via Wi-Fi |

Os estados finais possíveis — Sucesso, Falha por Comunicação, Falha Física e Falha Algorítmica — estão detalhados no Diagrama de Estados (`diagrama_estados.md`).

#### 5.1.2 Backend (Python / FastAPI)

| Módulo | Responsabilidade |
|---|---|
| `telemetry_receiver` | Endpoint de recepção de pacotes UDP ou WebSocket provenientes do firmware |
| `packet_validator` | Validação de schema dos pacotes; rejeição com HTTP 400 em caso de malformação (CT-18) |
| `ws_broadcaster` | Retransmissão dos pacotes válidos a todos os clientes frontend conectados via WebSocket |
| `race_manager` | Detecção da flag de conclusão; montagem do resumo final da corrida |
| `db_writer` | Persistência do resumo no SQLite via SQLAlchemy, somente após conclusão (CT-20) |
| `history_api` | Endpoints REST de consulta ao histórico, com suporte a filtro por tipo de labirinto (CT-22, CT-23) |

#### 5.1.3 Frontend (HTML5 / JavaScript ES6+)

| Módulo | Responsabilidade |
|---|---|
| `ws_client` | Estabelecimento e manutenção da conexão WebSocket com o backend; reconexão automática (CT-30) |
| `telemetry_display` | Renderização em tempo real dos 6 campos obrigatórios: tipo do labirinto, trajeto, bateria, velocidade média, tempo de conclusão, desafio cumprido (RNF-11, CT-26) |
| `maze_renderer` | Renderização do grid do labirinto e atualização do trajeto célula a célula (US10) |
| `race_summary` | Exibição dos dados consolidados ao detectar flag de conclusão (CT-27) |
| `history_panel` | Consulta ao backend e exibição do histórico com filtros por labirinto (CT-28, CT-29, US14) |

### 5.2 Visão de Processos

A visão de processos descreve o comportamento do sistema em tempo de execução. O fluxo principal de uma corrida é documentado no **Diagrama de Atividades** (`diagrama_atividades.md`), com quatro participantes: Operador, Firmware, Backend e Frontend.

O ciclo autônomo do firmware pode ser resumido como:

```
ler sensores → atualizar mapa → calcular rota (Flood Fill) → executar movimento → verificar objetivo
                                                                                         │
                                                                              objetivo atingido?
                                                                             Não ──▶ reinicia ciclo
                                                                             Sim ──▶ envia flag de conclusão
```

Em paralelo ao ciclo de navegação, o firmware executa a transmissão de telemetria (fluxo paralelo no Diagrama de Atividades). Os pacotes válidos recebidos pelo backend são retransmitidos ao frontend antes de qualquer operação de escrita no banco (CT-19).

### 5.3 Visão de Implementação

A organização dos artefatos de software é:

```
docs/
  software/
    entrega_1/
      diagrama_arquitetura.md   ← este documento
      diagrama_estados.md
      diagrama_atividades.md
      diagrama_casos_uso.md
      diagrama_der.md
      historias_usuario.md
      requisitos_nao_funcionais.md
      matriz_testes_funcionais.md

src/
  firmware/                     ← C/C++ (Arduino/ESP-IDF)
    main.cpp
    sensor_reader.*
    map_manager.*
    flood_fill.*
    motion_controller.*
    telemetry_sender.*

  backend/                      ← Python 3.10 + FastAPI
    main.py
    requirements.txt
    routers/
    models/
    db/

  frontend/                     ← HTML5 + CSS3 + JS ES6+
    index.html
    style.css
    app.js
    ws_client.js
    maze_renderer.js
```

As dependências do backend são gerenciadas via `requirements.txt` com versões fixadas (RE-06). O frontend não requer processo de build (RE-07).

### 5.4 Visão de Implantação

```
┌─────────────────────────────────────────────────────────┐
│                     Rede Local (LAN)                    │
│                                                         │
│  ┌──────────────────┐          ┌──────────────────────┐ │
│  │   Micromouse     │          │  Notebook / PC       │ │
│  │   (ESP32)        │          │  (qualquer SO)       │ │
│  │                  │  Wi-Fi   │                      │ │
│  │  Firmware C/C++  │◀────────▶│  Backend FastAPI     │ │
│  │  UDP/WS client   │          │  SQLite (arquivo .db)│ │
│  └──────────────────┘          │                      │ │
│                                │  Navegador (browser) │ │
│                                │  Frontend HTML/JS    │ │
│                                └──────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

- O firmware roda exclusivamente no ESP32 embarcado no robô.
- O backend e o banco de dados rodam no mesmo computador local, sem necessidade de servidor dedicado ou acesso à internet.
- O frontend é acessado via navegador no mesmo computador ou em qualquer dispositivo conectado à mesma rede local.
- O backend é compatível com Windows 10/11, Ubuntu 22.04 LTS e macOS 12 ou superior (RE-05).
- O sistema suporta ≥ 10 conexões WebSocket simultâneas sem degradação (RNF-08), cobrindo o cenário da apresentação final com avaliadores e integrantes do grupo.

---

### 5.5 Visão de Dados

O banco de dados SQLite armazena apenas o resumo final de cada corrida, conforme definido em RNF-06 e US13. O stream de telemetria em tempo real não é persistido.

#### Entidade principal: `corrida`

| Campo | Tipo | Descrição |
|---|---|---|
| `id` | INTEGER PK | Identificador único da corrida |
| `tipo_labirinto` | TEXT | Dimensão do labirinto: `"4x4"`, `"8x8"` ou `"16x16"` |
| `trajeto` | TEXT (JSON) | Sequência de células percorridas, serializada em JSON compacto |
| `mapa_paredes` | BLOB | Matriz de paredes (128 bytes para labirinto 16×16) |
| `tempo_conclusao_ms` | INTEGER | Tempo total de conclusão em milissegundos |
| `velocidade_media_cms` | REAL | Velocidade média em cm/s |
| `consumo_bateria_pct` | REAL | Variação percentual do nível de bateria durante a corrida |
| `desafio_cumprido` | INTEGER | `1` = sucesso, `0` = falha |
| `timestamp` | TEXT | Data e hora de registro (ISO 8601) |

O tamanho máximo de um registro é ≤ 10 KB (RNF-06). A interface web acessa o banco exclusivamente via backend, sem conexão direta (RE-11, RNF-10). Nenhum endpoint de modificação ou exclusão é exposto publicamente.

---

## 6. Qualidade e Restrições Arquiteturais

As principais restrições que influenciam as decisões arquiteturais estão consolidadas abaixo. A especificação completa encontra-se em `requisitos_nao_funcionais.md`.

| Requisito | Impacto Arquitetural |
|---|---|
| RNF-01: latência ≤ 500 ms | Uso de WebSocket em vez de polling HTTP; retransmissão imediata pelo backend (CT-19) |
| RNF-04: ciclo de controle ≤ 10 ms | Loop principal do firmware em bare-metal ou FreeRTOS; telemetria em tarefa paralela |
| RNF-08: ≥ 10 conexões simultâneas | FastAPI assíncrono com suporte nativo a múltiplas conexões WebSocket |
| RNF-10: dados imutáveis | Sem endpoints de UPDATE/DELETE; escrita somente via backend após flag de conclusão |
| RE-07: sem framework de build | Frontend em HTML/CSS/JS puro, sem Node.js, npm ou bundlers |



