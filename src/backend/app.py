import asyncio
import logging
import math
from typing import Optional
from fastapi import FastAPI, Query, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from database.database import init_db, salvar_corrida, listar_corridas, buscar_corrida, limpar_banco
from memory.session_buffer import (
    start_session, update_session, get_session,
    clear_session, calculate_avg_speed
)
from schemas.telemetria import TelemetriaSchema, MazeTypeEnum, RaceStatusEnum
from websocket.manager import manager
from serial_bridge import bridge

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
    """POST externo (simulador, fake_robot.py, firmware via HTTP). Contrato inalterado."""
    return await processar_telemetria(dados)


async def processar_telemetria(dados: TelemetriaSchema):
    """Núcleo compartilhado de processamento de telemetria: usado pelo POST acima e
    injetado diretamente pela ponte serial (sem HTTP interno)."""
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


# ---- Comandos que vao pro robô ----
# a ponte serial conecta no websocket /ws/robo e fica la escutando.
# ai qnd a gnt clica em iniciar no front, empurra o comando por la direto
# detalhe: se a ponte n tiver conectada na hr, o comando fica na fila e vai dps.
import re as _re

COMANDO_RE = _re.compile(r"^(start( (4|8|16))?|reset)$")
_comando_pendente: Optional[str] = None
_pontes_conectadas: set = set()


from pydantic import BaseModel


class ComandoSchema(BaseModel):
    command: str


async def _entregar_comando(cmd: str) -> int:
    """dispara o comando pra tds os websockets abertos e conta qnts deram certo"""
    entregues = 0
    for ws in list(_pontes_conectadas):
        try:
            await ws.send_json({"command": cmd})
            entregues += 1
        except Exception:
            _pontes_conectadas.discard(ws)
    return entregues


@app.post("/comando", status_code=200)
async def enviar_comando(comando: ComandoSchema):
    global _comando_pendente
    cmd = comando.command.strip().lower()
    if not COMANDO_RE.match(cmd):
        raise HTTPException(status_code=422, detail=f"Comando inválido: {cmd}")
    # Caminho principal: serial gerida pelo backend.
    if bridge.write_command(cmd):
        logger.info(f"Comando '{cmd}' escrito na serial")
        return {"status": "sucesso", "mensagem": f"Comando '{cmd}' enviado ao robô (serial)"}
    # Compatibilidade: ponte legada via WebSocket /ws/robo.
    entregues = await _entregar_comando(cmd)
    if entregues == 0:
        _comando_pendente = cmd  # entrega quando a ponte conectar
        logger.info(f"Comando '{cmd}' pendente (nenhuma ponte conectada)")
        return {"status": "sucesso", "mensagem": f"Comando '{cmd}' aguardando a ponte conectar"}
    logger.info(f"Comando '{cmd}' entregue a {entregues} ponte(s)")
    return {"status": "sucesso", "mensagem": f"Comando '{cmd}' enviado ao robô"}


@app.websocket("/ws/robo")
async def websocket_robo(websocket: WebSocket):
    """endpoint pra ponte do bluetooth plugar. os comandos q vem do front caem aqui."""
    global _comando_pendente
    await websocket.accept()
    _pontes_conectadas.add(websocket)
    logger.info(f"Ponte serial conectada ({len(_pontes_conectadas)} ativa(s))")
    if _comando_pendente:
        try:
            await websocket.send_json({"command": _comando_pendente})
            _comando_pendente = None
        except Exception:
            pass
    try:
        while True:
            await websocket.receive_text()  # keepalive; conteúdo ignorado
    except WebSocketDisconnect:
        pass
    finally:
        _pontes_conectadas.discard(websocket)
        logger.info("Ponte serial desconectada")


# ---- Ponte serial gerida pelo backend ----
# Absorve o antigo scripts/bt_bridge.py: o backend abre a COM direto e injeta
# a telemetria no mesmo pipeline. O /ws/robo acima fica como legado/compat.


@app.on_event("startup")
async def _configurar_ponte_serial():
    bridge.configure(asyncio.get_running_loop(), processar_telemetria)


class SerialConectarSchema(BaseModel):
    port: str
    baud: int = 921600


@app.get("/serial/portas", status_code=200)
def serial_portas():
    """Lista as COMs disponíveis (marca Bluetooth e a porta de saída sugerida)."""
    return {"status": "sucesso", "portas": bridge.listar_portas()}


@app.post("/serial/conectar", status_code=200)
def serial_conectar(body: SerialConectarSchema):
    try:
        bridge.connect(body.port, body.baud)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Não foi possível abrir {body.port}: {exc}")
    return {"status": "sucesso", "mensagem": f"Conectado a {body.port}", "data": bridge.status()}


@app.post("/serial/desconectar", status_code=200)
def serial_desconectar():
    bridge.disconnect()
    return {"status": "sucesso", "mensagem": "Serial desconectada", "data": bridge.status()}


@app.get("/serial/status", status_code=200)
def serial_status():
    return bridge.status()


# Hosts considerados locais para operações administrativas (RNF-10):
# loopback IPv4/IPv6 e o placeholder usado pelo TestClient do Starlette.
# Premissa: backend roda sem proxy reverso (execução local, RE-04/RE-05).
LOCAL_ADMIN_HOSTS = {"127.0.0.1", "::1", "localhost", "testclient"}


def require_local_request(request: Request) -> None:
    """Restringe a operação à máquina que executa o backend (RNF-10/CT-40).

    Dashboards abertos em outras máquinas da LAN recebem 403; a limpeza do
    histórico só é possível a partir do próprio host do servidor.
    """
    host = request.client.host if request.client else None
    if host not in LOCAL_ADMIN_HOSTS:
        logger.warning(f"DELETE /historico negado para origem remota: {host}")
        raise HTTPException(
            status_code=403,
            detail="Operação administrativa: permitida apenas a partir da máquina do servidor",
        )


@app.delete("/historico", status_code=200)
def apagar_historico(request: Request):
    require_local_request(request)
    try:
        limpar_banco()
        return {"status": "sucesso", "mensagem": "Histórico apagado com sucesso"}
    except Exception as e:
        logger.error(f"Erro ao limpar banco: {e}")
        raise HTTPException(status_code=500, detail="Erro ao limpar histórico")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=True)
