import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
from app import app 

client = TestClient(app)

def test_receber_comando_conectar_sucesso():
    # Frontend enviando um payload válido para o Backend
    payload = {"comando": "conectar"}
    response = client.post("/comandos", json=payload)
    
    # Espera que a rota processe e aceite o formato
    assert response.status_code == 200
    assert response.json()["status"] == "comando_enviado"

def test_receber_comando_invalido():
    # Envia um comando não suportado pelo sistema
    payload = {"comando": "voar"}
    response = client.post("/comandos", json=payload)
    
    # Espera erro de validação (422 Unprocessable Entity) do Pydantic
    assert response.status_code == 422

# O @patch substitui a função real por um "espião" durante o teste
@patch("app.encaminhar_para_esp32")
def test_encaminhamento_ao_esp32(mock_encaminhar):
    # Simula que a função de envio retornou Sucesso (True)
    mock_encaminhar.return_value = True
    
    payload = {"comando": "iniciar"}
    response = client.post("/comandos", json=payload)
    
    assert response.status_code == 200
    assert response.json()["status"] == "comando_enviado"
    
    # Verifica se a rota chamou a função de encaminhar passando a string "iniciar"
    mock_encaminhar.assert_called_once_with("iniciar")

@patch("app.encaminhar_para_esp32")
def test_encaminhamento_falha_esp32_offline(mock_encaminhar):
    # Simula que o ESP32 está desligado ou deu timeout
    mock_encaminhar.return_value = False
    
    payload = {"comando": "iniciar"}
    response = client.post("/comandos", json=payload)
    
    # Espera que a API retorne o erro 503 (Serviço Indisponível)
    assert response.status_code == 503
    assert response.json()["detail"] == "Falha de comunicação com o ESP32 (Timeout/Offline)"