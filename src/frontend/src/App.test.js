import { render, screen } from '@testing-library/react';
import App from './App';

// Stub do WS — sem servidor no Jest, evita loop de reconexão do useWebSocket
beforeAll(() => {
  global.WebSocket = class {
    constructor() {
      this.readyState = 0;
    }
    close() {}
    send() {}
  };
});

// HistoryView dispara GET /historico no mount
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
  expect(screen.getByText(/micromouse/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Mapa/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Histórico/i })).toBeInTheDocument();
});
