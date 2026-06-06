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

Você pode executar os testes a partir da raiz do repositório utilizando o `Makefile` ou diretamente em cada subdiretório.

### Backend (Pytest)

Os testes do backend utilizam o `pytest`. Para executá-los:

Usando o Make (na raiz do projeto):
```bash
make test-backend
```

Diretamente (em `src/backend`):
```bash
pytest
```

### Frontend Unitário (Jest)

Os testes unitários do frontend são feitos com o Jest. Para executá-los:

Usando o Make (na raiz do projeto):
```bash
make test-frontend
```

Diretamente (em `src/frontend`):
```bash
npm run test:unit
```

### E2E Frontend (Playwright)

Os testes End-to-End (ponta a ponta) do frontend utilizam o Playwright. Para executá-los:

Usando o Make (na raiz do projeto):
```bash
make test-frontend-e2e
```

Diretamente (em `src/frontend`):
```bash
npm run test:e2e
# Ou para abrir a interface do Playwright:
npx playwright test --ui
```

### Todos os testes (Backend + Frontend Unit)

Para rodar de forma automatizada tanto os testes do backend quanto do frontend:

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
