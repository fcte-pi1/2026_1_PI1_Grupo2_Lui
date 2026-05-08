
# Roteiro de Testes Funcionais — Micromouse

<!--
  SOBRE ESTE ROTEIRO
  ==================
  Os testes estão divididos em cinco partes:

  1. Unitários  — Testa cada peça sozinha (sensor, motor, encoder).
  2. Integrados — Testa as peças funcionando juntas e a lógica do Flood Fill.
  3. De Sistema — Testa o robô resolvendo o labirinto de verdade, em duas fases:
       Fase 1 (Exploração): O robô anda devagar, descobre as paredes e monta um mapa.
       Fase 2 (Corrida):    Com o mapa pronto, o robô refaz o caminho mais curto em velocidade máxima.
  4. De Servidor (Backend) — Recepção de telemetria, retransmissão WebSocket e persistência.
  5. De Dashboard (Frontend) — Conexão WebSocket, exibição de telemetria e consulta de histórico.

  Seguir sempre a parede direita NÃO funciona em labirintos de competição
  porque existem "ilhas" de paredes que fazem o robô andar em círculos.
  Por isso usamos o Flood Fill.
-->

---

## Testes Unitários

<!--
  Cada teste aqui verifica uma peça por vez, separada do resto.
  Se o sensor ou o motor não funcionar sozinho, não adianta testar o robô inteiro.
-->

### CT-01 — Detecção Frontal

| Atributo | Descrição |
|---|---|
| **Objetivo** | Diferenciar parede próxima (< 5 cm) de ausência. |
| **Pré-condições** | Robô ligado; Serial Monitor aberto. |
| **Procedimentos** | 1. Aproximar mão (3 cm).<br>2. Anotar valor no Serial.<br>3. Afastar mão (10 cm). |
| **Resultado Esperado** | Mudança clara de valor entre os cenários (Alto vs. Baixo). |
| **Reparo** | Ajustar valor de referência de detecção no código. |
| **Pós-Reparo** | Confirmar diferença de valores nos dois cenários. |

### CT-02 — Detecção Lateral

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar sensores laterais sem interferência mútua. |
| **Pré-condições** | CT-01 aprovado; sensores laterais ativos. |
| **Procedimentos** | 1. Aproximar mão lateral esquerda.<br>2. Verificar se sensor direito não muda.<br>3. Repetir para o lado direito. |
| **Resultado Esperado** | Detecção independente por sensor, sem interferência cruzada. |
| **Reparo** | Verificar pinagem no código ou realinhar sensores fisicamente. |
| **Pós-Reparo** | Confirmar independência das leituras laterais. |

### CT-03 — Sentido dos Motores

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar comandos de Frente e Ré isolados. |
| **Pré-condições** | Rodas suspensas; bateria carregada. |
| **Procedimentos** | 1. Testar Frente (Esq/Dir).<br>2. Testar Ré (Esq/Dir).<br>3. Observar direção de rotação. |
| **Resultado Esperado** | Rotação correta conforme comando, sem travamentos. |
| **Reparo** | Inverter lógica no código ou corrigir fiação do motor. |
| **Pós-Reparo** | Validar todos os sentidos de rotação novamente. |

### CT-04 — Níveis de Potência

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar diferenciação de potência (30 %, 60 %, 100 %). |
| **Pré-condições** | CT-03 aprovado; rodas suspensas. |
| **Procedimentos** | 1. Testar Potência Baixa.<br>2. Testar Potência Média.<br>3. Testar Potência Máxima. |
| **Resultado Esperado** | Velocidade aumenta visivelmente a cada nível. |
| **Reparo** | Verificar tensão da fonte ou valor de PWM no código. |
| **Pós-Reparo** | Confirmar ganho de velocidade perceptível entre os três níveis. |

### CT-05 — Leitura de Encoder

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar contagem de pulsos em uma volta completa. |
| **Pré-condições** | Código ativo; Serial Monitor aberto. |
| **Procedimentos** | 1. Zerar contador.<br>2. Girar roda manualmente (1 volta completa).<br>3. Ler valor no Serial. |
| **Resultado Esperado** | Contagem igual ao valor especificado (variação máxima de ±1 pulso). |
| **Reparo** | Validar pino de leitura ou lógica de interrupção. |
| **Pós-Reparo** | Garantir contagem consistente em 3 voltas consecutivas. |

### CT-06 — Inicialização Geral

| Atributo | Descrição |
|---|---|
| **Objetivo** | Garantir boot limpo de todos os componentes. |
| **Pré-condições** | Robô montado; Serial Monitor aberto. |
| **Procedimentos** | 1. Ligar o robô.<br>2. Monitorar sequência de inicialização no Serial.<br>3. Aguardar estado de ociosidade. |
| **Resultado Esperado** | Boot sem erros; robô imóvel e pronto para uso. |
| **Reparo** | Identificar erro no Serial; checar pinagem e conexões. |
| **Pós-Reparo** | Confirmar sequência de boot estável em duas tentativas. |

---

## Testes de Integração

<!--
  Aqui as peças são testadas funcionando juntas.
  CT-07: Parada de Segurança — interação entre sensor frontal e motor.
  CT-08 a CT-12: O robô anda, faz curvas e para — motores e sensores cooperando.
  CT-13: O robô guarda no mapa onde tem parede e onde não tem.
  CT-14: O Flood Fill funciona assim:
    - O centro do labirinto recebe o valor 0 (é o destino).
    - As células ao redor recebem 1, depois 2, 3... como uma enchente se espalhando.
    - O robô sempre anda para o vizinho com o número menor.
    - Se descobre uma parede nova, refaz a enchente e continua.
    - Com isso, ele sempre encontra o caminho mais curto que conhece até ali.
-->

### CT-07 — Parada de Segurança

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar reação ao sensor frontal durante movimento. |
| **Pré-condições** | CT-01 e CT-03 aprovados; parede posicionada a 30 cm. |
| **Procedimentos** | 1. Avançar o robô em direção à parede.<br>2. Observar ponto de frenagem. |
| **Resultado Esperado** | Parada completa sem colisão física. |
| **Reparo** | Aumentar a distância de segurança (threshold) no código. |
| **Pós-Reparo** | Validar parada segura em múltiplas distâncias. |

### CT-08 — Avanço de Célula

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar deslocamento via motor + encoder (1 célula). |
| **Pré-condições** | CT-03, CT-05 e CT-07 aprovados; corredor reto disponível. |
| **Procedimentos** | 1. Marcar posição inicial.<br>2. Comandar avanço de 1 célula.<br>3. Medir posição de parada. |
| **Resultado Esperado** | Parada precisa dentro da célula seguinte. |
| **Reparo** | Ajustar a conversão pulsos → cm no código. |
| **Pós-Reparo** | Validar 5 avanços consecutivos com precisão. |

### CT-09 — Trajetória Contínua

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar linearidade em múltiplas células. |
| **Pré-condições** | CT-08 aprovado; corredor reto com 4 células disponível. |
| **Procedimentos** | 1. Comandar avanço de 3 células seguidas.<br>2. Observar centralização ao final. |
| **Resultado Esperado** | Robô centralizado na 3ª célula, sem colisões laterais. |
| **Reparo** | Calibrar velocidades dos motores (trimpot ou software). |
| **Pós-Reparo** | Confirmar trajetória reta em percurso mais longo. |

### CT-10 — Correção de Rumo

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar alinhamento dinâmico via sensores laterais. |
| **Pré-condições** | CT-02 e CT-09 aprovados; corredor padrão disponível. |
| **Procedimentos** | 1. Posicionar robô desalinhado (≈ 10°).<br>2. Iniciar movimento e observar autocorreção. |
| **Resultado Esperado** | Robô alinha-se e percorre o eixo central sem tocar paredes. |
| **Reparo** | Revisar lógica de controle Proporcional (PID) lateral. |
| **Pós-Reparo** | Confirmar alinhamento partindo de diferentes ângulos. |

### CT-11 — Curvas de 90°

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar rotação angular precisa em ambas as direções. |
| **Pré-condições** | CT-08 aprovado; trecho com curva disponível. |
| **Procedimentos** | 1. Executar curva à esquerda.<br>2. Executar curva à direita.<br>3. Verificar alinhamento ao novo corredor. |
| **Resultado Esperado** | Robô finaliza rotação alinhado ao novo corredor. |
| **Reparo** | Ajustar constantes de tempo/delay de rotação. |
| **Pós-Reparo** | Confirmar alinhamento consistente em 3 ciclos. |

### CT-12 — Meia-Volta (180°)

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar detecção de beco sem saída e retorno. |
| **Pré-condições** | CT-07 e CT-11 aprovados; célula sem saída disponível. |
| **Procedimentos** | 1. Entrar no corredor cego.<br>2. Observar manobra de saída. |
| **Resultado Esperado** | Identificação do bloqueio + rotação 180° e saída limpa. |
| **Reparo** | Corrigir lógica condicional de sensores (Frente + Esq + Dir). |
| **Pós-Reparo** | Validar manobra sem colisões em beco sem saída. |

### CT-13 — Escrita de Mapa

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar se o robô salva corretamente as paredes na matriz de memória. |
| **Pré-condições** | CT-01 e CT-02 aprovados; robô em célula de teste; Serial Monitor aberto. |
| **Procedimentos** | 1. Posicionar robô em célula com paredes conhecidas (ex.: esq. e frente).<br>2. Ler os sensores.<br>3. Imprimir a matriz no Serial. |
| **Resultado Esperado** | A matriz reflete exatamente as paredes lidas (1 onde há parede, 0 onde não há). |
| **Reparo** | Revisar uso de índices (X, Y) ou manipulação de bits na gravação do array. |
| **Pós-Reparo** | Validar o mapeamento movendo o robô para 3 células diferentes. |

### CT-14 — Lógica Flood Fill

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar a atualização dos pesos numéricos para encontrar o centro. |
| **Pré-condições** | CT-13 aprovado; mapa inicializado com paredes via simulação em código. |
| **Procedimentos** | 1. Injetar labirinto simulado na memória.<br>2. Executar a função Flood Fill.<br>3. Verificar no Serial o próximo movimento escolhido. |
| **Resultado Esperado** | O algoritmo atribui pesos corretamente e escolhe a célula vizinha de menor valor. |
| **Reparo** | Corrigir lógica da fila ou cálculo de células adjacentes no código. |
| **Pós-Reparo** | O algoritmo deve traçar o caminho perfeito em mapa estático conhecido, verificado pelo Serial. |

---

## Testes de Sistema

<!--
  O robô resolve o labirinto em duas etapas:

  Fase 1 — Exploração (CT-15)
    O robô não sabe nada sobre o labirinto.
    Ele anda devagar, célula por célula, anotando onde tem parede.
    Usa o Flood Fill para escolher para onde ir.
    Cada vez que encontra uma parede nova, refaz a "enchente" de números.
    O importante aqui é chegar ao centro sem bater — pode ser lento.

  Fase 2 — Corrida (CT-16)
    Agora o robô já tem o mapa na memória.
    Ele calcula o caminho mais curto e percorre em velocidade máxima.
    É essa fase que vale na competição.

  Para o nosso projeto (PI1), o objetivo é:
    Fazer o Flood Fill básico funcionar, explorar o labirinto inteiro
    e depois tentar a corrida. A primeira vez vai ser devagar, e tá tudo bem.
-->

### CT-15 — Fase 1: Exploração

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar a navegação autônoma do início ao centro construindo o mapa. |
| **Pré-condições** | CT-08 a CT-14 aprovados; labirinto físico montado; robô posicionado na largada. |
| **Procedimentos** | 1. Ligar o robô no Modo Exploração.<br>2. Soltar o robô.<br>3. Acompanhar mapeamento e recálculos até o centro. |
| **Resultado Esperado** | Robô anda célula a célula, não colide, refaz o Flood Fill ao encontrar becos e para na célula central. |
| **Reparo** | Ajustar máquina de estados principal ou recalibrar constantes do PID. |
| **Pós-Reparo** | Robô deve chegar ao centro ao menos uma vez de forma autônoma, mesmo que lentamente. |

### CT-16 — Fase 2: Corrida

| Atributo | Descrição |
|---|---|
| **Objetivo** | Validar a execução do trajeto ótimo (caminho mais curto) com o mapa salvo. |
| **Pré-condições** | CT-15 concluído com sucesso (mapa completo na memória). |
| **Procedimentos** | 1. Posicionar robô de volta na largada.<br>2. Acionar Modo Corrida.<br>3. Observar o trajeto escolhido. |
| **Resultado Esperado** | Robô percorre o caminho mais curto de forma contínua e direta, ignorando becos mapeados. |
| **Reparo** | Ajustar leitura da matriz de caminhos para evitar re-exploração ou loop. |
| **Pós-Reparo** | Completar o percurso do início ao centro sem entrar em becos já conhecidos. |

---

## Testes de Servidor (Backend)

<!--
  Estes testes verificam o pool Servidor do BPMN: recepção de telemetria,
  retransmissão via WebSocket ao Dashboard e persistência no banco de dados.
  Nenhuma interação com o firmware real é necessária — os pacotes podem ser
  simulados via script ou ferramenta como Postman / curl.
-->

### CT-17 — Recepção de Telemetria

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se o servidor recebe corretamente um pacote de telemetria enviado pelo Micromouse. |
| **Pré-condições** | Servidor em execução; endpoint de recepção ativo. |
| **Procedimentos** | 1. Enviar pacote de telemetria simulado (posição, paredes, bateria, velocidade, timestamp).<br>2. Verificar log do servidor. |
| **Resultado Esperado** | Servidor registra o recebimento sem erro; todos os campos do pacote são identificados. |
| **Reparo** | Revisar parsing do pacote ou configuração do endpoint. |
| **Pós-Reparo** | Reenviar pacote e confirmar recepção completa. |

### CT-18 — Rejeição de Pacote Malformado

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se o servidor rejeita pacotes inválidos sem travar ou lançar exceção não tratada. |
| **Pré-condições** | Servidor em execução. |
| **Procedimentos** | 1. Enviar pacote com campos ausentes.<br>2. Enviar pacote com tipo de dado errado.<br>3. Enviar payload vazio. |
| **Resultado Esperado** | Servidor retorna erro apropriado (ex.: 400 Bad Request) e continua operando normalmente. |
| **Reparo** | Adicionar validação de schema na camada de recepção. |
| **Pós-Reparo** | Reenviar pacote malformado e confirmar que o servidor permanece estável. |

### CT-19 — Ordem: Retransmitir antes de Persistir

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se o servidor retransmite os dados ao Dashboard via WebSocket antes de gravá-los no banco. |
| **Pré-condições** | Servidor, Dashboard e banco de dados em execução; cliente WebSocket conectado. |
| **Procedimentos** | 1. Enviar pacote de telemetria com flag de conclusão.<br>2. Registrar timestamp de recebimento no Dashboard.<br>3. Registrar timestamp de inserção no banco. |
| **Resultado Esperado** | Dashboard recebe o dado antes (ou simultaneamente) que o banco registra a inserção — nunca depois. |
| **Reparo** | Revisar ordem de chamadas no handler do servidor (WebSocket primeiro, banco depois). |
| **Pós-Reparo** | Repetir o teste e comparar timestamps em 3 execuções. |

### CT-20 — Persistência ao Concluir Desafio

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se os dados são gravados no banco somente após o recebimento da flag de conclusão. |
| **Pré-condições** | Servidor e banco em execução. |
| **Procedimentos** | 1. Enviar sequência de pacotes sem flag de conclusão.<br>2. Consultar banco após cada envio.<br>3. Enviar pacote final com flag de conclusão.<br>4. Consultar banco novamente. |
| **Resultado Esperado** | Nenhum registro no banco nos passos 1–2; registro inserido somente após o passo 3. |
| **Reparo** | Verificar lógica do gateway "Desafio concluído?" no servidor. |
| **Pós-Reparo** | Repetir sequência e confirmar ausência de registro prematuro. |

### CT-21 — Corrida Interrompida Não Persiste

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se uma corrida encerrada sem flag de conclusão não gera registro no banco. |
| **Pré-condições** | Servidor e banco em execução. |
| **Procedimentos** | 1. Enviar pacotes de telemetria normalmente.<br>2. Encerrar conexão abruptamente (sem enviar flag de conclusão).<br>3. Consultar banco. |
| **Resultado Esperado** | Nenhum registro inserido para essa corrida. |
| **Reparo** | Adicionar tratamento de desconexão abrupta no servidor. |
| **Pós-Reparo** | Repetir interrupção e confirmar banco inalterado. |

### CT-22 — Consulta Filtrada por Labirinto

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se a API retorna corretamente os registros de um labirinto específico. |
| **Pré-condições** | Banco com registros de corridas nos três tipos de labirinto (4×4, 8×8, 16×16). |
| **Procedimentos** | 1. Chamar endpoint com filtro "4×4".<br>2. Chamar com filtro "8×8".<br>3. Chamar com filtro "16×16".<br>4. Verificar registros retornados em cada chamada. |
| **Resultado Esperado** | Cada chamada retorna apenas registros do tipo solicitado, sem misturar outros. |
| **Reparo** | Revisar cláusula WHERE da query de consulta. |
| **Pós-Reparo** | Repetir consultas e validar segregação dos dados. |

### CT-23 — Consulta com Filtro "Todos"

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se a API retorna todos os registros quando o filtro é "todos os labirintos". |
| **Pré-condições** | Banco com registros de ao menos dois tipos de labirinto diferentes. |
| **Procedimentos** | 1. Chamar endpoint sem filtro de tipo (ou com parâmetro "todos").<br>2. Comparar quantidade de registros retornados com o total no banco. |
| **Resultado Esperado** | Todos os registros de todas as corridas são retornados, sem omissão. |
| **Reparo** | Verificar ausência de filtro indevido na query padrão. |
| **Pós-Reparo** | Inserir novo registro e confirmar que aparece na consulta geral. |

### CT-24 — Consulta com Banco Vazio

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar o comportamento da API quando não há corridas cadastradas. |
| **Pré-condições** | Banco vazio (sem nenhum registro de corrida). |
| **Procedimentos** | 1. Chamar endpoint de consulta geral.<br>2. Chamar endpoint com filtro de labirinto específico. |
| **Resultado Esperado** | API retorna lista vazia (ex.: `[]`) com status 200, sem erro 500 ou exceção. |
| **Reparo** | Adicionar tratamento explícito para resultado vazio na camada de consulta. |
| **Pós-Reparo** | Repetir consultas e confirmar retorno vazio sem erro. |

---

## Testes de Dashboard (Frontend)

<!--
  Estes testes verificam o pool Dashboard do BPMN: conexão WebSocket,
  exibição de telemetria em tempo real e consulta de histórico via API REST.
  Podem ser executados com o servidor real ou com um servidor mock que simule
  os eventos WebSocket e as respostas REST.
-->

### CT-25 — Conexão WebSocket

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se o Dashboard estabelece conexão WebSocket automaticamente ao ser acessado. |
| **Pré-condições** | Servidor em execução com WebSocket ativo. |
| **Procedimentos** | 1. Abrir o Dashboard no navegador.<br>2. Verificar log de conexão no servidor.<br>3. Verificar indicador de status no Dashboard (se existir). |
| **Resultado Esperado** | Conexão WebSocket estabelecida sem interação manual; servidor registra o cliente conectado. |
| **Reparo** | Verificar URL do WebSocket no frontend e configuração de CORS no servidor. |
| **Pós-Reparo** | Recarregar página e confirmar reconexão automática. |

### CT-26 — Exibição dos 6 Campos de Telemetria

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se todos os campos obrigatórios são exibidos em tempo real no painel. |
| **Pré-condições** | Dashboard conectado ao WebSocket; servidor enviando stream de telemetria simulado. |
| **Procedimentos** | 1. Iniciar stream de telemetria com todos os campos.<br>2. Verificar no Dashboard a presença e atualização de: tipo do labirinto, trajeto, consumo de bateria, velocidade média, tempo decorrido e status do desafio (S/N). |
| **Resultado Esperado** | Todos os 6 campos aparecem e são atualizados a cada pacote recebido. |
| **Reparo** | Identificar campo ausente e corrigir binding no frontend. |
| **Pós-Reparo** | Reenviar stream e confirmar atualização de todos os campos. |

### CT-27 — Exibição de Dados Consolidados ao Fim da Corrida

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se o Dashboard detecta o encerramento do stream e exibe os dados finais consolidados. |
| **Pré-condições** | Dashboard conectado; servidor prestes a enviar pacote de conclusão. |
| **Procedimentos** | 1. Enviar sequência de pacotes de telemetria.<br>2. Enviar pacote final com flag de conclusão.<br>3. Observar mudança na interface. |
| **Resultado Esperado** | Dashboard transita da exibição em tempo real para a tela de dados consolidados sem ação manual. |
| **Reparo** | Revisar lógica do gateway "Corrida finalizada?" no frontend. |
| **Pós-Reparo** | Repetir o ciclo completo e confirmar transição automática. |

### CT-28 — Filtro por Labirinto Específico

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se o usuário consegue consultar o histórico de um labirinto específico. |
| **Pré-condições** | Banco com registros de corridas; API REST disponível. |
| **Procedimentos** | 1. Selecionar filtro "4×4" no Dashboard.<br>2. Confirmar requisição enviada ao servidor.<br>3. Verificar dados exibidos. |
| **Resultado Esperado** | Apenas registros do labirinto 4×4 são exibidos; dados de outros tipos não aparecem. |
| **Reparo** | Verificar parâmetro de filtro enviado na requisição REST. |
| **Pós-Reparo** | Repetir para 8×8 e 16×16 e confirmar segregação correta. |

### CT-29 — Filtro "Todos os Labirintos"

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar se o usuário consegue visualizar o histórico completo de todas as corridas. |
| **Pré-condições** | Banco com registros de ao menos dois tipos de labirinto. |
| **Procedimentos** | 1. Selecionar opção "Todos" no Dashboard.<br>2. Confirmar requisição enviada.<br>3. Verificar dados exibidos. |
| **Resultado Esperado** | Todos os registros de todas as corridas são exibidos, sem omissão de nenhum tipo. |
| **Reparo** | Verificar se o frontend envia a requisição sem filtro de tipo. |
| **Pós-Reparo** | Inserir novo registro e confirmar que aparece na listagem. |

### CT-30 — Reconexão WebSocket

| Atributo | Descrição |
|---|---|
| **Objetivo** | Verificar o comportamento do Dashboard após perda e restabelecimento da conexão WebSocket. |
| **Pré-condições** | Dashboard conectado; servidor em execução. |
| **Procedimentos** | 1. Estabelecer conexão WebSocket.<br>2. Derrubar o servidor temporariamente (simular queda de rede).<br>3. Restaurar o servidor.<br>4. Observar comportamento do Dashboard. |
| **Resultado Esperado** | Dashboard exibe indicação de conexão perdida e reconecta automaticamente sem recarregar a página. |
| **Reparo** | Implementar lógica de reconexão automática (ex.: backoff exponencial) no cliente WebSocket. |
| **Pós-Reparo** | Repetir queda de conexão e confirmar reconexão em até 30 segundos. |
