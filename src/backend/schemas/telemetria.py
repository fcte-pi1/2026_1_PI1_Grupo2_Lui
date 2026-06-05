from pydantic import BaseModel
from typing import List, Optional
from enum import Enum


class MazeTypeEnum(str, Enum):
    maze_4x4 = "4x4"
    maze_8x8 = "8x8"
    maze_16x16 = "16x16"


class RaceStatusEnum(str, Enum):
    running = "running"
    finished = "finished"
    error = "error"


class Position(BaseModel):
    x: float
    y: float
    z: float
    orientation: Optional[float] = None


class PathPoint(BaseModel):
    x: float
    y: float
    z: float


class TelemetriaSchema(BaseModel):
    robot_id: str
    timestamp: str
    maze_type: MazeTypeEnum
    current_position: Position
    path_traversed: List[PathPoint]
    battery_voltage_v: float
    speed_mm_s: float
    elapsed_time_ms: int
    race_status: RaceStatusEnum
    event: Optional[str] = None
    message: Optional[str] = None
    objective_location: Optional[Position] = None


class SessionData(BaseModel):
    robot_id: str
    maze_type: str
    battery_start_v: float
    started_at: str
    path_points: List[Position] = []
    total_distance: float = 0.0


class CorridaResponse(BaseModel):
    id: int
    robot_id: str
    maze_type: str
    started_at: str
    finished_at: str
    elapsed_time_ms: int
    avg_speed_mm_s: float
    battery_start_v: float
    battery_end_v: float
    path_traversed: List[PathPoint]
    step_count: int