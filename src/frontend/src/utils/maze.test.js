import { CELL_MM, DX, DY, mmToCell, getGoals } from './maze';

describe('utils/maze', () => {
  test('CELL_MM é 180 mm (18 cm por célula)', () => {
    expect(CELL_MM).toBe(180);
  });

  test('vetores de direção N/E/S/W são consistentes', () => {
    expect(DX).toEqual([0, 1, 0, -1]);
    expect(DY).toEqual([-1, 0, 1, 0]);
  });

  test('mmToCell converte centro da célula para o índice correto', () => {
    // centro da célula = cell * 180 + 90
    expect(mmToCell(90)).toBe(0);
    expect(mmToCell(270)).toBe(1);
    expect(mmToCell(450)).toBe(2);
    // bordas: floor garante a célula de baixo
    expect(mmToCell(179)).toBe(0);
    expect(mmToCell(180)).toBe(1);
  });

  test('getGoals devolve as 4 células centrais para 4x4', () => {
    expect(getGoals(4)).toEqual([
      { x: 1, y: 1 }, { x: 2, y: 1 },
      { x: 1, y: 2 }, { x: 2, y: 2 },
    ]);
  });

  test('getGoals escala para 16x16', () => {
    expect(getGoals(16)).toEqual([
      { x: 7, y: 7 }, { x: 8, y: 7 },
      { x: 7, y: 8 }, { x: 8, y: 8 },
    ]);
  });
});
