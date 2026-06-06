# Testes

## Pré-requisitos

* Python 3.10+
* Node.js 18+
* Make

## Instalação

```bash
make install-backend
make install-frontend
```

## Executando os testes

### Backend

```bash
make test-backend
```

### Frontend

```bash
make test-frontend
```

### E2E

```bash
make test-frontend-e2e
```

### Todos os testes

```bash
make test
```

## Cobertura

```bash
make coverage-backend
make coverage-frontend
make test-coverage
```

Relatórios:

```text
src/backend/coverage_html/index.html
src/frontend/coverage/lcov-report/index.html
```

## Estrutura

```text
src/backend/tests/
├── test_app.py
├── test_known_walls.py
├── test_replay.py
└── test_source_success.py

src/frontend/src/
├── App.test.js
└── ...

src/frontend/tests/
└── *.spec.js
```

## Convenções

### Backend

```text
test_*.py
```

Exemplo:

```text
test_app.py
```

### Frontend (Jest)

```text
*.test.js
```

Exemplo:

```text
App.test.js
```

### Frontend (Playwright)

```text
*.spec.js
```

Exemplo:

```text
test_historico.spec.js
```

## Boas práticas

* Testes unitários próximos ao código ou em `tests/unit`.
* Testes de integração em `tests/integration`.
* Não misturar unitário e integração no mesmo arquivo.
* Utilizar mocks, fixtures e banco em memória.
* Nunca depender de dados reais.
* Garantir execução local e em CI.

## Comandos úteis

```bash
make test
make test-backend
make test-frontend
make test-frontend-e2e

make coverage-backend
make coverage-frontend
make test-coverage

make install-backend
make install-frontend
```
