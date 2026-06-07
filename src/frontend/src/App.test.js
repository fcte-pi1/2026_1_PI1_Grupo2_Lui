// Testes de componente do dashboard (App): navegação, telemetria e histórico.
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import App from './App';

// Mock controlável do WebSocket para injetar pacotes de telemetria.
let wsInstances;
class MockWebSocket {
  constructor(url) {
    this.url = url;
    this.readyState = 0;
    this.onopen = null;
    this.onmessage = null;
    this.onclose = null;
    this.onerror = null;
    this.close = jest.fn();
    this.send = jest.fn();
    wsInstances.push(this);
  }
}

function emit(msg) {
  const ws = wsInstances[wsInstances.length - 1];
  act(() => { ws.onmessage({ data: JSON.stringify(msg) }); });
}

// Corridas simuladas vindas do backend (formato snake_case).
const fakeCorridas = [
  {
    id: 1, source: 'real', success: true, started_at: '2026-01-10T10:00:00Z',
    maze_type: '4x4', elapsed_time_ms: 65000, avg_speed_mm_s: 120, battery_end_v: 7.5,
    step_count: 20, path_traversed: [{ x: 90, y: 90 }, { x: 90, y: 270 }],
  },
  {
    id: 2, source: 'real', success: true, started_at: '2026-01-11T10:00:00Z',
    maze_type: '4x4', elapsed_time_ms: 95000, avg_speed_mm_s: 90, battery_end_v: 7.0,
    step_count: 30, path_traversed: [],
  },
  {
    id: 3, source: 'real', success: false, started_at: '2026-01-12T10:00:00Z',
    maze_type: '8x8', elapsed_time_ms: 120000, avg_speed_mm_s: 60, battery_end_v: 6.5,
    step_count: 40, path_traversed: [],
  },
];

beforeEach(() => {
  wsInstances = [];
  global.WebSocket = MockWebSocket;
  global.fetch = jest.fn(() =>
    Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'sucesso', data: fakeCorridas }) })
  );
});

afterEach(() => {
  jest.restoreAllMocks();
  delete global.WebSocket;
  delete global.fetch;
});

describe('navegação e render base', () => {
  // O cabeçalho, as abas e a conexão WebSocket aparecem ao carregar.
  test('renderiza cabeçalho, abas e abre o WebSocket', () => {
    render(<App />);
    expect(screen.getByText(/micromouse/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Mapa/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Histórico/i })).toBeInTheDocument();
    expect(wsInstances.length).toBeGreaterThan(0);
  });

  // A aba Mapa exibe o canvas do labirinto e os controles do simulador.
  test('aba Mapa mostra o canvas e os controles', () => {
    render(<App />);
    expect(screen.getByRole('button', { name: /^Iniciar$/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Novo/i })).toBeInTheDocument();
  });
});

describe('controles do mapa', () => {
  // Iniciar/Pausar, tamanho da malha, raio-X e botões reagem aos cliques.
  test('Iniciar/Pausar, tamanho, raio-X e reset respondem', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /^Iniciar$/i }));
    expect(screen.getByRole('button', { name: /Pausar/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Pausar/i }));
    // Interage com o CustomSelect de tamanho da matriz
    const sizeTrigger = screen.getByText(/16x16/i);
    fireEvent.click(sizeTrigger); // Abre o dropdown
    const option4x4 = screen.getByText(/4x4/i); // Pega a opção revelada
    fireEvent.click(option4x4); // Seleciona a opção
    
    // Agora o texto truncado na label do seletor deve ser 4x4
    expect(screen.getAllByText(/4x4/i).length).toBeGreaterThan(0);
    const checkboxes = screen.getAllByRole('checkbox', { hidden: true });
    fireEvent.click(checkboxes[1]); // Clica no Raio-X
    fireEvent.click(screen.getByRole('button', { name: /Novo/i }));
    fireEvent.click(screen.getByRole('button', { name: /Reiniciar/i }));
  });

  test('botão Raio-X só fica habilitado no modo Simulador e desabilita no modo Corrida', () => {
    render(<App />);
    
    // O checkbox deve estar no DOM e habilitado (pois o modo padrão do mock é simulador)
    // Buscamos pelo label raiz ou pelo próprio checkbox caso tenhamos adicionado aria-label (podemos pegar pelo label contendo 'Raio-X')
    const xrayCheckbox = screen.getAllByRole('checkbox', { hidden: true })[1]; // O Raio-X é o segundo checkbox
    expect(xrayCheckbox).not.toBeDisabled();
    
    // Muda o mockMode para "Corrida" através do switch
    const modeSwitch = screen.getByRole('checkbox', { name: /Alternar Modo de Operação/i, hidden: true });
    fireEvent.click(modeSwitch);
    
    // O Raio-X deve ter ficado desabilitado
    expect(xrayCheckbox).toBeDisabled();
  });
});

describe('telemetria em tempo real', () => {
  // Pacote real atualiza os campos (bateria, modo, latência e status).
  test('pacote real atualiza campos e latência', () => {
    render(<App />);
    const modeSwitch = screen.getByRole('checkbox', { name: /Alternar Modo de Operação/i, hidden: true });
    fireEvent.click(modeSwitch);
    emit({
      source: 'real',
      timestamp: new Date().toISOString(),
      battery_voltage_v: 7.2,
      elapsed_time_ms: 12000,
      speed_mm_s: 150,
      step_count: 7,
      race_status: 'running',
      event: 'start_race',
    });
    expect(screen.getAllByText(/Corrida/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/ms$/)).toBeInTheDocument();
    expect(screen.getByText(/Mapeando\.\.\./i)).toBeInTheDocument();
  });

  // Pacote final com sucesso mostra "Centro Alcançado!".
  test('pacote final de sucesso mostra "Centro Alcançado!"', () => {
    render(<App />);
    const modeSwitch = screen.getByRole('checkbox', { name: /Alternar Modo de Operação/i, hidden: true });
    fireEvent.click(modeSwitch);
    emit({
      source: 'real',
      timestamp: new Date().toISOString(),
      race_status: 'finished',
      success: true,
      battery_voltage_v: 7.0,
    });
    expect(screen.getByText(/Centro Alcançado!/i)).toBeInTheDocument();
  });

  // Mesmo com latência alta (pacote antigo) o valor continua sendo exibido.
  test('latência alta ainda é renderizada', () => {
    render(<App />);
    const modeSwitch = screen.getByRole('checkbox', { name: /Alternar Modo de Operação/i, hidden: true });
    fireEvent.click(modeSwitch);
    emit({
      source: 'real',
      timestamp: new Date(Date.now() - 1500).toISOString(),
      battery_voltage_v: 7.0,
      race_status: 'running',
    });
    expect(screen.getByText(/ms$/)).toBeInTheDocument();
  });
});

describe('histórico: tabela, filtro e CSV', () => {
  async function openHistorico() {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Histórico/i }));
    await screen.findByTestId('historico-view');
  }

  // Ao abrir a aba, as corridas do backend são carregadas na tabela.
  test('carrega corridas do backend ao abrir a aba', async () => {
    await openHistorico();
    await waitFor(() => expect(screen.getAllByTestId('corrida-item').length).toBe(3));
    expect(global.fetch).toHaveBeenCalled();
  });

  // Trocar o filtro dispara nova consulta passando o maze_type.
  test('mudar o filtro consulta com maze_type', async () => {
    await openHistorico();
    await screen.findAllByTestId('corrida-item');
    const filtro = screen.getByTestId('filtro-labirinto');
    fireEvent.click(filtro);
    const option4x4 = screen.getByText(/Pista 4x4/i);
    fireEvent.click(option4x4);
    await waitFor(() => {
      const urls = global.fetch.mock.calls.map(c => String(c[0]));
      expect(urls.some(u => u.includes('maze_type=4x4'))).toBe(true);
    });
  });

  // Sem corridas, a tabela mostra o estado vazio.
  test('estado vazio quando não há corridas', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: [] }) })
    );
    await openHistorico();
    expect(await screen.findByTestId('estado-vazio')).toBeInTheDocument();
  });

  // Falha no backend exibe a mensagem de erro.
  test('erro do backend exibe aviso de falha', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500 }));
    await openHistorico();
    expect(await screen.findByText(/Falha ao carregar histórico/i)).toBeInTheDocument();
  });

  // Exportar CSV cria um link de download com o filtro no nome do arquivo.
  test('exportar CSV cria link de download com o filtro no nome', async () => {
    const clickSpy = jest.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    let captured;
    const origCreate = document.createElement.bind(document);
    jest.spyOn(document, 'createElement').mockImplementation((tag) => {
      const el = origCreate(tag);
      if (tag === 'a') captured = el;
      return el;
    });
    await openHistorico();
    await screen.findAllByTestId('corrida-item');
    fireEvent.click(screen.getByRole('button', { name: /Exportar CSV/i }));
    expect(clickSpy).toHaveBeenCalled();
    expect(captured.getAttribute('download')).toMatch(/historico_micromouse_.*\.csv/);
  });
});

describe('histórico: ranking e detalhe/replay', () => {
  async function openHistorico() {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: /Histórico/i }));
    await screen.findByTestId('historico-view');
    await screen.findAllByTestId('corrida-item');
  }

  // A sub-aba Ranking lista os melhores por labirinto e o vazio por tipo.
  test('sub-aba Ranking lista melhores por labirinto', async () => {
    await openHistorico();
    fireEvent.click(screen.getByRole('button', { name: /Ranking/i }));
    expect(screen.getByText(/Top 5 por Labirinto/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Sem corridas concluídas/i).length).toBeGreaterThan(0);
  });

  // Clicar numa corrida com trajeto abre o modal e o replay.
  test('clicar numa corrida abre o modal e o replay', async () => {
    await openHistorico();
    const rows = screen.getAllByTestId('corrida-item');
    fireEvent.click(rows[0]);
    expect(await screen.findByText(/Detalhes da Corrida/i)).toBeInTheDocument();
    expect(screen.getByText(/Replay do Trajeto/i)).toBeInTheDocument();
  });

  // Corrida sem trajeto mostra "indisponível" no detalhe.
  test('corrida sem trajeto mostra "indisponível"', async () => {
    await openHistorico();
    const rows = screen.getAllByTestId('corrida-item');
    fireEvent.click(rows[1]);
    expect(await screen.findByText(/Detalhes da Corrida/i)).toBeInTheDocument();
    expect(await screen.findByText(/Trajeto indisponível/i)).toBeInTheDocument();
  });

  // O botão Atualizar refaz a consulta ao backend.
  test('botão Atualizar refaz a consulta', async () => {
    await openHistorico();
    const before = global.fetch.mock.calls.length;
    fireEvent.click(screen.getByRole('button', { name: /Atualizar/i }));
    await waitFor(() => expect(global.fetch.mock.calls.length).toBeGreaterThan(before));
  });
});
