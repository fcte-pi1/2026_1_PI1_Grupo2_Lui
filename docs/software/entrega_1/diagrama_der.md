### Diagrama de Entidade-Relacionamento (DER)

Este documento apresenta o modelo de dados relacional projetado para o sistema web do projeto Micromouse. O objetivo principal deste modelo é garantir a persistência de dados do histórico de corridas para posterior consulta. Em conformidade com os requisitos não funcionais, o banco de dados utilizado é o **SQLite 3**, garantindo uma solução leve e armazenada localmente.

### 1. Entidades e Atributos

O modelo foi projetado focando na simplicidade exigida pelo projeto e no volume de dados esperado (cerca de 100 corridas). Foram identificadas duas entidades principais:

**Entidade: `Labirinto`**
Armazena os tipos de labirintos físicos utilizados na competição.
*   `id_labirinto` **(PK - Integer)**: Identificador único do labirinto.
*   `dimensao` **(Varchar)**: O tamanho do labirinto (ex: "4x4", "8x8", "16x16").

**Entidade: `Registro_Corrida`**
Armazena o "resumo final" consolidado da telemetria, que é salvo pelo backend ao receber o sinal de conclusão do desafio pelo robô. O tamanho de cada registro não excede 10 KB.
*   `id_corrida` **(PK - Integer)**: Identificador único do registro da corrida.
*   `id_labirinto` **(FK - Integer)**: Chave estrangeira que referencia a qual pista a corrida pertence, permitindo os filtros na interface web.
*   `trajeto` **(Text/JSON)**: A matriz de paredes e a sequência de células do caminho percorrido.
*   `bateria_consumida` **(Float)**: Porcentagem de bateria utilizada.
*   `velocidade_media` **(Float)**: Velocidade média do robô durante o trajeto.
*   `tempo_conclusao` **(Float/Time)**: Tempo total percorrido.
*   `desafio_cumprido` **(Boolean)**: Status indicando se o robô conseguiu chegar à sala central com sucesso (Sim/Não).
*   `data_hora` **(Timestamp)**: Momento exato em que a corrida foi salva no sistema.

### 2. Cardinalidades dos Relacionamentos

A relação estrutural entre as duas tabelas obedece à regra **1:N (Um para Muitos)**:
*   **Um (1)** `Labirinto` pode ter **Muitos (N)** `Registros_Corrida` associados a ele, visto que o robô fará várias tentativas na mesma pista.
*   Cada **Uma (1)** corrida em `Registro_Corrida` ocorre em obrigatoriamente **Um (1)** `Labirinto` específico.

### 3. Validação dos Requisitos
O modelo atende perfeitamente à necessidade de consulta de histórico proposta. A separação usando a Chave Estrangeira `id_labirinto` permite a aplicação exata das regras de negócio que exigem a listagem das corridas filtrando por "*um labirinto específico*" ou por "*todos os labirintos*". Ademais, entidades de usuários/operadores não foram incluídas propositalmente, visto que a aplicação web deve ter interface de consulta com acesso somente leitura e não exige controle de perfis de acesso logados.

### 4. Diagrama Visual


![Diagrama DER](/docs/assets/images/der.svg "Representação gráfica do Diagrama de Entidade-Relacionamento")