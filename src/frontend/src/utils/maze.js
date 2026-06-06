export const CELL_MM = 180;
export const DX = [0, 1, 0, -1];
export const DY = [-1, 0, 1, 0];

export function mmToCell(mm) {
  return Math.floor(mm / 180);
}

export function getGoals(size) {
  const mid = Math.floor(size / 2);
  return [
    { x: mid - 1, y: mid - 1 },
    { x: mid, y: mid - 1 },
    { x: mid - 1, y: mid },
    { x: mid, y: mid },
  ];
}
