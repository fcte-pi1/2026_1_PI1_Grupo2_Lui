// Playwright — CT-28 e CT-29
// Referências: Tarefa 7.20 / US14
//
// Para rodar:
//   npx playwright test test/test_historico.spec.js

import { test, expect } from '@playwright/test';

const CORRIDAS_MOCK = [
  {
    id: 1, robot_id: 'micromouse_01', maze_type: '4x4',
    started_at: '2026-05-01T10:00:00Z', finished_at: '2026-05-01T10:00:20Z',
    elapsed_time_ms: 20000, avg_speed_mm_s: 120.5,
    battery_start_v: 7.4, battery_end_v: 7.1,
    path_traversed: [], step_count: 12
  },
  {
    id: 2, robot_id: 'micromouse_01', maze_type: '8x8',
    started_at: '2026-05-02T11:00:00Z', finished_at: '2026-05-02T11:01:00Z',
    elapsed_time_ms: 60000, avg_speed_mm_s: 98.3,
    battery_start_v: 7.4, battery_end_v: 6.9,
    path_traversed: [], step_count: 40
  },
  {
    id: 3, robot_id: 'micromouse_01', maze_type: '16x16',
    started_at: '2026-05-03T12:00:00Z', finished_at: '2026-05-03T12:02:30Z',
    elapsed_time_ms: 150000, avg_speed_mm_s: 85.0,
    battery_start_v: 7.4, battery_end_v: 6.5,
    path_traversed: [], step_count: 120
  },
];

// ── Helpers ────────────────────────────────────────────

async function mockHistorico(page, corridas) {
  await page.route('**/historico**', route => {
    const url      = route.request().url();
    const mazeType = new URL(url).searchParams.get('maze_type');
    const data     = mazeType
      ? corridas.filter(c => c.maze_type === mazeType)
      : corridas;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(data),
    });
  });
}

async function irParaCorrida(page) {
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Corrida' }).click();
  await expect(page.getByTestId('historico-corridas')).toBeVisible();
}

// ── CT-28: Filtro por labirinto específico ─────────────

test('CT-28 — filtro 4x4 exibe apenas corridas 4x4', async ({ page }) => {
  await mockHistorico(page, CORRIDAS_MOCK);
  await irParaCorrida(page);

  await page.getByTestId('filtro-4x4').click();

  const itens = page.getByTestId('corrida-item');
  await expect(itens).toHaveCount(1);
  await expect(itens.first()).toContainText('4x4');
});

test('CT-28 — filtro 8x8 exibe apenas corridas 8x8', async ({ page }) => {
  await mockHistorico(page, CORRIDAS_MOCK);
  await irParaCorrida(page);

  await page.getByTestId('filtro-8x8').click();

  const itens = page.getByTestId('corrida-item');
  await expect(itens).toHaveCount(1);
  await expect(itens.first()).toContainText('8x8');
});

test('CT-28 — filtro 16x16 exibe apenas corridas 16x16', async ({ page }) => {
  await mockHistorico(page, CORRIDAS_MOCK);
  await irParaCorrida(page);

  await page.getByTestId('filtro-16x16').click();

  const itens = page.getByTestId('corrida-item');
  await expect(itens).toHaveCount(1);
  await expect(itens.first()).toContainText('16x16');
});

// ── CT-29: Filtro "Todos" ──────────────────────────────

test('CT-29 — filtro Todos exibe todas as corridas', async ({ page }) => {
  await mockHistorico(page, CORRIDAS_MOCK);
  await irParaCorrida(page);

  await page.getByTestId('filtro-todos').click();

  await expect(page.getByTestId('corrida-item')).toHaveCount(3);
});

test('CT-29 — Todos é o filtro padrão ao abrir a aba', async ({ page }) => {
  await mockHistorico(page, CORRIDAS_MOCK);
  await irParaCorrida(page);

  await expect(page.getByTestId('corrida-item')).toHaveCount(3);
});

// ── Estado vazio (CT-24) ───────────────────────────────

test('CT-24 — exibe estado vazio quando não há corridas', async ({ page }) => {
  await mockHistorico(page, []);
  await irParaCorrida(page);

  await expect(page.getByTestId('estado-vazio')).toBeVisible();
  await expect(page.getByTestId('corrida-item')).toHaveCount(0);
});
