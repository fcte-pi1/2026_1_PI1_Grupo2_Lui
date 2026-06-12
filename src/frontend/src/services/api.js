/**
 * Cliente da API do backend de telemetria.
 *
 * Centraliza as URLs e o mapeamento entre o shape do backend
 * (snake_case, unidades SI) e o shape consumido pela UI.
 */

const API_BASE = process.env.REACT_APP_API_BASE || 'http://localhost:8000';

/**
 * Formata milissegundos em "Xm Y.Ys" (compatível com a tabela de Histórico).
 */
export function formatElapsedMs(ms) {
  if (!ms || ms <= 0) return '0m 0.0s';
  const min = Math.floor(ms / 60000);
  const sec = ((ms % 60000) / 1000).toFixed(1);
  return `${min}m ${sec}s`;
}

/**
 * Formata data ISO 8601 (UTC) em "DD/MM/YYYY HH:MM" no timezone local.
 */
export function formatTimestamp(iso) {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

/**
 * Converte mm/s para "cm/s" com uma casa decimal.
 */
export function formatSpeedMmS(mmS) {
  if (mmS === null || mmS === undefined) return '0.0 cm/s';
  return `${(mmS / 10).toFixed(1)} cm/s`;
}

/**
 * Converte tensão da bateria (V) em porcentagem aproximada.
 * Assume pack 2S Li-Ion (vazia ≈ 6.0 V, cheia ≈ 8.4 V). Ajuste se o hardware mudar.
 */
export function batteryVoltsToPercent(v, defaultMin = 6.0, defaultMax = 8.4) {
  if (v === null || v === undefined) return null;
  const storedMin = localStorage.getItem('BATT_VMIN');
  const storedMax = localStorage.getItem('BATT_VMAX');
  const vMin = storedMin !== null ? parseFloat(storedMin) : defaultMin;
  const vMax = storedMax !== null ? parseFloat(storedMax) : defaultMax;
  
  const pct = ((v - vMin) / (vMax - vMin)) * 100;
  return Math.max(0, Math.min(100, Math.round(pct)));
}

/**
 * Mapeia uma corrida vinda do backend para o shape que a tabela do
 * HistoryView espera. Mantém campos extras (timestamps brutos, path) para
 * o modal de detalhes / replay futuro.
 */
export function mapCorridaToUI(corrida) {
  const pct = batteryVoltsToPercent(corrida.battery_end_v);
  const success = corrida.success ?? true;
  return {
    id: `db-${corrida.id}`,
    source: corrida.source ?? 'real',
    success,
    date: formatTimestamp(corrida.started_at),
    maze: corrida.maze_type,
    status: success ? 'Centro Alcançado!' : 'Preso!',
    time: formatElapsedMs(corrida.elapsed_time_ms),
    speed: formatSpeedMmS(corrida.avg_speed_mm_s),
    battery: pct !== null ? `${pct}%` : `${corrida.battery_end_v?.toFixed?.(2) ?? '?'} V`,
    steps: corrida.step_count,
    knownWalls: corrida.known_walls ?? null,
    raw: corrida,
  };
}

/**
 * POST /telemetria — usado pelo simulador para persistir corridas locais.
 * Aceita um payload pronto no formato do contrato.
 */
export async function postTelemetria(payload) {
  const response = await fetch(`${API_BASE}/telemetria`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`POST /telemetria falhou: ${response.status} ${text}`);
  }
  return response.json();
}

/**
 * GET /historico [?maze_type=...]
 * Retorna a lista de corridas já normalizada para a UI.
 */
export async function getHistorico(mazeType) {
  const url = new URL(`${API_BASE}/historico`);
  if (mazeType && mazeType !== 'Todos') {
    url.searchParams.set('maze_type', mazeType);
  }
  const response = await fetch(url.toString());
  if (!response.ok) {
    throw new Error(`GET /historico falhou: ${response.status}`);
  }
  const body = await response.json();
  const data = Array.isArray(body) ? body : body.data ?? [];
  return data.map(mapCorridaToUI);
}

/**
 * POST /comando — manda o start/reset pro robo real. 
 * o script python da ponte q pega isso e taca via bluetooth no ESP32
 */
export async function postComando(command) {
  const response = await fetch(`${API_BASE}/comando`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command }),
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`POST /comando falhou: ${response.status} ${text}`);
  }
  return response.json();
}

/**
 * GET /health — usado pelo indicador de conexão antes do primeiro pacote.
 */
export async function getHealth() {
  const response = await fetch(`${API_BASE}/health`);
  if (!response.ok) throw new Error('health check falhou');
  return response.json();
}

/**
 * GET /historico/{id} — retorna uma corrida específica com path_traversed
 * completo (para a tela de replay).
 */
export async function getCorrida(id) {
  const response = await fetch(`${API_BASE}/historico/${id}`);
  if (!response.ok) {
    throw new Error(`GET /historico/${id} falhou: ${response.status}`);
  }
  const body = await response.json();
  return body.data;
}

/**
 * Converte string "1m 45.3s" em segundos para comparação no ranking.
 */
export function parseTimeToSeconds(timeStr) {
  if (!timeStr) return Infinity;
  const parts = timeStr.split(' ');
  if (parts.length < 2) return Infinity;
  return parseInt(parts[0], 10) * 60 + parseFloat(parts[1]);
}

/**
 * DELETE /historico — apaga todo o histórico de corridas do banco de dados.
 */
export async function deleteHistorico() {
  const response = await fetch(`${API_BASE}/historico`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`DELETE /historico falhou: ${response.status} ${text}`);
  }
  return response.json();
}
