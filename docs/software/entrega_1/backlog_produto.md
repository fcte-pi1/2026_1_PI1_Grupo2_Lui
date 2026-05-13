# Backlog do Produto

Este documento apresenta o backlog de software do Micromouse, consolidando os requisitos funcionais e não-funcionais que orientam o desenvolvimento, a validação e a evolução do sistema. A organização adotada assegura a rastreabilidade entre as necessidades do produto, os critérios de aceitação, as prioridades de implementação e as evidências de validação registradas na matriz de testes funcionais.

Os requisitos funcionais (RF) são documentados como Histórias de Usuário (HU), no formato "Eu como / gostaria de / para", acompanhadas de critérios de aceitação verificáveis e priorização pelo método MoSCoW. Os requisitos não-funcionais (RNF) são descritos de forma objetiva, com métrica, limite e condição de medição sempre que aplicável, o que evita formulações subjetivas ou de difícil validação.

## Escala MoSCoW

A priorização adotada estrutura a entrega em três níveis de criticidade, conforme detalhado a seguir.

| Prioridade | Significado no projeto |
|---|---|
| **Must have** | Item obrigatório para que o produto atenda ao escopo mínimo e ao enunciado. |
| **Should have** | Item importante, mas que não bloqueia a operação mínima do sistema. |
| **Could have** | Melhoria desejável, entregue apenas após o cumprimento dos itens obrigatórios. |

## Requisitos Funcionais como Histórias de Usuário

### Firmware: Navegação

#### RF-01 / US01: Localização do robô no labirinto

- **História de usuário:** Eu como operador, gostaria de que o robô monitore sua própria localização dentro do labirinto, para calcular a posição atual e auxiliar na tomada de decisões.
- **Critérios de aceitação:**
  - O robô deve manter um registro de coordenadas (X,Y) ou matriz atualizado.
  - A posição deve mudar dinamicamente conforme o deslocamento.
  - A lógica deve iniciar assumindo 3 paredes na casa inicial.
- **MoSCoW:** Must have.
- **Justificativa:** Fundamental para a consciência espacial do robô; sem esse registro, a navegação autônoma é inviável.

#### RF-02 / US02: Descoberta de paredes

- **História de usuário:** Eu como operador, gostaria de que o robô descubra paredes à medida que explora, para alimentar o algoritmo e evitar colisões.
- **Critérios de aceitação:**
  - Os sensores devem detectar obstáculos à frente, à esquerda e à direita.
  - O firmware deve bloquear comandos de avanço na direção de paredes detectadas.
- **MoSCoW:** Must have.
- **Justificativa:** Essencial para o mapeamento e para a segurança física do robô.

#### RF-03 / US03: Mapeamento do labirinto

- **História de usuário:** Eu como operador, gostaria de que o robô mapeie o labirinto durante o percurso, para encontrar e salvar o caminho mais eficiente.
- **Critérios de aceitação:**
  - O firmware deve gravar o mapa na memória, incluindo paredes e caminhos livres.
  - O mapa deve ser consultável após a exploração.
- **MoSCoW:** Must have.
- **Justificativa:** Requisito primário do Micromouse, voltado a resolver o labirinto e não apenas a percorrê-lo sem estratégia.

#### RF-04 / US04: Detecção da sala central

- **História de usuário:** Eu como operador, gostaria de que o robô detecte quando chegou à sala central, para encerrar a busca e marcar o desafio como concluído.
- **Critérios de aceitação:**
  - O firmware deve identificar a configuração de destino.
  - O robô deve parar e sinalizar o fim do desafio.
- **MoSCoW:** Must have.
- **Justificativa:** A chegada ao centro consolida a condição de vitória do sistema.

#### RF-05 / US05: Suporte a labirintos 4x4, 8x8 e 16x16

- **História de usuário:** Eu como operador, gostaria de que o robô resolva os três tamanhos de labirinto (4x4, 8x8 e 16x16), para garantir adaptação de escala.
- **Critérios de aceitação:**
  - O algoritmo deve aceitar configuração para labirintos 4x4, 8x8 e 16x16.
  - O dashboard deve exibir o tipo de labirinto ativo.
- **MoSCoW:** Must have.
- **Justificativa:** A entrega final prevê a validação do sistema nos três tamanhos de labirinto.

#### RF-06 / US06: Autonomia após largada

- **História de usuário:** Eu como juiz da prova, gostaria de que o firmware ignore comandos externos de direção após a largada, para validar a eficácia 100% autônoma do robô.
- **Critérios de aceitação:**
  - O percurso deve ocorrer do início ao fim sem aceitar controle manual de direção.
  - A interface deve indicar o estado de corrida autônoma durante a execução.
- **MoSCoW:** Must have.
- **Justificativa:** A intervenção manual descaracteriza a proposta do sistema e invalida a prova.

#### RF-07 / US07: Correção contínua de trajetória

- **História de usuário:** Eu como operador, gostaria de que o robô corrija a trajetória continuamente, via controle PID, para navegar de forma centralizada e não colidir.
- **Critérios de aceitação:**
  - O loop de controle deve corrigir o alinhamento com base nas leituras laterais.
  - O robô deve percorrer corredores sem tocar nas paredes em condições normais de teste.
- **MoSCoW:** Should have.
- **Justificativa:** O controle PID melhora a estabilidade, embora uma estratégia mais simples ainda viabilize a navegação mínima.

### Firmware: Telemetria

#### RF-08 / US08: Envio de dados primários em tempo real

- **História de usuário:** Eu como operador, gostaria de que o firmware envie em tempo real dados primários (trajeto, tempo e status), para alimentar o sistema web.
- **Critérios de aceitação:**
  - A transmissão sem fio deve ocorrer continuamente durante a corrida.
  - Os dados recebidos devem atualizar o dashboard sem ação manual do operador.
- **MoSCoW:** Must have.
- **Justificativa:** A interface web depende desses dados para cumprir o monitoramento em tempo real.

#### RF-09 / US09: Envio de bateria e velocidade média

- **História de usuário:** Eu como operador, gostaria de que o firmware envie o consumo de bateria e a velocidade média em tempo real, para monitorar a integridade do robô.
- **Critérios de aceitação:**
  - O firmware deve ler a tensão da bateria e convertê-la em porcentagem.
  - O firmware deve calcular e enviar a velocidade média.
  - O dashboard deve exibir bateria e velocidade média sem rolagem.
- **MoSCoW:** Must have.
- **Justificativa:** Bateria e velocidade média compõem os seis campos obrigatórios de telemetria definidos no enunciado.

### Sistema Web: Tempo Real

#### RF-10 / US10: Visualização do trajeto e labirinto em tempo real

- **História de usuário:** Eu como operador, gostaria de visualizar na interface web o trajeto e o labirinto em tempo real, para acompanhar a evolução da corrida.
- **Critérios de aceitação:**
  - A interface deve renderizar um grid/mapa preenchido com a telemetria.
  - A interface deve exibir o tipo do labirinto (4x4, 8x8 ou 16x16).
- **MoSCoW:** Must have.
- **Justificativa:** Constitui o núcleo operacional do dashboard, viabilizando o acompanhamento visual do comportamento do robô durante a execução.

#### RF-11 / US11: Resultado imediato da corrida

- **História de usuário:** Eu como operador, gostaria de ver no painel o tempo de conclusão e a notificação se o desafio foi cumprido, para ter o resultado imediato.
- **Critérios de aceitação:**
  - O painel deve exibir cronômetro durante a corrida.
  - Ao final, a interface deve indicar se o desafio foi cumprido (S/N).
- **MoSCoW:** Must have.
- **Justificativa:** Sem esses campos, não é possível atestar digitalmente o sucesso e a performance da corrida.

#### RF-12 / US12: Indicadores de velocidade média e bateria

- **História de usuário:** Eu como operador, gostaria de monitorar indicadores de velocidade média e nível de bateria na tela, para prever pausas para recarga.
- **Critérios de aceitação:**
  - Velocidade média e bateria devem ficar visíveis em tempo real no painel, sem necessidade de rolagem.
  - Os valores devem atualizar dinamicamente conforme a telemetria chega.
- **MoSCoW:** Must have.
- **Justificativa:** O enunciado exige a exibição dos seis campos de telemetria, incluindo bateria e velocidade média.

### Sistema Web: Banco de Dados

#### RF-13 / US13: Persistência automática da corrida

- **História de usuário:** Eu como operador, gostaria de que os dados finais de cada corrida sejam salvos automaticamente no banco ao término, para consulta do histórico.
- **Critérios de aceitação:**
  - O backend deve criar um registro de corrida ao receber a flag de conclusão.
  - Os dados devem persistir após o reinício da aplicação.
- **MoSCoW:** Must have.
- **Justificativa:** A persistência viabiliza a consulta posterior e a validação dos resultados.

#### RF-14 / US14: Consulta filtrada por tipo de labirinto

- **História de usuário:** Eu como operador, gostaria de filtrar os dados consolidados do histórico por tipo de labirinto (4x4, 8x8, 16x16) ou visualizar todos, para analisar o desempenho em diferentes cenários.
- **Critérios de aceitação:**
  - A interface deve permitir seleção de filtro por tamanho de labirinto.
  - A listagem deve atualizar conforme o filtro selecionado.
- **MoSCoW:** Must have.
- **Justificativa:** O enunciado exige consulta por labirinto ou por todos os labirintos.

### Funcionalidades Adicionais

#### RF-15 / US15: Ranking de melhores corridas

- **História de usuário:** Eu como operador, gostaria de ver um ranking das melhores corridas por tamanho de labirinto, para identificar a evolução do desempenho do robô ao longo dos testes.
- **Critérios de aceitação:**
  - Cada tipo de labirinto deve exibir um Top 5 ordenado por menor tempo de conclusão.
  - Apenas corridas com desafio cumprido = S devem aparecer no ranking.
  - O ranking deve atualizar quando uma nova corrida concluída for registrada.
- **MoSCoW:** Could have.
- **Justificativa:** Agrega valor analítico aos dados, embora não bloqueie a entrega mínima.

#### RF-16 / US16: Exportação do histórico em CSV

- **História de usuário:** Eu como operador, gostaria de exportar o histórico de corridas em formato CSV, para realizar análises externas em planilhas e gráficos.
- **Critérios de aceitação:**
  - A tela de histórico deve conter botão "Exportar CSV".
  - O arquivo deve conter tempo total, trajeto, velocidade média, bateria, status, tipo de labirinto e data_hora.
  - A exportação deve respeitar o filtro de labirinto ativo.
- **MoSCoW:** Could have.
- **Justificativa:** Auxilia a análise do relatório final, mas não é exigida pelo escopo mínimo.

#### RF-17 / US17: Replay de corrida salva

- **História de usuário:** Eu como operador, gostaria de reproduzir visualmente o trajeto de uma corrida salva, para revisar decisões do algoritmo após a corrida.
- **Critérios de aceitação:**
  - Selecionar uma corrida no histórico deve abrir uma tela de replay.
  - O replay deve animar o trajeto célula a célula.
  - A tela deve possuir controles de play, pause e velocidade.
- **MoSCoW:** Could have.
- **Justificativa:** Possui alto valor de depuração e apresentação, embora exija esforço adicional de interface.

#### RF-18 / US18: Indicador de qualidade da conexão

- **História de usuário:** Eu como operador, gostaria de ver no dashboard um indicador da qualidade da conexão WebSocket, com latência atual e status, para identificar rapidamente quedas ou degradação durante a corrida.
- **Critérios de aceitação:**
  - O indicador deve estar visível no dashboard.
  - O indicador deve apresentar os estados conectado, reconectando e desconectado.
  - A interface deve exibir a latência média dos últimos 10 pacotes em milissegundos.
  - Deve haver alerta visual quando a latência exceder 500 ms.
- **MoSCoW:** Should have.
- **Justificativa:** Confere visibilidade ao RNF-01 e apoia o diagnóstico de falhas de comunicação.

## Requisitos Não-Funcionais

Os requisitos não-funcionais estabelecem atributos de qualidade necessários para que o sistema opere de forma confiável, mensurável e compatível com o contexto de uso previsto. Cada RNF é apresentado com descrição objetiva, métrica ou requisito verificável, condição de medição e prioridade MoSCoW, viabilizando sua validação por meio de testes e inspeções técnicas.

### Desempenho

| ID | Descrição objetiva | Métrica / limite | Condição de medição | MoSCoW |
|---|---|---|---|---|
| **RNF-01** | Latência de transmissão de telemetria entre robô e sistema web. | Tempo entre geração do dado no robô e exibição na interface: **<= 500 ms**. | Rede Wi-Fi local, até 10 m entre robô e roteador. | Must have |
| **RNF-02** | Taxa de atualização da interface web. | Intervalo entre atualizações consecutivas: **<= 1 s**. | Navegador moderno, conexão local ativa. | Must have |
| **RNF-03** | Tempo de carregamento inicial da página web. | Time-to-Interactive (TTI): **<= 3 s**. | Rede local e hardware padrão de laboratório. | Should have |
| **RNF-04** | Tempo do ciclo principal de controle do firmware. | Ciclo de controle: **<= 10 ms**, equivalente a **>= 100 Hz**. | Microcontrolador alvo, labirinto 16x16 em operação. | Must have |
| **RNF-05** | Tempo entre detecção do objetivo e confirmação de escrita no banco. | Escrita confirmada em **<= 2 s**. | Banco local ou servidor na mesma rede. | Should have |

### Capacidade e Carga

| ID | Descrição objetiva | Métrica / limite | Condição de medição | MoSCoW |
|---|---|---|---|---|
| **RNF-06** | Tamanho máximo do resumo final persistido por corrida. | **<= 10 KB** por corrida. | Registro contendo tempo total, matriz de paredes, sequência de células, velocidade média, bateria e status. | Should have |
| **RNF-07** | Quantidade mínima de corridas armazenadas sem degradação relevante. | **>= 100 corridas** e consulta filtrada em **<= 1 s**. | Banco com registros distribuídos entre 4x4, 8x8 e 16x16. | Should have |
| **RNF-08** | Usuários simultâneos acessando a interface web. | **>= 10 clientes ativos** mantendo atualização em **<= 1 s**. | Dashboard aberto em múltiplos navegadores na rede local. | Should have |
| **RNF-09** | Tamanho máximo do pacote de telemetria. | **<= 512 bytes** por pacote. | Pacote enviado pelo Micromouse ao servidor por ciclo de telemetria. | Should have |

### Segurança e Integridade

| ID | Descrição objetiva | Requisito verificável | Condição de medição | MoSCoW |
|---|---|---|---|---|
| **RNF-10** | Integridade dos dados de corrida gravados no banco. | Interface de consulta somente leitura; nenhum endpoint público de edição ou exclusão. | Inspeção da API e tentativa de alteração pela interface web. | Must have |

### Usabilidade e Compatibilidade

| ID | Descrição objetiva | Requisito verificável | Condição de medição | MoSCoW |
|---|---|---|---|---|
| **RNF-11** | Visibilidade dos seis campos obrigatórios de telemetria. | Tipo de labirinto, trajeto, consumo de bateria, velocidade média, tempo de conclusão e desafio cumprido (S/N) visíveis sem rolagem. | Tela de notebook ou desktop com largura mínima de 1024 px. | Must have |
| **RNF-12** | Compatibilidade com navegadores. | Funcionamento correto em Chrome >= 110, Firefox >= 110 e Edge >= 110, sem plugins adicionais. | Execução do dashboard nos três navegadores. | Should have |

## Rastreabilidade Resumida

A rastreabilidade relaciona os principais grupos de requisitos às respectivas evidências de validação, permitindo verificar a cobertura entre as funcionalidades previstas, os requisitos de qualidade e os casos de teste associados.

| Item | Evidência de validação |
|---|---|
| Navegação e mapeamento | CT-01 a CT-16, CT-45 |
| Telemetria e tempo real | CT-17 a CT-19, CT-25 a CT-27, CT-31, CT-32, CT-39 |
| Persistência e histórico | CT-20 a CT-24, CT-28, CT-29, CT-35 a CT-37, CT-40 |
| Reconexão e qualidade de conexão | CT-30, CT-38 |
| Funcionalidades adicionais | CT-42 a CT-44 |
| RNFs de desempenho | CT-31 a CT-34, com medições de latência, atualização, carregamento e ciclo de controle |
