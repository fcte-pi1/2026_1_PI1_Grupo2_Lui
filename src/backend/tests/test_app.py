import pytest
from fastapi.testclient import TestClient
from app import app  

client = TestClient(app)

def test_receber_telemetria_valida_ct17():
    """CT-17: Deve aceitar um pacote de telemetria completo e válido"""
    payload = {
        "robo_id": 1,
        "distancia_mm": 150,
        "bateria_v": 3.7,
        "eixo_x": 0.1,
        "eixo_y": -0.2,
        "eixo_z": 9.8
    }
    response = client.post("/telemetria", json=payload)
    assert response.status_code == 200
    assert response.json() == {"status": "sucesso", "mensagem": "Telemetria registrada com sucesso"}

def test_receber_telemetria_incompleta_ct18():
    """CT-18: Deve rejeitar pacotes que não possuem os campos obrigatórios"""
    payload = {
        "robo_id": 1
        # Propositadamente incompleto
    }
    response = client.post("/telemetria", json=payload)
    assert response.status_code == 422  # Erro padrão de validação do FastAPI