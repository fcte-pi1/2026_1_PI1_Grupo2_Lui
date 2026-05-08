# Diagrama de Atividades

O diagrama de atividades modela o funcionamento de uma corrida do Micromouse, desde o acionamento pelo operador até a exibição do resultado final no painel de monitoramento. Ele mostra a ordem das atividades, as condições de decisão e a interação entre os componentes do sistema.

Adota-se o Diagrama de Atividades UML porque o sistema envolve quatro atores com atividades simultâneas: operador, firmware embarcado no ESP32, backend FastAPI e frontend. Essa notação permite representar raias, decisões, sincronizações e fluxos de controle de forma clara. A Figura 1 apresenta o diagrama, destacando a raia do firmware ESP32, responsável pela navegação autônoma; a raia do backend FastAPI, responsável pela validação dos pacotes e pela persistência no SQLite; e os pontos de decisão “objetivo atingido?” e “pacote válido?”, que controlam o fluxo da execução. Esses atores e atividades servem de base para o diagrama de casos de uso, detalhado na próxima subseção.

<div class="svg-embed-container" 
       data-svg-path="../../../assets/images/diagramaAtividades.svg" 
       data-title="Figura 1 Diagrama de atividades do fluxo de corrida do Micromouse" 
       style="height: 600px; width: 100%;"> </div>

---

## Atores e raias

Cada raia (*swimlane*) do diagrama corresponde a um ator e agrupa as atividades de sua responsabilidade.

| Ator (raia) | Responsabilidade |
|---|---|
| **Operador** | Configura o labirinto, posiciona o robô e aciona a corrida |
| **Micromouse / Firmware (ESP32)** | Executa a navegação autônoma e envia telemetria ao backend |
| **Backend (FastAPI)** | Recebe e valida os pacotes, notifica o frontend e persiste o resultado |
| **Frontend** | Exibe os dados em tempo real e o resultado final da corrida |

O SQLite aparece no diagrama como armazenamento de dados (*data store*), acessado pelo backend ao final da corrida.

---

## Atividades por raia

### Operador

Inicia o fluxo selecionando o tipo de labirinto, posicionando o robô na célula de partida e acionando o início da corrida.

### Firmware (ESP32)

Ao receber o sinal de início, inicializa sensores, motores e a estrutura interna do mapa. A partir desse ponto, executa um ciclo autônomo:

```text
ler sensores → atualizar mapa → calcular rota com Flood Fill → executar movimento → verificar objetivo
```

Enquanto o objetivo não é atingido, o ciclo se repete. Ao alcançá-lo, o firmware envia um sinal de conclusão ao backend. Em paralelo ao ciclo de navegação, o firmware monta e envia pacotes de telemetria ao backend, comportamento representado por uma barra de bifurcação (*fork*) e sincronizado posteriormente por uma barra de junção (*join*).

### Backend (FastAPI)

Recebe os pacotes de telemetria e valida cada um:

- pacotes inválidos são rejeitados sem interromper o servidor;
- pacotes válidos são retransmitidos ao frontend.

Ao receber o sinal de conclusão, o backend notifica o frontend, gera o resumo final e persiste os dados no SQLite.

### Frontend

Exibe os dados recebidos em tempo real e atualiza o painel de monitoramento. Ao detectar que a corrida foi finalizada, exibe a tela com o resultado final, encerrando o fluxo.

---

## Insumos e saídas

| Atividade | Insumos (entradas) | Saídas (resultados) |
|---|---|---|
| Configurar corrida | Tipo de labirinto, posição inicial | Configuração da corrida |
| Ciclo autônomo de navegação | Leituras dos sensores, mapa atual | Mapa atualizado, próximo movimento |
| Envio de telemetria | Estado interno do firmware | Pacotes de telemetria HTTP |
| Validação de pacotes | Pacote recebido | Pacote válido encaminhado ou descarte |
| Geração do resumo final | Pacotes da corrida | Resumo persistido no SQLite |
| Exibição em tempo real | Dados retransmitidos pelo backend | Painel atualizado, tela de resultado final |

---

## Pontos de decisão, paralelismo e sincronização

| Elemento | Notação UML | Função |
|---|---|---|
| **Navegação e telemetria** | Bifurcação / sincronização (*fork/join*) | Permite que o firmware navegue e envie dados simultaneamente |
| **Objetivo atingido?** | Nó de decisão | Decide se o firmware continua o ciclo ou envia o sinal de conclusão |
| **Pacote válido?** | Nó de decisão | Decide se o backend retransmite ou rejeita o pacote recebido |
| **Finalizado?** | Nó de decisão | Decide se o frontend mantém o monitoramento ou exibe o resultado final |

---

## Mensagens entre raias

```text
Operador  → ESP32:    sinal de início
ESP32     → FastAPI:  pacotes de telemetria
ESP32     → FastAPI:  sinal de conclusão
FastAPI   → Frontend: dados em tempo real
FastAPI   → Frontend: notificação de conclusão
FastAPI   → SQLite:   resumo final
```

---

## Notações empregadas

O diagrama aplica as seguintes notações UML: estado inicial e estado final delimitam a corrida; atividades representam as ações executadas em cada raia; nós de decisão e junção controlam os caminhos alternativos; barras de bifurcação e sincronização (*fork/join*) representam o paralelismo entre navegação e telemetria; raias (*swimlanes*) separam as responsabilidades dos atores; e os fluxos de controle conectam atividades, decisões e mensagens entre raias.

---

## Histórico de versões

| Versão | Data | Descrição | Autor(es) | Revisor(es) | Descrição da Revisão |
|:---:|:---:|:---:|:---:|:---:|:---:|
| `1.0` | 27/04/2026 | Criação do documento de descrição textual do Diagrama BPMN | [Arthur Moreira](https://github.com/arthurrochamoreira) | [Eduardo Ferreira](https://github.com/eduardoferre) | |
| `1.1` | 29/04/2026 | Melhoria da estrutura do documento | [Arthur Moreira](https://github.com/arthurrochamoreira) | [Eduardo Ferreira](https://github.com/eduardoferre) | |
| `1.2` | 29/04/2026 | Reorganização da descrição textual do BPMN | [Arthur Moreira](https://github.com/arthurrochamoreira) | [Eduardo Ferreira](https://github.com/eduardoferre) | |
| `1.3` | 07/05/2026 | Elaboração e Adição do Diagrama BPMN | [Eduardo Ferreira](https://github.com/eduardoferre) | Pendente | |
| `1.4` | 08/05/2026 | Simplificação do texto | [Arthur Moreira](https://github.com/arthurrochamoreira) | Pendente | |
| `1.5` | 08/05/2026 | Reenquadramento como Diagrama de Atividades | [Arthur Moreira](https://github.com/arthurrochamoreira) | Pendente | |
