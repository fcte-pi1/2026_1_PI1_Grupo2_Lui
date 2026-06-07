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
                step_count       INTEGER NOT NULL,
                source           TEXT    NOT NULL DEFAULT 'real',
                success          INTEGER,
                known_walls      TEXT
            )
            """
        )
        existing_cols = {row[1] for row in conn.execute("PRAGMA table_info(corridas)").fetchall()}
        if "source" not in existing_cols:
            conn.execute("ALTER TABLE corridas ADD COLUMN source TEXT NOT NULL DEFAULT 'real'")
        if "success" not in existing_cols:
            conn.execute("ALTER TABLE corridas ADD COLUMN success INTEGER")
        if "known_walls" not in existing_cols:
            conn.execute("ALTER TABLE corridas ADD COLUMN known_walls TEXT")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_corridas_maze_type ON corridas (maze_type)")
        conn.execute("CREATE INDEX IF NOT EXISTS idx_corridas_source ON corridas (source)")
        conn.commit()


def _row_to_record(row):
    record = dict(row)
    record["path_traversed"] = json.loads(record["path_traversed"])
    raw_success = record.get("success")
    record["success"] = None if raw_success is None else bool(raw_success)
    record.setdefault("source", "real")
    raw_walls = record.get("known_walls")
    record["known_walls"] = json.loads(raw_walls) if raw_walls else None
    return record


def salvar_corrida(
    robot_id, maze_type, started_at, finished_at,
    elapsed_time_ms, avg_speed_mm_s,
    battery_start_v, battery_end_v,
    path_traversed, step_count,
    source="real", success=None, known_walls=None,
):
    with managed_connection() as conn:
        cursor = conn.execute(
            "INSERT INTO corridas (robot_id, maze_type, started_at, finished_at, elapsed_time_ms, avg_speed_mm_s, battery_start_v, battery_end_v, path_traversed, step_count, source, success, known_walls) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            (
                robot_id, maze_type, started_at, finished_at,
                elapsed_time_ms, avg_speed_mm_s,
                battery_start_v, battery_end_v,
                json.dumps(path_traversed), step_count,
                source,
                None if success is None else int(bool(success)),
                json.dumps(known_walls) if known_walls is not None else None,
            ),
        )
        conn.commit()
        return cursor.lastrowid


def listar_corridas(maze_type=None):
    with managed_connection() as conn:
        if maze_type:
            rows = conn.execute(
                "SELECT * FROM corridas WHERE maze_type = ? ORDER BY id DESC",
                (maze_type,),
            ).fetchall()
        else:
            rows = conn.execute("SELECT * FROM corridas ORDER BY id DESC").fetchall()
    return [_row_to_record(r) for r in rows]


def buscar_corrida(corrida_id):
    with managed_connection() as conn:
        row = conn.execute(
            "SELECT * FROM corridas WHERE id = ?",
            (corrida_id,),
        ).fetchone()
    return _row_to_record(row) if row else None


def limpar_banco():
    with managed_connection() as conn:
        conn.execute("DELETE FROM corridas")
        conn.commit()
