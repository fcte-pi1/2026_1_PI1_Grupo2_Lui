import os
import json
import sqlite3
from contextlib import contextmanager

DB_PATH = "db/telemetria.db"
_memory_conn: sqlite3.Connection | None = None


def get_connection() -> sqlite3.Connection:
    global _memory_conn
    path = os.environ.get("DB_PATH", DB_PATH)
    if path == ":memory:":
        if _memory_conn is None:
            _memory_conn = sqlite3.connect(":memory:", check_same_thread=False)
            _memory_conn.row_factory = sqlite3.Row
        return _memory_conn

    os.makedirs(os.path.dirname(path) if os.path.dirname(path) else ".", exist_ok=True)
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn


@contextmanager
def managed_connection():
    """Context manager que fecha a conexão automaticamente para conexões em arquivo.
    Para :memory:, a conexão singleton é reutilizada e nunca fechada aqui."""
    conn = get_connection()
    is_memory = os.environ.get("DB_PATH") == ":memory:"
    try:
        yield conn
    finally:
        if not is_memory:
            conn.close()


def init_db() -> None:
    with managed_connection() as conn:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS corridas (
                id               INTEGER PRIMARY KEY AUTOINCREMENT,
                robot_id         TEXT    NOT NULL,
                maze_type        TEXT    NOT NULL,
                started_at       TEXT    NOT NULL,
                finished_at      TEXT    NOT NULL,
                elapsed_time_ms  INTEGER NOT NULL,
                avg_speed_mm_s   REAL    NOT NULL,
                battery_start_v  REAL    NOT NULL,
                battery_end_v    REAL    NOT NULL,
                path_traversed   TEXT    NOT NULL,
                step_count       INTEGER NOT NULL
            )
            """
        )
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_corridas_maze_type ON corridas (maze_type)"
        )
        conn.commit()


def salvar_corrida(
    robot_id: str,
    maze_type: str,
    started_at: str,
    finished_at: str,
    elapsed_time_ms: int,
    avg_speed_mm_s: float,
    battery_start_v: float,
    battery_end_v: float,
    path_traversed: list,
    step_count: int,
) -> int:
    with managed_connection() as conn:
        cursor = conn.execute(
            """
            INSERT INTO corridas (
                robot_id, maze_type, started_at, finished_at,
                elapsed_time_ms, avg_speed_mm_s,
                battery_start_v, battery_end_v, path_traversed, step_count
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                robot_id,
                maze_type,
                started_at,
                finished_at,
                elapsed_time_ms,
                avg_speed_mm_s,
                battery_start_v,
                battery_end_v,
                json.dumps(path_traversed),
                step_count,
            ),
        )
        conn.commit()
        return cursor.lastrowid


def listar_corridas(maze_type: str | None = None) -> list[dict]:
    with managed_connection() as conn:
        if maze_type:
            rows = conn.execute(
                "SELECT * FROM corridas WHERE maze_type = ? ORDER BY id DESC",
                (maze_type,),
            ).fetchall()
        else:
            rows = conn.execute(
                "SELECT * FROM corridas ORDER BY id DESC"
            ).fetchall()

    result = []
    for row in rows:
        record = dict(row)
        record["path_traversed"] = json.loads(record["path_traversed"])
        result.append(record)

    return result