% Engenheiro: João Victor Pereira Silva
% Projeto: Micromouse - Projeto integrador I

% Dados coletados (ignorando a zona morta de 1cm)
dist_cm = [10; 20; 30];
tensoes = [0.226; 0.266; 0.276]; % Valores da coluna "branco"

dist_m = dist_cm / 100; % Conversão para metros
y = 1 ./ dist_m; % O inverso da distância em metros
x = tensoes;

% Cálculo da Regressão Linear (1/d = a*V + b)
p = polyfit(x, y, 1); % polyfit retorna os coeficientes [a, b]
a = p(1);
b = p(2);

fprintf('Coeficiente a: %.4f\n', a);
fprintf('Coeficiente b: %.4f\n', b);

% Função de conversão para teste
v_teste = 0.260; % Exemplo de tensão lida pelo sensor
dist_calculada = 1 / (a * v_teste + b);

fprintf('\nPara uma leitura de %.3fV, a distancia estimada e: %.4f metros\n', v_teste, dist_calculada);

% 5. Plotagem para verificação visual
plot(x, y, 'ro', 'DisplayName', 'Dados Coletados');
hold on;
plot(x, polyval(p, x), 'b-', 'DisplayName', 'Linha de Tendência');
xlabel('Tensao (V)');
ylabel('1 / Distancia (1/m)');
title('Calibracao do Sensor Sharp - Parede Branca');
legend('location', 'northwest');
grid on;
