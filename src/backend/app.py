import logging
import math
from typing import Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database.database import init_db, salvar_corrida, listar_corridas
from memory.session_buffer import (
    start_session, update_session, get_session,
    clear_session, calculate_avg_speed
)
from schemas.telemetria import TelemetriaSchema, MazeTypeEnum, RaceStatusEnum

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

init_db()

app = FastAPI(
    title="API de Telemetria do Robô",
    description="API para recebimento de dados de telemetria e consulta de histórico.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calcular_distancia_total(path_traversed: list) -> float:
    dist_total = 0.0
    for i in range(1, len(path_traversed)):
        p1, p2 = path_traversed[i - 1], path_traversed[i]
        dist_total += math.hypot(p2.x - p1.x, p2.y - p1.y)
    return dist_total


@app.post("/telemetria", status_code=200)
def receber_telemetria(dados: TelemetriaSchema):
    logger.info(f"Recebido: Robô {dados.robot_id} | Status: {dados.race_status} | Evento: {dados.event}")

    if dados.race_status == RaceStatusEnum.running:
        if not get_session(dados.robot_id):
            start_session(
                robot_id=dados.robot_id,
                maze_type=dados.maze_type.value,
                battery_v=dados.battery_voltage_v,
                timestamp=dados.timestamp
            )
        update_session(dados.robot_id, dados.current_position)

    elif dados.race_status == RaceStatusEnum.finished or dados.event == "race_ended":
        session = get_session(dados.robot_id)

        battery_start = session.battery_start_v if session else dados.battery_voltage_v
        started_at = session.started_at if session else dados.timestamp

        if session and session.total_distance > 0:
            avg_speed = calculate_avg_speed(dados.robot_id, dados.elapsed_time_ms)
        else:
            dist_total = calcular_distancia_total(dados.path_traversed)
            avg_speed = round(dist_total / (dados.elapsed_time_ms / 1000.0), 2) if dados.elapsed_time_ms > 0 else 0.0

        step_count = len(dados.path_traversed)

        try:
            salvar_corrida(
                robot_id=dados.robot_id,
                maze_type=dados.maze_type.value,
                started_at=started_at,
                finished_at=dados.timestamp,
                elapsed_time_ms=dados.elapsed_time_ms,
                avg_speed_mm_s=avg_speed,
                battery_start_v=battery_start,
                battery_end_v=dados.battery_voltage_v,
                path_traversed=[p.model_dump() for p in dados.path_traversed],
                step_count=step_count
            )
            logger.info(f"Corrida salva: {step_count} passos, Vel. Média: {avg_speed} mm/s")
        except Exception as e:
            logger.error(f"Erro ao persistir corrida: {e}")
            raise HTTPException(status_code=500, detail="Erro interno ao salvar histórico")
        finally:
            clear_session(dados.robot_id)

    elif dados.race_status == RaceStatusEnum.error:
        clear_session(dados.robot_id)

    return {"status": "sucesso", "mensagem": "Dados processados"}


@app.get("/historico", status_code=200)
def obter_historico(
    maze_type: Optional[MazeTypeEnum] = Query(
        None,
        description="Filtra o histórico pelo tipo de labirinto. Valores permitidos: 4x4, 8x8, 16x16"
    )
):
    try:
        filtro = maze_type.value if maze_type else None
        corridas = listar_corridas(filtro)
        return {"status": "sucesso", "data": corridas}
    except Exception as e:
        logger.error(f"Erro ao listar histórico: {e}")
        raise HTTPException(status_code=500, detail="Erro interno ao buscar o histórico de corridas.")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)