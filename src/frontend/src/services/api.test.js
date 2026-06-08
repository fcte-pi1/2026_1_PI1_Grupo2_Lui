// Testes do cliente de API de telemetria (formatadores e chamadas HTTP).
import {
  formatElapsedMs,
  formatTimestamp,
  formatSpeedMmS,
  batteryVoltsToPercent,
  mapCorridaToUI,
  postTelemetria,
  getHistorico,
  getHealth,
  getCorrida,
  parseTimeToSeconds,
  deleteHistorico,
} from './api';

afterEach(() => {
  jest.restoreAllMocks();
  delete global.fetch;
});

describe('formatadores puros', () => {
  // Tempo zero ou negativo deve cair no valor padrão "0m 0.0s".
  test('formatElapsedMs trata 0 e negativos', () => {
    expect(formatElapsedMs(0)).toBe('0m 0.0s');
    expect(formatElapsedMs(-5)).toBe('0m 0.0s');
    expect(formatElapsedMs(undefined)).toBe('0m 0.0s');
  });

  // Milissegundos viram o formato "minutos m segundos.s".
  test('formatElapsedMs converte ms em "Xm Y.Ys"', () => {
    expect(formatElapsedMs(60000)).toBe('1m 0.0s');
    expect(formatElapsedMs(105300)).toBe('1m 45.3s');
    expect(formatElapsedMs(5000)).toBe('0m 5.0s');
  });

  // Velocidade em mm/s é convertida para cm/s; null/undefined viram 0.
  test('formatSpeedMmS converte mm/s para cm/s e trata null/undefined', () => {
    expect(formatSpeedMmS(null)).toBe('0.0 cm/s');
    expect(formatSpeedMmS(undefined)).toBe('0.0 cm/s');
    expect(formatSpeedMmS(100)).toBe('10.0 cm/s');
    expect(formatSpeedMmS(0)).toBe('0.0 cm/s');
  });

  // Data ISO vira string DD/MM/AAAA; vazio/null retornam string vazia.
  test('formatTimestamp devolve string formatada e trata vazio', () => {
    expect(formatTimestamp('')).toBe('');
    expect(formatTimestamp(null)).toBe('');
    const out = formatTimestamp('2026-01-15T12:30:00Z');
    expect(typeof out).toBe('string');
    expect(out).toMatch(/\d{2}\/\d{2}\/\d{4}/);
  });

  test('formatTimestamp cai no catch em erro de formatação', () => {
    // Passando um objeto que falha no `new Date(iso)` ou `toLocaleString`
    const badDate = { toString: () => { throw new Error('ops'); } };
    expect(formatTimestamp(badDate)).toBe(badDate);
  });
});

describe('batteryVoltsToPercent', () => {
  // Sem tensão informada o retorno é null.
  test('null/undefined retornam null', () => {
    expect(batteryVoltsToPercent(null)).toBeNull();
    expect(batteryVoltsToPercent(undefined)).toBeNull();
  });

  // Os extremos da faixa devem dar exatamente 0% e 100%.
  test('limites da faixa dão 0% e 100%', () => {
    expect(batteryVoltsToPercent(6.0)).toBe(0);
    expect(batteryVoltsToPercent(8.4)).toBe(100);
  });

  // Tensões fora da faixa são saturadas em 0% e 100%.
  test('satura abaixo e acima dos limites', () => {
    expect(batteryVoltsToPercent(5.0)).toBe(0);
    expect(batteryVoltsToPercent(9.0)).toBe(100);
  });

  // O ponto médio da faixa corresponde a ~50%.
  test('ponto médio resulta em ~50%', () => {
    expect(batteryVoltsToPercent(7.2)).toBe(50);
  });

  // É possível passar uma faixa de tensão diferente.
  test('aceita faixa de tensão customizada', () => {
    expect(batteryVoltsToPercent(3.7, 3.0, 4.2)).toBe(58);
  });

  test('lê valores do localStorage', () => {
    localStorage.setItem('BATT_VMIN', '5.5');
    localStorage.setItem('BATT_VMAX', '8.0');
    expect(batteryVoltsToPercent(8.0)).toBe(100);
    expect(batteryVoltsToPercent(5.5)).toBe(0);
    localStorage.removeItem('BATT_VMIN');
    localStorage.removeItem('BATT_VMAX');
  });
});

describe('mapCorridaToUI', () => {
  // Uma corrida completa do backend é traduzida para o formato da tabela.
  test('mapeia corrida completa de sucesso', () => {
    const corrida = {
      id: 7,
      source: 'real',
      success: true,
      started_at: '2026-01-15T12:30:00Z',
      maze_type: '16x16',
      elapsed_time_ms: 105300,
      avg_speed_mm_s: 100,
      battery_end_v: 7.2,
      step_count: 42,
      known_walls: [[[true]]],
    };
    const ui = mapCorridaToUI(corrida);
    expect(ui.id).toBe('db-7');
    expect(ui.source).toBe('real');
    expect(ui.success).toBe(true);
    expect(ui.maze).toBe('16x16');
    expect(ui.status).toBe('Centro Alcançado!');
    expect(ui.time).toBe('1m 45.3s');
    expect(ui.speed).toBe('10.0 cm/s');
    expect(ui.battery).toBe('50%');
    expect(ui.steps).toBe(42);
    expect(ui.knownWalls).toEqual([[[true]]]);
    expect(ui.raw).toBe(corrida);
  });

  // Campos ausentes assumem padrões: origem real e sucesso verdadeiro.
  test('aplica defaults de source e success', () => {
    const ui = mapCorridaToUI({ id: 1, maze_type: '4x4', elapsed_time_ms: 1000 });
    expect(ui.source).toBe('real');
    expect(ui.success).toBe(true);
    expect(ui.status).toBe('Centro Alcançado!');
    expect(ui.knownWalls).toBeNull();
  });

  // Corrida sem sucesso vira status "Preso!".
  test('corrida sem sucesso vira status "Preso!"', () => {
    const ui = mapCorridaToUI({ id: 2, success: false, maze_type: '8x8', elapsed_time_ms: 2000 });
    expect(ui.success).toBe(false);
    expect(ui.status).toBe('Preso!');
  });

  // Sem porcentagem calculável, a bateria mostra a tensão bruta.
  test('bateria sem volts cai no fallback de tensão', () => {
    const ui = mapCorridaToUI({ id: 3, maze_type: '4x4', battery_end_v: null, elapsed_time_ms: 0 });
    expect(ui.battery).toMatch(/V$|%$/);
  });
});

describe('parseTimeToSeconds', () => {
  // String "Xm Ys" é convertida no total de segundos (usado no ranking).
  test('converte "Xm Ys" em segundos', () => {
    expect(parseTimeToSeconds('1m 45.3s')).toBeCloseTo(105.3, 1);
    expect(parseTimeToSeconds('0m 5.0s')).toBeCloseTo(5.0, 1);
    expect(parseTimeToSeconds('2m 0.0s')).toBeCloseTo(120, 1);
  });

  // Entradas inválidas devolvem Infinity para irem ao fim da ordenação.
  test('entradas inválidas retornam Infinity', () => {
    expect(parseTimeToSeconds('')).toBe(Infinity);
    expect(parseTimeToSeconds(null)).toBe(Infinity);
    expect(parseTimeToSeconds('semespaco')).toBe(Infinity);
  });
});

describe('postTelemetria', () => {
  // Envia POST com JSON e devolve o corpo da resposta em caso de sucesso.
  test('envia POST e retorna json em sucesso', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) })
    );
    const res = await postTelemetria({ a: 1 });
    expect(res).toEqual({ status: 'ok' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/telemetria');
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    expect(JSON.parse(opts.body)).toEqual({ a: 1 });
  });

  // Resposta com erro HTTP deve lançar exceção.
  test('lança erro quando a resposta não é ok', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 422, text: () => Promise.resolve('inválido') })
    );
    await expect(postTelemetria({})).rejects.toThrow(/422/);
  });
});

describe('getHistorico', () => {
  // Filtro "Todos" não deve adicionar o parâmetro maze_type na URL.
  test('filtro "Todos" não envia maze_type', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve([]) })
    );
    await getHistorico('Todos');
    expect(global.fetch.mock.calls[0][0]).not.toContain('maze_type');
  });

  // Filtro específico inclui maze_type e mapeia os itens retornados.
  test('filtro específico envia maze_type', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve([{ id: 1, maze_type: '4x4', elapsed_time_ms: 1000, success: true }]),
      })
    );
    const items = await getHistorico('4x4');
    expect(global.fetch.mock.calls[0][0]).toContain('maze_type=4x4');
    expect(items).toHaveLength(1);
    expect(items[0].maze).toBe('4x4');
  });

  // Aceita tanto array puro quanto corpo no formato { data: [...] }.
  test('aceita corpo no formato {data: [...]}', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ status: 'sucesso', data: [{ id: 9, maze_type: '8x8', elapsed_time_ms: 1 }] }),
      })
    );
    const items = await getHistorico();
    expect(items).toHaveLength(1);
    expect(items[0].id).toBe('db-9');
  });

  // Banco sem registros deve devolver uma lista vazia, sem erro.
  test('banco vazio retorna lista vazia', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({}) })
    );
    const items = await getHistorico('16x16');
    expect(items).toEqual([]);
  });

  // Erro HTTP na consulta deve lançar exceção.
  test('lança erro quando a resposta não é ok', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 500 }));
    await expect(getHistorico()).rejects.toThrow(/500/);
  });
});

describe('getHealth e getCorrida', () => {
  // Health check bem-sucedido devolve o JSON de status.
  test('getHealth retorna json em sucesso', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'up' }) })
    );
    await expect(getHealth()).resolves.toEqual({ status: 'up' });
  });

  // Health check com falha deve lançar exceção.
  test('getHealth lança erro em falha', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false }));
    await expect(getHealth()).rejects.toThrow(/health/);
  });

  // Busca de uma corrida específica retorna o objeto em body.data.
  test('getCorrida retorna body.data', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ data: { id: 5, path_traversed: [] } }) })
    );
    const c = await getCorrida(5);
    expect(c.id).toBe(5);
    expect(global.fetch.mock.calls[0][0]).toContain('/historico/5');
  });

// Busca de corrida inexistente deve lançar exceção.
  test('getCorrida lança erro em falha', async () => {
    global.fetch = jest.fn(() => Promise.resolve({ ok: false, status: 404 }));
    await expect(getCorrida(99)).rejects.toThrow(/404/);
  });
});

describe('deleteHistorico', () => {
  test('envia DELETE e retorna json em sucesso', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: true, json: () => Promise.resolve({ status: 'ok' }) })
    );
    const res = await deleteHistorico();
    expect(res).toEqual({ status: 'ok' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toContain('/historico');
    expect(opts.method).toBe('DELETE');
  });

  test('lança erro quando a resposta não é ok', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ ok: false, status: 500, text: () => Promise.resolve('erro') })
    );
    await expect(deleteHistorico()).rejects.toThrow(/500/);
  });
});
