# Especificação de Requisitos Não-Funcionais

## 1. Introdução

O sistema é composto por dois blocos:
- O firmware embarcado no micromouse, que é responsável pelo controle autônomo do robô, e a aplicação web, que é responsável por exibir telemetria em tempo real e armazenar dados de cada corrida em um banco de dados.

## 2. Desempenho: Métricas de Tempo

### RNF-01 — Latência de Transmissão de Telemetria

| Atributo | Valor |
|---|---|
| **Descrição** | O micromouse deve transmitir dados de telemetria ao sistema web com latência máxima aceitável |
| **Métrica** | Tempo entre geração do dado no robô e exibição na interface web |
| **Limite máximo** | ≤ 500 ms (em condições normais de operação na rede local) |
| **Condição de medição** | Rede Wi-Fi local, distância de até 10 metros entre robô e roteador |
| **Justificativa** | Telemetria "em tempo real" percebida pelo usuário exige atualização sub-segundo |

### RNF-02 — Taxa de Atualização da Interface Web

| Atributo | Valor |
|---|---|
| **Descrição** | A interface web deve atualizar os dados exibidos (velocidade, trajeto, bateria) com frequência mínima |
| **Métrica** | Intervalo entre atualizações consecutivas dos dados na tela |
| **Limite máximo** | ≤ 1 segundo por ciclo de atualização |
| **Condição de medição** | Navegador moderno (Chrome/Firefox), conexão local ativa |
| **Justificativa** | Garantir que o observador acompanhe o progresso do micromouse em tempo real |

A interface deve se atualizar a cada 1 segundo. Para que isso seja possível, a transmissão dos dados do robô até o servidor precisa ser concluída em menos tempo do que esse intervalo, deixando margem para o processamento no servidor e a renderização no navegador. Adotando uma divisão conservadora: metade do tempo para transmissão, metade para processamento e renderização, chegamos a 500 ms como limite para a etapa de transmissão. Em redes locais Wi-Fi comuns, latências na faixa de 10 a 50 ms são típicas, de modo que 500 ms é um limite bastante seguro e alcançável.

### RNF-03 — Tempo de Carregamento da Página Web

| Atributo | Valor |
|---|---|
| **Descrição** | A aplicação web deve carregar completamente dentro de um tempo aceitável |
| **Métrica** | Tempo desde a requisição HTTP até o estado "interativo" da página (TTI) |
| **Limite máximo** | ≤ 3 segundos (em rede local) |
| **Condição de medição** | Conexão local, hardware padrão de laboratório |
| **Justificativa** | Evitar espera excessiva antes do início da corrida |

Este requisito se aplica ao carregamento inicial da aplicação, não à telemetria em si. O limite de 3 segundos é amplamente adotado como referência na indústria (Google Core Web Vitals define esse intervalo como limite aceitável de carregamento)

### RNF-04 — Tempo de Ciclo de Controle do Firmware

| Atributo | Valor |
|---|---|
| **Descrição** | Tempo máximo de execução do loop principal de controle no microcontrolador |
| **Limite máximo** | ≤ 10 ms por ciclo (equivalente a ≥ 100 Hz) |
| **Condição de medição** | Execução no microcontrolador alvo, labirinto 16×16 em operação |

Este valor vem das características físicas da competição. O robô precisa detectar paredes, corrigir sua trajetória e tomar decisões de navegação enquanto se move. As células têm 18 cm de lado e robôs em competições Micromouse tipicamente atingem velocidades entre 0,5 e 2 m/s. O tempo disponível para atravessar metade de uma célula é de aproximadamente 45 a 180 ms. Para ter pelo menos 4 a 5 ciclos de controle nesse intervalo (garantindo estabilidade), a frequência mínima deve ser próxima de 100 Hz, ou seja, 10 ms por ciclo. Este requisito deve ser revisado após a definição do microcontrolador.

### RNF-05 — Tempo de Armazenamento no Banco de Dados

| Atributo | Valor |
|---|---|
| **Descrição** | Tempo máximo entre a detecção do objetivo pelo micromouse e a confirmação de escrita dos dados finais no banco |
| **Limite máximo** | ≤ 2 segundos |
| **Condição de medição** | Banco de dados local ou servidor na mesma rede |

Ao final de uma corrida, o sistema precisa garantir que todos os dados sejam armazenados antes que o operador desligue o robô ou encerre a aplicação. Dois segundos é tempo suficiente para que a interface detecte o evento de conclusão, monte o objeto de dados e execute uma operação de escrita em banco de dados local.

## 3. Capacidade e Carga

### RNF-06 — Tamanho do Resumo Final por Corrida

| Atributo | Valor |
|---|---|
| **Descrição** | Tamanho máximo dos dados consolidados de uma corrida persistidos no banco |
| **Limite máximo** | ≤ 10 KB por corrida |
| **Conteúdo do resumo** | Tempo total, trajeto percorrido (matriz de paredes + sequência de células), velocidade média, consumo de bateria, status do desafio |

Conforme o diagrama BPMN (Lane 3A — Backend) e a história US13, o backend grava no banco apenas o resumo final da corrida, ao receber a flag de conclusão emitida pelo firmware (comportamento verificado por CT-20 e CT-21). O stream contínuo de telemetria não é persistido: ele apenas trafega entre firmware, backend e frontend para alimentar a interface em tempo real.

O dimensionamento do resumo considera o pior caso (labirinto 16×16): a matriz de paredes ocupa cerca de 128 bytes (1 bit por parede em 256 células), e a sequência de células percorridas — mesmo com revisitas durante a fase de exploração — fica abaixo de 4 KB quando serializada em formato compacto. Os demais campos (escalares e enum de status) somam menos de 100 bytes. O limite de 10 KB cobre esse cenário com folga, incluindo overhead de serialização em JSON.

### RNF-07 — Total de Corridas Armazenadas

| Atributo | Valor |
|---|---|
| **Descrição** | Quantidade mínima de corridas que o banco de dados deve suportar sem degradação de desempenho nas consultas |
| **Limite mínimo** | ≥ 100 corridas |
| **Tempo de consulta** | Resultado de consulta por labirinto específico em ≤ 1 segundo |

Estimando aproximadamente 10 sessões de teste distribuídas ao longo do semestre, com 3 labirintos por sessão e até 3 tentativas cada, chegamos a cerca de 90 corridas no total. O limite de 100 corridas cobre esse uso com uma pequena margem de segurança. Combinado com o limite do RNF-06 (≤ 10 KB por corrida), o banco precisaria suportar cerca de 1 MB de dados — volume sem qualquer impacto para PostgreSQL, SQLite ou MySQL. ou outros bancos relacionais.

### RNF-08 — Usuários Simultâneos no Sistema Web

| Atributo | Valor |
|---|---|
| **Descrição** | Número mínimo de usuários que podem acessar a interface web simultaneamente sem degradação |
| **Limite mínimo** | ≥ 10 usuários simultâneos |
| **Critério de degradação** | Latência de atualização mantida em ≤ 1 segundo com 10 clientes ativos |

O contexto mais exigente é a apresentação final, onde todos os professores da disciplina e os próprios integrantes da equipe podem estar acompanhando simultaneamente. São 5 professores avaliadores e aproximadamente 5 a 6 membros do grupo, totalizando cerca de 10 a 11 usuários simultâneos no pico de uso. O limite de ≥ 10 conexões simultâneas cobre esse cenário com folga mínima. Ainda assim, precisa ser explicitamente testado pois o sistema de telemetria mantém conexões abertas continuamente (via WebSocket ou polling), o que consome mais recursos do que requisições comuns.


### RNF-09 — Tamanho Máximo do Pacote de Telemetria

| Atributo | Valor |
|---|---|
| **Descrição** | Tamanho máximo de cada pacote de dados enviado pelo micromouse ao servidor por ciclo |
| **Limite máximo** | ≤ 512 bytes por pacote |

Microcontroladores tipicamente utilizados em projetos Micromouse (como STM32 ou ESP32) possuem buffers de comunicação limitados. Pacotes menores também reduzem a latência de transmissão e o risco de fragmentação na rede. Os dados necessários por ciclo: posição, velocidade, nível de bateria e timestamp, podem ser representados em menos de 100 bytes com estrutura binária eficiente. O limite de 512 bytes é generoso o suficiente para acomodar inclusive formatos texto como JSON, que são mais fáceis de depurar durante o desenvolvimento.

## 4. Segurança

### RNF-10 — Integridade dos Dados de Corrida

| Atributo | Valor |
|---|---|
| **Descrição** | Os dados gravados no banco após uma corrida não devem poder ser modificados pela interface web |
| **Requisito** | Interface de consulta somente leitura; nenhum endpoint de modificação ou exclusão exposto publicamente |

Como os dados serão utilizados para avaliação, é fundamental garantir que não haja possibilidade de alteração posterior dos resultados, seja acidental ou intencional. A forma mais simples de atender a isso é não implementar endpoints de atualização ou deleção no sistema web, deixando qualquer eventual correção como uma operação administrativa direta no banco de dados, com acesso restrito.

## 5. Usabilidade

### RNF-11 — Visibilidade dos Dados de Telemetria

| Atributo | Valor |
|---|---|
| **Descrição** | Todos os 6 campos de telemetria exigidos pelo projeto devem estar visíveis sem necessidade de rolagem |
| **Campos obrigatórios** | Tipo do labirinto, trajeto, consumo de bateria, velocidade média, tempo de conclusão, desafio cumprido (S/N) |
| **Requisito de layout** | Interface responsiva, adaptável a diferentes tamanhos de tela |

### RNF-12 — Compatibilidade de Navegadores

| Atributo | Valor |
|---|---|
| **Descrição** | A aplicação deve funcionar corretamente nos navegadores mais utilizados |
| **Requisito** | Chrome ≥ 110, Firefox ≥ 110, Edge ≥ 110 |

Para garantir que o sistema funcione nos equipamentos disponíveis durante as avaliações, independentemente do laboratório ou computador utilizado, é necessário definir um conjunto mínimo de navegadores suportados. As versões ≥ 110 foram escolhidas por oferecerem amplo suporte a APIs modernas como WebSocket, CSS Grid e Fetch API, recursos que provavelmente serão utilizados no desenvolvimento da interface de telemetria.

# Restrições de Ambiente e Documentação de Software

## 1. Introdução

As restrições estão organizadas em quatro camadas: **firmware embarcado** (o software que roda no robô), **backend** (o servidor que recebe e processa os dados), **frontend** (a interface web) e **banco de dados**.

## 2. Firmware Embarcado

### RE-01 — Microcontrolador

| Atributo | Valor |
|---|---|
| **Tecnologia adotada** | ESP32 |
| **Linguagem** | C/C++ (framework Arduino ou ESP-IDF) |
| **Restrição** | O firmware deve ser compilado e executado exclusivamente no ESP32 |

O ESP32 foi escolhido por integrar Wi-Fi nativamente, o que é indispensável para a transmissão de telemetria em tempo real ao sistema web sem a necessidade de módulos adicionais. É também o microcontrolador com maior disponibilidade de bibliotecas para controle de motores, leitura de sensores infravermelhos e encoders (componentes centrais do micromouse). Alternativas como o STM32 são mais poderosas para controle em tempo real, mas exigiriam um módulo Wi-Fi externo, aumentando a complexidade do hardware.

### RE-02 — Protocolo de Comunicação

| Atributo | Valor |
|---|---|
| **Protocolo** | Wi-Fi (IEEE 802.11 b/g/n) + UDP ou WebSocket |
| **Restrição** | A comunicação entre robô e servidor deve ocorrer via rede local (LAN) |
| **Frequência mínima de envio** | 1 pacote por segundo durante a corrida |

O UDP foi considerado por ser mais leve e ter menor latência do que o TCP, adequado para o envio contínuo de dados de telemetria onde a perda eventual de um pacote é aceitável. O WebSocket sobre TCP é uma alternativa caso optemos por uma comunicação bidirecional mais robusta com o servidor. A rede local elimina a dependência de internet durante as apresentações, garantindo maior confiabilidade.

### RE-03 — Sensores Suportados

| Atributo | Valor |
|---|---|
| **Sensores de distância** | Infravermelho (IR) ou ultrassônico (HC-SR04 ou similar) |
| **Encoder de rodas** | Encoder incremental compatível com GPIO do ESP32 |
| **Restrição** | O firmware deve ser capaz de ler e processar dados de pelo menos 3 sensores de distância simultaneamente (frente, esquerda, direita) |

A detecção de paredes em três direções é o mínimo para que algoritmos de navegação como o flood fill ou wall-following funcionem corretamente. O ESP32 possui GPIOs suficientes para suportar essa configuração sem necessidade de multiplexação.

## 3. Backend

### RE-04 — Linguagem e Framework

| Atributo | Valor |
|---|---|
| **Linguagem** | Python 3.10 ou superior |
| **Framework** | FastAPI |
| **Restrição** | O backend deve ser executável localmente sem necessidade de infraestrutura em nuvem |

Python é a linguagem de maior familiaridade entre os integrantes do grupo. O FastAPI foi escolhido sobre o Flask por ter suporte nativo a WebSocket, que é essencial para a transmissão de telemetria em tempo real e por ser assíncrono por padrão, o que permite lidar com múltiplas conexões simultâneas (professores e integrantes acompanhando a apresentação) com melhor desempenho. A execução local elimina dependências externas durante as apresentações.

### RE-05 — Sistema Operacional do Servidor

| Atributo | Valor |
|---|---|
| **Sistemas suportados** | Windows 10/11, Ubuntu 22.04 LTS, macOS 12 ou superior |
| **Restrição** | O backend deve inicializar e operar corretamente em qualquer um dos sistemas listados |

O grupo pode usar diferentes sistemas operacionais nas sua máquinas pessoais. Garantir compatibilidade com os três sistemas mais comuns evita que a apresentação dependa de um equipamento específico. O Python 3.10+ e o FastAPI são multiplataforma por natureza, então essa restrição é atendida sem esforço adicional desde que as dependências sejam gerenciadas via `requirements.txt` ou similar.

### RE-06 — Gerenciamento de Dependências

| Atributo | Valor |
|---|---|
| **Ferramenta** | pip + arquivo `requirements.txt` |
| **Restrição** | Todas as dependências do backend devem estar listadas no `requirements.txt` com versões fixadas |

Fixar versões das dependências garante que o sistema funcione da mesma forma em qualquer máquina onde for instalado.

## 4. Frontend

### RE-07 — Tecnologias de Interface

| Atributo | Valor |
|---|---|
| **Tecnologias** | HTML5, CSS3, JavaScript (ES6+) |
| **Restrição** | A interface não deve depender de frameworks externos que exijam processo de build (ex: React, Vue com Vite) |

Utilizar HTML, CSS e JavaScript puros elimina a necessidade de configurar ambientes de build (Node.js, npm, Webpack, etc.), reduzindo a complexidade de instalação e execução. Para o escopo do projeto, frameworks pesados não trazem benefícios que justifiquem o custo de setup. A atualização em tempo real pode ser implementada com a Fetch API ou WebSocket nativos do navegador.

### RE-08 — Navegadores Suportados

| Atributo | Valor |
|---|---|
| **Navegadores** | Google Chrome ≥ 110, Mozilla Firefox ≥ 110, Microsoft Edge ≥ 110 |
| **Restrição** | A interface deve funcionar corretamente em qualquer um dos navegadores listados, sem plugins adicionais |

As versões ≥ 110 foram escolhidas por garantirem suporte completo a WebSocket, CSS Grid, Flexbox e Fetch API. São também versões com ampla adoção, presentes na maioria dos notebooks atuais sem necessidade de atualização.

### RE-09 — Layout Responsivo

| Atributo | Valor |
|---|---|
| **Restrição** | A interface deve se adaptar a telas de notebooks e desktops convencionais sem perda de usabilidade |
| **Referência mínima** | Telas com largura a partir de 1024px |

Durante as apresentações, diferentes dispositivos podem ser utilizados para acessar a interface. Garantir que o layout funcione a partir de 1024px cobre a grande maioria dos notebooks atualmente, sem a necessidade de otimização para dispositivos móveis, que não fazem parte do escopo de uso do sistema.

## 5. Banco de Dados

### RE-10 — Sistema de Banco de Dados

| Atributo | Valor |
|---|---|
| **Tecnologia** | SQLite 3 |
| **Restrição** | O banco de dados deve ser um arquivo local, sem necessidade de servidor dedicado |

O SQLite foi escolhido por ser um banco de dados baseado em arquivo. Para o volume de dados esperado (~100 corridas, ~100 MB), o SQLite é mais que suficiente em termos de desempenho. Sua portabilidade também é uma vantagem, já que o banco de dados é um único arquivo que pode ser copiado, versionado e compartilhado facilmente entre os integrantes do grupo.

### RE-11 — Acesso ao Banco de Dados

| Atributo | Valor |
|---|---|
| **Biblioteca** | SQLAlchemy (ORM) ou sqlite3 (biblioteca padrão do Python) |
| **Restrição** | O acesso ao banco deve ser feito exclusivamente pelo backend; a interface web não deve ter acesso direto ao banco |

Centralizar o acesso ao banco no backend garante que toda escrita e leitura de dados passe por uma camada de validação, prevenindo inconsistências e atendendo ao requisito de integridade dos dados (RNF-10). O uso de SQLAlchemy como ORM facilita a manutenção do código e a eventual migração para outro banco de dados caso necessário.

## 6. Resumo das Restrições Tecnológicas

| ID | Camada | Tecnologia | Versão mínima |
|---|---|---|---|
| RE-01 | Firmware | ESP32 (C/C++) | ESP-IDF 5.0 / Arduino Core 2.0 |
| RE-02 | Firmware | Wi-Fi + UDP/WebSocket | IEEE 802.11 b/g/n |
| RE-04 | Backend | Python + FastAPI | Python 3.10 |
| RE-05 | Backend | Windows / Ubuntu / macOS | Win 10, Ubuntu 22.04, macOS 12 |
| RE-07 | Frontend | HTML5 + CSS3 + JS | ES6+ |
| RE-08 | Frontend | Chrome / Firefox / Edge | versão 110 |
| RE-09 | Frontend | Layout responsivo | largura ≥ 1024px |
| RE-10 | Banco de dados | SQLite 3 | versão 3.35+ |
