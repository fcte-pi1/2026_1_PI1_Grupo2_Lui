import { render, screen } from '@testing-library/react';
import App from './App';

// Mock global do WebSocket: o useWebSocket abre conexão no mount; em ambiente Jest
// não há servidor, então fornecemos um stub mínimo que registra os handlers e
// nunca dispara onopen/onmessage. Isso impede o setInterval de reconexão de
// rodar indefinidamente nos testes.
beforeAll(() => {
  global.WebSocket = class {
    constructor() {
      this.readyState = 0;
    }
    close() {}
    send() {}
  };
});

// Mock global do fetch: HistoryView dispara GET /historico ao abrir a aba.
beforeAll(() => {
  global.fetch = jest.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ status: 'sucesso', data: [] }),
    })
  );
});

test('smoke: o dashboard renderiza com o cabeçalho do projeto', () => {
  render(<App />);
  // Cabeçalho com a marca do produto
  expect(screen.getByText(/micromouse/i)).toBeInTheDocument();
  // Tabs principais
  expect(screen.getByRole('button', { name: /Mapa/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Histórico/i })).toBeInTheDocument();
});
