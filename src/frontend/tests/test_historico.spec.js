import { test, expect } from '@playwright/test';

async function abrirHistorico(page) {
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Histórico' }).click();
  await expect(page.getByTestId('historico-view')).toBeVisible();
}

// shape do backend: GET /historico → { status, data }
const CORRIDAS_MOCK = [
  {
    id: 1, robot_id: 'micromouse_01', maze_type: '4x4',
    started_at: '2026-05-01T13:00:00Z', finished_at: '2026-05-01T13:00:20Z',
    elapsed_time_ms: 20000, avg_speed_mm_s: 120.5,
    battery_start_v: 7.4, battery_end_v: 7.1,
    path_traversed: [
      { x: 90,  y: 630, z: 9.81 },
      { x: 90,  y: 450, z: 9.81 },
      { x: 90,  y: 270, z: 9.81 },
      { x: 270, y: 270, z: 9.81 },
    ],
    step_count: 4,
    source: 'real', success: true,
  },
  {
    id: 2, robot_id: 'micromouse_01', maze_type: '8x8',
    started_at: '2026-05-02T14:00:00Z', finished_at: '2026-05-02T14:01:00Z',
    elapsed_time_ms: 60000, avg_speed_mm_s: 98.3,
    battery_start_v: 7.4, battery_end_v: 6.9,
    path_traversed: [{ x: 90, y: 1350, z: 9.81 }],
    step_count: 40,
    source: 'simulator', success: true,
  },
  {
    id: 3, robot_id: 'micromouse_01', maze_type: '16x16',
    started_at: '2026-05-03T15:00:00Z', finished_at: '2026-05-03T15:02:30Z',
    elapsed_time_ms: 150000, avg_speed_mm_s: 85.0,
    battery_start_v: 7.4, battery_end_v: 6.5,
    path_traversed: [{ x: 90, y: 2790, z: 9.81 }],
    step_count: 120,
    source: 'real', success: true,
  },
];

async function mockHistorico(page, corridas) {
  await page.route('**/historico*', route => {
    const url = route.request().url();
    const mazeType = new URL(url).searchParams.get('maze_type');
    const filtered = mazeType
      ? corridas.filter(c => c.maze_type === mazeType)
      : corridas;
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ status: 'sucesso', data: filtered }),
    });
  });
}

test.describe('Filtros do histórico (API mockada)', () => {
  // Selecionar 4x4 deixa apenas as corridas desse labirinto na tabela.
  test('filtro 4x4 exibe apenas corridas 4x4', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await abrirHistorico(page);
    await page.getByTestId('filtro-labirinto').selectOption('4x4');
    const itens = page.getByTestId('corrida-item');
    await expect(itens).toHaveCount(1);
    await expect(itens.first()).toContainText('4x4');
  });

  // Selecionar 8x8 deixa apenas as corridas desse labirinto na tabela.
  test('filtro 8x8 exibe apenas corridas 8x8', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await abrirHistorico(page);
    await page.getByTestId('filtro-labirinto').selectOption('8x8');
    const itens = page.getByTestId('corrida-item');
    await expect(itens).toHaveCount(1);
    await expect(itens.first()).toContainText('8x8');
  });

  // Selecionar 16x16 deixa apenas as corridas desse labirinto na tabela.
  test('filtro 16x16 exibe apenas corridas 16x16', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await abrirHistorico(page);
    await page.getByTestId('filtro-labirinto').selectOption('16x16');
    const itens = page.getByTestId('corrida-item');
    await expect(itens).toHaveCount(1);
    await expect(itens.first()).toContainText('16x16');
  });

  // O filtro "Todos" mostra todas as corridas, sem distinção de labirinto.
  test('filtro Todos exibe todas as corridas', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await abrirHistorico(page);
    await page.getByTestId('filtro-labirinto').selectOption('Todos');
    await expect(page.getByTestId('corrida-item')).toHaveCount(3);
  });

  // Ao abrir a aba, o filtro já vem em "Todos" mostrando tudo.
  test('Todos é o filtro padrão ao abrir a aba', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await abrirHistorico(page);
    await expect(page.getByTestId('filtro-labirinto')).toHaveValue('Todos');
    await expect(page.getByTestId('corrida-item')).toHaveCount(3);
  });
});

test.describe('Estado vazio', () => {
  // Banco sem corridas mostra o estado vazio em vez de erro.
  test('banco vazio mostra o estado vazio', async ({ page }) => {
    await mockHistorico(page, []);
    await abrirHistorico(page);
    await expect(page.getByTestId('estado-vazio')).toBeVisible();
    await expect(page.getByTestId('corrida-item')).toHaveCount(0);
  });

  // Filtro sem resultados também mostra o estado vazio.
  test('filtro sem resultados mostra o estado vazio', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK.filter(c => c.maze_type !== '4x4'));
    await abrirHistorico(page);
    await page.getByTestId('filtro-labirinto').selectOption('4x4');
    await expect(page.getByTestId('estado-vazio')).toBeVisible();
    await expect(page.getByTestId('corrida-item')).toHaveCount(0);
  });
});

test.describe('Coluna Tipo — Simulada × Real', () => {
  // A tabela mostra a pílula "Real" para origem real e "Simulada" para o simulador.
  test('exibe pílula Real e Simulada conforme a origem', async ({ page }) => {
    await mockHistorico(page, CORRIDAS_MOCK);
    await abrirHistorico(page);
    const itens = page.getByTestId('corrida-item');
    await expect(itens).toHaveCount(3);
    await expect(page.locator('[data-testid="corrida-item"]').filter({ hasText: /Real/i })).toHaveCount(2);
    await expect(page.locator('[data-testid="corrida-item"]').filter({ hasText: /Simulada/i })).toHaveCount(1);
  });
});
