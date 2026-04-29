# Histórias de Usuário

Este documento consolida as Histórias de Usuário (US) do projeto.

## Lista de US (Entrega 1)
- **US: Definição da Arquitetura e Persistência** (#31)
- **US: Planejamento de Testes Funcionais** (#29)
- **US: Prototipagem e Comportamento do Software** (#27)
- **US: Backlog Funcional (MoSCoW)** (#35, #42)
- **US: Mapeamento de Processos e Fluxos** (#23)

---

## Backlog Funcional de Software

Abaixo estão listadas as funcionalidades do sistema mapeadas em formato de Histórias de Usuário, priorizadas e justificadas através do método **MoSCoW**, detalhadas com Critérios de Aceite para garantir a testabilidade.

### 1. Firmware Navegação

| ID | História de Usuário | Critérios de Aceitação | MoSCoW | Justificativa |
|---|---|---|---|---|
| **US01** | Como operador, quero que o robô monitore sua própria localização dentro do labirinto, para calcular a posição atual e auxiliar na tomada de decisões. | <ul><li>O robô deve manter um registro de coordenadas (X,Y) ou matriz atualizado.</li><li>A posição deve mudar dinamicamente.</li><li>Iniciar a lógica assumindo 3 paredes na casa inicial.</li></ul> | **Must Have** | Fundamental para a consciência espacial do robô; sem isso, a navegação autônoma é inviável (core do MVP). |
| **US02** | Como operador, quero que o robô descubra paredes à medida que explora, para alimentar o algoritmo e evitar colisões. | <ul><li>Sensores devem detectar obstáculos.</li><li>O firmware deve barrar comandos de avanço na direção de paredes.</li></ul> | **Must Have** | Essencial para o mapeamento e segurança física; o algoritmo de labirinto depende da identificação de barreiras. |
| **US03** | Como operador, quero que o robô mapeie o labirinto durante o percurso, para encontrar e salvar o caminho mais eficiente. | <ul><li>Gravar o mapa na memória (paredes e caminhos livres).</li><li>Mapa consultável após exploração.</li></ul> | **Must Have** | Requisito primário da competição/projeto (resolver o labirinto e não apenas andar a esmo). |
| **US04** | Como operador, quero que o robô detecte quando chegou à sala central, para encerrar a busca e marcar o desafio como concluído. | <ul><li>O firmware deve identificar a configuração de destino (sala central).</li><li>Parar e sinalizar o fim.</li></ul> | **Must Have** | Condição de vitória do sistema; o robô precisa saber quando o objetivo foi atingido. |
| **US05** | Como operador, quero que o robô resolva os três tamanhos de labirinto (4x4, 8x8 e 16x16), para garantir adaptação de escala. | <ul><li>Algoritmo com alocação dinâmica para 4x4, 8x8 e 16x16.</li></ul> | **Should Have** | Importante para a entrega final, mas o MVP (Minimum Viable Product) pode rodar apenas no 4x4 inicialmente para validar a viabilidade da arquitetura. |
| **US06** | Como juiz da prova, quero que o firmware ignore comandos externos de direção após a largada, para validar a eficácia 100% autônoma do robô. | <ul><li>Percurso do início ao fim sem aceitar inputs de controle manual.</li></ul> | **Must Have** | A intervenção manual desclassifica e descaracteriza a proposta inteligente do firmware. |
| **US07** | Como operador, quero que o robô corrigija trajetória continuamente (via controle PID), para navegar de forma centralizada e não bater. | <ul><li>Loop de controle deve corrigir o alinhamento com base na leitura lateral antes de tocar nas paredes.</li></ul> | **Must Have** | Restrição física onde danificar as paredes pode causar penalidades. |

### 2. Firmware Telemetria

| ID | História de Usuário | Critérios de Aceitação | MoSCoW | Justificativa |
|---|---|---|---|---|
| **US08** | Como operador, quero que o firmware envie em tempo real dados primários (trajeto, tempo, status), para alimentar o sistema web. | <ul><li>Transmissão sem fio contínua.</li><li>Atraso mínimo de envio (delay).</li></ul> | **Must Have** | Integração indispensável da arquitetura (ponte Firmware <-> Software). A web depende disso. |
| **US09** | Como operador, quero que o firmware envie o consumo de bateria e a velocidade média em tempo real, para monitorar a integridade. | <ul><li>Ler tensão e converter em %</li><li>Calcular velocidade média.</li></ul> | **Must Have** | Agrega alto valor de monitoramento, mas o sistema base de resolução do labirinto funciona sem esses dados específicos. |

### 3. Sistema Web Tempo Real

| ID | História de Usuário | Critérios de Aceitação | MoSCoW | Justificativa |
|---|---|---|---|---|
| **US10** | Como operador, quero visualizar na interface web o trajeto e o labirinto em tempo real, para acompanhar a evolução. | <ul><li>Renderizar grid/mapa que se preenche com a telemetria.</li></ul> | **Must Have** | É o propósito central da interface web (Dashboard de operação). |
| **US11** | Como operador, quero ver no painel o tempo de conclusão e a notificação se o desafio foi cumprido, para ter o resultado imediato. | <ul><li>Painel com cronômetro e indicador de Sucesso.</li></ul> | **Must Have** | Sem isso, não há como atestar digitalmente o sucesso e a performance da corrida. |
| **US12** | Como operador, quero monitorar indicadores de velocidade média e o nível de bateria na tela, para prever pausas para recarga. | <ul><li>Exibir gráficos ou barras atualizadas dinamicamente.</li></ul> | **Must Have** | Interessa ter se o cronograma permitir, mas não trava o uso básico. |

### 4. Sistema Web Banco de Dados

| ID | História de Usuário | Critérios de Aceitação | MoSCoW | Justificativa |
|---|---|---|---|---|
| **US13** | Como operador, quero que os dados finais de cada corrida sejam salvos automaticamente no banco ao término, para consulta do histórico. | <ul><li>Criar registro (Log) no banco.</li><li>Dados devem persistir após reinício.</li></ul> | **Must Have** | Fundamental para a camada de persistência da arquitetura, validando o requisito de banco de dados. |
| **US14** | Como operador, quero poder filtrar os dados consolidados do histórico por tipo de labirinto (4x4, 8x8, 16x16) ou visualizar todos, para analisar o desempenho em diferentes cenários. | <ul><li>Interface deve permitir a seleção de filtros por tamanho. A listagem deve atualizar conforme o filtro selecionado.</li></ul> | **Must Have** | Essencial para a análise comparativa de desempenho. Como a complexidade varia entre os mapas, a filtragem impede a distorção das métricas agrupando dados de mesma escala. |