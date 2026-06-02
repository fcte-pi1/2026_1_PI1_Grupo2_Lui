import logging
from fastapi import FastAPI
from pydantic import BaseModel

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Inicialização do servidor
app = FastAPI(title="API de Telemetria do Robô")

# Definição do formato do pacote
class TelemetriaSchema(BaseModel):
    robo_id: int
    distancia_mm: int
    bateria_v: float
    eixo_x: float
    eixo_y: float
    eixo_z: float

# Criação do endpoint POST /telemetria
@app.post("/telemetria")
def receber_telemetria(dados: TelemetriaSchema):
    # Regista no log que o pacote foi recebido 
    logger.info(f"Pacote válido recebido do Robô {dados.robo_id}: {dados.model_dump()}")
    
    # Retorna sucesso 
    return {"status": "sucesso", "mensagem": "Telemetria registrada com sucesso"}