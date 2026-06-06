import { test, expect } from '@playwright/test';

test.describe('Dashboard Telemetry Test (CT-26)', () => {
  test('Deve exibir os dados básicos da corrida simulando recebimento de telemetria', async ({ page }) => {
    // Interceptar a conexão WebSocket para injetar telemetria
    await page.routeWebSocket('**/ws/dashboard', ws => {
      ws.onMessage(() => {
        // Ignora mensagens enviadas pelo cliente
      });

      // Simula a chegada de um pacote de telemetria após a página carregar
      setTimeout(() => {
        ws.send(JSON.stringify({
          source: 'real',
          timestamp: new Date().toISOString(),
          maze_type: '8x8',
          battery_voltage_v: 7.2, // 7.2V deve resultar em 50% segundo o batteryVoltsToPercent
          speed_mm_s: 150.0,      // 150.0 mm/s deve resultar em 15.0 cm/s
          elapsed_time_ms: 45000, // 45000 ms deve resultar em 45.0 s
          step_count: 55,
          race_status: 'running',
          event: 'start_race',    // Resulta no status "Mapeando..."
          current_position: { x: 270, y: 90, orientation: 90 }, // Robô em uma posição válida
          path_traversed: [
            { x: 90, y: 90 },
            { x: 270, y: 90 }
          ]
        }));
      }, 1000);
    });

    await page.goto('/');

    // Aguarda que o modo alterne para "Real" ao receber o pacote via WebSocket
    await expect(page.getByText('Real', { exact: true })).toBeVisible({ timeout: 5000 });

    // Verificar exibição da bateria (50%)
    await expect(page.getByText('50%')).toBeVisible();

    // Verificar exibição da velocidade (15.0)
    await expect(page.getByText('15.0')).toBeVisible();

    // Verificar exibição do tempo (45.0)
    await expect(page.getByText('45.0')).toBeVisible();

    // Verificar exibição do status da corrida ("Mapeando...")
    await expect(page.getByText('Mapeando...')).toBeVisible();

    // Verificar exibição do labirinto / trajeto na tela
    // O id="robot" ou a classe "cell" no maze-container confirmam que a matriz está sendo renderizada
    await expect(page.locator('#robot')).toBeVisible();
    await expect(page.locator('#maze-container')).toBeVisible();
  });
});
