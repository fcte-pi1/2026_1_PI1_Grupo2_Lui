#include <Arduino.h>
#include <unity.h>

#include "network/network.h" 

void setUp(void) {
    // Redefine o estado antes de cada teste
    RobotNetwork::currentState = "desconectado";
}

void tearDown(void) {
    // Limpeza após o teste
}

void test_receber_comando_conectar() {
    String payload = "{\"comando\":\"conectar\"}";
    RobotNetwork::processCommand(payload);
    TEST_ASSERT_EQUAL_STRING("connected", RobotNetwork::currentState.c_str());
}

void test_receber_comando_invalido() {
    String payload = "{\"comando\":\"voar\"}";
    RobotNetwork::processCommand(payload);
    TEST_ASSERT_EQUAL_STRING("error", RobotNetwork::currentState.c_str());
}

void setup() {
    delay(2000); 
    UNITY_BEGIN();
    RUN_TEST(test_receber_comando_conectar);
    RUN_TEST(test_receber_comando_invalido);
    UNITY_END();
}

void loop() {
}