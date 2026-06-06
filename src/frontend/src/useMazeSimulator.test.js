// Testes do hook useMazeSimulator (geração de labirinto, flood fill e navegação).
import { renderHook, act } from '@testing-library/react';
import { useMazeSimulator } from './useMazeSimulator';
import { getGoals } from './utils/maze';

// RNG determinístico: labirinto reproduzível -> cobertura estável entre execuções.
let rngSpy;
beforeEach(() => {
  let s = 1234567;
  rngSpy = jest.spyOn(Math, 'random').mockImplementation(() => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  });
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

// Estado inicial padrão: malha 16x16, parado e na velocidade base.
test('inicializa com gridSize default 16 e estado base', () => {
  const { result } = renderHook(() => useMazeSimulator());
  expect(result.current.gridSize).toBe(16);
  expect(result.current.isRunning).toBe(false);
  expect(result.current.speed).toBe(50);
});

// Objetivos formam a sala central 2x2 e o robô parte do canto inferior esquerdo.
test('objetivos são a sala central 2x2 e robô parte do canto', () => {
  const { result } = renderHook(() => useMazeSimulator(4));
  const mem = result.current.memory;
  expect(result.current.gridSize).toBe(4);
  expect(mem.goals).toEqual(getGoals(4));
  expect(mem.robot).toEqual({ x: 0, y: 3, dir: 0 });
  expect(mem.truthWalls).toHaveLength(4);
});

// Flood fill zera a distância no centro e a largada fica acessível.
test('flood fill zera distância no centro e alcança a largada', () => {
  const { result } = renderHook(() => useMazeSimulator(4));
  const mem = result.current.memory;
  for (const g of mem.goals) {
    expect(mem.distances[g.x][g.y]).toBe(0);
  }
  expect(mem.distances[0][3]).toBeLessThan(255);
  expect(mem.bfsCount).toBeGreaterThan(0);
});

// senseWalls grava no mapa a parede detectada e marca a célula como explorada.
test('senseWalls grava parede detectada e marca célula explorada', () => {
  const { result } = renderHook(() => useMazeSimulator(4));
  const mem = result.current.memory;
  const { x, y } = mem.robot;
  mem.truthWalls[x][y][0] = true;
  mem.knownWalls[x][y][0] = false;
  jest.useFakeTimers();
  act(() => { result.current.setIsRunning(true); });
  act(() => { jest.advanceTimersByTime(60); });
  act(() => { result.current.setIsRunning(false); });
  expect(mem.knownWalls[x][y][0]).toBe(true);
  expect(mem.explored[x][y]).toBe(true);
});

// Estando numa célula objetivo, o status vira "Centro Alcançado!" e para.
test('status vira "Centro Alcançado!" ao chegar numa célula objetivo', () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useMazeSimulator(4));
  const mem = result.current.memory;
  const goal = mem.goals[0];
  act(() => { mem.robot.x = goal.x; mem.robot.y = goal.y; });
  act(() => { result.current.setIsRunning(true); });
  act(() => { jest.advanceTimersByTime(60); });
  expect(mem.status).toBe('Centro Alcançado!');
  expect(result.current.isRunning).toBe(false);
});

// Sem saída possível (4 direções bloqueadas), o status vira "Preso!".
test('status vira "Preso!" quando todas as direções estão bloqueadas', () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useMazeSimulator(4));
  const mem = result.current.memory;
  const { x, y } = mem.robot;
  mem.knownWalls[x][y] = { 0: true, 1: true, 2: true, 3: true };
  act(() => { result.current.setIsRunning(true); });
  act(() => { jest.advanceTimersByTime(60); });
  expect(mem.status).toBe('Preso!');
  expect(result.current.isRunning).toBe(false);
});

// Rodando a simulação, o robô avança, acumula trajeto e chega ao centro.
test('rodando a simulação o robô avança e chega ao centro', () => {
  jest.useFakeTimers();
  const { result } = renderHook(() => useMazeSimulator(4));
  const mem = result.current.memory;
  act(() => { result.current.setIsRunning(true); });
  act(() => { jest.advanceTimersByTime(50 * 60); });
  expect(mem.steps).toBeGreaterThan(0);
  expect(mem.pathHistory.length).toBeGreaterThan(1);
  expect(mem.timeMs).toBeGreaterThan(0);
  expect(mem.status).toBe('Centro Alcançado!');
});

// resetSimulation zera contadores, volta ao estado inicial e à largada.
test('resetSimulation zera contadores e volta ao estado "Aguardando"', () => {
  const { result } = renderHook(() => useMazeSimulator(4));
  const mem = result.current.memory;
  mem.steps = 99; mem.turns = 9; mem.timeMs = 1234; mem.status = 'Preso!';
  act(() => { result.current.resetSimulation(true); });
  expect(mem.steps).toBe(0);
  expect(mem.turns).toBe(0);
  expect(mem.timeMs).toBe(0);
  expect(mem.status).toBe('Aguardando');
  expect(mem.robot).toEqual({ x: 0, y: 3, dir: 0 });
});

// Trocar o tamanho reconfigura a malha e os objetivos.
test('changeGridSize reconfigura a malha de 4 para 8', () => {
  const { result } = renderHook(() => useMazeSimulator(4));
  act(() => { result.current.changeGridSize(8); });
  expect(result.current.gridSize).toBe(8);
  expect(result.current.memory.truthWalls).toHaveLength(8);
  expect(result.current.memory.goals).toEqual(getGoals(8));
});

// Os setters de velocidade e de raio-X atualizam o estado.
test('setters de velocidade e raio-X atualizam o estado', () => {
  const { result } = renderHook(() => useMazeSimulator(4));
  act(() => { result.current.setSpeed(120); });
  act(() => { result.current.setShowTruth(true); });
  expect(result.current.speed).toBe(120);
  expect(result.current.showTruth).toBe(true);
});
