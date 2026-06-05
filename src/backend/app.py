import logging
from typing import List, Optional
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from database.database import init_db, salvar_corrida, listar_corridas
from memory.session_buffer import (
    start_session, update_session, get_session, 
    clear_session, calculate_avg_speed
)
from schemas.telemetria import TelemetriaSchema, Position

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

init_db()

app = FastAPI(title="API de Telemetria do Robô")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/telemetria")
def receber_telemetria(dados: TelemetriaSchema):
    logger.info(f"Recebido: Robô {dados.robot_id} | Status: {dados.race_status} | Evento: {dados.event}")

    if dados.race_status == "running":
        if not get_session(dados.robot_id):
            start_session(
                dados.robot_id, 
                dados.maze_type, 
                dados.battery_voltage_v, 
                dados.timestamp
            )
        update_session(dados.robot_id, dados.current_position)
    
    elif dados.race_status == "finished" or dados.event == "race_ended":
        session = get_session(dados.robot_id)
        
        battery_start = session.battery_start_v if session else dados.battery_voltage_v
        started_at = session.started_at if session else dados.timestamp
        
        if session and session.total_distance > 0:
            avg_speed = calculate_avg_speed(dados.robot_id, dados.elapsed_time_ms)
        else:
            dist_total = 0.0
            for i in range(1, len(dados.path_traversed)):
                p1, p2 = dados.path_traversed[i-1], dados.path_traversed[i]
                dist_total += ((p2.x - p1.x)**2 + (p2.y - p1.y)**2)**0.5
            avg_speed = round(dist_total / (dados.elapsed_time_ms / 1000.0), 2) if dados.elapsed_time_ms > 0 else 0.0

        step_count = len(dados.path_traversed)

        try:
            salvar_corrida(
                robot_id=dados.robot_id,
                maze_type=dados.maze_type,
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
            clear_session(dados.robot_id)
        except Exception as e:
            logger.error(f"Erro ao persistir corrida: {e}")
            raise HTTPException(status_code=500, detail="Erro interno ao salvar histórico")

    elif dados.race_status == "error":
        clear_session(dados.robot_id)

    return {"status": "sucesso", "mensagem": "Dados processados"}

@app.get("/historico")
def obter_historico(maze_type: Optional[str] = Query(None, enum=["4x4", "8x8", "16x16"])):
    try:
        corridas = listar_corridas(maze_type)
        return {"status": "sucesso", "data": corridas}
    except Exception as e:
        logger.error(f"Erro ao listar histórico: {e}")
        return {"status": "erro", "mensagem": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
