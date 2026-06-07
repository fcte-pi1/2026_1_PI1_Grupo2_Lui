import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Cpu, Wifi, Play, Pause, Bot, RotateCw, ChevronDown, Battery, Clock, Footprints, Gauge, RefreshCw, Zap, Timer, Download, CheckCircle2, XCircle, Calendar, Square, Trophy, Table, ChevronRight } from 'lucide-react';
import { useMazeSimulator } from './useMazeSimulator';
import { CELL_MM, DX as DXR, DY as DYR, mmToCell } from './utils/maze';
import { useWebSocket } from './useWebSocket';
import { getHistorico, postTelemetria, batteryVoltsToPercent, getCorrida, parseTimeToSeconds } from './services/api';

const ReplayCanvas = ({ pathMm, mazeSize, knownWalls }) => {
  const total = pathMm?.length ?? 0;
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [speedMs, setSpeedMs] = useState(150); // ms por passo

  useEffect(() => { setIdx(0); }, [pathMm]);

  useEffect(() => {
    if (!playing || idx >= total - 1) return;
    const t = setTimeout(() => setIdx(i => Math.min(i + 1, total - 1)), speedMs);
    return () => clearTimeout(t);
  }, [playing, idx, total, speedMs]);

  // Pausa automática ao chegar no fim
  useEffect(() => {
    if (idx >= total - 1) setPlaying(false);
  }, [idx, total]);

  const visited = new Set();
  // Conjunto de "arestas atravessadas" (cell→cell adjacente). Toda vez que
  // o robô se move de A para B, sabemos que NÃO há parede entre A e B.
  const passable = new Set();
  for (let i = 0; i <= idx && i < total; i++) {
    const ax = mmToCell(pathMm[i].x), ay = mmToCell(pathMm[i].y);
    visited.add(`${ax},${ay}`);
    if (i > 0) {
      const bx = mmToCell(pathMm[i - 1].x), by = mmToCell(pathMm[i - 1].y);
      passable.add(`${ax},${ay}->${bx},${by}`);
      passable.add(`${bx},${by}->${ax},${ay}`);
    }
  }
  const cur = pathMm[idx] || pathMm[0];
  const rx = cur ? mmToCell(cur.x) : 0;
  const ry = cur ? mmToCell(cur.y) : 0;

  // Paredes do replay:
  //   1) Se vier `knownWalls` do backend (mapa preciso), usa direto.
  //   2) Senão, infere a partir do caminho percorrido (versão antiga).
  const hasPreciseWalls = Array.isArray(knownWalls) && knownWalls.length === mazeSize;
  const hasWallReplay = (cx, cy, d) => {
    if (hasPreciseWalls) {
      const cell = knownWalls[cx]?.[cy];
      return Array.isArray(cell) ? Boolean(cell[d]) : false;
    }
    const nx = cx + DXR[d];
    const ny = cy + DYR[d];
    if (nx < 0 || nx >= mazeSize || ny < 0 || ny >= mazeSize) return true;
    if (!visited.has(`${cx},${cy}`)) return false;
    if (!visited.has(`${nx},${ny}`)) return false;
    return !passable.has(`${cx},${cy}->${nx},${ny}`);
  };

  // Direção do robô: deduzida do movimento entre células consecutivas
  let robotDir = 0;
  for (let i = idx; i > 0; i--) {
    const prev = pathMm[i - 1], curP = pathMm[i];
    const dxCell = mmToCell(curP.x) - mmToCell(prev.x);
    const dyCell = mmToCell(curP.y) - mmToCell(prev.y);
    if (dxCell !== 0 || dyCell !== 0) {
      if (dyCell < 0)      robotDir = 0; // Norte
      else if (dxCell > 0) robotDir = 1; // Leste
      else if (dyCell > 0) robotDir = 2; // Sul
      else                 robotDir = 3; // Oeste
      break;
    }
  }

  const mid = Math.floor(mazeSize / 2);
  const goals = [
    {x: mid - 1, y: mid - 1}, {x: mid, y: mid - 1},
    {x: mid - 1, y: mid}, {x: mid, y: mid},
  ];

  return (
    <div className="bg-app-bg rounded-xl border border-border-rule p-3 h-full flex flex-col shadow-card">
      <div className="text-label mb-2 flex items-center justify-between">
        <span>Replay do Trajeto</span>
        <span className="text-brand-h1 font-mono normal-case text-xs">{idx + 1}/{total}</span>
      </div>
      <div
        className="aspect-square w-full max-w-[260px] mx-auto border-2 border-brand-purple-light rounded-md overflow-hidden bg-app-bg"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${mazeSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${mazeSize}, minmax(0, 1fr))`,
        }}
      >
        {Array.from({ length: mazeSize * mazeSize }).map((_, i) => {
          const cy = Math.floor(i / mazeSize);
          const cx = i % mazeSize;
          const isVisited = visited.has(`${cx},${cy}`);
          const isGoal = goals.some(g => g.x === cx && g.y === cy);
          const isRobot = cx === rx && cy === ry;
          let bg = 'var(--bg-unexplored)';
          if (isVisited) bg = 'var(--bg-explored)';
          if (isGoal) bg = 'var(--bg-center)';
          const faint = '1px solid rgba(255,255,255,0.06)';
          const wall  = '2.5px solid var(--primary-2)';
          return (
            <div key={i} style={{
              backgroundColor: bg,
              borderTop:    hasWallReplay(cx, cy, 0) ? wall : faint,
              borderRight:  hasWallReplay(cx, cy, 1) ? wall : faint,
              borderBottom: hasWallReplay(cx, cy, 2) ? wall : faint,
              borderLeft:   hasWallReplay(cx, cy, 3) ? wall : faint,
              boxSizing: 'border-box',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {isRobot && (
                <div style={{
                  width: 0, height: 0,
                  borderLeft: '4px solid transparent',
                  borderRight: '4px solid transparent',
                  borderBottom: '8px solid var(--primary-2)',
                  transform: `rotate(${robotDir * 90}deg)`,
                }} />
              )}
            </div>
          );
        })}
      </div>
      <div className="mt-3 space-y-2">
        <input
          type="range" min={0} max={Math.max(0, total - 1)} value={idx}
          onChange={(e) => { setPlaying(false); setIdx(parseInt(e.target.value, 10)); }}
          className="w-full"
        />
        <div className="flex items-center justify-between">
          <div className="flex gap-1.5">
            <button onClick={() => setPlaying(p => !p)} className="bg-app-raised border border-border-rule text-brand-h1 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all hover:bg-app-hover hover:border-border-accent">
              {playing ? <><Pause size={11}/><span>Pausar</span></> : <><Play size={11}/><span>Reproduzir</span></>}
            </button>
            <button onClick={() => { setIdx(0); setPlaying(true); }} className="bg-app-raised border border-border-rule text-brand-h1 px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all hover:bg-app-hover hover:border-border-accent">
              <RotateCw size={11}/><span>Reiniciar</span>
            </button>
          </div>
          <select
            value={speedMs}
            onChange={(e) => setSpeedMs(parseInt(e.target.value, 10))}
            className="bg-app-raised border border-border-rule text-brand-h2 text-xs font-medium px-2 py-1 rounded-lg focus:outline-none cursor-pointer"
          >
            <option value={400}>0.5×</option>
            <option value={150}>1×</option>
            <option value={75}>2×</option>
            <option value={30}>5×</option>
          </select>
        </div>
      </div>
    </div>
  );
};

const MiniMap = ({ snapshot }) => {
  const { gridSize, knownWalls, explored, goals, robot } = snapshot;

  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-app-bg relative rounded-xl border border-border-rule shadow-card">
        <h4 className="absolute top-3 left-0 right-0 text-center text-label z-10 pointer-events-none drop-shadow-md">Trajeto Mapeado</h4>
        <div
          className="aspect-square w-full max-w-[200px] border-2 border-brand-purple-light rounded-md overflow-hidden box-border bg-app-bg mt-6"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
              const y = Math.floor(i / gridSize);
              const x = i % gridSize;

              let style = {
                borderTop: knownWalls[x][y][0] ? '2px solid var(--primary-2)' : '1px solid rgba(255,255,255,0.06)',
                borderRight: knownWalls[x][y][1] ? '2px solid var(--primary-2)' : '1px solid rgba(255,255,255,0.06)',
                borderBottom: knownWalls[x][y][2] ? '2px solid var(--primary-2)' : '1px solid rgba(255,255,255,0.06)',
                borderLeft: knownWalls[x][y][3] ? '2px solid var(--primary-2)' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: 'var(--bg-unexplored)',
                boxSizing: 'border-box'
              };

              if (explored[x][y]) style.backgroundColor = 'var(--bg-explored)';
              const isGoal = goals.some(g => g.x === x && g.y === y);
              if (isGoal) style.backgroundColor = 'var(--bg-center)';
              const isRobot = robot && robot.x === x && robot.y === y;

              return (
                 <div key={i} style={style} className="relative flex items-center justify-center">
                    {isRobot && (
                        <div style={{
                           width: 0, height: 0,
                           borderLeft: '3px solid transparent',
                           borderRight: '3px solid transparent',
                           borderBottom: '6px solid var(--primary-2)',
                           transform: `rotate(${robot.direction * 90}deg)`,
                        }} />
                    )}
                 </div>
              );
          })}
        </div>
    </div>
  );
};

const App = () => {
  const [activeTab, setActiveTab] = useState('Mapa');
  const sim = useMazeSimulator();
  const { status: wsStatus, lastMessage } = useWebSocket();

  // ── Telemetria viva derivada do WebSocket ─────────────────────────────
  const [liveTelemetry, setLiveTelemetry] = useState(null);
  const [latencyMs, setLatencyMs] = useState(null);
  const [packetsRx, setPacketsRx] = useState(0);

  useEffect(() => {
    if (!lastMessage || typeof lastMessage !== 'object') return;
    setLiveTelemetry(lastMessage);
    setPacketsRx(prev => prev + 1);
    if (lastMessage.timestamp) {
      const t = Date.parse(lastMessage.timestamp);
      if (!Number.isNaN(t)) {
        setLatencyMs(Math.max(0, Date.now() - t));
      }
    }
  }, [lastMessage]);

  // ── Histórico: corridas reais do backend + corridas do simulador ──────
  const [apiHistory, setApiHistory] = useState([]);
  const [simHistory, setSimHistory] = useState([]);
  const [historyFilter, setHistoryFilter] = useState('Todos');
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const refreshHistory = React.useCallback(async (filter) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const items = await getHistorico(filter);
      setApiHistory(items);
    } catch (err) {
      setHistoryError(err.message || 'Erro ao carregar histórico');
      setApiHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'Histórico') {
      refreshHistory(historyFilter);
    }
  }, [activeTab, historyFilter, refreshHistory]);

  useEffect(() => {
    if (lastMessage && lastMessage.race_status === 'finished') {
      const t = setTimeout(() => refreshHistory(historyFilter), 200);
      return () => clearTimeout(t);
    }
  }, [lastMessage, historyFilter, refreshHistory]);

  // Sessão do simulador → POSTa em /telemetria com source='simulator'.
  const lastSimRunRef = useRef(null);
  useEffect(() => {
    const status = sim.memory.status;
    if (status !== 'Centro Alcançado!' && status !== 'Preso!') return;
    if (sim.memory.timeMs <= 0) return;
    const runId = `sim-${sim.memory.bfsCount}-${sim.memory.steps}-${sim.memory.timeMs}`;
    if (lastSimRunRef.current === runId) return;
    lastSimRunRef.current = runId;

    const mem = sim.memory;
    const success = status === 'Centro Alcançado!';
    const robotPathPoint = {
      x: mem.robot.x * CELL_MM + CELL_MM / 2,
      y: mem.robot.y * CELL_MM + CELL_MM / 2,
      z: 9.81,
    };
    const path = (mem.pathHistory && mem.pathHistory.length > 0)
      ? mem.pathHistory
      : [robotPathPoint];

    const size = sim.gridSize;
    const walls = (mem.truthWalls && mem.truthWalls.length === size)
      ? Array.from({ length: size }, (_, x) =>
          Array.from({ length: size }, (_, y) => {
            const w = mem.truthWalls[x][y];
            return [Boolean(w[0]), Boolean(w[1]), Boolean(w[2]), Boolean(w[3])];
          })
        )
      : null;

    const payload = {
      robot_id: 'sim_browser',
      timestamp: new Date().toISOString(),
      maze_type: `${sim.gridSize}x${sim.gridSize}`,
      current_position: {
        ...robotPathPoint,
        orientation: mem.robot.dir * 90,
      },
      path_traversed: path,
      battery_voltage_v: mem.batteryEndV ?? 7.1,
      speed_mm_s: 0.0,
      elapsed_time_ms: Math.max(1, Math.round(mem.timeMs)),
      race_status: 'finished',
      event: success ? 'race_ended' : 'simulator_stuck',
      message: success ? 'Simulador: centro alcançado.' : 'Simulador: robô preso.',
      source: 'simulator',
      success,
      known_walls: walls,
    };

    postTelemetria(payload)
      .then(() => {
        if (activeTab === 'Histórico') refreshHistory(historyFilter);
      })
      .catch((err) => {
        console.warn('Falha ao persistir corrida simulada — mantendo em memória local.', err);
        const fallbackRun = {
          id: runId,
          source: 'simulator',
          success,
          date: new Date().toLocaleString('pt-BR'),
          maze: `${sim.gridSize}x${sim.gridSize}`,
          status,
          time: `${Math.floor(mem.timeMs / 60000)}m ${((mem.timeMs % 60000) / 1000).toFixed(1)}s`,
          speed: mem.timeMs > 0
            ? ((mem.steps * 18) / (mem.timeMs / 1000)).toFixed(1) + ' cm/s'
            : '0.0 cm/s',
          battery: '100%',
          steps: mem.steps,
          mapSnapshot: {
            gridSize: sim.gridSize,
            knownWalls: JSON.parse(JSON.stringify(mem.knownWalls)),
            explored: JSON.parse(JSON.stringify(mem.explored)),
            goals: JSON.parse(JSON.stringify(mem.goals)),
            robot: JSON.parse(JSON.stringify(mem.robot)),
          },
        };
        setSimHistory(prev => [fallbackRun, ...prev]);
      });
  }, [sim.memory.status, sim.memory.timeMs, sim.memory.steps, sim.memory.bfsCount, sim.gridSize, sim.memory.knownWalls, sim.memory.explored, sim.memory.goals, sim.memory.robot, sim.memory, activeTab, historyFilter, refreshHistory]);

  // Lista combinada exibida na aba Histórico
  const combinedHistory = useMemo(() => {
    const simFiltered = historyFilter === 'Todos'
      ? simHistory
      : simHistory.filter(h => h.maze === historyFilter);
    return [...simFiltered, ...apiHistory];
  }, [simHistory, apiHistory, historyFilter]);

  // Bateria exibida no widget
  const batteryPct = liveTelemetry?.battery_voltage_v != null
    ? batteryVoltsToPercent(liveTelemetry.battery_voltage_v)
    : null;

  const [mockMode, setMockMode] = useState('simulator');

  // Modo de operação (Controlado pelo Mock Switch)
  const dataMode = useMemo(() => {
    return mockMode;
  }, [mockMode]);

  // Status da corrida
  const runStatus = useMemo(() => {
    if (dataMode === 'real' && liveTelemetry) {
      if (liveTelemetry.event === 'objective_found') return 'Objetivo localizado!';
      if (liveTelemetry.event === 'race_ended' || liveTelemetry.race_status === 'finished') {
        return liveTelemetry.success === false ? 'Preso!' : 'Centro Alcançado!';
      }
      if (liveTelemetry.race_status === 'error' || liveTelemetry.event === 'error_occurred') return 'Erro!';
      if (liveTelemetry.event === 'start_race' || liveTelemetry.race_status === 'running') return 'Mapeando...';
      if (liveTelemetry.race_status === 'paused') return 'Pausado';
      if (liveTelemetry.race_status === 'ready') return 'Pronto';
    }
    return sim.memory.status;
  }, [dataMode, liveTelemetry, sim.memory.status]);

  const liveRobot = useMemo(() => {
    if (dataMode !== 'real' || !liveTelemetry?.current_position) return null;
    const p = liveTelemetry.current_position;
    const dir = Math.round(((p.orientation ?? 0) / 90)) % 4;
    return { x: mmToCell(p.x), y: mmToCell(p.y), dir: (dir + 4) % 4 };
  }, [dataMode, liveTelemetry]);

  const liveExplored = useMemo(() => {
    if (dataMode !== 'real' || !liveTelemetry?.path_traversed) return null;
    const size = sim.gridSize;
    const arr = Array(size).fill(null).map(() => Array(size).fill(false));
    for (const p of liveTelemetry.path_traversed) {
      const cx = mmToCell(p.x), cy = mmToCell(p.y);
      if (cx >= 0 && cx < size && cy >= 0 && cy < size) arr[cx][cy] = true;
    }
    return arr;
  }, [dataMode, liveTelemetry, sim.gridSize]);

  return (
    <div className="font-sans h-screen flex flex-col overflow-hidden">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} wsStatus={wsStatus} sim={sim} />
      <div className="w-full flex-grow flex flex-col overflow-hidden relative">
        <main className="flex-grow flex flex-col lg:flex-row gap-4 h-full min-h-0 overflow-hidden">
          {activeTab === 'Histórico' ? (
            <div className="w-full h-full flex flex-col overflow-hidden min-h-0">
              <HistoryView
                historyData={combinedHistory}
                filter={historyFilter}
                setFilter={setHistoryFilter}
                loading={historyLoading}
                error={historyError}
                onRefresh={() => refreshHistory(historyFilter)}
              />
            </div>
          ) : (
            <>
              <section className="flex-grow bg-app-surface border-r border-border-rule p-5 flex flex-col relative overflow-hidden min-h-0">
                <MazeCanvas sim={sim} liveRobot={liveRobot} liveExplored={liveExplored} dataMode={dataMode} mockMode={mockMode} setMockMode={setMockMode} />
              </section>
              <aside className="w-full lg:w-[372px] flex flex-col gap-2 overflow-y-auto shrink-0 my-4 mr-4 pr-1 custom-scrollbar">
                <TelemetrySidebar
                  sim={sim}
                  wsStatus={wsStatus}
                  batteryPct={batteryPct}
                  latencyMs={latencyMs}
                  packetsRx={packetsRx}
                  liveTelemetry={liveTelemetry}
                  dataMode={dataMode}
                  runStatus={runStatus}
                />
              </aside>
            </>
          )}
        </main>
      </div>
    </div>
  );
};

/* ============================================================
   CABEÇALHO
   ============================================================ */
const Header = ({ activeTab, setActiveTab, wsStatus, sim }) => {
  const tabs = ['Mapa', 'Telemetria', 'Histórico', 'Configurações'];
  const isConnected = wsStatus === 'Conectado';

  return (
    <header className="relative flex items-center justify-center h-16 px-5 shrink-0 w-full border-b border-border-subtle bg-[#080614]" data-screen-label="Header">
      {/* Marca */}
      <div className="absolute left-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl grid place-items-center text-white bg-brand-purple shrink-0">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="4" y="4" width="16" height="16" rx="2" />
            <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
            <circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div className="font-bold text-lg tracking-tight text-brand-h1 leading-none flex items-center">
          micro<span className="text-brand-purple-light">mouse</span><span className="text-brand-h3">.</span>
          <span className="sr-only">micromouse</span>
        </div>
      </div>

      {/* Pílulas de navegação */}
      <nav data-testid="pill-container" className="hidden md:flex pill-container">
        {tabs.map((tab) => (
          <button
            key={tab}
            data-testid="pill-item"
            onClick={() => setActiveTab(tab)}
            className={`pill-item font-medium text-sm transition-all ${
              activeTab === tab
                ? 'text-white bg-brand-purple'
                : 'text-brand-h3 hover:text-brand-h1 hover:bg-white/[0.03]'
            }`}
            {...(activeTab === tab ? { 'aria-current': 'page' } : {})}
          >
            {tab}
          </button>
        ))}
      </nav>
    </header>
  );
};

const CustomSelect = ({ value, onChange, options, className = "", dropdownWidth = "w-full", "data-testid": dataTestId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const selectedLabel = options.find(o => o.value === value)?.label || value;

  return (
    <div data-testid={dataTestId} className={`relative flex items-center justify-between cursor-pointer group ${className}`} ref={dropdownRef} onClick={() => setIsOpen(!isOpen)}>
      <span className="truncate pr-2 select-none pointer-events-none">{selectedLabel}</span>
      <ChevronDown size={14} className={`pointer-events-none transition-transform duration-200 text-brand-h3 group-hover:text-brand-h1 ${isOpen ? 'rotate-180' : ''}`} />

      {isOpen && (
        <div className={`absolute top-[calc(100%+8px)] left-1/2 -translate-x-1/2 ${dropdownWidth} min-w-[160px] bg-app-surface border border-border-rule rounded-xl shadow-[0_8px_30px_rgb(0,0,0,0.5)] overflow-hidden z-[100] animate-in fade-in zoom-in-95 duration-200 origin-top`}>
          {options.map((opt) => (
            <div
              key={opt.value}
              className={`px-4 py-2.5 text-sm font-medium transition-colors select-none ${
                value === opt.value
                  ? 'bg-brand-purple/15 text-brand-purple-light'
                  : 'text-brand-h1 hover:bg-white/[0.04]'
              }`}
              onClick={(e) => {
                e.stopPropagation();
                onChange(opt.value);
                setIsOpen(false);
              }}
            >
              {opt.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const GlobalChip = ({ children, className = '', ...props }) => (
  <div
    className={`flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-app-raised border border-border-rule text-sm text-brand-h2 font-medium box-border ${className}`}
    {...props}
  >
    {children}
  </div>
);

/* ============================================================
   CANVAS DO LABIRINTO
   ============================================================ */
const MazeCanvas = ({ sim, liveRobot, liveExplored, dataMode, mockMode, setMockMode }) => {
  const { memory, isRunning, setIsRunning, speed, setSpeed, showTruth, setShowTruth, resetSimulation, gridSize, changeGridSize } = sim;
  const mem = memory;
  const robotShown = liveRobot ?? mem.robot;
  const exploredShown = liveExplored ?? mem.explored;
  const isRealMode = dataMode === 'real';

  if (!mem.truthWalls || mem.truthWalls.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center relative p-4 bg-app-bg rounded-xl border border-border-rule overflow-hidden">
        <div className="text-brand-h3 font-medium text-sm">Carregando simulador...</div>
      </div>
    );
  }

  let maxD = 0;
  for (let x = 0; x < gridSize; x++)
    for (let y = 0; y < gridSize; y++)
      if (mem.distances[x][y] !== 255 && mem.distances[x][y] > maxD) maxD = mem.distances[x][y];

  const GOALS = mem.goals || [];

  const COL = 'ABCDEFGHIJKLMNOP';
  const cellName = (x, y) => COL[x] + (gridSize - y);

  return (
    <>
      {/* Barra de ferramentas */}
      <div className="flex flex-col xl:flex-row justify-between items-center mb-4 z-10 gap-4 shrink-0 w-full">
        {/* Grupo de controles: seletor + velocidade + raio-x */}
        <div className="flex items-center gap-4 h-10 px-4 rounded-xl bg-app-inset border border-border-rule box-border">
            {/* Matrix selector */}
            <div className="flex items-center gap-2">
              <span className="text-label">Matriz</span>
              <CustomSelect
                aria-label="Tamanho da matriz"
                className="h-[28px] bg-app-raised border border-border-subtle hover:bg-app-hover hover:border-border-accent rounded-[16px] transition-all px-3 text-brand-h1 font-sans font-semibold text-sm"
                value={gridSize}
                onChange={(val) => changeGridSize(parseInt(val))}
                dropdownWidth="w-auto"
                options={[
                  { value: 4, label: '4x4' },
                  { value: 8, label: '8x8' },
                  { value: 16, label: '16x16' }
                ]}
              />
            </div>

            <div className="w-px h-5 bg-border-rule" />

            {/* Controle de velocidade */}
            <div className="flex items-center gap-3 h-full">
              <span className="text-label">Velocidade</span>
              <div className="flex items-center h-full">
                <input
                  type="range" min="10" max="500"
                  value={510 - speed}
                  onChange={(e) => setSpeed(510 - parseInt(e.target.value))}
                  className="w-24"
                  style={{ '--fill': `${((510 - speed - 10) / 490) * 100}%` }}
                />
              </div>
            </div>

            <div className="w-px h-5 bg-border-rule" />

            {/* Alternador Modo */}
            <label className="flex items-center gap-2 h-full cursor-pointer group" title="Mock de Modo (Simulador vs Corrida)">
              <input type="checkbox" className="sr-only" checked={mockMode === 'real'} onChange={(e) => setMockMode(e.target.checked ? 'real' : 'simulator')} aria-label="Alternar Modo de Operação" />
              <div className={`toggle-switch ${mockMode === 'real' ? 'active' : ''}`} />
              <span className="text-label w-[75px] text-left">{mockMode === 'real' ? 'Corrida' : 'Simulador'}</span>
            </label>

            <div className="w-px h-5 bg-border-rule" />

            {/* Alternador Raio-X */}
            <label className={`flex items-center gap-2 h-full ${isRealMode ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} title={isRealMode ? 'Raio-X só disponível no modo Simulador' : ''}>
              <input type="checkbox" className="sr-only" checked={showTruth && !isRealMode} disabled={isRealMode} onChange={(e) => setShowTruth(e.target.checked)} />
              <div className={`toggle-switch ${showTruth && !isRealMode ? 'active' : ''}`} />
              <span className="text-label">Raio-X</span>
            </label>
          </div>

          {/* Botões de ação */}
          <div data-testid="pill-container" className="pill-container">
            <button
              data-testid="pill-item"
              onClick={() => setIsRunning(!isRunning)}
              className={`group pill-item gap-2 font-semibold text-sm transition-all w-[100px] ${
                isRunning
                  ? 'bg-app-raised border border-border-subtle text-brand-h2 hover:text-brand-h1 hover:border-border-accent'
                  : 'text-white border border-transparent bg-brand-purple'
              }`}
            >
              {isRunning ? (
                <><Square size={16} className="transition-transform group-active:scale-90" /><span>Pausar</span></>
              ) : (
                <><Play size={16} className="transition-transform group-hover:scale-110 group-active:scale-90" /><span>Iniciar</span></>
              )}
            </button>
            <button
              data-testid="pill-item"
              onClick={() => resetSimulation(false)}
              className="group pill-item gap-2 font-semibold text-sm bg-app-raised border border-border-subtle text-brand-h1 transition-all hover:bg-app-hover hover:border-border-accent"
            >
              <Bot size={16} className="transition-transform group-hover:-translate-y-0.5 group-active:scale-90" /><span>Reiniciar</span>
            </button>
            <button
              data-testid="pill-item"
              onClick={() => resetSimulation(true)}
              className="group pill-item gap-2 font-semibold text-sm bg-app-raised border border-border-subtle text-brand-h1 transition-all hover:bg-app-hover hover:border-border-accent"
            >
              <RotateCw size={16} className="transition-transform duration-300 group-hover:rotate-180 group-active:scale-90" /><span>Novo</span>
            </button>
          </div>
      </div>

      {/* Grade do labirinto */}
      <div className="flex-1 flex items-center justify-center relative p-4 bg-app-bg rounded-xl border border-border-rule overflow-hidden min-h-0" style={{ containerType: 'size' }}>
        <div id="maze-container" className={showTruth ? "show-truth" : ""} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))` }}>
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const y = Math.floor(i / gridSize), x = i % gridSize;
            let classes = ["cell"];
            if (showTruth && !isRealMode) {
              if (mem.truthWalls[x][y][0]) classes.push("truth-wall-n");
              if (mem.truthWalls[x][y][1]) classes.push("truth-wall-e");
              if (mem.truthWalls[x][y][2]) classes.push("truth-wall-s");
              if (mem.truthWalls[x][y][3]) classes.push("truth-wall-w");
            }
            const cellExplored = exploredShown[x]?.[y];
            if (cellExplored) {
              classes.push("explored");
              if (!isRealMode) {
                if (mem.knownWalls[x][y][0]) classes.push("known-wall-n");
                if (mem.knownWalls[x][y][1]) classes.push("known-wall-e");
                if (mem.knownWalls[x][y][2]) classes.push("known-wall-s");
                if (mem.knownWalls[x][y][3]) classes.push("known-wall-w");
              }
            }
            const isGoal = GOALS.some(g => g.x === x && g.y === y);
            if (isGoal) classes.push("goal");
            const d = mem.distances[x][y];
            let dataColor = null;
            if (!isRealMode && cellExplored && d !== 0 && d !== 255)
              dataColor = d <= maxD / 3 ? "g" : d <= 2 * maxD / 3 ? "y" : "r";
            const hasRobot = robotShown && robotShown.x === x && robotShown.y === y;
            return (
              <div key={i} className={classes.join(" ")} data-color={dataColor}>
                {hasRobot && <div id="robot" className={`dir-${robotShown.dir}`}></div>}
                {isGoal && !hasRobot && "G"}
                {!isGoal && !hasRobot && cellExplored && !isRealMode && d !== 255 ? d : ""}
              </div>
            );
          })}
        </div>

      </div>
    </>
  );
};

/* ============================================================
   PAINEL DE TELEMETRIA
   ============================================================ */
const TelemetrySidebar = ({ sim, wsStatus, batteryPct, latencyMs, packetsRx, liveTelemetry, dataMode, runStatus }) => {
  const mem = sim.memory;
  const statusText = runStatus ?? mem.status;
  const isReal = dataMode === 'real';

  // Estilo do estado
  let estadoClass = 'text-brand-h2 bg-app-raised border-border-rule';

  if (statusText === 'Mapeando...' || statusText === 'Explorando' || statusText === 'Voltando') {
    estadoClass = 'text-white bg-brand-purple border-transparent';
  } else if (statusText === 'Centro Alcançado!' || statusText === 'Objetivo localizado!') {
    estadoClass = 'text-white bg-brand-green border-transparent';
  } else if (statusText === 'Preso!' || statusText === 'Erro!') {
    estadoClass = 'text-white bg-brand-danger border-transparent';
  }

  // Valores de telemetria
  const timeSec = (dataMode === 'real' && liveTelemetry?.elapsed_time_ms != null)
    ? (liveTelemetry.elapsed_time_ms / 1000).toFixed(1)
    : (mem.timeMs / 1000).toFixed(1);
  const avgSpeed = (dataMode === 'real' && liveTelemetry?.speed_mm_s != null)
    ? (liveTelemetry.speed_mm_s / 10).toFixed(1)
    : (mem.timeMs > 0 ? ((mem.steps * 18) / (mem.timeMs / 1000)).toFixed(1) : "0.0");
  const stepsDisplay = (dataMode === 'real' && liveTelemetry?.step_count != null)
    ? liveTelemetry.step_count
    : mem.steps;

  // Cobertura
  const explored = mem.explored;
  let coveredCount = 0;
  if (explored) {
    for (let x = 0; x < sim.gridSize; x++)
      for (let y = 0; y < sim.gridSize; y++)
        if (explored[x]?.[y]) coveredCount++;
  }
  const totalCells = sim.gridSize * sim.gridSize;
  const coveragePct = Math.round((coveredCount / totalCells) * 100);

  // Fase do algoritmo
  let phaseText = 'Espera';
  if (statusText === 'Mapeando...' || statusText === 'Explorando') phaseText = 'Busca';
  else if (statusText === 'Centro Alcançado!' || statusText === 'Objetivo localizado!') phaseText = 'Resolvido';

  const isConnected = wsStatus === 'Conectado';
  const latencyOver = latencyMs != null && latencyMs > 500;
  const batteryDisplay = batteryPct != null ? `${batteryPct}%` : '—';
  const batteryWidth = batteryPct != null ? Math.max(0, Math.min(100, batteryPct)) : 0;

  // Distância até o centro
  const robotX = mem.robot?.x ?? 0;
  const robotY = mem.robot?.y ?? 0;
  const distCenter = mem.distances?.[robotX]?.[robotY];
  const distDisplay = distCenter != null && distCenter !== 255 ? distCenter : '—';

  return (
    <>
      {/* Status do Robô */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-1 pb-1">
          <h3 className="text-label">Status do Robô</h3>
          <span className="flex-1 h-px bg-border-rule" />
        </div>
        <div className="bg-panel overflow-hidden">
          <ConnRow
            icon={<Play size={16} />}
            label="Estado"
            value={<span className={`inline-flex items-center justify-center h-6 px-3 min-w-[96px] rounded-md border text-[11px] font-semibold leading-none ${estadoClass}`}>{statusText}</span>}
          />
          <ConnRow
            icon={<Wifi size={16} />}
            label="Conexão"
            value={
              <span className={`inline-flex items-center justify-center h-6 w-24 rounded-md border text-[11px] font-semibold leading-none ${
                isConnected
                  ? 'text-white bg-brand-green border-transparent'
                  : 'text-white bg-brand-danger border-transparent'
              }`}>
                {isConnected ? 'Conectado' : 'Desconectado'}
              </span>
            }
          />
          <ConnRow
            icon={<Bot size={16} />}
            label="Modo"
            value={
              <span className={`inline-flex items-center justify-center h-6 w-24 rounded-md border text-[11px] font-semibold leading-none ${
                isReal
                  ? 'text-white bg-brand-green border-transparent'
                  : 'text-white bg-brand-purple border-transparent'
              }`}>
                {isReal ? 'Corrida' : 'Simulador'}
              </span>
            }
          />
          <ConnRow
            icon={<Clock size={16} />}
            label="Latência"
            value={
              <span className={`font-mono font-semibold text-sm ${latencyOver ? 'text-brand-danger-text' : 'text-brand-h1'}`}>
                {latencyMs != null ? latencyMs : '—'} <span className="text-brand-h3 text-xs">ms</span>
              </span>
            }
          />
          <ConnRow
            icon={<Battery size={16} />}
            label="Bateria"
            last
            value={
              <span className="flex items-center gap-2 font-mono font-semibold text-sm text-brand-h1">
                <span className="w-10 h-2 rounded-full bg-app-inset overflow-hidden border border-border-rule">
                  <span className="block h-full rounded-full" style={{
                    width: `${batteryWidth}%`,
                    backgroundColor: 'var(--success)',
                  }} />
                </span>
                {batteryDisplay}
              </span>
            }
          />
        </div>
      </div>

      {/* Telemetria */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-1 pb-1">
          <h3 className="text-label">Telemetria</h3>
          <span className="flex-1 h-px bg-border-rule" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <MetricCard label="Velocidade" value={avgSpeed} unit="cm/s" icon={<Gauge size={16} />} accent />
          <MetricCard label="Tempo" value={timeSec} unit="s" icon={<Timer size={16} />} />
          <MetricCard label="Passos" value={stepsDisplay} unit="" icon={<Footprints size={16} />} />
          <MetricCard label="Giros" value={mem.turns} unit="" icon={<RefreshCw size={16} />} />
        </div>
      </div>

      {/* Algoritmo */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2 px-1 pb-1">
          <h3 className="text-label">Algoritmo</h3>
          <span className="flex-1 h-px bg-border-rule" />
        </div>
        <div className="bg-panel p-3 flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg grid place-items-center text-white flex-none bg-brand-purple">
              <Zap size={16} />
            </div>
            <div>
              <div className="text-base font-bold tracking-tight text-brand-h1">Flood-Fill</div>
              <div className="text-[11px] text-brand-h3 uppercase tracking-wider font-semibold mt-0.5">Resolução por inundação</div>
            </div>
          </div>
          <div className="flex gap-2">
            <AlgoStat label="Fase" value={phaseText} />
            <AlgoStat label="Dist. centro" value={distDisplay} />
            <AlgoStat label="Cobertura" value={`${coveragePct}%`} />
          </div>
        </div>
      </div>
    </>
  );
};

const ConnRow = ({ icon, label, value, last = false }) => (
  <div className={`flex items-center justify-between h-11 px-3 ${last ? '' : 'border-b border-border-rule'}`}>
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 rounded-lg grid place-items-center bg-app-raised border border-border-rule text-brand-h2 flex-none">
        {icon}
      </div>
      <span className="text-brand-h2 text-sm font-medium">{label}</span>
    </div>
    <div className="ml-auto">{value}</div>
  </div>
);

const MetricCard = ({ label, value, unit, icon, accent = false }) => (
  <div className="bg-panel p-3 rounded-xl transition-all hover:border-border-accent hover:bg-app-hover group">
    <div className="flex items-center justify-between">
      <span className="text-label">{label}</span>
      <span className="text-brand-h3 group-hover:text-brand-h2 transition-colors">{icon}</span>
    </div>
    <div className={`mt-1.5 font-mono text-2xl font-bold tracking-tight leading-none tabular-nums ${accent ? 'text-brand-purple-light' : 'text-brand-h1'}`}>
      {value}
      {unit && <span className="text-sm text-brand-h2 font-medium font-sans ml-1">{unit}</span>}
    </div>
  </div>
);

const AlgoStat = ({ label, value }) => (
  <div className="flex-1 bg-app-inset border border-border-rule rounded-lg p-2">
    <div className="text-label">{label}</div>
    <div className="font-mono text-base font-semibold text-brand-h1 mt-1 tabular-nums">{value}</div>
  </div>
);

/* ============================================================
   VISÃO DE HISTÓRICO
   ============================================================ */
const RankingPanel = ({ runs, onSelectRun }) => {
  const [sourceFilter, setSourceFilter] = useState('Todos');

  const ranking = useMemo(() => {
    return runs
      .filter(r => r.status === 'Centro Alcançado!')
      .filter(r => sourceFilter === 'Todos' || r.source === (sourceFilter === 'Físico' ? 'real' : 'simulator'))
      .sort((a, b) => parseTimeToSeconds(a.time) - parseTimeToSeconds(b.time));
  }, [runs, sourceFilter]);

  const getPodiumStyle = (idx) => {
    if (idx === 0) return 'border-l-2 border-l-yellow-400 bg-yellow-500/10 text-yellow-400';
    if (idx === 1) return 'border-l-2 border-l-slate-400 bg-slate-400/10 text-slate-300';
    if (idx === 2) return 'border-l-2 border-l-amber-600 bg-amber-600/10 text-amber-500';
    return 'border-l-2 border-l-transparent text-brand-h3 hover:bg-app-hover';
  };

  const getPodiumIcon = (idx) => {
    if (idx === 0) return <div className="w-3 h-3 rounded-full bg-yellow-400/80" />;
    if (idx === 1) return <div className="w-3 h-3 rounded-full bg-slate-400/80" />;
    if (idx === 2) return <div className="w-3 h-3 rounded-full bg-amber-600/80" />;
    return <span className="font-bold text-xs opacity-50 text-brand-h3">{idx + 1}</span>;
  };

  return (
    <div className="mb-6">
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-brand-h2 uppercase tracking-wider">Ranking Geral</h3>
        </div>
        <div className="pill-container">
          {['Todos', 'Físico', 'Simulador'].map(f => (
            <button
              key={f}
              onClick={() => setSourceFilter(f)}
              className={`pill-item font-medium text-xs transition-colors ${
                sourceFilter === f ? 'bg-brand-purple text-white' : 'text-brand-h3 hover:text-brand-h1 hover:bg-white/[0.03]'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="overflow-hidden rounded-xl border border-border-rule bg-app-bg shadow-card">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="bg-app-surface border-b border-border-rule">
            <tr>
              <th className="p-4 text-label w-16 text-center">Posição</th>
              <th className="p-4 text-label">Tipo</th>
              <th className="p-4 text-label">Labirinto</th>
              <th className="p-4 text-label">Tempo</th>
              <th className="p-4 text-label">Velocidade</th>
              <th className="p-4 text-label">Bateria</th>
              <th className="p-4 text-label">Movimentos</th>
              <th className="p-4 text-label">Status</th>
              <th className="p-4 text-label w-10 text-center"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-rule">
            {ranking.length > 0 ? ranking.map((run, idx) => (
              <tr key={run.id} onClick={() => onSelectRun(run)} className={`transition-colors cursor-pointer group ${getPodiumStyle(idx)}`}>
                <td className="p-4">
                  <div className="flex justify-center items-center h-full">
                    {getPodiumIcon(idx)}
                  </div>
                </td>
                <td className="p-4">
                  {run.source === 'simulator' ? (
                    <span className="badge w-[100px] bg-brand-purple text-white" title="Corrida gerada no simulador local">
                      <Cpu size={14} />
                      <span>Simulada</span>
                    </span>
                  ) : (
                    <span className="badge w-[100px] bg-brand-green text-white" title="Corrida do robô físico">
                      <Bot size={14} />
                      <span>Corrida</span>
                    </span>
                  )}
                </td>
                <td className="p-4 text-brand-h2 font-medium text-sm">
                  <div className="bg-app-raised inline-block px-3 py-1 rounded-lg border border-border-rule font-mono">{run.maze}</div>
                </td>
                <td className={`p-4 font-mono text-sm h-14 ${idx === 0 ? 'text-yellow-400 font-bold' : 'text-brand-h1'}`}>
                  <div className="flex items-center gap-2 h-full">
                    <span>{run.time}</span>
                  </div>
                </td>
                <td className="p-4 text-brand-h2 text-sm">{run.speed}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Battery size={16} className="text-brand-green"/>
                    <span className="text-brand-h1 text-sm">{run.battery}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Footprints size={16} className="text-brand-purple-light"/>
                    <span className="text-brand-h1 text-sm">{run.steps}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="inline-flex items-center justify-center h-6 px-3 rounded-md border text-[11px] font-semibold leading-none gap-1.5 w-max text-white bg-brand-green border-transparent">
                    <CheckCircle2 size={14}/>
                    <span>{run.status}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="text-brand-h3 group-hover:text-brand-h1 transition-colors flex items-center justify-end">
                    <span className="text-xs mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Replay</span>
                    <ChevronRight size={16} />
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" data-testid="estado-vazio" className="p-12 text-center text-brand-h3">
                  Nenhuma corrida concluída encontrada no ranking.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const HistoryView = ({ historyData, filter, setFilter, loading, error, onRefresh }) => {
  const [subTab, setSubTab] = useState('tabela');
  const [selectedRun, setSelectedRun] = useState(null);
  const [replayPath, setReplayPath] = useState(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState(null);

  useEffect(() => {
    setReplayPath(null);
    setReplayError(null);
    if (!selectedRun) return;
    if (selectedRun.mapSnapshot) return;
    const rawPath = selectedRun.raw?.path_traversed;
    if (rawPath && rawPath.length > 0) {
      setReplayPath(rawPath);
      return;
    }
    const numericId = parseInt(String(selectedRun.id).replace(/^db-/, ''), 10);
    if (!Number.isFinite(numericId)) return;
    setReplayLoading(true);
    getCorrida(numericId)
      .then(data => setReplayPath(data?.path_traversed ?? []))
      .catch(err => setReplayError(err.message || 'Erro ao carregar replay'))
      .finally(() => setReplayLoading(false));
  }, [selectedRun]);

  const filteredHistory = historyData;

  const successfulRuns = filteredHistory.filter(r => r.status === 'Centro Alcançado!');
  const bestRun = successfulRuns.length > 0 ? successfulRuns.reduce((prev, curr) => {
    const parseTime = (t) => {
      const parts = t.split(' ');
      return parseInt(parts[0]) * 60 + parseFloat(parts[1]);
    };
    return parseTime(curr.time) < parseTime(prev.time) ? curr : prev;
  }) : null;

  const totalRuns    = filteredHistory.length;
  const successRate  = totalRuns > 0 ? Math.round((successfulRuns.length / totalRuns) * 100) : 0;
  const bestTimeStr  = bestRun ? bestRun.time : '--';
  const avgSpeed     = totalRuns > 0 ? (filteredHistory.reduce((acc, curr) => acc + parseFloat(curr.speed), 0) / totalRuns).toFixed(1) + ' cm/s' : '--';

  const exportCSV = () => {
    const headers = ['Data/Hora', 'Tipo', 'Labirinto', 'Status', 'Tempo', 'Velocidade', 'Bateria', 'Movimentos'];
    const tipoLabel = (s) => (s === 'simulator' ? 'Simulada' : 'Real');
    const rows = filteredHistory.map(run => [run.date, tipoLabel(run.source), run.maze, run.status, run.time, run.speed, run.battery, run.steps]);
    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const link = document.createElement("a");
    link.setAttribute("href", encodeURI(csvContent));
    link.setAttribute("download", `historico_micromouse_${filter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div data-testid="historico-view" className="flex-1 bg-app-surface w-full h-full overflow-y-auto p-6 box-border">
      <div className="flex justify-between items-center mb-6">
        <div data-testid="pill-container" className="pill-container">
          <button
            data-testid="pill-item"
            onClick={() => setSubTab('tabela')}
            className={`group pill-item font-medium text-sm transition-all ${
              subTab === 'tabela'
                ? 'text-white bg-brand-purple'
                : 'text-brand-h3 hover:text-brand-h1 hover:bg-white/[0.03]'
            }`}
          >
            Tabela
          </button>
          <button
            data-testid="pill-item"
            onClick={() => setSubTab('ranking')}
            className={`group pill-item font-medium text-sm transition-all ${
              subTab === 'ranking'
                ? 'text-white bg-brand-purple'
                : 'text-brand-h3 hover:text-brand-h1 hover:bg-white/[0.03]'
            }`}
          >
            Ranking
          </button>
        </div>

        <div data-testid="pill-container" className="pill-container">
          <CustomSelect
            data-testid="filtro-labirinto"
            className="h-[var(--pill-h)] bg-app-raised text-brand-h1 px-4 rounded-[16px] font-medium text-sm border border-border-rule hover:bg-app-hover hover:border-border-accent transition-all min-w-[180px]"
            value={filter}
            onChange={(val) => setFilter(val)}
            options={[
              { value: 'Todos', label: 'Todos os Labirintos' },
              { value: '4x4', label: 'Pista 4x4' },
              { value: '8x8', label: 'Pista 8x8' },
              { value: '16x16', label: 'Pista 16x16' }
            ]}
          />
          <button data-testid="pill-item" onClick={onRefresh} title="Recarregar do backend" className="group pill-item gap-2 bg-app-raised border border-border-rule hover:border-border-accent text-brand-h1 font-medium transition-all text-sm w-[130px]">
            <RefreshCw size={16} className={`transition-transform duration-300 group-hover:rotate-180 group-active:scale-90 ${loading ? 'animate-spin' : ''}`} /><span>{loading ? 'Carregando…' : 'Atualizar'}</span>
          </button>
          {subTab === 'tabela' && (
            <button
              data-testid="pill-item"
              onClick={exportCSV}
              className="group pill-item gap-2 text-white font-medium transition-all text-sm border border-transparent bg-brand-purple"
            >
              <Download size={16} className="transition-transform group-hover:-translate-y-0.5 group-active:scale-90" /><span>Exportar CSV</span>
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-xl">
          Falha ao carregar histórico do backend: {error}. Mostrando apenas corridas do simulador.
        </div>
      )}

      {subTab === 'tabela' && (
        <div className="flex items-center flex-wrap gap-x-6 gap-y-2 bg-app-bg border border-border-rule rounded-xl px-5 py-2 mb-3 text-sm shadow-card">
          <div className="flex items-center gap-2">
            <span className="text-label">Corridas</span>
            <span className="text-brand-h1 font-bold">{totalRuns}</span>
          </div>
          <div className="w-px h-4 bg-border-rule" />
          <div className="flex items-center gap-2">
            <span className="text-label">Sucesso</span>
            <span className="text-brand-green font-bold">{successRate}%</span>
          </div>
          <div className="w-px h-4 bg-border-rule" />
          <div className="flex items-center gap-2">
            <span className="text-label">Melhor Tempo</span>
            <span className="text-brand-purple-light font-bold font-mono">{bestTimeStr}</span>
          </div>
          <div className="w-px h-4 bg-border-rule" />
          <div className="flex items-center gap-2">
            <span className="text-label">Velocidade Média</span>
            <span className="text-brand-h1 font-bold">{avgSpeed}</span>
          </div>
        </div>
      )}

      {subTab === 'ranking' && <RankingPanel runs={historyData} onSelectRun={setSelectedRun} />}

      {subTab === 'tabela' && (
        <div className="overflow-hidden rounded-xl border border-border-rule bg-app-bg shadow-card">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead className="bg-app-surface border-b border-border-rule">
              <tr>
                <th className="p-4 text-label">Data / Hora</th>
                <th className="p-4 text-label">Tipo</th>
                <th className="p-4 text-label">Labirinto</th>
                <th className="p-4 text-label">Tempo</th>
                <th className="p-4 text-label">Velocidade</th>
                <th className="p-4 text-label">Bateria</th>
                <th className="p-4 text-label">Movimentos</th>
                <th className="p-4 text-label">Status</th>
                <th className="p-4 text-label w-10 text-center"></th>
              </tr>
          </thead>
          <tbody className="divide-y divide-border-rule">
            {filteredHistory.length > 0 ? filteredHistory.map((run) => (
              <tr key={run.id} data-testid="corrida-item" onClick={() => setSelectedRun(run)} className="hover:bg-app-hover transition-colors cursor-pointer group">
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-brand-h3 group-hover:text-brand-h2 transition-colors"/>
                    <span className="text-brand-h1 font-medium text-sm">{run.date}</span>
                  </div>
                </td>
                <td className="p-4">
                  {run.source === 'simulator' ? (
                    <span className="badge w-[100px] bg-brand-purple text-white" title="Corrida gerada no simulador local">
                      <Cpu size={14} />
                      <span>Simulada</span>
                    </span>
                  ) : (
                    <span className="badge w-[100px] bg-brand-green text-white" title="Corrida do robô físico">
                      <Bot size={14} />
                      <span>Corrida</span>
                    </span>
                  )}
                </td>
                <td className="p-4 text-brand-h2 font-medium text-sm">
                  <div className="bg-app-raised inline-block px-3 py-1 rounded-lg border border-border-rule font-mono">{run.maze}</div>
                </td>
                <td className="p-4 text-brand-h1 font-mono text-sm h-14">
                  <div className="flex items-center gap-2 h-full">
                    <span>{run.time}</span>
                  </div>
                </td>
                <td className="p-4 text-brand-h2 text-sm">{run.speed}</td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Battery size={16} className="text-brand-green"/>
                    <span className="text-brand-h1 text-sm">{run.battery}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center gap-2">
                    <Footprints size={16} className="text-brand-purple-light"/>
                    <span className="text-brand-h1 text-sm">{run.steps}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className={`inline-flex items-center justify-center h-6 px-3 rounded-md border text-[11px] font-semibold leading-none gap-1.5 w-max ${
                    run.status === 'Centro Alcançado!' 
                      ? 'text-white bg-brand-green border-transparent' 
                      : 'text-white bg-brand-danger border-transparent'
                  }`}>
                    {run.status === 'Centro Alcançado!' ? <CheckCircle2 size={14}/> : <XCircle size={14}/>}
                    <span>{run.status}</span>
                  </div>
                </td>
                <td className="p-4 text-right">
                  <div className="text-brand-h3 group-hover:text-brand-h1 transition-colors flex items-center justify-end">
                    <span className="text-xs mr-1 opacity-0 group-hover:opacity-100 transition-opacity">Replay</span>
                    <ChevronRight size={16} />
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="8" data-testid="estado-vazio" className="p-12 text-center text-brand-h3">
                  Nenhuma corrida encontrada para o filtro selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      )}

      {selectedRun && (
        <div className="absolute inset-0 z-50 bg-app-bg/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedRun(null)}>
          <div className="bg-panel w-full max-w-2xl shadow-pop flex flex-col p-6 rounded-xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-2xl font-bold text-brand-h1 mb-1">Detalhes da Corrida</h3>
                <p className="text-brand-h3 text-sm">{selectedRun.date}</p>
              </div>
              <button onClick={() => setSelectedRun(null)} className="text-brand-h3 hover:text-white transition-colors">
                <XCircle size={24}/>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="bg-app-bg p-4 rounded-xl border border-border-rule flex justify-between items-center">
                  <span className="text-brand-h3 text-sm">Tipo</span>
                  {selectedRun.source === 'simulator' ? (
                    <span className="badge bg-brand-purple/20 text-brand-accent border border-brand-purple/40">
                      <Cpu size={12} /><span>Simulada</span>
                    </span>
                  ) : (
                    <span className="badge bg-brand-green/15 text-brand-green-text border border-brand-green/30">
                      <Bot size={12} /><span>Real</span>
                    </span>
                  )}
                </div>
                <div className="bg-app-bg p-4 rounded-xl border border-border-rule flex justify-between items-center">
                  <span className="text-brand-h3 text-sm">Tempo</span>
                  <span className="text-brand-h1 font-mono font-bold">{selectedRun.time}</span>
                </div>
                <div className="bg-app-bg p-4 rounded-xl border border-border-rule flex justify-between items-center">
                  <span className="text-brand-h3 text-sm">Labirinto</span>
                  <span className="text-brand-h1 font-bold font-mono">{selectedRun.maze}</span>
                </div>
                <div className="bg-app-bg p-4 rounded-xl border border-border-rule flex justify-between items-center">
                  <span className="text-brand-h3 text-sm">Velocidade Média</span>
                  <span className="text-brand-h1 font-bold">{selectedRun.speed}</span>
                </div>
                <div className="bg-app-bg p-4 rounded-xl border border-border-rule flex justify-between items-center">
                  <span className="text-brand-h3 text-sm">Bateria Restante</span>
                  <span className="text-brand-green font-bold">{selectedRun.battery}</span>
                </div>
              </div>
              {selectedRun.mapSnapshot ? (
                <MiniMap snapshot={selectedRun.mapSnapshot}/>
              ) : replayLoading ? (
                <div className="bg-app-bg rounded-xl border border-border-rule flex items-center justify-center p-4 h-full text-brand-h3 text-sm">
                  Carregando replay…
                </div>
              ) : replayError ? (
                <div className="bg-app-bg rounded-xl border border-red-500/30 flex items-center justify-center p-4 h-full text-red-400 text-sm text-center">
                  {replayError}
                </div>
              ) : replayPath && replayPath.length > 0 ? (
                <ReplayCanvas
                  pathMm={replayPath}
                  mazeSize={parseInt(selectedRun.maze.split('x')[0], 10)}
                  knownWalls={selectedRun.knownWalls ?? selectedRun.raw?.known_walls ?? null}
                />
              ) : (
                <div className="bg-app-bg rounded-xl border border-border-rule flex items-center justify-center p-4 h-full text-brand-h3 text-xs text-center">
                  Trajeto indisponível para esta corrida.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
