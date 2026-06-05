#include <Arduino.h>
#include <unity.h>
#include "motors/motors.h"

void setUp(void) {}
void tearDown(void) {}

void test_conversao_pwm_limites(void) {
    // 0% tem que ser PWM 0. 100% tem que ser PWM 255.
    TEST_ASSERT_EQUAL(0, converter_percentual_para_pwm(0));
    TEST_ASSERT_EQUAL(255, converter_percentual_para_pwm(100));
}

void test_conversao_pwm_intermediario(void) {
    // 50% de 255 é ~127. 20% é ~51.
    TEST_ASSERT_EQUAL(127, converter_percentual_para_pwm(50));
    TEST_ASSERT_EQUAL(51, converter_percentual_para_pwm(20));
}

void test_conversao_pwm_fora_dos_limites(void) {
    // Se mandar negativo ou mais de 100%, a função tem que travar nos limites
    TEST_ASSERT_EQUAL(0, converter_percentual_para_pwm(-10));
    TEST_ASSERT_EQUAL(255, converter_percentual_para_pwm(150));
}

void setup() {
    delay(2000);
    UNITY_BEGIN();
    
    RUN_TEST(test_conversao_pwm_limites);
    RUN_TEST(test_conversao_pwm_intermediario);
    RUN_TEST(test_conversao_pwm_fora_dos_limites);
    
    UNITY_END();
}

void loop() {}