% Código levantamento de curva do sensor VL53L0X para calibração
% autor: João Victor P. Silva Marinho

clc
clear all
close all

% 1. DADOS COLETADOS (1 amostra por posição)
dados_S1 = [25, 48, 145, 173, 246];
dados_S2 = [39, 55, 151, 177, 241];
dados_S3 = [48, 62, 146, 180, 250];

% Valores medidos com a trena métrica
dist_real = [30, 50, 150, 180, 250];

% 2. AJUSTE LINEAR (y = ax + b)
coef_S1 = polyfit(dist_real, dados_S1, 1);
coef_S2 = polyfit(dist_real, dados_S2, 1);
coef_S3 = polyfit(dist_real, dados_S3, 1);

% 3. EXIBIÇÃO DOS RESULTADOS NO TERMINAL
fprintf('--- RESULTADOS DA CALIBRAÇÃO ---\n');
fprintf('Sensor 1 -> Equação: Medida = %.4f * Real + (%.4f)\n', coef_S1(1), coef_S1(2));
fprintf('Sensor 2 -> Equação: Medida = %.4f * Real + (%.4f)\n', coef_S2(1), coef_S2(2));
fprintf('Sensor 3 -> Equação: Medida = %.4f * Real + (%.4f)\n', coef_S3(1), coef_S3(2));

% 4. PLOTAGEM DO GRÁFICO
figure;
hold on; grid on;

% Plota as linhas ideais e de ajuste
plot(dist_real, dist_real, 'k--', 'LineWidth', 1.5); % Reta Ideal (Real = Medido)
plot(dist_real, polyval(coef_S1, dist_real), '-r', 'LineWidth', 1.2);
plot(dist_real, polyval(coef_S2, dist_real), '-b', 'LineWidth', 1.2);
plot(dist_real, polyval(coef_S3, dist_real), '-g', 'LineWidth', 1.2);

% Plota os pontos reais
plot(dist_real, dados_S1, 'or', 'MarkerFaceColor', 'r');
plot(dist_real, dados_S2, 'ob', 'MarkerFaceColor', 'b');
plot(dist_real, dados_S3, 'og', 'MarkerFaceColor', 'g');

% Formatação visual do gráfico
xlabel('Distância Real da Trena (mm)', 'FontSize', 12);
ylabel('Distância Lida pelo Sensor (mm)', 'FontSize', 12);
title('Curva de Calibração: Sensores VL53L0X vs Distância Real', 'FontSize', 14);
legend('Referência Ideal (1:1)', 'Ajuste S1', 'Ajuste S2', 'Ajuste S3', ...
       'Dados S1', 'Dados S2', 'Dados S3', 'Location', 'NorthWest');
hold off;
