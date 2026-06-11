import pytest
from fastapi.testclient import TestClient

from app import app 

client = TestClient(app)

def test_receber_comando_conectar_sucesso():
    # Frontend enviando um payload válido para o Backend
    payload = {"comando": "conectar"}
    response = client.post("/comandos", json=payload)
    
    # Espera que a rota processe e aceite o formato
    assert response.status_code == 200
    assert response.json()["status"] == "comando_recebido"

def test_receber_comando_invalido():
    # Envia um comando não suportado pelo sistema
    payload = {"comando": "voar"}
    response = client.post("/comandos", json=payload)
    
    # Espera erro de validação (422 Unprocessable Entity) do Pydantic
    assert response.status_code == 422