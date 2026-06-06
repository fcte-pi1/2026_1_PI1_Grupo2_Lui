// Testes das constantes e helpers de geometria do labirinto.
import { CELL_MM, DX, DY, mmToCell, getGoals } from './maze';

describe('utils/maze', () => {
  // Cada célula do labirinto mede 180 mm (18 cm).
  test('CELL_MM é 180 mm', () => {
    expect(CELL_MM).toBe(180);
  });

  // Os vetores de deslocamento seguem a ordem Norte, Leste, Sul, Oeste.
  test('vetores de direção N/E/S/W são consistentes', () => {
    expect(DX).toEqual([0, 1, 0, -1]);
    expect(DY).toEqual([-1, 0, 1, 0]);
  });

  // Converte uma posição em mm para o índice da célula correspondente.
  test('mmToCell converte posição em mm para o índice da célula', () => {
    expect(mmToCell(90)).toBe(0);
    expect(mmToCell(270)).toBe(1);
    expect(mmToCell(450)).toBe(2);
    // na borda, o floor mantém a célula de baixo
    expect(mmToCell(179)).toBe(0);
    expect(mmToCell(180)).toBe(1);
  });

  // A sala central 2x2 de um labirinto 4x4 são as 4 células do meio.
  test('getGoals devolve as 4 células centrais do 4x4', () => {
    expect(getGoals(4)).toEqual([
      { x: 1, y: 1 }, { x: 2, y: 1 },
      { x: 1, y: 2 }, { x: 2, y: 2 },
    ]);
  });

  // O cálculo da sala central escala corretamente para o 16x16.
  test('getGoals escala para o 16x16', () => {
    expect(getGoals(16)).toEqual([
      { x: 7, y: 7 }, { x: 8, y: 7 },
      { x: 7, y: 8 }, { x: 8, y: 8 },
    ]);
  });
});
