from typing import Dict, Optional
import math
from schemas.telemetria import SessionData, Position

_sessions: Dict[str, SessionData] = {}

def start_session(robot_id: str, maze_type: str, battery_v: float, timestamp: str):
    _sessions[robot_id] = SessionData(
        robot_id=robot_id,
        maze_type=maze_type,
        battery_start_v=battery_v,
        started_at=timestamp,
        path_points=[]
    )

def update_session(robot_id: str, current_pos: Position):
    if robot_id in _sessions:
        session = _sessions[robot_id]
        if session.path_points:
            last_pos = session.path_points[-1]
            dist = math.sqrt((current_pos.x - last_pos.x)**2 + (current_pos.y - last_pos.y)**2)
            session.total_distance += dist
        session.path_points.append(current_pos)

def get_session(robot_id: str) -> Optional[SessionData]:
    return _sessions.get(robot_id)

def clear_session(robot_id: str):
    if robot_id in _sessions:
        del _sessions[robot_id]

def calculate_avg_speed(robot_id: str, elapsed_time_ms: int) -> float:
    if robot_id in _sessions and elapsed_time_ms > 0:
        session = _sessions[robot_id]
        avg_speed = session.total_distance / (elapsed_time_ms / 1000.0)
        return round(avg_speed, 2)
    return 0.0
