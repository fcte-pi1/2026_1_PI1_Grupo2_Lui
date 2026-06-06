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


@pytest.fixture(autouse=True)
def _reset_state():
    with db_module.managed_connection() as conn:
        conn.execute("DROP TABLE IF EXISTS corridas")
        conn.commit()
    db_module.init_db()
    _sessions.clear()
    yield
    _sessions.clear()


def _payload(**overrides):
    base = {
        "robot_id": "x",
        "timestamp": "2026-06-06T12:00:00Z",
        "maze_type": "4x4",
        "current_position": {"x": 90.0, "y": 90.0, "z": 9.81, "orientation": 0.0},
        "path_traversed": [{"x": 90.0, "y": 90.0, "z": 9.81}],
        "battery_voltage_v": 7.4,
        "speed_mm_s": 0.0,
        "elapsed_time_ms": 5000,
        "race_status": "finished",
    }
    base.update(overrides)
    return base


def test_source_simulator_e_success_true_persiste():
    client.post(
        "/telemetria",
        json=_payload(robot_id="sim_browser", source="simulator", success=True, event="race_ended"),
    )
    h = client.get("/historico").json()["data"]
    assert len(h) == 1
    assert h[0]["source"] == "simulator"
    assert h[0]["success"] is True


def test_source_simulator_com_success_false_para_preso():
    client.post(
        "/telemetria",
        json=_payload(robot_id="sim_browser", source="simulator", success=False),
    )
    h = client.get("/historico").json()["data"]
    assert len(h) == 1
    assert h[0]["source"] == "simulator"
    assert h[0]["success"] is False


def test_sem_source_default_real_e_success_true():
    p = _payload(event="race_ended")
    p.pop("source", None)
    client.post("/telemetria", json=p)
    h = client.get("/historico").json()["data"]
    assert h[0]["source"] == "real"
    assert h[0]["success"] is True


def test_source_invalido_retorna_422():
    r = client.post(
        "/telemetria", json=_payload(race_status="running", source="hacker")
    )
    assert r.status_code == 422
