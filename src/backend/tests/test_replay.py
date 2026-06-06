import os, sys, pathlib
BACKEND_DIR = pathlib.Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BACKEND_DIR))
os.environ["DB_PATH"] = ":memory:"

import pytest
from fastapi.testclient import TestClient
import database.database as db_module
from app import app
from memory.session_buffer import _sessions

client = TestClient(app)


@pytest.fixture(autouse=True)
def _reset():
    with db_module.managed_connection() as conn:
        conn.execute("DROP TABLE IF EXISTS corridas")
        conn.commit()
    db_module.init_db()
    _sessions.clear()
    yield
    _sessions.clear()


def _persistir():
    payload = {
        "robot_id": "x", "timestamp": "2026-06-06T12:00:00Z",
        "maze_type": "4x4",
        "current_position": {"x": 90, "y": 90, "z": 9.81, "orientation": 0},
        "path_traversed": [
            {"x": 90, "y": 630, "z": 9.81},
            {"x": 90, "y": 450, "z": 9.81},
            {"x": 90, "y": 270, "z": 9.81},
            {"x": 90, "y": 90,  "z": 9.81},
        ],
        "battery_voltage_v": 7.4, "speed_mm_s": 0, "elapsed_time_ms": 4000,
        "race_status": "finished", "event": "race_ended",
        "source": "real", "success": True,
    }
    r = client.post("/telemetria", json=payload)
    assert r.status_code == 200


def test_get_historico_id_retorna_corrida_com_path_completo():
    _persistir()
    hist = client.get("/historico").json()["data"]
    corrida_id = hist[0]["id"]
    r = client.get(f"/historico/{corrida_id}")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "sucesso"
    data = body["data"]
    assert data["id"] == corrida_id
    assert data["maze_type"] == "4x4"
    assert len(data["path_traversed"]) == 4
    assert data["path_traversed"][0] == {"x": 90.0, "y": 630.0, "z": 9.81}


def test_get_historico_id_inexistente_retorna_404():
    r = client.get("/historico/99999")
    assert r.status_code == 404
