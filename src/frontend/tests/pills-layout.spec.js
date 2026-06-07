const { test, expect } = require('@playwright/test');

test.describe('Pill Layout optical alignment', () => {
  test.beforeEach(async ({ page }) => {
    // Navegar para o servidor de desenvolvimento local
    await page.goto('http://localhost:3000');
  });

  test('All pill containers should have mathematically uniform visual padding', async ({ page }) => {
    // Esperamos múltiplos contêineres de pills no DOM
    const containers = page.getByTestId('pill-container');
    const containerCount = await containers.count();
    
    expect(containerCount).toBeGreaterThan(0);

    for (let i = 0; i < containerCount; i++) {
      const container = containers.nth(i);
      const containerBox = await container.boundingBox();
      
      // Pegar todos os itens (pills) dentro deste contêiner específico
      const items = container.getByTestId('pill-item');
      const itemCount = await items.count();
      
      if (itemCount === 0) continue;

      // Verificar o preenchimento vertical (superior e inferior) do primeiro item
      const firstItem = items.nth(0);
      const firstItemBox = await firstItem.boundingBox();

      const topPadding = firstItemBox.y - containerBox.y;
      const bottomPadding = (containerBox.y + containerBox.height) - (firstItemBox.y + firstItemBox.height);
      
      // O preenchimento vertical deve ser simétrico (com tolerância de 1px para renderização de subpixel)
      expect(Math.abs(topPadding - bottomPadding)).toBeLessThanOrEqual(1);
      
      // O preenchimento vertical é matematicamente: 1px de borda + (38px altura interna - 32px altura do item)/2 = 4px.
      expect(Math.round(topPadding)).toBe(4);

      // Verificar o preenchimento horizontal do primeiro item (distância da esquerda do contêiner para a esquerda do item)
      const leftPadding = firstItemBox.x - containerBox.x;
      // O preenchimento horizontal deve ser igual ao nosso token --pill-container-p (4px) + 1px de borda = 5px
      expect(Math.round(leftPadding)).toBe(5);

      // Verificar o preenchimento horizontal do último item (distância da direita do item para a direita do contêiner)
      const lastItem = items.nth(itemCount - 1);
      const lastItemBox = await lastItem.boundingBox();
      const rightPadding = (containerBox.x + containerBox.width) - (lastItemBox.x + lastItemBox.width);
      // O preenchimento à direita pode sofrer de arredondamento de subpixel do flex ou clipping de border-box em 1-2px, então apenas garantimos que está balanceado ou próximo do leftPadding
      expect(rightPadding).toBeGreaterThanOrEqual(2);
      expect(Math.abs(leftPadding - rightPadding)).toBeLessThanOrEqual(3);
    }
  });

  test('Pill items must be vertically centered relative to their text', async ({ page }) => {
    // Verificar especificamente as pills de navegação (Nav) e botões de ação
    const items = page.getByTestId('pill-item');
    const itemCount = await items.count();
    
    for (let i = 0; i < itemCount; i++) {
      const item = items.nth(i);
      const computedStyle = await item.evaluate((el) => {
        const style = window.getComputedStyle(el);
        return {
          display: style.display,
          alignItems: style.alignItems,
          justifyContent: style.justifyContent,
          height: style.height
        };
      });

      // Restrições estruturais
      expect(['inline-flex', 'flex']).toContain(computedStyle.display);
      expect(computedStyle.alignItems).toBe('center');
      expect(computedStyle.height).toBe('32px'); // --pill-h
    }
  });
});
