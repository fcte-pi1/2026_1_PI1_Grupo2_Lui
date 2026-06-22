#include "network.h"
#include <ArduinoJson.h>

// Inicializa o estado padrão (necessário por ser uma variável estática)
String RobotNetwork::currentState = "desconectado";

void RobotNetwork::processCommand(String payload) {
    // Cria o documento JSON (Sintaxe oficial do ArduinoJson v7)
    JsonDocument doc;
    
    // Tenta ler e converter a string recebida
    DeserializationError error = deserializeJson(doc, payload);

    // Se a mensagem não for um JSON válido, vai para estado de erro
    if (error) {
        currentState = "error";
        return;
    }

    // Extrai o valor associado à chave "comando"
    const char* comando = doc["comando"];

    if (comando != nullptr) {
        // Verifica se o comando é o "conectar" exigido no critério da issue
        if (strcmp(comando, "conectar") == 0) {
            currentState = "connected"; 
        } 
        // Se for um comando desconhecido (como o "voar" do nosso teste)
        else {
            currentState = "error"; 
        }
    } 
    // Se for um JSON válido, mas que não tem a palavra "comando" dentro dele
    else {
        currentState = "error"; 
    }
}