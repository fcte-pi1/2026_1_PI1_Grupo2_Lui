% Script de Calibração do Giroscópio MPU6500
clc; clear; close all;

% 1. DADOS COLETADOS
% Ângulos reais medidos no transferidor (Referência)
angulo_real = [0, 40, 80, 90];

% Médias das leituras do MPU6500 no monitor serial para cada posição
angulo_medido = [2.75, 39.23, 77.01, 88.21];

% 2. AJUSTE LINEAR (Regressão: Medida = a * Real + b)
coef_calibracao = polyfit(angulo_real, angulo_medido, 1);

% 3. EXIBIÇÃO NO TERMINAL
fprintf('--- RESULTADOS DA CALIBRAÇÃO DO MPU6500 ---\n');
fprintf('Equação do Sensor: Medida = %.4f * Real + (%.4f)\n', coef_calibracao(1), coef_calibracao(2));
fprintf('Para corrigir no código (C++), use: Real = (Medida - %.4f) / %.4f\n', coef_calibracao(2), coef_calibracao(1));

% 4. PLOTAGEM DO GRÁFICO
figure;
hold on; grid on;

% Plota a Reta Ideal (1:1) - Como o sensor deveria ser se fosse perfeito
plot(angulo_real, angulo_real, 'k--', 'LineWidth', 1.5);

% Plota a Reta de Ajuste (Regressão dos dados medidos)
plot(angulo_real, polyval(coef_calibracao, angulo_real), '-b', 'LineWidth', 1.2);

% Plota os pontos reais coletados nos testes
plot(angulo_real, angulo_medido, 'ob', 'MarkerFaceColor', 'b', 'MarkerSize', 8);

% Formatação visual
xlabel('Ângulo Real no Transferidor (Graus)', 'FontSize', 12);
ylabel('Ângulo Lido pelo MPU6500 (Graus)', 'FontSize', 12);
title('Curva de Calibração: MPU6500 vs Transferidor', 'FontSize', 14);
legend('Referência Ideal (1:1)', 'Ajuste Linear (Calibração)', 'Dados Coletados', 'Location', 'NorthWest');

hold off;
