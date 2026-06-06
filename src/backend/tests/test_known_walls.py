"""known_walls: matriz de paredes persistida e devolvida."""
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


def _walls_4x4():
    # Matriz 4x4 com perímetro marcado e algumas paredes internas.
    size = 4
    walls = [[[False] * 4 for _ in range(size)] for _ in range(size)]
    for x in range(size):
        for y in range(size):
            if y == 0:        walls[x][y][0] = True
            if x == size - 1: walls[x][y][1] = True
            if y == size - 1: walls[x][y][2] = True
            if x == 0:        walls[x][y][3] = True
    # Parede interna entre (1,1) e (2,1): leste de (1,1) = oeste de (2,1)
    walls[1][1][1] = True
    walls[2][1][3] = True
    return walls


def _payload(walls=None):
    p = {
        "robot_id": "x", "timestamp": "2026-06-06T12:00:00Z",
        "maze_type": "4x4",
        "current_position": {"x": 90, "y": 90, "z": 9.81, "orientation": 0},
        "path_traversed": [{"x": 90, "y": 90, "z": 9.81}],
        "battery_voltage_v": 7.4, "speed_mm_s": 0, "elapsed_time_ms": 1000,
        "race_status": "finished", "event": "race_ended",
        "source": "simulator", "success": True,
    }
    if walls is not None:
        p["known_walls"] = walls
    return p


def test_known_walls_persistido_e_devolvido():
    walls = _walls_4x4()
    client.post("/telemetria", json=_payload(walls))
    h = client.get("/historico").json()["data"]
    assert len(h) == 1
    assert h[0]["known_walls"] == walls
    assert h[0]["known_walls"][1][1] == [False, True, False, False]


def test_known_walls_ausente_fica_none():
    client.post("/telemetria", json=_payload(None))
    h = client.get("/historico").json()["data"]
    assert h[0]["known_walls"] is None


def test_known_walls_disponivel_em_historico_por_id():
    walls = _walls_4x4()
    client.post("/telemetria", json=_payload(walls))
    rid = client.get("/historico").json()["data"][0]["id"]
    r = client.get(f"/historico/{rid}").json()["data"]
    assert r["known_walls"] == walls
