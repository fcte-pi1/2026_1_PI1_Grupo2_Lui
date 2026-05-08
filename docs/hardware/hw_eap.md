# EAP - Núcleo de Eletrônica (hardware)

## Introdução

Este documento apresenta a Estrutura Analítica de Projeto (EAP) do núcleo de Eletrônica para o desenvolvimento de um Micromouse, no âmbito da disciplina de Projeto Integrador 1 (2026/1). O desafio do projeto consiste em construir um robô capaz de explorar e solucionar labirintos de forma totalmente autônoma. Como é expressamente proibido o uso de robôs ou soluções prontas do mercado, a equipe de eletrônica é responsável por desenvolver o hardware autoral do projeto. Esse sistema deve respeitar as restrições físicas da competição (como o limite máximo de 25 cm de largura ou comprimento) e integrar todo o processamento, sensoriamento e comunicação necessários para a navegação autônoma e para o envio da telemetria. A EAP a seguir organiza e detalha os pacotes de trabalho exigidos para a concepção, montagem e validação técnica destes componentes.

## 

1. Projeto e Arquitetura de Hardware
    
    1.1. Design Customizado: Desenvolvimento do sistema eletrônico próprio pelo grupo, sendo expressamente proibido o uso de soluções prontas do mercado.

    1.2. Documentação Técnica: Geração dos arquivos de projeto exigidos.
        
        1.2.1. Esquemáticos dos circuitos
        1.2.2. Simulações dos circuitos
    
    1.3. Restrições Dimensionais: O design da placa e a montagem dos componentes eletrônicos devem respeitar o limite máximo do robô, que não pode exceder 25 centímetros de comprimento ou 
    largura (sem restrição de altura).

2. Sistema de Processamento e Controle

    2.1. Navegação Autônoma: Hardware central (microcontrolador/processador) capacitado para resolver o labirinto de forma autônoma, sem nenhuma intervenção humana durante a corrida.

    2.2. Gerenciamento de Memória: Estrutura eletrônica capaz de armazenar dados do labirinto sem necessidade de alteração de código ou memória via cabo durante a resolução do trajeto.

3. Sistema de Sensoriamento
    
    3.1. Detecção de Paredes e Mapeamento: Sensores integrados que permitam ao micromouse identificar as paredes brancas (de 5 cm de altura) e obstáculos do labirinto para compor o mapeamento.
    
    3.2. Odometria e Localização: Sensores dedicados a monitorar a localização do robô em tempo real e fornecer dados para o cálculo de sua velocidade média.
    
    3.3. Detecção de Objetivo: Sensores capazes de detectar quando o robô alcança a sala retangular alvo geralmente no centro do labirinto.

4. Sistema de Atuação e Locomoção
    
    4.1. Controle de Motores: Hardware de controle de tração.
    
    4.2. Restrições de Propulsão: Garantir que os atuadores obedeçam às regras, não permitindo voar, pular, escalar, nem utilizar propulsão por combustão ou foguete.
    
    4.3. Restrição de Danos: Os atuadores não devem causar arranhões ou danos ao chão preto e às paredes do labirinto.

5. Sistema de Alimentação e Telemetria de Energia
    
    5.1. Monitoramento de Bateria: Circuito dedicado à leitura da carga da bateria, já que o consumo de bateria é um dado obrigatório na telemetria.
    
    5.2. Otimização Energética: Foco na eficiência elétrica, visto que o "Consumo Energético" do robô é um critério de avaliação direto do 2º ponto de controle.

6. Sistema de Comunicação (Telemetria)
    
    6.1. Transmissão de Dados: Integração de módulo de comunicação sem fio (dedução técnica) para enviar dados de telemetria em tempo real para um sistema web.
  
    6.2. Dados Trafegados: O hardware de comunicação deve ser capaz de reportar continuamente o tipo de labirinto, trajeto, consumo, velocidade, tempo e se o desafio foi cumprido.

7. Validação, Testes e Manutenção
    
    7.1. Validação de Ponto de Controle (PC2): Planejamento de execução dos Testes de Verificação e Validação específicos para o Hardware e Consumo Energético.
  
    7.2. Hardware de Teste e Reparo: A eletrônica deve ser robusta para a inspeção prévia de funcionamento completo e permitir pequenos reparos rápidos (como limpeza ou reinício) enquanto o robô estiver em repouso.