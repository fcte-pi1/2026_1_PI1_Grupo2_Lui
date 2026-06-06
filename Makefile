# Configuração de rede e caminhos
PORT = 8123
URL  = http://127.0.0.1:$(PORT)/
REQ  = requirements.txt

VENV        = .venv
SCRIPTS_DIR = scripts

# Caminhos das stacks de teste — separador correto por OS para o `cd` do cmd.
ifeq ($(OS),Windows_NT)
BACKEND_DIR  = src\backend
FRONTEND_DIR = src\frontend
else
BACKEND_DIR  = src/backend
FRONTEND_DIR = src/frontend
endif

# Detecção de Sistema Operacional (Windows vs Unix)
OS := $(shell (uname 2>NUL) || echo Windows_NT)

# Mapeamento de binários e comandos específicos por OS
ifeq ($(OS),Windows_NT)
    PYTHON      = python
    PYTHON_VENV = $(VENV)\Scripts\python.exe
    PIP         = $(VENV)\Scripts\pip.exe
    MKDOCS      = $(VENV)\Scripts\mkdocs.exe
    CHECK_VENV  = call $(SCRIPTS_DIR)\check_venv.bat
    CHECK_REQ   = $(PYTHON_VENV) $(SCRIPTS_DIR)\check_requirements.py
    OPEN_BROWSER= cmd /c start $(URL)
    CHCP_CMD    = chcp 65001 >NUL
    DEVNULL     = NUL
    UI_BOLD     =
    UI_RESET    =
    PRINT       = @echo
    # Caminho do Python do .venv visto a partir de src\backend\
    PY_FROM_BACKEND = ..\..\$(VENV)\Scripts\python.exe
else
    PYTHON      = python3
    PYTHON_VENV = $(VENV)/bin/python3
    PIP         = $(VENV)/bin/pip
    MKDOCS      = $(VENV)/bin/mkdocs
    CHECK_VENV  = sh $(SCRIPTS_DIR)/check_venv.sh
    CHECK_REQ   = $(PYTHON_VENV) $(SCRIPTS_DIR)/check_requirements.py
    OPEN_BROWSER= xdg-open $(URL)
    CHCP_CMD    = true
    DEVNULL     = /dev/null
    UI_BOLD     = \033[1;36m
    UI_RESET    = \033[0m
    PRINT       = @printf '%b\n'
    # Caminho do Python do .venv visto a partir de src/backend/
    PY_FROM_BACKEND = ../../$(VENV)/bin/python3
endif

.PHONY: help run setup build-up venv install verify serve clean test test-backend test-frontend test-frontend-unit test-frontend-e2e test-coverage coverage-backend coverage-frontend install-backend install-frontend

# help: Lista os principais comandos de automação
help:
	@$(CHCP_CMD) || true
	$(PRINT) "Comandos disponiveis no projeto LUI:"
	$(PRINT) "  make run      - Inicia o servidor MkDocs e abre o navegador automaticamente."
	$(PRINT) "  make setup    - Cria o ambiente virtual e instala as dependencias necessarias."
	$(PRINT) "  make clean    - Remove o ambiente virtual (.venv) e arquivos temporarios."
	$(PRINT) "  make serve    - Apenas inicia o servidor (sem abrir navegador ou verificar venv)."
	$(PRINT) ""
	$(PRINT) "Testes:"
	$(PRINT) "  make test              - Roda TODOS os testes (backend + frontend unit)."
	$(PRINT) "  make test-backend      - Roda os testes do backend (pytest)."
	$(PRINT) "  make test-frontend     - Roda os testes unitarios do frontend (Jest)."
	$(PRINT) "  make test-frontend-unit- Idem test-frontend (alias)."
	$(PRINT) "  make test-frontend-e2e - Roda os testes E2E do frontend (Playwright)."
	$(PRINT) "  make test-coverage     - Roda backend+frontend com relatorio HTML de cobertura."
	$(PRINT) "  make coverage-backend  - Cobertura do backend (HTML em src/backend/coverage_html/)."
	$(PRINT) "  make coverage-frontend - Cobertura do frontend (HTML em src/frontend/coverage/)."
	$(PRINT) ""
	$(PRINT) "Instalacao de dependencias das stacks:"
	$(PRINT) "  make install-backend   - Instala dependencias Python do backend."
	$(PRINT) "  make install-frontend  - Instala dependencias Node do frontend."

# run: Atalho principal para desenvolvimento local
run:
	@$(CHCP_CMD) || true
	$(PRINT) "$(UI_BOLD)Iniciando servidor na porta $(PORT)...$(UI_RESET)"
	@$(OPEN_BROWSER)
	@$(MKDOCS) serve -a 127.0.0.1:$(PORT)

# setup: Fluxo completo de inicialização do ambiente
setup: build-up

build-up:
	@$(CHCP_CMD) || true
	$(PRINT) "$(UI_BOLD)Iniciando instalacao do ambiente...$(UI_RESET)"
	@$(MAKE) venv
	@$(MAKE) install
	@$(MAKE) verify
	$(PRINT) "$(UI_BOLD)Sucesso! Use 'make run' para iniciar o projeto.$(UI_RESET)"

# Targets auxiliares de instalação
venv:
	@$(PRINT) "[1/3] Verificando interpretador Python e Venv..."
	@$(CHECK_VENV)

install:
	@$(PRINT) "[2/3] Sincronizando dependencias Python..."
	@$(CHECK_REQ)

verify:
	@$(PRINT) "[3/3] Validando configuracao..."
	@$(PYTHON_VENV) --version >$(DEVNULL) 2>&1 || (echo "Erro no ambiente virtual." && exit 1)

# serve: Comando cru para execução do MkDocs
serve:
	@$(MKDOCS) serve -a 127.0.0.1:$(PORT)

# clean: Reseta o diretório de trabalho removendo o venv
clean:
	@$(PRINT) "Limpando ambiente..."
ifeq ($(OS),Windows_NT)
	@if exist $(VENV) rmdir /s /q $(VENV)
else
	@rm -rf $(VENV)
endif
	@$(PRINT) "Limpeza concluida."

# ──────────────────────────────────────────────────────────────────────
# Instalação de dependências por stack
# ──────────────────────────────────────────────────────────────────────

# install-backend: instala dependências Python do backend dentro do .venv
install-backend: venv
	@$(PRINT) "$(UI_BOLD)Instalando dependencias do backend...$(UI_RESET)"
	@$(PIP) install -r $(BACKEND_DIR)/requirements.txt

# install-frontend: instala dependências Node do frontend
install-frontend:
	@$(PRINT) "$(UI_BOLD)Instalando dependencias do frontend...$(UI_RESET)"
	@cd $(FRONTEND_DIR) && npm install

# ──────────────────────────────────────────────────────────────────────
# Testes
# ──────────────────────────────────────────────────────────────────────

# test-backend: roda pytest no backend usando o Python do .venv
# Usamos um wrapper Python para evitar problemas de `cd path && cmd` no
# cmd.exe/PowerShell. O wrapper faz chdir para src/backend e roda pytest.
test-backend:
	@$(PRINT) "$(UI_BOLD)Rodando testes do backend (pytest)...$(UI_RESET)"
	@$(PYTHON_VENV) $(SCRIPTS_DIR)/run_backend_tests.py

# test-frontend: roda os testes unitários do frontend (Jest via CRA)
test-frontend: test-frontend-unit

test-frontend-unit:
	@$(PRINT) "$(UI_BOLD)Rodando testes unitarios do frontend (Jest)...$(UI_RESET)"
	@$(PYTHON_VENV) $(SCRIPTS_DIR)/run_frontend_tests.py test:unit

# test-frontend-e2e: roda os testes E2E do frontend (Playwright)
test-frontend-e2e:
	@$(PRINT) "$(UI_BOLD)Rodando testes E2E do frontend (Playwright)...$(UI_RESET)"
	@$(PYTHON_VENV) $(SCRIPTS_DIR)/run_frontend_tests.py test:e2e

# test: roda todos os testes do projeto (backend + frontend unit)
# Obs.: testes E2E (Playwright) não são incluídos por padrão pois exigem o
# servidor do frontend de pé. Rode `make test-frontend-e2e` separadamente.
test: test-backend test-frontend-unit
	@$(PRINT) "$(UI_BOLD)Todos os testes (backend + frontend unit) concluidos.$(UI_RESET)"

# ──────────────────────────────────────────────────────────────────────
# Cobertura de testes (threshold 70%)
# ──────────────────────────────────────────────────────────────────────

# coverage-backend: pytest com pytest-cov; gera HTML em src/backend/coverage_html/
# (pytest.ini ja inclui --cov, --cov-report=html e --cov-fail-under=70)
coverage-backend:
	@$(PRINT) "$(UI_BOLD)Gerando cobertura do backend...$(UI_RESET)"
	@$(PYTHON_VENV) $(SCRIPTS_DIR)/run_backend_tests.py
	@$(PRINT) "Relatorio HTML: $(BACKEND_DIR)/coverage_html/index.html"

# coverage-frontend: Jest com --coverage; gera HTML em src/frontend/coverage/lcov-report/
coverage-frontend:
	@$(PRINT) "$(UI_BOLD)Gerando cobertura do frontend...$(UI_RESET)"
	@$(PYTHON_VENV) $(SCRIPTS_DIR)/run_frontend_tests.py test:coverage
	@$(PRINT) "Relatorio HTML: $(FRONTEND_DIR)/coverage/lcov-report/index.html"

# test-coverage: alvo unico que roda as duas suites com cobertura
test-coverage: coverage-backend coverage-frontend
	@$(PRINT) "$(UI_BOLD)Cobertura gerada para backend e frontend.$(UI_RESET)"
	@$(PRINT) "Backend : $(BACKEND_DIR)/coverage_html/index.html"
	@$(PRINT) "Frontend: $(FRONTEND_DIR)/coverage/lcov-report/index.html"