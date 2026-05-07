# Diagrama de Estados

<!-- 

Estudo inicial dos estados do sistema

- Estado inicial: 
    - Descoberta: inicialização, software veriifica se tudo está bem definido, se os sensores estão comunicando corretamente e inicia o algoritmo de busca.
        - Exame de sensores para seguir em frente, virar para esquerda ou para a direita
        - Caso faça uma rota falha ele retorna ao último ponto de transição válido
        - Robô envia rota calculada em tempo real junto aos dados da bateria e sensores
        - Interface frontend grava os dados e apresenta de maneira depurada
    - Caminho para o centro do labirinto:  Software inicializa, verifica os sensores e começa a fazer a rota mais curta encontrada para o centro do labirinto.
        - É calculada a rota mais curta de acordo com o caminho seguido anteriormente
        - Robô inicia rota pré calculada para o centro do labirinto
        - Caso o Robô erre o caminho deve ser feito o refazer o calculo de rota e talvez o mapeamento novamente

- Estado final:
    - Sucesso: Robô encontra o centro do labirinto e salva a rota mais rápida
    - Falha por comunicação: Robô encontra falha na comunicação entre os sensores ou o computador para envio de dados.
    - Falha Física: Robô fica preso em alguma parte do sistema e não consegue sair sozinho
    - Falha Algoritmica: Robô não faz o melhor caminho definido pelo algoritmo de busca -->


# 1. Estados Iniciais (Setup e Validação)

- **Boot e Inicialização do Sistema:** O microcontrolador é energizado e o software embarcado entra em execução.
- **Verificação de Periféricos:** O sistema realiza uma checagem de integridade para garantir que os sensores de distância, motores e comunicação sem fios estão a responder corretamente antes de iniciar qualquer movimento.

# 2. Modos de Operação (Estados Principais)

## 2.1. Modo de Descoberta (Mapeamento do Labirinto)

- **Execução do Algoritmo de Busca:** O robô inicia a exploração de células desconhecidas.
- **Leitura Contínua de Sensores:** Em cada célula, o robô examina os arredores para decidir a próxima ação (seguir em frente, virar à esquerda ou virar à direita).
- **Recuperação de Beco Sem Saída:** Caso o robô identifique uma rota falha (beco), executa um retorno e volta ao último ponto de bifurcação/transição válido.
- **Transmissão de Telemetria:** Paralelamente à navegação, o robô envia em tempo real os dados da rota calculada, estado da bateria e leituras dos sensores.
- **Registo no Frontend:** A interface recebe, processa e apresenta os dados de maneira depurada para a equipe acompanhar o mapeamento.

## 2.2. Modo de Rota Otimizada (Caminho para o Centro)

- **Cálculo do Caminho Mais Curto:** Com base no mapa gerado no modo de descoberta, o algoritmo processa e define a rota mais rápida e eficiente da origem até ao centro.
- **Execução da Corrida:** O robô inicia a movimentação seguindo estritamente a rota pré-calculada, otimizando a velocidade.
- **Recálculo de Rota (Recuperação):** Caso os sensores detetem que o robô se desviou do caminho ou errou uma curva, a movimentação é interrompida para refazer o cálculo da rota ou, se necessário, reativar o mapeamento.

## 2.3 Controle Manual

- **Desligamento remoto:** Caso necessário, equipe pode desligar o robô remotamente através do frontend

# 3. Estados Finais (Fim de Execução)

- **Sucesso:** O robô encontra o centro do labirinto, salva a rota mais rápida na sua memória e encerra a rotina de busca de forma segura.
- **Falha por Comunicação:** O sistema entra em estado de paragem segura após detetar a perda prolongada de comunicação entre os sensores e o microcontrolador, ou a perda de ligação de dados com o computador base.
- **Falha Física:** O software identifica um travamento mecânico e corta a força para evitar danos no chassis.
- **Sistema frontend:** O sistema Frontend fornece um resumo de tudo que ocorreu durante a operação, não importando sucesso ou fracasso.