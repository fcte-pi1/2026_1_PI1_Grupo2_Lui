import logging
from typing import List
from fastapi import WebSocket

logger = logging.getLogger(__name__)


class ConnectionManager:
    def __init__(self):
        self._active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket) -> None:
        await websocket.accept()
        self._active_connections.append(websocket)
        logger.info(
            f"Dashboard conectado. Total de conexões ativas: {len(self._active_connections)}"
        )

    def disconnect(self, websocket: WebSocket) -> None:
        if websocket in self._active_connections:
            self._active_connections.remove(websocket)
        logger.info(
            f"Dashboard desconectado. Total de conexões ativas: {len(self._active_connections)}"
        )

    async def broadcast(self, message: dict) -> None:
        if not self._active_connections:
            return

        dead_connections: List[WebSocket] = []

        for websocket in self._active_connections:
            try:
                await websocket.send_json(message)
            except Exception as exc:
                logger.warning(f"Falha ao enviar para um dashboard, removendo conexão: {exc}")
                dead_connections.append(websocket)

        for websocket in dead_connections:
            self.disconnect(websocket)

    @property
    def active_count(self) -> int:
        """Retorna o número de dashboards atualmente conectados."""
        return len(self._active_connections)


manager = ConnectionManager()