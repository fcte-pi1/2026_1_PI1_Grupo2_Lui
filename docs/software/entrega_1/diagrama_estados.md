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


