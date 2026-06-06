// Playwright — CT-28 e CT-29
// Referências: Tarefa 7.20 / US14
//
// Para rodar:
//   npx playwright test test/test_historico.spec.js

import { test, expect } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────

async function irParaCorrida(page) {
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Histórico' }).click();
  await expect(page.getByTestId('historico-view')).toBeVisible();
}

// ── Testes usando os dados estáticos do frontend (Temporário) ──
test.describe('Testes E2E - Frontend Estático', () => {

  test('CT-28 — filtro 4x4 exibe apenas corridas 4x4', async ({ page }) => {
    await irParaCorrida(page);
    await page.getByTestId('filtro-labirinto').selectOption('4x4');
    const itens = page.getByTestId('corrida-item');
    await expect(itens).toHaveCount(1);
    await expect(itens.first()).toContainText('4x4');
  });

  test('CT-28 — filtro 8x8 exibe apenas corridas 8x8', async ({ page }) => {
    await irParaCorrida(page);
    await page.getByTestId('filtro-labirinto').selectOption('8x8');
    const itens = page.getByTestId('corrida-item');
    await expect(itens).toHaveCount(1);
    await expect(itens.first()).toContainText('8x8');
  });

  test('CT-28 — filtro 16x16 exibe apenas corridas 16x16', async ({ page }) => {
    await irParaCorrida(page);
    await page.getByTestId('filtro-labirinto').selectOption('16x16');
    const itens = page.getByTestId('corrida-item');
    await expect(itens).toHaveCount(2);
    await expect(itens.first()).toContainText('16x16');
  });

  test('CT-29 — filtro Todos exibe todas as corridas', async ({ page }) => {
    await irParaCorrida(page);
    await page.getByTestId('filtro-labirinto').selectOption('4x4');
    await page.getByTestId('filtro-labirinto').selectOption('Todos');
    await expect(page.getByTestId('corrida-item')).toHaveCount(4);
  });

  test('CT-29 — Todos é o filtro padrão ao abrir a aba', async ({ page }) => {
    await irParaCorrida(page);
    await expect(page.getByTestId('corrida-item')).toHaveCount(4);
    await expect(page.getByTestId('filtro-labirinto')).toHaveValue('Todos');
  });

  test('CT-24 — exibe estado vazio quando não há corridas', async ({ page }) => {
    await irParaCorrida(page);
    await page.evaluate(() => {
      const select = document.querySelector('[data-testid="filtro-labirinto"]');
      if (select) {
        const option = document.createElement('option');
        option.value = '32x32';
        option.text = '32x32';
        select.appendChild(option);
      }
    });
    await page.getByTestId('filtro-labirinto').selectOption('32x32');
    await expect(page.getByTestId('estado-vazio')).toBeVisible();
    await expect(page.getByTestId('corrida-item')).toHaveCount(0);
  });
});

// ── Testes com API Mockada (Para o Futuro) ──
// TODO: remover o .skip assim que o App.js estiver fazendo fetch() na API
test.describe.skip('Testes E2E - Integração com API (Mock)', () => {

  const CORRIDAS_MOCK = [
    {
      id: 1, robot_id: 'micromouse_01', maze: '4x4', maze_type: '4x4',
      started_at: '2026-05-01T10:00:00Z', finished_at: '2026-05-01T10:00:20Z',
      date: '01/05/2026 10:00', status: 'Centro Alcançado!', time: '0m 20s', speed: '120.5 cm/s',
      elapsed_time_ms: 20000, avg_speed_mm_s: 120.5,
      battery_start_v: 7.4, battery_end_v: 7.1, battery: '7.1V',
      path_traversed: [], step_count: 12, steps: 12
    },
    {
      id: 2, robot_id: 'micromouse_01', maze: '8x8', maze_type: '8x8',
      started_at: '2026-05-02T11:00:00Z', finished_at: '2026-05-02T11:01:00Z',
      date: '02/05/2026 11:00', status: 'Centro Alcançado!', time: '1m 00s', speed: '98.3 cm/s',
      elapsed_time_ms: 60000, avg_speed_mm_s: 98.3,
      battery_start_v: 7.4, battery_end_v: 6.9, battery: '6.9V',
      path_traversed: [], step_count: 40, steps: 40
    },
    {
      id: 3, robot_id: 'micromouse_01', maze: '16x16', maze_type: '16x16',
      started_at: '2026-05-03T12:00:00Z', finished_at: '2026-05-03T12:02:30Z',
      date: '03/05/2026 12:00', status: 'Centro Alcançado!', time: '2m 30s', speed: '85.0 cm/s',
      elapsed_time_ms: 150000, avg_speed_mm_s: 85.0,
      battery_start_v: 7.4, battery_end_v: 6.5, battery: '6.5V',
      path_traversed: [], step_count: 120, steps: 120
    },
  ];

  async function mockHistorico(page, corridas) {
    await page.route('**/historico**', route => {
      const url = route.request().url();
      const mazeType = new URL(url).searchParams.get('maze_type');
      const data = mazeType
        ? corridas.filter(c => c.maze_type === mazeType)
        : corridas;
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(data),
      });
    });
  }

  test('CT-28 — filtro 4x4 exibe apenas corridas 4x4', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await irParaCorrida(page);
    await page.getByTestId('filtro-labirinto').selectOption('4x4');
    const itens = page.getByTestId('corrida-item');
    await expect(itens).toHaveCount(1);
    await expect(itens.first()).toContainText('4x4');
  });

  test('CT-28 — filtro 8x8 exibe apenas corridas 8x8', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await irParaCorrida(page);
    await page.getByTestId('filtro-labirinto').selectOption('8x8');
    const itens = page.getByTestId('corrida-item');
    await expect(itens).toHaveCount(1);
    await expect(itens.first()).toContainText('8x8');
  });

  test('CT-28 — filtro 16x16 exibe apenas corridas 16x16', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await irParaCorrida(page);
    await page.getByTestId('filtro-labirinto').selectOption('16x16');
    const itens = page.getByTestId('corrida-item');
    await expect(itens).toHaveCount(1);
    await expect(itens.first()).toContainText('16x16');
  });

  test('CT-29 — filtro Todos exibe todas as corridas', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await irParaCorrida(page);
    await page.getByTestId('filtro-labirinto').selectOption('Todos');
    await expect(page.getByTestId('corrida-item')).toHaveCount(3);
  });

  test('CT-29 — Todos é o filtro padrão ao abrir a aba', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await irParaCorrida(page);
    await expect(page.getByTestId('corrida-item')).toHaveCount(3);
  });

  test('CT-24 — exibe estado vazio quando não há corridas', async ({ page }) => {
    await mockHistorico(page, []);
    await irParaCorrida(page);
    await expect(page.getByTestId('estado-vazio')).toBeVisible();
    await expect(page.getByTestId('corrida-item')).toHaveCount(0);
  });
});
