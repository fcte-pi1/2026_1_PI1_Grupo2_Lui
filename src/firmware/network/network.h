#ifndef NETWORK_H
#define NETWORK_H

#include <Arduino.h>

// Classe responsável por interpretar os comandos do Backend
class RobotNetwork {
public:
    // Variável estática para guardar o estado atual do robô
    static String currentState;

    // Função que recebe a mensagem WebSocket e decide o que fazer
    static void processCommand(String payload);
};

#endif