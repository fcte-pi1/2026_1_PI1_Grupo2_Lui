import { test, expect } from '@playwright/test';

test.describe('Dashboard Load Test', () => {
  test('Deve abrir a página principal sem erros de console e exibir as áreas principais', async ({ page }) => {
    const consoleErrors = [];
    
    // Captura erros no console do navegador
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Captura erros de JavaScript não tratados na página
    page.on('pageerror', exception => {
      consoleErrors.push(exception.message);
    });

    await page.goto('/');

    // 1. Verificar Mapa
    // O texto "Mapa do Labirinto" identifica a área do mapa principal
    await expect(page.getByText('Mapa do Labirinto')).toBeVisible();

    // 2. Verificar Telemetria
    // O título "Telemetria" identifica o painel de telemetria
    await expect(page.getByRole('heading', { name: 'Telemetria', exact: true })).toBeVisible();

    // 3. Verificar Status
    // O título "Status do Robô" identifica o painel de status
    await expect(page.getByRole('heading', { name: 'Status do Robô', exact: true })).toBeVisible();

    // 4. Verificar Histórico
    // Clicar na aba de histórico e validar se a view correspondente aparece
    await page.getByRole('button', { name: 'Histórico' }).click();
    await expect(page.getByTestId('historico-view')).toBeVisible();

    // Volta para o Mapa apenas para deixar no estado inicial
    await page.getByRole('button', { name: 'Mapa' }).click();

    // 5. Verificar se não houve erros críticos
    // Ignora erros de rede relacionados ao WebSocket tentando conectar ao backend que não está rodando no teste isolado
    const criticalErrors = consoleErrors.filter(err => 
      !err.includes('WebSocket connection to') && 
      !err.includes('Failed to fetch') && 
      !err.includes('net::ERR_CONNECTION_REFUSED')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
