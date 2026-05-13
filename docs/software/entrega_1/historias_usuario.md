# Histórias de Usuário

Este documento consolida as Histórias de Usuário (US) do projeto Micromouse, estruturando o backlog funcional do software. As histórias são organizadas em cinco grupos temáticos (firmware de navegação, firmware de telemetria, sistema web em tempo real, sistema web e banco de dados, e funcionalidades adicionais) e priorizadas pelo método MoSCoW, com critérios de aceitação verificáveis que asseguram sua testabilidade. A organização adotada viabiliza a rastreabilidade entre as necessidades do produto, os requisitos funcionais (RF-01 a RF-18) e os casos de teste correspondentes definidos na matriz de testes funcionais.

## Backlog Funcional de Software

As funcionalidades do sistema são apresentadas a seguir em formato de Histórias de Usuário, acompanhadas dos respectivos critérios de aceitação, da prioridade MoSCoW e da justificativa que sustenta cada classificação.

### 1. Firmware: Navegação

| ID | História de Usuário | Critérios de Aceitação | MoSCoW | Justificativa |
|---|---|---|---|---|
| **US01** | Eu como operador,<br>Gostaria de que o robô monitore sua própria localização dentro do labirinto,<br>Para calcular a posição atual e auxiliar na tomada de decisões. | <ul><li>O robô deve manter um registro de coordenadas (X,Y) ou matriz atualizado.</li><li>A posição deve mudar dinamicamente.</li><li>Iniciar a lógica assumindo 3 paredes na casa inicial.</li></ul> | **Must Have** | Fundamental para a consciência espacial do robô; sem esse registro, a navegação autônoma é inviável. |
| **US02** | Eu como operador,<br>Gostaria de que o robô descubra paredes à medida que explora,<br>Para alimentar o algoritmo e evitar colisões. | <ul><li>Sensores devem detectar obstáculos.</li><li>O firmware deve barrar comandos de avanço na direção de paredes.</li></ul> | **Must Have** | Essencial para o mapeamento e para a segurança física do robô; o algoritmo de resolução do labirinto depende da identificação das barreiras. |
| **US03** | Eu como operador,<br>Gostaria de que o robô mapeie o labirinto durante o percurso,<br>Para encontrar e salvar o caminho mais eficiente. | <ul><li>Gravar o mapa na memória (paredes e caminhos livres).</li><li>Mapa consultável após exploração.</li></ul> | **Must Have** | Requisito primário do projeto: resolver o labirinto, e não apenas percorrê-lo sem estratégia. |
| **US04** | Eu como operador,<br>Gostaria de que o robô detecte quando chegou à sala central,<br>Para encerrar a busca e marcar o desafio como concluído. | <ul><li>O firmware deve identificar a configuração de destino (sala central).</li><li>Parar e sinalizar o fim.</li></ul> | **Must Have** | Condição de vitória do sistema; o robô precisa reconhecer o cumprimento do objetivo. |
| **US05** | Eu como operador,<br>Gostaria de que o robô resolva os três tamanhos de labirinto (4x4, 8x8 e 16x16),<br>Para garantir adaptação de escala. | <ul><li>Algoritmo com alocação dinâmica para 4x4, 8x8 e 16x16.</li></ul> | **Must Have** | Requisito da entrega final, que prevê a validação do robô nos três tamanhos. |
| **US06** | Eu como juiz da prova,<br>Gostaria de que o firmware ignore comandos externos de direção após a largada,<br>Para validar a eficácia 100% autônoma do robô. | <ul><li>Percurso do início ao fim sem aceitar inputs de controle manual.</li></ul> | **Must Have** | A intervenção manual descaracteriza a proposta autônoma do firmware e invalida a prova. |
| **US07** | Eu como operador,<br>Gostaria de que o robô corrija a trajetória continuamente (via controle PID),<br>Para navegar de forma centralizada e não bater. | <ul><li>Loop de controle deve corrigir o alinhamento com base na leitura lateral antes de tocar nas paredes.</li></ul> | **Should Have** | Embora um controle bang-bang simples ainda viabilize a navegação mínima, o controle PID melhora a estabilidade e reduz o risco de penalidade por colisão. |

### 2. Firmware: Telemetria

| ID | História de Usuário | Critérios de Aceitação | MoSCoW | Justificativa |
|---|---|---|---|---|
| **US08** | Eu como operador,<br>Gostaria de que o firmware envie em tempo real dados primários (trajeto, tempo, status),<br>Para alimentar o sistema web. | <ul><li>Transmissão sem fio contínua.</li><li>Atraso mínimo de envio (delay).</li></ul> | **Must Have** | Integração indispensável da arquitetura, pois constitui a ponte entre firmware e sistema web. |
| **US09** | Eu como operador,<br>Gostaria de que o firmware envie o consumo de bateria e a velocidade média em tempo real,<br>Para monitorar a integridade. | <ul><li>Ler tensão e converter em %.</li><li>Calcular velocidade média.</li></ul> | **Must Have** | Bateria e velocidade média constam explicitamente entre os seis campos obrigatórios de telemetria definidos no enunciado do projeto. Sua ausência inviabiliza o atendimento ao RNF-11 e ao CT-26. |

### 3. Sistema Web: Tempo Real

| ID | História de Usuário | Critérios de Aceitação | MoSCoW | Justificativa |
|---|---|---|---|---|
| **US10** | Eu como operador,<br>Gostaria de visualizar na interface web o trajeto e o labirinto em tempo real,<br>Para acompanhar a evolução. | <ul><li>Renderizar grid/mapa que se preenche com a telemetria.</li><li>Incluir exibição do tipo de labirinto (4x4, 8x8 e 16x16).</li></ul> | **Must Have** | Constitui o propósito central da interface web como dashboard operacional. |
| **US11** | Eu como operador,<br>Gostaria de ver no painel o tempo de conclusão e a notificação se o desafio foi cumprido,<br>Para ter o resultado imediato. | <ul><li>Painel com cronômetro e indicador de Sucesso.</li></ul> | **Must Have** | Sem esses campos, não há como atestar digitalmente o sucesso e a performance da corrida. |
| **US12** | Eu como operador,<br>Gostaria de monitorar indicadores de velocidade média e o nível de bateria na tela,<br>Para prever pausas para recarga. | <ul><li>Velocidade média e bateria visíveis em tempo real no painel, sem necessidade de rolagem.</li><li>Atualização dinâmica conforme a telemetria chega.</li></ul> | **Must Have** | O enunciado exige a exibição dos seis campos de telemetria, incluindo bateria e velocidade média, conforme RNF-11. A escolha do formato visual (gráfico ou numérico) é livre, mas a presença dos campos é obrigatória. |

### 4. Sistema Web: Banco de Dados

| ID | História de Usuário | Critérios de Aceitação | MoSCoW | Justificativa |
|---|---|---|---|---|
| **US13** | Eu como operador,<br>Gostaria de que os dados finais de cada corrida sejam salvos automaticamente no banco ao término,<br>Para consulta do histórico. | <ul><li>Criar registro (Log) no banco.</li><li>Dados devem persistir após reinício.</li></ul> | **Must Have** | Fundamental para a camada de persistência da arquitetura, validando o requisito de banco de dados. |
| **US14** | Eu como operador,<br>Gostaria de poder filtrar os dados consolidados do histórico por tipo de labirinto (4x4, 8x8, 16x16) ou visualizar todos,<br>Para analisar o desempenho em diferentes cenários. | <ul><li>Interface deve permitir a seleção de filtros por tamanho.</li><li>A listagem deve atualizar conforme o filtro selecionado.</li></ul> | **Must Have** | O enunciado exige "consulta por labirinto ou todos"; sem o filtro por dimensão, esse critério não é atendido. Coberto pelos casos de uso UC06/UC07 e validado pelos CT-22, CT-23 e CT-28. |

### 5. Funcionalidades Adicionais

As histórias a seguir não derivam diretamente do enunciado, mas foram incluídas no backlog por agregarem valor relevante ao operador e à apresentação final. Por ultrapassarem o escopo mínimo, recebem prioridade *Should* ou *Could*, sendo entregues apenas após o cumprimento integral dos itens *Must Have*.

| ID | História de Usuário | Critérios de Aceitação | MoSCoW | Justificativa |
|---|---|---|---|---|
| **US15** | Eu como operador,<br>Gostaria de ver um ranking das melhores corridas (menor tempo) por tamanho de labirinto,<br>Para identificar a evolução do desempenho do robô ao longo dos testes. | <ul><li>Cada labirinto (4x4, 8x8, 16x16) exibe um Top 5 ordenado por tempo de conclusão.</li><li>Apenas corridas com `desafio_cumprido = S` aparecem no ranking.</li><li>Atualização automática ao chegar nova corrida concluída.</li></ul> | **Could Have** | Agrega valor analítico aos dados já persistidos pela US13, sem alterar o esquema do banco. O filtro de US14 já permite ordenação manual, de modo que o ranking pode ser cortado sem comprometer a entrega. |
| **US16** | Eu como operador,<br>Gostaria de exportar o histórico de corridas em formato CSV,<br>Para realizar análises externas (planilhas, gráficos no relatório). | <ul><li>Botão "Exportar CSV" na tela de histórico.</li><li>Arquivo gerado contém todos os campos do resumo (RNF-06): tempo total, trajeto, velocidade média, bateria, status, tipo de labirinto e data_hora.</li><li>Respeita o filtro de labirinto ativo no momento da exportação.</li></ul> | **Could Have** | Útil para a redação do relatório final e do Ponto de Controle 2, mas não é exigido pelo enunciado e não bloqueia a apresentação. |
| **US17** | Eu como operador,<br>Gostaria de reproduzir visualmente o trajeto de uma corrida salva (replay),<br>Para revisar decisões do algoritmo após a corrida. | <ul><li>Selecionar uma corrida no histórico abre uma tela de replay.</li><li>O replay anima o trajeto célula a célula, com controles de play, pause e velocidade.</li><li>Usa o trajeto persistido em RNF-06 como fonte de dados.</li></ul> | **Could Have** | Recurso de depuração e apresentação que reaproveita dados existentes. Possui alto valor demonstrativo, embora exija esforço de interface considerável e não conste no enunciado. |
| **US18** | Eu como operador,<br>Gostaria de ver no canto do dashboard um indicador da qualidade da conexão WebSocket (latência atual e status),<br>Para identificar rapidamente quedas ou degradação durante a corrida. | <ul><li>Indicador visível em todas as telas do dashboard.</li><li>Mostra três estados: conectado, reconectando e desconectado.</li><li>Exibe latência média dos últimos 10 pacotes (ms).</li><li>Aciona alerta visual quando a latência excede o limite do RNF-01 (500 ms).</li></ul> | **Should Have** | Diretamente associado ao cenário do CT-30 (reconexão WebSocket) e ao RNF-01 (latência). Sem esse feedback, o operador detecta a perda de telemetria apenas quando os dados deixam de atualizar. Importante, ainda que não obrigatório pelo enunciado. |
