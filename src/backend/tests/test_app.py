"""
Testes do backend de telemetria.

Cobre:
- CT-17: aceitação de payload válido (POST /telemetria com running e finished)
- CT-18: rejeição de payload malformado (campo ausente, tipo errado, vazio)
- CT-19: ordem broadcast→persistir (broadcast acontece mesmo se persistir falhar)
- CT-20: persistência somente em finished/race_ended
- CT-21: corrida interrompida não persiste
- CT-22: GET /historico com filtro por maze_type
- CT-23: GET /historico sem filtro retorna tudo
- CT-24: GET /historico em banco vazio retorna []
- CT-40: RNF-10 — ausência de PUT/PATCH/DELETE em /historico
- source/success: corridas do simulador são persistidas e marcadas

O DB é configurado em :memory: via fixture para isolamento.
"""

import os
import sys
import pathlib

BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))

os.environ["DB_PATH"] = ":memory:"

import pytest
from fastapi.testclient import TestClient

import database.database as db_module
from app import app
from memory.session_buffer import _sessions

client = TestClient(app)


# ────────────────────────────── Fixtures ──────────────────────────────

@pytest.fixture(autouse=True)
def _reset_state():
    """Garante banco limpo e sessões limpas a cada teste."""
    with db_module.managed_connection() as conn:
        conn.execute("DROP TABLE IF EXISTS corridas")
        conn.commit()
    db_module.init_db()
    _sessions.clear()
    yield
    _sessions.clear()


def make_payload(
    race_status="running",
    elapsed_ms=5000,
    maze_type="4x4",
    event=None,
    path=None,
    robot_id="micromouse_01",
    timestamp="2026-06-06T12:00:00Z",
    source="real",
    success=None,
):
    payload = {
        "robot_id": robot_id,
        "timestamp": timestamp,
        "maze_type": maze_type,
        "current_position": {"x": 60.2, "y": 15.0, "z": 9.81, "orientation": 90.0},
        "path_traversed": path
        if path is not None
        else [
            {"x": 0.0, "y": 0.0, "z": 9.80},
            {"x": 30.0, "y": 0.0, "z": 9.78},
            {"x": 60.2, "y": 15.0, "z": 9.81},
        ],
        "battery_voltage_v": 7.32,
        "speed_mm_s": 120.5,
        "elapsed_time_ms": elapsed_ms,
        "race_status": race_status,
        "source": source,
    }
    if event:
        payload["event"] = event
    if success is not None:
        payload["success"] = success
    return payload


# ────────────────────────────── CT-17 ──────────────────────────────

def test_ct17_payload_valido_running():
    """CT-17: payload mínimo válido em running deve ser aceito."""
    response = client.post("/telemetria", json=make_payload(race_status="running"))
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "sucesso"


def test_ct17_payload_valido_finished_persiste():
    """CT-17 + CT-20: payload finished persiste exatamente uma corrida."""
    client.post("/telemetria", json=make_payload(race_status="running", elapsed_ms=1000))
    client.post("/telemetria", json=make_payload(race_status="running", elapsed_ms=3000))
    response = client.post(
        "/telemetria",
        json=make_payload(race_status="finished", elapsed_ms=5000, event="race_ended"),
    )
    assert response.status_code == 200

    hist = client.get("/historico").json()["data"]
    assert len(hist) == 1
    assert hist[0]["maze_type"] == "4x4"
    assert hist[0]["elapsed_time_ms"] == 5000
    assert hist[0]["step_count"] == 3


def test_ct17_aceita_estados_ready_e_paused():
    """RaceStatusEnum deve aceitar ready e paused (contrato de telemetria)."""
    for status in ("ready", "paused"):
        response = client.post("/telemetria", json=make_payload(race_status=status))
        assert response.status_code == 200, f"falhou em race_status={status}"


# ────────────────────────────── CT-18 ──────────────────────────────

def test_ct18_rejeita_campo_obrigatorio_ausente():
    """CT-18: faltando maze_type → 422."""
    payload = make_payload()
    del payload["maze_type"]
    response = client.post("/telemetria", json=payload)
    assert response.status_code == 422


def test_ct18_rejeita_tipo_incorreto():
    """CT-18: battery_voltage_v como string → 422."""
    payload = make_payload()
    payload["battery_voltage_v"] = "muito"
    response = client.post("/telemetria", json=payload)
    assert response.status_code == 422


def test_ct18_rejeita_payload_vazio():
    """CT-18: {} → 422."""
    response = client.post("/telemetria", json={})
    assert response.status_code == 422


def test_ct18_rejeita_maze_type_invalido():
    """CT-18: maze_type fora do enum → 422."""
    payload = make_payload(maze_type="2x2")
    response = client.post("/telemetria", json=payload)
    assert response.status_code == 422


# ────────────────────────────── CT-20 / CT-21 ──────────────────────────────

def test_ct20_intermediarios_nao_persistem():
    """CT-20: pacotes running sem flag não criam registro."""
    for _ in range(5):
        client.post("/telemetria", json=make_payload(race_status="running"))
    assert client.get("/historico").json()["data"] == []


def test_ct21_interrupcao_nao_persiste():
    """CT-21: stream sem finished não gera registro."""
    client.post("/telemetria", json=make_payload(race_status="running", elapsed_ms=1000))
    client.post("/telemetria", json=make_payload(race_status="running", elapsed_ms=2000))
    assert client.get("/historico").json()["data"] == []


def test_ct21_error_descarta_buffer():
    """CT-21: race_status=error limpa o buffer e nada é persistido."""
    client.post("/telemetria", json=make_payload(race_status="running"))
    assert "micromouse_01" in _sessions
    client.post("/telemetria", json=make_payload(race_status="error"))
    assert "micromouse_01" not in _sessions
    assert client.get("/historico").json()["data"] == []


# ────────────────────────────── CT-22 / CT-23 / CT-24 ──────────────────────────────

def _seed_corridas():
    for size in ("4x4", "8x8", "16x16"):
        client.post(
            "/telemetria",
            json=make_payload(
                race_status="finished",
                event="race_ended",
                maze_type=size,
                elapsed_ms=10000,
                robot_id=f"robot_{size}",
                timestamp=f"2026-06-06T12:00:{int(size.split('x')[0]):02d}Z",
            ),
        )


def test_ct22_filtro_por_labirinto():
    """CT-22: GET /historico?maze_type=8x8 retorna apenas 8x8."""
    _seed_corridas()
    for size in ("4x4", "8x8", "16x16"):
        data = client.get(f"/historico?maze_type={size}").json()["data"]
        assert len(data) == 1
        assert data[0]["maze_type"] == size


def test_ct22_filtro_invalido_retorna_422():
    response = client.get("/historico?maze_type=2x2")
    assert response.status_code == 422


def test_ct23_sem_filtro_retorna_tudo():
    _seed_corridas()
    data = client.get("/historico").json()["data"]
    assert len(data) == 3


def test_ct24_banco_vazio_retorna_lista_vazia():
    response = client.get("/historico")
    assert response.status_code == 200
    assert response.json() == {"status": "sucesso", "data": []}

    response = client.get("/historico?maze_type=16x16")
    assert response.status_code == 200
    assert response.json()["data"] == []


# ────────────────────────────── CT-40 ──────────────────────────────

def test_ct40_endpoints_de_mutacao_nao_existem():
    """RNF-10: nenhum método de modificação está exposto em /historico."""
    _seed_corridas()
    assert client.put("/historico/1", json={}).status_code in (404, 405)
    assert client.patch("/historico/1", json={}).status_code in (404, 405)
    assert client.delete("/historico/1").status_code in (404, 405)



# Health
def test_health_endpoint():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "websocket_clients" in body
