#include <Arduino.h>
#include <unity.h>

#include "movimento/movimento.h"

void setUp(void) {
}

void tearDown(void) {
}

void test_mover_frente_deve_existir(void) {
    mover_frente(150, 100); 
    TEST_ASSERT_TRUE(true); 
}

void test_girar_esquerda_deve_existir(void) {
    girar_esquerda(150, 100);
    TEST_ASSERT_TRUE(true);
}

void setup() {
    delay(2000); 
    
    UNITY_BEGIN(); 
    
    RUN_TEST(test_mover_frente_deve_existir);
    RUN_TEST(test_girar_esquerda_deve_existir);
    
    UNITY_END(); 
}

void loop() {
}