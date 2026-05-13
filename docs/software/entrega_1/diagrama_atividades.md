# Diagrama de Atividades

O Diagrama de Atividades modela o funcionamento de uma corrida do Micromouse, desde o acionamento pelo operador até a exibição do resultado final no painel de monitoramento. Sua finalidade é explicitar a ordem das atividades, as condições de decisão e a interação entre os componentes do sistema, viabilizando uma compreensão integrada do comportamento dinâmico da solução.

A notação UML de Diagrama de Atividades foi adotada por ser adequada à representação de processos que envolvem múltiplos atores com atividades simultâneas: o operador, o firmware embarcado no ESP32, o backend FastAPI e o frontend. Essa notação permite expressar com clareza as raias responsáveis por cada ator, os pontos de decisão, as sincronizações e os fluxos de controle. A Figura 1 apresenta o diagrama, destacando a raia do firmware (responsável pela navegação autônoma), a raia do backend (responsável pela validação dos pacotes e pela persistência no SQLite), bem como os pontos de decisão "objetivo atingido?" e "pacote válido?", que regem a continuidade da execução. Esses atores e atividades constituem a base para o Diagrama de Casos de Uso, detalhado em documento próprio.

<div class="svg-embed-container" 
       data-svg-path="../../../assets/images/diagramaAtividades.svg" 
       data-title="Figura 1 Diagrama de atividades do fluxo de corrida do Micromouse" 
       style="height: 600px; width: 100%;"> </div>

## Atores e raias

Cada raia (*swimlane*) do diagrama corresponde a um ator e consolida o conjunto de atividades sob sua responsabilidade.

| Ator (raia) | Responsabilidade |
|---|---|
| **Operador** | Configura o labirinto, posiciona o robô e aciona a corrida |
| **Micromouse / Firmware (ESP32)** | Executa a navegação autônoma e transmite a telemetria ao backend |
| **Backend (FastAPI)** | Recebe e valida os pacotes, notifica o frontend e persiste o resultado |
| **Frontend** | Exibe os dados em tempo real e apresenta o resultado final da corrida |

O SQLite é representado no diagrama como armazenamento de dados (*data store*), acessado pelo backend ao término da corrida.

## Atividades por raia

### Operador

O operador inicia o fluxo selecionando o tipo de labirinto, posicionando o robô na célula de partida e acionando o início da corrida.

### Firmware (ESP32)

Ao receber o sinal de início, o firmware inicializa sensores, motores e a estrutura interna do mapa. A partir desse ponto, executa um ciclo autônomo:

```text
ler sensores → atualizar mapa → calcular rota com Flood Fill → executar movimento → verificar objetivo
```

Enquanto o objetivo não é atingido, o ciclo se repete. Ao alcançá-lo, o firmware emite um sinal de conclusão ao backend. Em paralelo ao ciclo de navegação, o firmware monta e transmite pacotes de telemetria ao backend, comportamento representado por uma barra de bifurcação (*fork*) e sincronizado posteriormente por uma barra de junção (*join*).

### Backend (FastAPI)

O backend recebe os pacotes de telemetria e valida cada um deles: os pacotes inválidos são rejeitados sem comprometer a operação do servidor, ao passo que os pacotes válidos são retransmitidos ao frontend. Ao receber o sinal de conclusão, o backend notifica o frontend, consolida o resumo final e persiste os dados no SQLite.

### Frontend

O frontend exibe os dados recebidos em tempo real e atualiza o painel de monitoramento. Ao detectar a finalização da corrida, apresenta a tela com o resultado consolidado, encerrando o fluxo.

## Insumos e saídas

As entradas e saídas de cada atividade explicitam as dependências de dados entre as raias, conforme consolidado a seguir.

| Atividade | Insumos (entradas) | Saídas (resultados) |
|---|---|---|
| Configurar corrida | Tipo de labirinto, posição inicial | Configuração da corrida |
| Ciclo autônomo de navegação | Leituras dos sensores, mapa atual | Mapa atualizado, próximo movimento |
| Envio de telemetria | Estado interno do firmware | Mensagens de telemetria via WebSocket |
| Validação de pacotes | Pacote recebido | Pacote válido encaminhado ou descarte |
| Geração do resumo final | Pacotes da corrida | Resumo persistido no SQLite |
| Exibição em tempo real | Dados retransmitidos pelo backend | Painel atualizado e tela de resultado final |

## Pontos de decisão, paralelismo e sincronização

Os elementos de controle de fluxo asseguram a representação adequada do paralelismo e das ramificações condicionais que caracterizam a execução do sistema.

| Elemento | Notação UML | Função |
|---|---|---|
| **Navegação e telemetria** | Bifurcação e sincronização (*fork/join*) | Permite que o firmware navegue e transmita dados simultaneamente |
| **Objetivo atingido?** | Nó de decisão | Determina se o firmware reinicia o ciclo ou emite o sinal de conclusão |
| **Pacote válido?** | Nó de decisão | Determina se o backend retransmite ou descarta o pacote recebido |
| **Finalizado?** | Nó de decisão | Determina se o frontend mantém o monitoramento ou exibe o resultado final |

## Mensagens entre raias

As trocas de mensagens entre raias estruturam a comunicação assíncrona entre os componentes, sintetizadas a seguir.

```text
Operador  → ESP32:    sinal de início
ESP32     → FastAPI:  pacotes de telemetria
ESP32     → FastAPI:  sinal de conclusão
FastAPI   → Frontend: dados em tempo real
FastAPI   → Frontend: notificação de conclusão
FastAPI   → SQLite:   resumo final
```

## Notações empregadas

O diagrama aplica as seguintes notações UML: estados inicial e final delimitam a corrida; as atividades representam as ações executadas em cada raia; nós de decisão e junção controlam os caminhos alternativos; barras de bifurcação e sincronização (*fork/join*) representam o paralelismo entre navegação e telemetria; as raias (*swimlanes*) segregam as responsabilidades dos atores; e os fluxos de controle conectam atividades, decisões e mensagens entre as raias.

## Histórico de versões

| Versão | Data | Descrição | Autor(es) | Revisor(es) | Descrição da Revisão |
|:---:|:---:|:---:|:---:|:---:|:---:|
| `1.0` | 27/04/2026 | Criação do documento de descrição textual do Diagrama BPMN | [Arthur Moreira](https://github.com/arthurrochamoreira) | [Eduardo Ferreira](https://github.com/eduardoferre) | |
| `1.1` | 29/04/2026 | Melhoria da estrutura do documento | [Arthur Moreira](https://github.com/arthurrochamoreira) | [Eduardo Ferreira](https://github.com/eduardoferre) | |
| `1.2` | 29/04/2026 | Reorganização da descrição textual do BPMN | [Arthur Moreira](https://github.com/arthurrochamoreira) | [Eduardo Ferreira](https://github.com/eduardoferre) | |
| `1.3` | 07/05/2026 | Elaboração e Adição do Diagrama BPMN | [Eduardo Ferreira](https://github.com/eduardoferre) | Pendente | |
| `1.4` | 08/05/2026 | Simplificação do texto | [Arthur Moreira](https://github.com/arthurrochamoreira) | Pendente | |
| `1.5` | 08/05/2026 | Reenquadramento como Diagrama de Atividades | [Arthur Moreira](https://github.com/arthurrochamoreira) | Pendente | |
