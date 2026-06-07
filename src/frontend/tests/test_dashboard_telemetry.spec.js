import { test, expect } from '@playwright/test';

test.describe('Telemetria do dashboard', () => {
  // Ao receber um pacote via WebSocket, o dashboard mostra bateria, velocidade,
  // tempo, status e o robô no labirinto.
  test('exibe os dados da corrida ao receber telemetria', async ({ page }) => {
    // Intercepta o WebSocket para injetar um pacote de telemetria
    await page.routeWebSocket('**/ws/dashboard', ws => {
      ws.onMessage(() => {
        // Ignora mensagens enviadas pelo cliente
      });

      // Simula a chegada de um pacote após a página carregar
      setTimeout(() => {
        ws.send(JSON.stringify({
          source: 'real',
          timestamp: new Date().toISOString(),
          maze_type: '8x8',
          battery_voltage_v: 7.2, // 7.2V -> 50%
          speed_mm_s: 150.0,      // 150 mm/s -> 15.0 cm/s
          elapsed_time_ms: 45000, // 45000 ms -> 45.0 s
          step_count: 55,
          race_status: 'running',
          event: 'start_race',    // status "Mapeando..."
          current_position: { x: 270, y: 90, orientation: 90 },
          path_traversed: [
            { x: 90, y: 90 },
            { x: 270, y: 90 }
          ]
        }));
      }, 1000);
    });

    await page.goto('/');

    // Ativa o modo corrida para escutar a telemetria
    await page.getByLabel('Alternar Modo de Operação').click({ force: true });

    // o modo agora exibe "Corrida" e aceita telemetria
    await expect(page.getByText('Corrida', { exact: true }).first()).toBeVisible({ timeout: 5000 });

    // bateria convertida para 50%
    await expect(page.getByText('50%')).toBeVisible();

    // velocidade convertida para 15.0 cm/s
    await expect(page.getByText('15.0')).toBeVisible();

    // tempo convertido para 45.0 s
    await expect(page.getByText('45.0')).toBeVisible();

    // status da corrida
    await expect(page.getByText('Mapeando...')).toBeVisible();

    // o labirinto e o robô são renderizados
    await expect(page.locator('#robot')).toBeVisible();
    await expect(page.locator('#maze-container')).toBeVisible();
  });
});
