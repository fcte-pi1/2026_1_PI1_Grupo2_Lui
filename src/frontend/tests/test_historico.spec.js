// Playwright — CT-28 e CT-29
// Referências: Tarefa 7.20 / US14
//
// Para rodar:
//   npx playwright test tests/test_historico.spec.js

import { test, expect } from '@playwright/test';

// ── Helpers ────────────────────────────────────────────

async function irParaHistorico(page) {
  await page.goto('http://localhost:3000');
  await page.getByRole('button', { name: 'Histórico' }).click();
  await expect(page.getByTestId('historico-view')).toBeVisible();
}

// ── CT-28: Filtro por labirinto específico ─────────────

test('CT-28 — filtro 4x4 exibe apenas corridas 4x4', async ({ page }) => {
  await irParaHistorico(page);
  await page.getByTestId('filtro-labirinto').selectOption('4x4');
  const itens = page.getByTestId('corrida-item');
  const count = await itens.count();
  for (let i = 0; i < count; i++) {
    await expect(itens.nth(i)).toContainText('4x4');
  }
});

test('CT-28 — filtro 8x8 exibe apenas corridas 8x8', async ({ page }) => {
  await irParaHistorico(page);
  await page.getByTestId('filtro-labirinto').selectOption('8x8');
  const itens = page.getByTestId('corrida-item');
  const count = await itens.count();
  for (let i = 0; i < count; i++) {
    await expect(itens.nth(i)).toContainText('8x8');
  }
});

test('CT-28 — filtro 16x16 exibe apenas corridas 16x16', async ({ page }) => {
  await irParaHistorico(page);
  await page.getByTestId('filtro-labirinto').selectOption('16x16');
  const itens = page.getByTestId('corrida-item');
  const count = await itens.count();
  for (let i = 0; i < count; i++) {
    await expect(itens.nth(i)).toContainText('16x16');
  }
});

// ── CT-29: Filtro "Todos" ──────────────────────────────

test('CT-29 — filtro Todos exibe todas as corridas', async ({ page }) => {
  await irParaHistorico(page);
  await page.getByTestId('filtro-labirinto').selectOption('Todos');
  await expect(page.getByTestId('corrida-item').first()).toBeVisible();
});

test('CT-29 — Todos é o filtro padrão ao abrir a aba', async ({ page }) => {
  await irParaHistorico(page);
  const select = page.getByTestId('filtro-labirinto');
  await expect(select).toHaveValue('Todos');
  await expect(page.getByTestId('corrida-item').first()).toBeVisible();
});

// ── Estado vazio (CT-24) ───────────────────────────────

test('CT-24 — exibe mensagem quando não há corridas no filtro', async ({ page }) => {
  await irParaHistorico(page);
  await page.getByTestId('filtro-labirinto').selectOption('4x4');
  const itens = page.getByTestId('corrida-item');
  const count = await itens.count();
  if (count === 0) {
    await expect(page.getByTestId('estado-vazio')).toBeVisible();
  }
});
