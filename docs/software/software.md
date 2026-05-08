# Visão Geral do Software

O software do Micromouse tem como objetivo permitir que o robô navegue autonomamente em labirintos desconhecidos e envie dados de telemetria para uma interface web de acompanhamento em tempo real. O sistema também registra o histórico das corridas, permitindo consulta posterior dos resultados.

A solução é composta por quatro partes principais:

| Componente     | Tecnologia             | Responsabilidade                                                                       |
| -------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| Firmware       | ESP32, C/C++           | Leitura de sensores, controle dos motores, navegação, mapeamento e envio de telemetria |
| Backend        | Python, FastAPI        | Recebimento, validação e retransmissão dos dados em tempo real                         |
| Frontend       | HTML, CSS e JavaScript | Exibição da corrida, indicadores e histórico                                           |
| Banco de dados | SQLite                 | Armazenamento local das corridas e registros de telemetria                             |

O fluxo principal do sistema é:

```text
ESP32 → FastAPI/WebSocket → Dashboard → SQLite
```

As escolhas tecnológicas seguem as restrições definidas no projeto: uso de tecnologias locais, ausência de dependência em nuvem, frontend sem frameworks de build e comunicação por rede local.

---

# Estrutura do Projeto de Software

## Objetivo da EAP

A EAP organiza o trabalho de software do projeto Micromouse em pacotes menores, facilitando o planejamento, a divisão de responsabilidades, o acompanhamento do progresso e a validação das entregas.

## Produto, serviço e projeto

| Item    | Definição                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------- |
| Produto | Firmware, backend, frontend e banco de dados que apoiam o funcionamento e o monitoramento do Micromouse |
| Serviço | Monitoramento da corrida em tempo real e consulta ao histórico de resultados                            |
| Projeto | Esforço temporário do grupo para especificar, desenvolver, testar, integrar e documentar o software     |

## Abordagem de gerenciamento

A abordagem adotada é híbrida. As atividades de requisitos, arquitetura, testes e documentação seguem uma lógica mais tradicional, pois exigem registro e rastreabilidade. Já o desenvolvimento de firmware, backend e frontend segue ciclos incrementais, permitindo ajustes conforme os testes com o robô e a integração entre os componentes evoluem.

---

## EAP resumida

```text
1. Software do Micromouse

   1.1 Gestão e documentação
       - Definição de escopo
       - Cronograma
       - Responsabilidades
       - Riscos
       - Registro de decisões técnicas

   1.2 Engenharia de requisitos
       - Problema e objetivos
       - Histórias de usuário
       - Requisitos funcionais e não funcionais
       - Critérios de aceite
       - Backlog priorizado

   1.3 Modelagem e arquitetura
       - BPMN
       - Casos de uso
       - Diagrama de estados
       - Arquitetura do sistema
       - DER
       - Interfaces entre firmware, backend e frontend

   1.4 Firmware embarcado
       - Leitura de sensores
       - Controle dos motores
       - Mapeamento do labirinto
       - Navegação com Flood Fill
       - Envio de telemetria

   1.5 Backend e comunicação
       - Servidor FastAPI
       - Comunicação WebSocket
       - Validação dos pacotes de telemetria
       - Retransmissão dos dados ao dashboard
       - API de consulta ao histórico

   1.6 Banco de dados
       - Modelo de dados
       - Configuração do SQLite
       - Persistência das corridas
       - Consulta do histórico

   1.7 Frontend e dashboard
       - Interface de monitoramento
       - Mapa em tempo real
       - Indicadores de bateria, velocidade e tempo
       - Status da corrida
       - Histórico de resultados

   1.8 Integração
       - Integração firmware-backend
       - Integração backend-frontend
       - Integração backend-banco
       - Validação do fluxo completo

   1.9 Testes e validação
       - Testes funcionais
       - Testes de integração
       - Testes de sistema
       - Testes de latência e persistência
       - Registro de evidências

   1.10 Entrega
       - Código revisado
       - Documentação atualizada
       - Relatório técnico
       - Demonstração
       - Lições aprendidas
```

---

## Dicionário resumido da EAP

| Pacote                      | Entrega principal             | Critério de conclusão                                 |
| --------------------------- | ----------------------------- | ----------------------------------------------------- |
| 1.1 Gestão e documentação   | Projeto planejado             | Escopo, responsáveis, cronograma e riscos registrados |
| 1.2 Requisitos              | Backlog validado              | Histórias, critérios de aceite e RNFs documentados    |
| 1.3 Modelagem e arquitetura | Visão do sistema              | Diagramas e interfaces concluídos                     |
| 1.4 Firmware                | Controle do robô              | Sensores, motores, navegação e telemetria funcionando |
| 1.5 Backend                 | Servidor de telemetria        | Dados recebidos, validados e retransmitidos           |
| 1.6 Banco de dados          | Histórico de corridas         | Corridas e telemetrias persistidas corretamente       |
| 1.7 Frontend                | Dashboard                     | Corrida exibida em tempo real                         |
| 1.8 Integração              | Fluxo completo                | Componentes comunicando corretamente                  |
| 1.9 Testes                  | Qualidade verificada          | Casos executados e evidências registradas             |
| 1.10 Entrega                | Sistema pronto para avaliação | Código, documentação e demonstração finalizados       |

---

## Riscos principais

| Risco                                         |                                         |
| --------------------------------------------- | --------------------------------------------------------- |
| Dificuldade de integrar firmware e telemetria | Prototipar o envio de dados desde o início                |
| Instabilidade na comunicação em tempo real    | Implementar reconexão e simulador de pacotes              |
| Dashboard depender do robô físico             | Usar dados simulados durante o desenvolvimento            |
| Dados inconsistentes no banco                 | Validar pacotes no backend antes da persistência          |
| Backlog maior que o tempo disponível          | Priorizar navegação, telemetria básica e dashboard mínimo |
| Diagramas ficarem desatualizados              | Revisar a documentação a cada mudança relevante           |

---

## Rastreabilidade

| Item                   | Pacote da EAP      | Testes relacionados                |
| ---------------------- | ------------------ | ---------------------------------- |
| Navegação              | 1.4 Firmware       | CT-01 a CT-16                      |
| Telemetria             | 1.4, 1.5, 1.8      | CT-17 a CT-19                      |
| Persistência           | 1.6 Banco de dados | CT-20 a CT-24                      |
| Dashboard              | 1.7 Frontend       | CT-25 a CT-30                      |
| Latência e atualização | 1.5, 1.7, 1.9      | Testes de latência                 |
| Integridade dos dados  | 1.5, 1.6           | Testes de validação e persistência |

---
