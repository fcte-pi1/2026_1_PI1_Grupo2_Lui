# Backend — API de Telemetria do Robô

API REST + WebSocket desenvolvida com **FastAPI** para recebimento, processamento e transmissão em tempo real dos dados de telemetria do micromouse.

## Estrutura

```
backend/
├── app.py                  # Entrypoint da aplicação (rotas HTTP e WebSocket)
├── requirements.txt        # Dependências do projeto
├── database/
│   └── database.py         # Inicialização do banco e persistência de corridas
├── memory/
│   └── session_buffer.py   # Buffer em memória para sessões de corrida ativas
├── schemas/
│   └── telemetria.py       # Schemas Pydantic (validação dos pacotes)
├── websocket/
│   └── manager.py          # Gerenciador de conexões WebSocket (broadcast)
├── tests/
│   └── test_app.py         # Testes da API
└── db/
    └── telemetria.db       # Banco de dados SQLite (gerado automaticamente)
```

## Endpoints

### `POST /telemetria`
Recebe pacotes de telemetria do firmware. Valida o payload, atualiza a sessão em memória e, ao final da corrida, persiste o histórico no banco. Todo pacote válido é transmitido em tempo real via WebSocket para os dashboards conectados.

### `GET /historico`
Retorna o histórico de corridas salvas. Aceita filtro opcional por tipo de labirinto (`4x4`, `8x8`, `16x16`).

### `WS /ws/dashboard`
Endpoint WebSocket para conexão dos dashboards. Suporta múltiplos clientes simultâneos — cada pacote de telemetria válido recebido é transmitido a todos os conectados em tempo real.

## Como executar

```bash
pip install -r requirements.txt
uvicorn app:app --reload
```

A API estará disponível em `http://localhost:8000`.  
Documentação interativa em `http://localhost:8000/docs`.

## Como testar o WebSocket

Com o servidor rodando, conecte um cliente WebSocket:

```bash
websocat ws://localhost:8000/ws/dashboard
```

Em outro terminal, envie um pacote de telemetria via `POST /telemetria` e o dashboard receberá o JSON imediatamente.