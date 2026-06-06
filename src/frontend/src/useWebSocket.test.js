// Testes do hook useWebSocket (conexão, mensagens e reconexão).
import { renderHook, act } from '@testing-library/react';
import { useWebSocket, WS_STATUS } from './useWebSocket';

let instances;

class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.close = jest.fn(() => { this.readyState = 3; });
    instances.push(this);
  }
}

beforeEach(() => {
  instances = [];
  jest.useFakeTimers();
  global.WebSocket = MockWebSocket;
});

afterEach(() => {
  jest.runOnlyPendingTimers();
  jest.useRealTimers();
  delete global.WebSocket;
});

// Ao montar, o hook abre o WebSocket sozinho e fica "Conectando...".
test('abre conexão automaticamente e começa "Conectando..."', () => {
  const { result } = renderHook(() => useWebSocket());
  expect(instances).toHaveLength(1);
  expect(instances[0].url).toBe('ws://localhost:8000/ws/dashboard');
  expect(result.current.status).toBe(WS_STATUS.CONECTANDO);
});

// Quando a conexão abre, o status passa para "Conectado".
test('onopen muda status para Conectado', () => {
  const { result } = renderHook(() => useWebSocket());
  act(() => { instances[0].onopen(); });
  expect(result.current.status).toBe(WS_STATUS.CONECTADO);
});

// Mensagem com JSON válido é desserializada para objeto.
test('onmessage com JSON válido faz parse para objeto', () => {
  const { result } = renderHook(() => useWebSocket());
  act(() => { instances[0].onmessage({ data: JSON.stringify({ a: 1 }) }); });
  expect(result.current.lastMessage).toEqual({ a: 1 });
});

// Mensagem que não é JSON é mantida como string crua.
test('onmessage com texto não-JSON mantém a string crua', () => {
  const { result } = renderHook(() => useWebSocket());
  act(() => { instances[0].onmessage({ data: 'ping' }); });
  expect(result.current.lastMessage).toBe('ping');
});

// Ao cair a conexão, o status vira "Reconectando..." e reconecta após 3s.
test('onclose vira Reconectando e reconecta após 3 s', () => {
  const { result } = renderHook(() => useWebSocket());
  act(() => { instances[0].onclose(); });
  expect(result.current.status).toBe(WS_STATUS.RECONECTANDO);
  expect(instances).toHaveLength(1);
  act(() => { jest.advanceTimersByTime(3000); });
  expect(instances).toHaveLength(2);
});

// Um erro no socket dispara o fechamento da conexão.
test('onerror fecha o socket', () => {
  renderHook(() => useWebSocket());
  act(() => { instances[0].onerror(); });
  expect(instances[0].close).toHaveBeenCalled();
});

// Ao desmontar, o socket é fechado e nenhuma reconexão é agendada.
test('cleanup no unmount fecha socket e não reconecta', () => {
  const { unmount } = renderHook(() => useWebSocket());
  const ws = instances[0];
  act(() => { unmount(); });
  expect(ws.close).toHaveBeenCalled();
  act(() => { ws.onclose && ws.onclose(); jest.advanceTimersByTime(3000); });
  expect(instances).toHaveLength(1);
});
