import os
import json
import sqlite3

os.makedirs("db", exist_ok=True)

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
    conn = sqlite3.connect(path)
    conn.row_factory = sqlite3.Row
    return conn
 
 
def init_db() -> None:
    conn = get_connection()
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
            path_traversed   TEXT    NOT NULL
        )
        """
    )
    conn.execute("""
    CREATE INDEX IF NOT EXISTS idx_corridas_maze_type
    ON corridas (maze_type)
    """)
    conn.commit()

    if os.environ.get("DB_PATH") == ":memory:":
        conn.close()
 
 
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
) -> int:
    conn = get_connection()
    cursor = conn.execute(
        """
        INSERT INTO corridas (
            robot_id, maze_type, started_at, finished_at,
            elapsed_time_ms, avg_speed_mm_s,
            battery_start_v, battery_end_v, path_traversed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
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
        ),
    )
    conn.commit()
    row_id = cursor.lastrowid

    if os.environ.get("DB_PATH") == ":memory:":
        conn.close()

    return row_id
 
 
def listar_corridas(maze_type: str | None = None) -> list[dict]:
    conn = get_connection()
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

    if os.environ.get("DB_PATH") == ":memory:":
        conn.close()

    return result
