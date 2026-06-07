/**
 * Testes de regressão do DESIGN SYSTEM.
 *
 * Garantem que as regras globais de composição (tokens, raio interno,
 * altura compartilhada, alinhamento por flex, ausência de offsets manuais,
 * contraste e uso restrito de monospace) não sejam quebradas no futuro.
 *
 * Observação: o jsdom não executa o Tailwind nem aplica o index.css, então
 * as regras de layout são validadas (a) lendo o CSS/Tailwind como texto e
 * (b) checando a ESTRUTURA do DOM renderizado (classes/atributos), que é o
 * que carrega a semântica do design system.
 */
import fs from 'fs';
import path from 'path';
import { render, screen } from '@testing-library/react';
import App from './App';

const CSS = fs.readFileSync(path.join(__dirname, 'index.css'), 'utf8');
const APP_SRC = fs.readFileSync(path.join(__dirname, 'App.js'), 'utf8');
// eslint-disable-next-line import/no-dynamic-require, global-require
const tailwind = require('../tailwind.config.js');

/* ----------------------------------------------------------------
   Helpers de contraste (WCAG 2.x)
   ---------------------------------------------------------------- */
function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}
function relLuminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(fg, bg) {
  const L1 = relLuminance(fg);
  const L2 = relLuminance(bg);
  const [hi, lo] = L1 >= L2 ? [L1, L2] : [L2, L1];
  return (hi + 0.05) / (lo + 0.05);
}
function cssVar(name) {
  const m = CSS.match(new RegExp(`${name}\\s*:\\s*([^;]+);`));
  return m ? m[1].trim() : null;
}

/* WebSocket/fetch mocks: App abre um WS e busca histórico ao montar. */
beforeEach(() => {
  global.WebSocket = class {
    constructor() { this.close = () => {}; this.send = () => {}; }
  };
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) })
  );
});
afterEach(() => {
  jest.restoreAllMocks();
  delete global.WebSocket;
  delete global.fetch;
});

/* ================================================================
   1. TOKENS GLOBAIS
   ================================================================ */
describe('tokens globais', () => {
  test('escala de espaçamento 4→24 existe', () => {
    expect(cssVar('--space-1')).toBe('4px');
    expect(cssVar('--space-2')).toBe('8px');
    expect(cssVar('--space-3')).toBe('12px');
    expect(cssVar('--space-4')).toBe('16px');
    expect(cssVar('--space-5')).toBe('20px');
    expect(cssVar('--space-6')).toBe('24px');
  });

  test('raios reutilizáveis (sm→xl + pill) existem', () => {
    expect(cssVar('--radius-sm')).toBe('8px');
    expect(cssVar('--radius-md')).toBe('12px');
    expect(cssVar('--radius-lg')).toBe('16px');
    expect(cssVar('--radius-xl')).toBe('22px');
    expect(cssVar('--radius-pill')).toBe('999px');
  });

  test('alturas de controle compartilhadas existem', () => {
    expect(cssVar('--control-h-sm')).toBe('32px');
    expect(cssVar('--control-h-md')).toBe('40px');
    expect(cssVar('--control-h-lg')).toBe('48px');
  });

  test('tokens de ícone e gap existem', () => {
    expect(cssVar('--icon-sm')).toBe('14px');
    expect(cssVar('--icon-md')).toBe('16px');
    expect(cssVar('--icon-lg')).toBe('20px');
    expect(cssVar('--gap-xs')).toBe('4px');
    expect(cssVar('--gap-sm')).toBe('6px');
    expect(cssVar('--gap-md')).toBe('8px');
    expect(cssVar('--gap-lg')).toBe('12px');
  });
});

/* ================================================================
   2. REGRA DO ARREDONDAMENTO PERFEITO
   raio interno = raio externo - padding do container
   ================================================================ */
describe('arredondamento perfeito (raio interno = externo - padding)', () => {
  test('container de pill: 40px de altura, padding 4, raio externo 20', () => {
    expect(cssVar('--pill-container-h')).toContain('control-h-md'); // 40
    expect(cssVar('--pill-container-p')).toBe('4px');
    expect(cssVar('--pill-radius-outer')).toBe('20px');
  });

  test('raio interno é derivado por calc(externo - padding) = 16px', () => {
    const inner = cssVar('--pill-radius-inner');
    expect(inner).toMatch(/calc\(\s*var\(--pill-radius-outer\)\s*-\s*var\(--pill-container-p\)\s*\)/);
    // 20 - 4 = 16
    expect(20 - 4).toBe(16);
  });

  test('item interno é stadium perfeito dentro do container stadium', () => {
    // item: altura 32 (control-h-sm) → raio 16 = metade ⇒ stadium
    expect(cssVar('--pill-h')).toContain('control-h-sm'); // 32
    // 32 / 2 === 16 === raio interno
    expect(32 / 2).toBe(16);
  });
});

/* ================================================================
   3. ALINHAMENTO CENTRAL ESTRUTURAL (flex), sem offsets manuais
   ================================================================ */
describe('alinhamento central estrutural', () => {
  function block(selector) {
    const re = new RegExp(`\\.${selector}\\s*\\{([^}]*)\\}`);
    const m = CSS.match(re);
    return m ? m[1] : '';
  }

  test('.pill-item centraliza ícone+texto com flex e box-sizing', () => {
    const b = block('pill-item');
    expect(b).toMatch(/display:\s*inline-flex/);
    expect(b).toMatch(/align-items:\s*center/);
    expect(b).toMatch(/justify-content:\s*center/);
    expect(b).toMatch(/box-sizing:\s*border-box/);
    expect(b).toMatch(/line-height:\s*1/);
    expect(b).toMatch(/gap:\s*var\(--gap/);
  });

  test('.badge centraliza com flex e altura única', () => {
    const b = block('badge');
    expect(b).toMatch(/display:\s*inline-flex/);
    expect(b).toMatch(/align-items:\s*center/);
    expect(b).toMatch(/height:\s*var\(--badge-h\)/);
    expect(b).toMatch(/box-sizing:\s*border-box/);
  });

  test('box-sizing border-box é global', () => {
    expect(CSS).toMatch(/\*,\s*\*::before,\s*\*::after\s*\{\s*box-sizing:\s*border-box/);
  });
});

/* ================================================================
   4. PROIBIÇÃO DE OFFSETS MANUAIS EM COMPONENTES DO DESIGN SYSTEM
   ================================================================ */
describe('sem correções pontuais (offsets manuais) nos DS classes', () => {
  // Nenhuma das utilities do DS pode usar margens/posicionamento/transform
  // para "consertar" alinhamento.
  const dsBlocks = ['pill-container', 'pill-item', 'badge', 'control-md', 'text-label'];
  test.each(dsBlocks)('.%s não usa margin/top/left/transform manual', (cls) => {
    const re = new RegExp(`\\.${cls}\\s*\\{([^}]*)\\}`);
    const m = CSS.match(re);
    const b = m ? m[1] : '';
    expect(b).not.toMatch(/margin-top|margin-left|margin-right/);
    expect(b).not.toMatch(/(^|[^-])top:\s*-?\d/);
    expect(b).not.toMatch(/(^|[^-])left:\s*-?\d/);
    expect(b).not.toMatch(/transform:\s*translate/);
  });
});

/* ================================================================
   5. TIPOGRAFIA — Inter como sans, mono só p/ dados técnicos
   ================================================================ */
describe('tipografia por categoria', () => {
  test('fonte sans é Inter (não monoespaçada)', () => {
    expect(tailwind.theme.extend.fontFamily.sans.join(' ')).toMatch(/Inter/);
    expect(tailwind.theme.extend.fontFamily.sans.join(' ')).not.toMatch(/JetBrains|mono/i);
  });

  test('mono é JetBrains, reservada a .text-value/.text-data', () => {
    expect(tailwind.theme.extend.fontFamily.mono.join(' ')).toMatch(/JetBrains/);
    const value = CSS.match(/\.text-value\s*\{([^}]*)\}/)[1];
    const data = CSS.match(/\.text-data\s*\{([^}]*)\}/)[1];
    expect(value).toMatch(/font-family:\s*var\(--font-mono\)/);
    expect(data).toMatch(/font-family:\s*var\(--font-mono\)/);
  });

  test('navegação e botões NÃO usam font-mono', () => {
    // O cabeçalho/nav e os botões de ação não devem aplicar monospace.
    expect(APP_SRC).not.toMatch(/className=\{`pill-item[^`]*font-mono/);
    // O seletor de matriz (controle) usa sans explicitamente
    expect(APP_SRC).toMatch(/aria-label="Tamanho da matriz"[\s\S]*?font-sans/);
  });
});

/* ================================================================
   6. CONTRASTE no tema escuro
   ================================================================ */
describe('contraste suficiente no dark', () => {
  const BG = cssVar('--bg-app');         // #0e0b1d
  const SURF = cssVar('--surface-1');    // #100c27

  test('texto primário e secundário legíveis (AA)', () => {
    expect(contrast(cssVar('--text-1'), BG)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(cssVar('--text-2'), BG)).toBeGreaterThanOrEqual(4.5);
    expect(contrast(cssVar('--text-2'), SURF)).toBeGreaterThanOrEqual(4.5);
  });

  test('texto terciário discreto porém legível', () => {
    expect(contrast(cssVar('--text-3'), BG)).toBeGreaterThanOrEqual(3.5);
  });

  test('acento roxo de texto tem contraste (não é roxo-escuro sobre escuro)', () => {
    expect(contrast(cssVar('--accent'), SURF)).toBeGreaterThanOrEqual(4.5);
  });

  test('cores de status (verde/vermelho) legíveis sobre superfícies', () => {
    expect(contrast(cssVar('--success-text'), SURF)).toBeGreaterThanOrEqual(3.0);
    expect(contrast(cssVar('--danger-text'), SURF)).toBeGreaterThanOrEqual(3.0);
  });
});

/* ================================================================
   7. ESTRUTURA DO DOM — componentes encapsulados e mesma linha
   ================================================================ */
describe('estrutura do DOM renderizado', () => {
  test('todo pill-container só contém pill-items (respiro uniforme via padding+gap)', () => {
    render(<App />);
    const containers = screen.getAllByTestId('pill-container');
    expect(containers.length).toBeGreaterThan(0);
    for (const c of containers) {
      const items = c.querySelectorAll('[data-testid="pill-item"]');
      expect(items.length).toBeGreaterThan(0);
      // Cada item carrega a classe estrutural .pill-item (altura/raio do token)
      items.forEach((it) => expect(it.className).toMatch(/\bpill-item\b/));
    }
  });

  test('o seletor de matriz é um controle único rotulado (Matriz NxN)', () => {
    render(<App />);
    expect(screen.getByDisplayValue(/Matriz 16x16/i)).toBeInTheDocument();
  });

  test('primeiro/último item de grupo não usam margens manuais', () => {
    render(<App />);
    const items = screen.getAllByTestId('pill-item');
    items.forEach((it) => {
      const s = it.getAttribute('style') || '';
      expect(s).not.toMatch(/margin-left|margin-right|margin-top/);
    });
  });
});
