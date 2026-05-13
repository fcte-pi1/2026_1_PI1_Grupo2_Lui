# Visão Geral do Software

O software do projeto Micromouse tem por finalidade viabilizar a navegação autônoma do robô em labirintos desconhecidos e, simultaneamente, transmitir dados de telemetria a uma interface web destinada ao acompanhamento em tempo real. O sistema também consolida o histórico das corridas, permitindo a consulta posterior dos resultados para fins de análise e avaliação.

A solução estrutura-se em quatro componentes integrados, cujas responsabilidades e tecnologias estão sintetizadas no quadro a seguir.

| Componente     | Tecnologia             | Responsabilidade                                                                       |
| -------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| Firmware       | ESP32, C/C++           | Leitura de sensores, controle dos motores, navegação, mapeamento e envio de telemetria |
| Backend        | Python, FastAPI        | Recepção, validação e retransmissão dos dados em tempo real                            |
| Frontend       | HTML5, CSS3 e JavaScript ES6+ | Exibição da corrida, indicadores e histórico                                    |
| Banco de dados | SQLite                 | Armazenamento local dos resumos finais das corridas                                    |

O fluxo principal do sistema pode ser representado de forma compacta como:

```text
ESP32 → FastAPI/WebSocket → Dashboard
FastAPI → SQLite (resumo final da corrida)
```

As escolhas tecnológicas decorrem das restrições definidas no projeto, em particular a adoção de tecnologias locais, a ausência de dependência de serviços em nuvem, a dispensa de processos de build no frontend e a comunicação restrita à rede local.

---

# Estrutura do Projeto de Software

## Objetivo da EAP

A Estrutura Analítica do Projeto (EAP) organiza o trabalho de software do Micromouse em pacotes menores, viabilizando o planejamento, a distribuição de responsabilidades, o acompanhamento do progresso e a validação das entregas.

## Produto, serviço e projeto

A delimitação do escopo distingue o produto entregue, o serviço prestado e o esforço temporário de desenvolvimento, conforme consolidado na tabela a seguir.

| Item    | Definição                                                                                               |
| ------- | ------------------------------------------------------------------------------------------------------- |
| Produto | Firmware, backend, frontend e banco de dados que apoiam o funcionamento e o monitoramento do Micromouse |
| Serviço | Monitoramento da corrida em tempo real e consulta ao histórico de resultados                            |
| Projeto | Esforço temporário do grupo para especificar, desenvolver, testar, integrar e documentar o software     |

## Abordagem de gerenciamento

Adota-se uma abordagem híbrida. As atividades de engenharia de requisitos, arquitetura, testes e documentação seguem uma lógica predominantemente tradicional, dada a necessidade de registro e rastreabilidade. Em contrapartida, o desenvolvimento de firmware, backend e frontend é conduzido em ciclos incrementais, o que permite ajustes contínuos à medida que os testes com o robô e as integrações entre os componentes evoluem.

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
       - Histórias de usuário (US01–US18)
       - Requisitos funcionais (RF-01–RF-18) e não-funcionais (RNF-01–RNF-12)
       - Critérios de aceite
       - Backlog priorizado pelo método MoSCoW

   1.3 Modelagem e arquitetura
       - Diagrama de Atividades
       - Diagrama de Casos de Uso (UC01–UC08)
       - Diagrama de Estados
       - Diagrama de Arquitetura
       - Diagrama Entidade-Relacionamento (DER)
       - Interfaces entre firmware, backend e frontend

   1.4 Firmware embarcado
       - Leitura de sensores
       - Controle dos motores
       - Mapeamento do labirinto
       - Navegação com algoritmo Flood Fill
       - Envio de telemetria

   1.5 Backend e comunicação
       - Servidor FastAPI
       - Comunicação WebSocket
       - Validação dos pacotes de telemetria
       - Retransmissão dos dados ao dashboard
       - API REST de consulta ao histórico

   1.6 Banco de dados
       - Modelo de dados (entidade corrida)
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
       - Testes funcionais (CT-01–CT-30)
       - Testes não-funcionais (CT-31–CT-41)
       - Testes de funcionalidades adicionais (CT-42–CT-44)
       - Conformidade com o Tema PI1 (CT-45)
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

O dicionário consolida, para cada pacote da EAP, a entrega principal associada e o respectivo critério de conclusão, assegurando a rastreabilidade entre o planejamento e a execução.

| Pacote                      | Entrega principal             | Critério de conclusão                                 |
| --------------------------- | ----------------------------- | ----------------------------------------------------- |
| 1.1 Gestão e documentação   | Projeto planejado             | Escopo, responsáveis, cronograma e riscos registrados |
| 1.2 Requisitos              | Backlog validado              | Histórias, critérios de aceite e RNFs documentados    |
| 1.3 Modelagem e arquitetura | Visão do sistema              | Diagramas e interfaces concluídos                     |
| 1.4 Firmware                | Controle do robô              | Sensores, motores, navegação e telemetria funcionando |
| 1.5 Backend                 | Servidor de telemetria        | Dados recebidos, validados e retransmitidos           |
| 1.6 Banco de dados          | Histórico de corridas         | Resumos finais de corridas persistidos corretamente   |
| 1.7 Frontend                | Dashboard                     | Corrida exibida em tempo real                         |
| 1.8 Integração              | Fluxo completo                | Componentes comunicando corretamente                  |
| 1.9 Testes                  | Qualidade verificada          | Casos executados e evidências registradas             |
| 1.10 Entrega                | Sistema pronto para avaliação | Código, documentação e demonstração finalizados      |

---

## Riscos principais

A matriz de riscos consolida as principais ameaças identificadas no projeto e as estratégias de mitigação correspondentes, orientando ações preventivas ao longo do ciclo de desenvolvimento.

| Risco                                         | Mitigação                                                |
| --------------------------------------------- | --------------------------------------------------------- |
| Dificuldade de integrar firmware e telemetria | Prototipar o envio de dados desde o início                |
| Instabilidade na comunicação em tempo real    | Implementar reconexão e simulador de pacotes              |
| Dashboard depender do robô físico             | Utilizar dados simulados durante o desenvolvimento        |
| Dados inconsistentes no banco                 | Validar pacotes no backend antes da persistência          |
| Backlog maior que o tempo disponível          | Priorizar navegação, telemetria básica e dashboard mínimo |
| Diagramas ficarem desatualizados              | Revisar a documentação a cada mudança relevante           |

---

## Rastreabilidade

A rastreabilidade vincula os principais grupos de funcionalidade aos pacotes da EAP que os contemplam e aos casos de teste que validam sua implementação, conforme definido na matriz de testes funcionais.

| Item                            | Pacote da EAP      | Testes relacionados                              |
| ------------------------------- | ------------------ | ------------------------------------------------ |
| Navegação e mapeamento          | 1.4 Firmware       | CT-01 a CT-16, CT-45                             |
| Telemetria em tempo real        | 1.4, 1.5, 1.8      | CT-17 a CT-19, CT-25 a CT-27, CT-31, CT-32, CT-39 |
| Persistência e histórico        | 1.6 Banco de dados | CT-20 a CT-24, CT-28, CT-29, CT-35 a CT-37, CT-40 |
| Dashboard e qualidade da conexão | 1.7 Frontend       | CT-25 a CT-30, CT-38, CT-41                      |
| Ciclo de controle do firmware   | 1.4 Firmware       | CT-34                                            |
| Tempo de carregamento da web    | 1.7 Frontend       | CT-33                                            |
| Funcionalidades adicionais      | 1.5, 1.6, 1.7      | CT-42 a CT-44                                    |

---
