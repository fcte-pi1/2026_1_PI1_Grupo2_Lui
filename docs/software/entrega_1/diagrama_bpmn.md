# Diagrama BPMN

<div class="svg-embed-container" 
       data-svg-path="../../../assets/images/diagramaBPMN.svg" 
       data-title="Diagrama BPMN do fluxo" 
       style="height: 600px; width: 100%;"> </div>

O diagrama BPMN representa o fluxo principal de uma corrida do Micromouse, desde o acionamento do robô pelo operador até a exibição do resultado final no painel de monitoramento.

O nível adotado é descritivo, com foco nas responsabilidades dos participantes, nas mensagens trocadas e nas principais decisões do processo.

---

## Participantes

| Participante | Responsabilidade |
|---|---|
| **Operador** | Configura o labirinto, posiciona o robô e aciona a corrida |
| **Micromouse / Firmware** | Executa a navegação autônoma e envia telemetria ao backend |
| **Backend** | Recebe e valida os pacotes, notifica o frontend e persiste o resultado |
| **Frontend** | Exibe os dados em tempo real e o resultado final da corrida |

O SQLite aparece no diagrama como armazenamento de dados (*data store*), acessado pelo backend ao final da corrida.

---

## Fluxo principal

### Operador

Inicia o processo selecionando o tipo de labirinto, posicionando o robô na célula de partida e acionando o início da corrida.

### Firmware

Ao receber o sinal de início, inicializa sensores, motores e a estrutura interna do mapa. A partir desse ponto, executa um ciclo autônomo:

```text
ler sensores → atualizar mapa → calcular rota com Flood Fill → executar movimento → verificar objetivo
```

Enquanto o objetivo não é atingido, o ciclo se repete. Ao alcançá-lo, o firmware envia um sinal de conclusão ao backend.

Em paralelo ao ciclo de navegação, o firmware monta e envia pacotes de telemetria ao backend.

### Backend

Recebe os pacotes de telemetria e valida cada um:

- pacotes inválidos são rejeitados sem interromper o servidor;
- pacotes válidos são retransmitidos ao frontend.

Ao receber o sinal de conclusão, o backend notifica o frontend, gera o resumo final e persiste os dados no SQLite.

### Frontend

Exibe os dados recebidos em tempo real e atualiza o painel de monitoramento. Ao detectar que a corrida foi finalizada, exibe a tela com o resultado final, encerrando o fluxo.

---

## Mensagens entre participantes

```text
Operador  → Firmware: sinal de início
Firmware  → Backend:  pacotes de telemetria
Firmware  → Backend:  sinal de conclusão
Backend   → Frontend: dados em tempo real
Backend   → Frontend: notificação de conclusão
Backend   → SQLite:   resumo final
```

---

## Gateways

| Gateway | Tipo | Função |
|---|---|---|
| **Navegação e telemetria** | Paralelo | Permite que o firmware navegue e envie dados simultaneamente |
| **Objetivo atingido?** | Exclusivo | Decide se o firmware continua o ciclo ou envia o sinal de conclusão |
| **Pacote válido?** | Exclusivo | Decide se o backend retransmite ou rejeita o pacote recebido |
| **Finalizado?** | Exclusivo | Decide se o frontend mantém o monitoramento ou exibe o resultado final |

---

## Histórico de versões

| Versão | Data | Descrição | Autor(es) | Revisor(es) | Descrição da Revisão |
|:---:|:---:|:---:|:---:|:---:|:---:|
| `1.0` | 27/04/2026 | Criação do documento de descrição textual do Diagrama BPMN | [Arthur Moreira](https://github.com/arthurrochamoreira) | [Eduardo Ferreira](https://github.com/eduardoferre) | |
| `1.1` | 29/04/2026 | Melhoria da estrutura do documento | [Arthur Moreira](https://github.com/arthurrochamoreira) | [Eduardo Ferreira](https://github.com/eduardoferre) | |
| `1.2` | 29/04/2026 | Reorganização da descrição textual do BPMN | [Arthur Moreira](https://github.com/arthurrochamoreira) | [Eduardo Ferreira](https://github.com/eduardoferre) | |
| `1.3` | 07/05/2026 | Elaboração e Adição do Diagrama BPMN | [Eduardo Ferreira](https://github.com/eduardoferre) | Pendente | |
| `1.4` | 08/05/2026 | Simplificação do texto| [Arthur Moreira](https://github.com/arthurrochamoreira) | Pendente | |