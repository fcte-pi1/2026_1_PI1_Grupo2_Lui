from pydantic import BaseModel
from typing import Literal

class ComandoSchema(BaseModel):
    # Aceita apenas os comandos mapeados na nossa arquitetura
    comando: Literal["conectar", "iniciar"]