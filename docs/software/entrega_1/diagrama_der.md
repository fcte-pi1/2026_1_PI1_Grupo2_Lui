# Diagrama de Entidade-Relacionamento (DER)

<div class="svg-embed-container"
       data-svg-path="../../../assets/images/der.svg"
       data-title="Representação gráfica do Diagrama de Entidade-Relacionamento"
       style="height: 600px; width: 100%;"> </div>

Este documento apresenta o modelo de dados relacional projetado para a camada de persistência do sistema web do projeto Micromouse. Sua finalidade é explicitar as entidades, os atributos e os relacionamentos necessários ao armazenamento do histórico de corridas, viabilizando a consulta posterior dos resultados. A representação gráfica é complementada pelo esquema relacional textual, em conformidade com o material de referência da disciplina.

A persistência é implementada em SQLite 3, conforme estabelecido pela restrição RE-10. Em decorrência, os tipos de dados restringem-se aos cinco reconhecidos nativamente pelo SGBD: `INTEGER`, `REAL`, `TEXT`, `BLOB` e `NULL`.

## 1. Entidades e Atributos

O modelo identifica duas entidades. A entidade `Labirinto` consolida os tipos de pista utilizados na competição (4x4, 8x8 e 16x16) e atua como tabela de referência. A entidade `Corrida` registra, para cada execução completa, o resumo final consolidado pelo backend ao receber a flag de conclusão emitida pelo firmware. O dimensionamento de cada registro respeita o limite de 10 KB estabelecido pelo RNF-06.

### Entidade `Labirinto`

| Atributo | Tipo SQLite | Descrição |
|---|---|---|
| `id_labirinto` (PK) | `INTEGER` | Identificador único do tipo de labirinto |
| `dimensao` | `TEXT` | Dimensão da pista: `"4x4"`, `"8x8"` ou `"16x16"` |

### Entidade `Corrida`

| Atributo | Tipo SQLite | Descrição |
|---|---|---|
| `id_corrida` (PK) | `INTEGER` | Identificador único do registro da corrida |
| `trajeto` | `TEXT` | Sequência de células percorridas, serializada em JSON compacto |
| `mapa_paredes` | `BLOB` | Matriz de paredes (até 128 bytes no pior caso, em 16x16) |
| `tempo_conclusao_ms` | `INTEGER` | Tempo total de conclusão, em milissegundos |
| `velocidade_media_cms` | `REAL` | Velocidade média do robô, em cm/s |
| `consumo_bateria_pct` | `REAL` | Variação percentual do nível de bateria durante a corrida |
| `desafio_cumprido` | `INTEGER` | Indicador de sucesso: `1` representa sucesso e `0` representa falha |
| `data_hora` | `TEXT` | Data e hora de registro, em formato ISO 8601 |
| `id_labirinto` (FK) | `INTEGER` | Chave estrangeira que referencia `Labirinto(id_labirinto)` |

## 2. Esquema Relacional

A representação textual do modelo segue a convenção adotada na disciplina, com a chave primária sublinhada e a chave estrangeira prefixada por `#`.

```text
Labirinto(id_labirinto, dimensao)
Corrida(id_corrida, trajeto, mapa_paredes, tempo_conclusao_ms,
        velocidade_media_cms, consumo_bateria_pct, desafio_cumprido,
        data_hora, #id_labirinto)
```

## 3. Cardinalidades

O relacionamento `registra` vincula as duas entidades segundo a regra (0, n) — (1, 1). Um `Labirinto` pode estar associado a (0, n) `Corridas`, uma vez que um tipo de pista pode permanecer cadastrado antes que qualquer corrida tenha sido executada nele. Uma `Corrida`, por sua vez, pertence obrigatoriamente a (1, 1) `Labirinto`, o que viabiliza o filtro por tipo de pista exigido pela US14 e validado pelos casos de teste CT-22, CT-23 e CT-28.

A síntese gráfica do relacionamento expressa-se da seguinte forma:

```text
Corrida -(0, n)- registra -(1, 1)- Labirinto
```

## 4. Validação dos Requisitos

O modelo viabiliza diretamente o atendimento aos requisitos associados à persistência. A separação por meio da chave estrangeira `id_labirinto` permite a aplicação dos filtros previstos pela US14 (consulta por labirinto específico ou por todos os labirintos), validada pelos CT-22, CT-23 e CT-28. A escrita no banco ocorre exclusivamente após a flag de conclusão (US13, CT-20 e CT-21), e nenhum endpoint público de modificação ou exclusão é exposto, conforme determinado pelo RNF-10 e verificado pelo CT-40. A ausência de entidades de usuário é deliberada: a interface web opera em modo somente leitura sobre o histórico e não requer controle de perfis de acesso.
