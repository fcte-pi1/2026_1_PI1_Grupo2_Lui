import logging
import math
from typing import Optional
from fastapi import FastAPI, Query, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database.database import init_db, salvar_corrida, listar_corridas, buscar_corrida
from memory.session_buffer import (
    start_session, update_session, get_session,
    clear_session, calculate_avg_speed
)
from schemas.telemetria import TelemetriaSchema, MazeTypeEnum, RaceStatusEnum
from websocket.manager import manager

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

init_db()

app = FastAPI(title="Telemetria do Robô", version="1.4.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def calcular_distancia_total(path):
    d = 0.0
    for i in range(1, len(path)):
        p1, p2 = path[i - 1], path[i]
        d += math.hypot(p2.x - p1.x, p2.y - p1.y)
    return d


@app.get("/health", status_code=200)
def health():
    return {"status": "ok", "websocket_clients": manager.active_count}


@app.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)
    except Exception as exc:
        logger.warning(f"WS encerrado: {exc}")
        manager.disconnect(websocket)


@app.post("/telemetria", status_code=200)
async def receber_telemetria(dados: TelemetriaSchema):
    logger.info(f"Recebido: {dados.robot_id} | {dados.race_status} | {dados.event}")

    if dados.race_status == RaceStatusEnum.running:
        if not get_session(dados.robot_id):
            start_session(dados.robot_id, dados.maze_type.value, dados.battery_voltage_v, dados.timestamp)
        update_session(dados.robot_id, dados.current_position)
    elif dados.race_status == RaceStatusEnum.error:
        clear_session(dados.robot_id)

    session = get_session(dados.robot_id)
    passos_atual = len(session.path_points) if session else len(dados.path_traversed)
    try:
        await manager.broadcast({**dados.model_dump(), "step_count": passos_atual})
    except Exception as exc:
        logger.error(f"Broadcast falhou: {exc}")
    logger.info(f"-> {manager.active_count} dashboard(s)")

    eh_final = dados.race_status == RaceStatusEnum.finished or dados.event == "race_ended"
    if eh_final:
        session = get_session(dados.robot_id)
        battery_start = session.battery_start_v if session else dados.battery_voltage_v
        started_at = session.started_at if session else dados.timestamp

        if session and session.total_distance > 0:
            avg_speed = calculate_avg_speed(dados.robot_id, dados.elapsed_time_ms)
        else:
            dist = calcular_distancia_total(dados.path_traversed)
            avg_speed = round(dist / (dados.elapsed_time_ms / 1000.0), 2) if dados.elapsed_time_ms > 0 else 0.0

        success_flag = dados.success if dados.success is not None else True

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
                step_count=len(dados.path_traversed),
                source=dados.source,
                success=success_flag,
                known_walls=dados.known_walls,
            )
            walls_log = "sim" if dados.known_walls else "nao"
            logger.info(f"Salva: {len(dados.path_traversed)} passos, {avg_speed} mm/s, source={dados.source}, success={success_flag}, mapa={walls_log}")
        except Exception as e:
            logger.error(f"Erro persistir: {e}")
            raise HTTPException(status_code=500, detail="Erro ao salvar histórico")
        finally:
            clear_session(dados.robot_id)

    return {"status": "sucesso", "mensagem": "Dados processados"}


@app.get("/historico", status_code=200)
def obter_historico(maze_type: Optional[MazeTypeEnum] = Query(None, description="4x4, 8x8, 16x16")):
    try:
        filtro = maze_type.value if maze_type else None
        return {"status": "sucesso", "data": listar_corridas(filtro)}
    except Exception as e:
        logger.error(f"Erro listar: {e}")
        raise HTTPException(status_code=500, detail="Erro ao buscar histórico")


@app.get("/historico/{corrida_id}", status_code=200)
def obter_corrida(corrida_id: int):
    corrida = buscar_corrida(corrida_id)
    if corrida is None:
        raise HTTPException(status_code=404, detail="Corrida não encontrada")
    return {"status": "sucesso", "data": corrida}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
