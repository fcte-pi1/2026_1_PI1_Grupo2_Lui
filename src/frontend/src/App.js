import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Cpu, Wifi, Play, Pause, Bot, RotateCw, ChevronDown, Battery, Clock, Footprints, Gauge, RefreshCw, Zap, Usb, Timer, Radio, Download, CheckCircle2, XCircle, Calendar } from 'lucide-react';
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
  // (N=0, E=1, S=2, W=3). Se idx atual repete a célula anterior, anda
  // para trás no path até achar um movimento real para preservar a
  // orientação. Inicial = Norte.
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
    <div className="bg-app-bg rounded-xl border border-border-rule p-3 h-full flex flex-col">
      <div className="text-brand-h3 text-[10px] uppercase tracking-widest font-semibold mb-2 flex items-center justify-between">
        <span>Replay do Trajeto</span>
        <span className="text-brand-h1 font-mono normal-case">{idx + 1}/{total}</span>
      </div>
      <div
        className="aspect-square w-full max-w-[260px] mx-auto border border-border-rule bg-app-bg"
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
          let bg = 'transparent';
          if (isVisited) bg = 'rgba(167,139,250,0.18)';
          if (isGoal) bg = '#10B981';
          const faint = '1px solid rgba(255,255,255,0.06)';
          const wall  = '2px solid rgba(255,255,255,0.85)';
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
                  borderBottom: '8px solid #A78BFA',
                  transform: `rotate(${robotDir * 90}deg)`,
                  transition: 'transform 120ms ease-out',
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
          className="w-full h-1.5 bg-border-ghost rounded-lg appearance-none cursor-pointer accent-brand-purple"
        />
        <div className="flex items-center justify-between">
          <div className="flex space-x-1.5">
            <button onClick={() => setPlaying(p => !p)} className="bg-app-raised border-2 border-border-dim text-brand-h1 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1">
              {playing ? <><Pause size={11}/><span>Pausar</span></> : <><Play size={11}/><span>Reproduzir</span></>}
            </button>
            <button onClick={() => { setIdx(0); setPlaying(true); }} className="bg-app-raised border-2 border-border-dim text-brand-h1 px-3 py-1 rounded-full text-[11px] font-semibold flex items-center space-x-1">
              <RotateCw size={11}/><span>Reiniciar</span>
            </button>
          </div>
          <select
            value={speedMs}
            onChange={(e) => setSpeedMs(parseInt(e.target.value, 10))}
            className="bg-app-raised border-2 border-border-dim text-brand-h2 text-[11px] font-medium px-2 py-1 rounded-full focus:outline-none cursor-pointer"
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
    <div className="w-full h-full flex flex-col items-center justify-center p-2 bg-app-bg relative rounded-xl border border-border-rule">
        <h4 className="absolute top-3 left-0 right-0 text-center text-brand-h3 text-xs uppercase tracking-widest font-semibold z-10 pointer-events-none drop-shadow-md">Trajeto Mapeado</h4>
        <div 
          className="aspect-square w-full max-w-[200px] border border-border-rule box-border bg-app-bg mt-6"
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
                borderTop: knownWalls[x][y][0] ? '1px solid white' : '1px solid rgba(255,255,255,0.06)',
                borderRight: knownWalls[x][y][1] ? '1px solid white' : '1px solid rgba(255,255,255,0.06)',
                borderBottom: knownWalls[x][y][2] ? '1px solid white' : '1px solid rgba(255,255,255,0.06)',
                borderLeft: knownWalls[x][y][3] ? '1px solid white' : '1px solid rgba(255,255,255,0.06)',
                backgroundColor: 'transparent',
                boxSizing: 'border-box'
              };

              if (explored[x][y]) style.backgroundColor = '#110E20';
              const isGoal = goals.some(g => g.x === x && g.y === y);
              if (isGoal) style.backgroundColor = '#10B981';
              const isRobot = robot && robot.x === x && robot.y === y;

              return (
                 <div key={i} style={style} className="relative flex items-center justify-center">
                    {isRobot && (
                        <div style={{
                           width: 0, height: 0,
                           borderLeft: '3px solid transparent',
                           borderRight: '3px solid transparent',
                           borderBottom: '6px solid #A78BFA',
                           transform: `rotate(${robot.direction * 90}deg)`
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
  // Quando o firmware (ou o fake_robot.py) enviar pacotes, esses valores
  // substituem os literais hardcoded. Antes do primeiro pacote, ficam null
  // e a UI cai no fallback do simulador.
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

  // Carrega o histórico ao abrir a aba, ao trocar de filtro e quando
  // uma corrida nova é persistida (detectada por lastMessage.race_status==finished).
  useEffect(() => {
    if (activeTab === 'Histórico') {
      refreshHistory(historyFilter);
    }
  }, [activeTab, historyFilter, refreshHistory]);

  useEffect(() => {
    if (lastMessage && lastMessage.race_status === 'finished') {
      // Pequeno atraso para garantir que o backend já confirmou o INSERT.
      const t = setTimeout(() => refreshHistory(historyFilter), 200);
      return () => clearTimeout(t);
    }
  }, [lastMessage, historyFilter, refreshHistory]);

  // Sessão do simulador → POSTa em /telemetria com source='simulator'.
  // Fallback: se o backend estiver fora, mantém em simHistory (memória local).
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

    // Mapa preciso: simulador conhece truthWalls. Converte {0..3:bool} para
    // o formato do contrato: walls[x][y] = [N, E, S, W].
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
        // Backend persistiu; refresca histórico para puxar a nova corrida.
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

  // Bateria exibida no widget: % da telemetria real, ou fallback do simulador.
  const batteryPct = liveTelemetry?.battery_voltage_v != null
    ? batteryVoltsToPercent(liveTelemetry.battery_voltage_v)
    : null;

  // Modo de operação: determinado pela origem do último pacote recebido.
  // Pacote 'real' (firmware) tem prioridade até ficar antigo (>10s); caso
  // contrário, o sistema está mostrando o simulador local.
  const dataMode = useMemo(() => {
    if (liveTelemetry?.source === 'real' && latencyMs != null && latencyMs < 10000) {
      return 'real';
    }
    return 'simulator';
  }, [liveTelemetry, latencyMs]);

  // Status da corrida traduzido para a UI a partir dos eventos do WS em modo
  // real; fallback para o status do simulador.
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

  // Conversão mm → célula para o canvas e o replay. Coordenadas vêm como
  // (cell + 0.5) * CELL_MM mm, então mmToCell() devolve a célula (importado de maze.js).

  // Em modo Real, o robô e as células visitadas vêm da telemetria.
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
    <div className="bg-app-bg font-sans h-screen p-2 sm:p-6 flex items-center justify-center overflow-hidden">
      <div className="w-full h-full max-h-screen flex flex-col overflow-hidden relative">
        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        <main className="flex-grow flex flex-col lg:flex-row gap-6 h-full pb-2 min-h-0 overflow-hidden">
          {activeTab === 'Histórico' ? (
            <HistoryView
              historyData={combinedHistory}
              filter={historyFilter}
              setFilter={setHistoryFilter}
              loading={historyLoading}
              error={historyError}
              onRefresh={() => refreshHistory(historyFilter)}
            />
          ) : (
            <>
              <section className="flex-grow bg-panel p-6 flex flex-col relative overflow-hidden min-h-0">
                <MazeCanvas sim={sim} liveRobot={liveRobot} liveExplored={liveExplored} dataMode={dataMode} />
              </section>
              <aside className="w-full lg:w-[360px] flex flex-col space-y-3 overflow-hidden shrink-0">
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

const Header = ({ activeTab, setActiveTab }) => {
  const tabs = ['Mapa', 'Telemetria', 'Histórico', 'Configurações'];
  return (
    <header className="flex items-center justify-between mb-8 shrink-0">
      <div className="flex items-center space-x-2">
        <Cpu className="text-brand-purple-glow" size={24} />
        <span className="text-2xl font-bold text-brand-h1 tracking-tighter">micromouse<span className="text-brand-purple">.</span></span>
      </div>
      <nav className="hidden md:flex items-center space-x-1 bg-app-header p-1 rounded-full border-2 border-border-rule shadow-sm">
        {tabs.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-8 py-3 rounded-full font-medium text-sm transition-all ${
              activeTab === tab
                ? 'bg-brand-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
                : 'text-brand-h3 hover:text-brand-h1 hover:bg-border-ghost'
            }`}
          >
            {tab}
          </button>
        ))}
      </nav>
      <button className="flex items-center space-x-2 bg-app-raised border-2 border-border-dim hover:border-border-accent text-brand-h1 font-medium px-6 py-2.5 rounded-full transition-all text-sm">
        <Wifi className="text-brand-green" size={14} />
        <span>Conectar</span>
      </button>
    </header>
  );
};

const MazeCanvas = ({ sim, liveRobot, liveExplored, dataMode }) => {
  const { memory, isRunning, setIsRunning, speed, setSpeed, showTruth, setShowTruth, resetSimulation, gridSize, changeGridSize } = sim;
  const mem = memory;
  // Em modo Real, sobrescreve robô e explored com dados do WS; o resto
  // (paredes, distâncias) continua vindo do simulador (não há fonte real).
  const robotShown = liveRobot ?? mem.robot;
  const exploredShown = liveExplored ?? mem.explored;
  const isRealMode = dataMode === 'real';

  if (!mem.truthWalls || mem.truthWalls.length === 0) {
    return (
      <div className="flex-grow flex items-center justify-center relative p-4 bg-app-raised rounded-3xl border-2 border-border-subtle overflow-hidden">
        <div className="text-brand-h3 font-medium text-sm">Carregando simulador...</div>
      </div>
    );
  }

  let maxD = 0;
  for (let x = 0; x < gridSize; x++)
    for (let y = 0; y < gridSize; y++)
      if (mem.distances[x][y] !== 255 && mem.distances[x][y] > maxD) maxD = mem.distances[x][y];

  const GOALS = mem.goals || [];

  return (
    <>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 z-10 space-y-4 xl:space-y-0 shrink-0">
        <div>
          <h2 className="text-2xl font-semibold text-brand-h1 tracking-tight">Mapa do Labirinto</h2>
        </div>
        <div className="flex items-center space-x-6 bg-app-bg p-2 px-4 rounded-full border-2 border-border-rule shadow-inner">
          <div className="relative">
            <select
              className="appearance-none bg-transparent text-brand-h2 py-1 pl-3 pr-8 focus:outline-none font-medium text-xs cursor-pointer"
              value={gridSize}
              onChange={(e) => changeGridSize(parseInt(e.target.value))}
            >
              <option value={4}  className="bg-app-raised">Matriz 4x4</option>
              <option value={8}  className="bg-app-raised">Matriz 8x8</option>
              <option value={16} className="bg-app-raised">Matriz 16x16</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-brand-h3">
              <ChevronDown size={14} />
            </div>
          </div>
          <div className="w-px h-6 bg-border-rule"></div>
          <div className="flex items-center space-x-3">
            <span className="text-brand-h3 text-[11px] font-medium uppercase tracking-wider">Velocidade</span>
            <input type="range" min="10" max="500" value={510 - speed} onChange={(e) => setSpeed(510 - parseInt(e.target.value))} className="w-24 h-1.5 bg-border-ghost rounded-lg appearance-none cursor-pointer accent-brand-purple" />
          </div>
          <div className="w-px h-6 bg-border-rule"></div>
          <label className={`flex items-center space-x-2 ${isRealMode ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`} title={isRealMode ? 'Raio-X só disponível no modo Simulador' : ''}>
            <div className="relative">
              <input type="checkbox" className="sr-only peer" checked={showTruth && !isRealMode} disabled={isRealMode} onChange={(e) => setShowTruth(e.target.checked)} />
              <div className="w-9 h-5 bg-border-ghost peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-purple-glow after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-h3 after:border-border-subtle after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-purple peer-checked:after:bg-white border-2 border-border-rule"></div>
            </div>
            <span className="text-brand-h3 text-[11px] font-medium uppercase tracking-wider">Raio-X</span>
          </label>
        </div>
        <div className="flex space-x-3">
          <button onClick={() => setIsRunning(!isRunning)} className="flex items-center space-x-2 bg-app-raised border-2 border-border-dim hover:border-border-accent text-brand-h1 font-medium px-6 py-2 rounded-full transition-all text-sm">
            {isRunning ? <><Pause className="text-brand-amber" size={14} fill="currentColor"/><span>Pausar</span></> : <><Play className="text-brand-green" size={14} fill="currentColor"/><span>Iniciar</span></>}
          </button>
          <button onClick={() => resetSimulation(false)} className="bg-app-bg hover:bg-border-ghost text-brand-h1 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 border-2 border-border-dim transition-all">
            <Bot size={14} /><span>Robô</span>
          </button>
          <button onClick={() => resetSimulation(true)} className="bg-app-bg hover:bg-border-ghost text-brand-h1 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 border-2 border-border-dim transition-all">
            <RotateCw size={14} /><span>Novo</span>
          </button>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center relative p-4 bg-app-bg rounded-3xl border-2 border-border-rule overflow-hidden min-h-0" style={{ containerType: 'size' }}>
        <div id="maze-container" className={showTruth ? "show-truth" : ""} style={{ gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))` }}>
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
            const y = Math.floor(i / gridSize), x = i % gridSize;
            let classes = ["cell"];
            // "Raio-X" só faz sentido em modo Simulador (no Real não há truthWalls).
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
            // Gradiente de distância só faz sentido com simulador (depende do flood-fill).
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

const TelemetrySidebar = ({ sim, wsStatus, batteryPct, latencyMs, packetsRx, liveTelemetry, dataMode, runStatus }) => {
  const mem = sim.memory;
  const statusText = runStatus ?? mem.status;
  let statusColor = "bg-brand-cyan";
  if (statusText === "Centro Alcançado!" || statusText === "Objetivo localizado!") statusColor = "bg-brand-green";
  else if (statusText === "Preso!" || statusText === "Erro!") statusColor = "bg-red-500";
  else if (statusText === "Mapeando...") statusColor = "bg-brand-amber";
  else if (statusText === "Pausado")     statusColor = "bg-brand-purple";

  // Tempo/velocidade: prefere telemetria real se disponível, senão usa simulador.
  const timeSec  = liveTelemetry?.elapsed_time_ms != null
    ? (liveTelemetry.elapsed_time_ms / 1000).toFixed(1)
    : (mem.timeMs / 1000).toFixed(1);
  const avgSpeed = liveTelemetry?.speed_mm_s != null
    ? (liveTelemetry.speed_mm_s / 10).toFixed(1)
    : (mem.timeMs > 0 ? ((mem.steps * 18) / (mem.timeMs / 1000)).toFixed(1) : "0.0");
  const stepsDisplay = liveTelemetry?.step_count ?? mem.steps;

  // Alerta visual quando latência ultrapassa RNF-01 (500 ms)
  const latencyOver = latencyMs != null && latencyMs > 500;

  const formatPackets = (n) => {
    if (n < 1000) return String(n);
    return `${(n / 1000).toFixed(1)}k`;
  };

  const getWSStatusColor = (status) => {
    switch(status) {
      case 'Conectado': return { text: 'text-brand-green', bg: 'bg-brand-green/10', border: 'border-brand-green/20', dot: 'bg-brand-green' };
      case 'Conectando...': return { text: 'text-brand-amber', bg: 'bg-brand-amber/10', border: 'border-brand-amber/20', dot: 'bg-brand-amber' };
      case 'Reconectando...': return { text: 'text-brand-amber', bg: 'bg-brand-amber/10', border: 'border-brand-amber/20', dot: 'bg-brand-amber' };
      case 'Desconectado': return { text: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20', dot: 'bg-red-500' };
      default: return { text: 'text-brand-green', bg: 'bg-brand-green/10', border: 'border-brand-green/20', dot: 'bg-brand-green' };
    }
  };

  const wsColor = getWSStatusColor(wsStatus);

  const isReal = dataMode === 'real';
  const modeStyle = isReal
    ? { text: 'text-brand-green', bg: 'bg-brand-green/10', border: 'border-brand-green/40', dot: 'bg-brand-green' }
    : { text: 'text-brand-purple-glow', bg: 'bg-brand-purple/15', border: 'border-brand-purple/40', dot: 'bg-brand-purple-glow' };

  return (
    <>
      <section className="bg-panel p-3 shrink-0">
        <div className={`flex items-center justify-between px-3 py-2 rounded-full border-2 ${modeStyle.bg} ${modeStyle.border}`} title={isReal ? 'Dados do robô físico via WebSocket' : 'Simulador local — sem hardware'}>
          <span className="text-brand-h3 text-[10px] font-bold uppercase tracking-widest">Modo</span>
          <span className={`${modeStyle.text} text-xs font-bold uppercase tracking-wider flex items-center`}>
            <span className={`relative flex h-2 w-2 mr-2 rounded-full ${modeStyle.dot}`}>
              {isReal && <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${modeStyle.dot} opacity-60`}></span>}
            </span>
            {isReal ? 'Real' : 'Simulador'}
          </span>
        </div>
      </section>
      <section className="bg-panel p-4 shrink-0">
        <div className="grid grid-cols-3 gap-2">
          <BatteryWidget percent={batteryPct} />
          <MetricCard label="Tempo" value={timeSec} unit="s" icon={<Clock size={14} />} iconColor="text-brand-cyan" />
          <MetricCard label="Passos" value={stepsDisplay} unit="" icon={<Footprints size={14} />} iconColor="text-brand-purple-glow" />
          <MetricCard label="Veloc" value={avgSpeed} unit="cm/s" icon={<Gauge size={14} />} iconColor="text-brand-green" />
          <MetricCard label="Giros" value={mem.turns} unit="" icon={<RefreshCw size={14} />} iconColor="text-brand-amber" />
          <MetricCard label="Algoritmo" value="Flood-Fill" unit="" icon={<Zap size={14} />} iconColor="text-brand-purple" isString={true} />
        </div>
      </section>
      <section className="bg-panel p-4 shrink-0 flex-1 min-h-0 flex flex-col justify-center">
        <h3 className="text-lg font-semibold text-brand-h1 mb-3">Conectividade</h3>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-brand-h3 text-[11px] font-medium uppercase tracking-wider flex items-center"><Usb className="mr-3 text-brand-h3 w-4 h-4" />WebSocket</span>
            <span className={`${wsColor.text} text-[10px] uppercase tracking-wider font-bold flex items-center ${wsColor.bg} border-2 ${wsColor.border} px-3 py-1.5 rounded-full`}>
              <span className={`relative flex h-2 w-2 mr-2 rounded-full ${wsColor.dot}`}></span>
              {wsStatus}
            </span>
          </div>
          <div className="border-b border-border-rule"></div>
          <div className="flex justify-between items-center">
            <span className="text-brand-h3 text-[11px] font-medium uppercase tracking-wider flex items-center"><Timer className="mr-3 text-brand-h3 w-4 h-4" />Latência</span>
            <span className={`font-semibold font-mono text-sm ${latencyOver ? 'text-red-500' : 'text-brand-h2'}`} title={latencyOver ? 'Latência acima do limite RNF-01 (500 ms)' : undefined}>
              {latencyMs != null ? `${latencyMs} ms` : '— ms'}
            </span>
          </div>
          <div className="border-b border-border-rule"></div>
          <div className="flex justify-between items-center">
            <span className="text-brand-h3 text-[11px] font-medium uppercase tracking-wider flex items-center"><Radio className="mr-3 text-brand-h3 w-4 h-4" />Pacotes RX</span>
            <span className="text-brand-h2 font-semibold font-mono text-sm">{formatPackets(packetsRx)}</span>
          </div>
        </div>
      </section>
      <section className="bg-panel p-3 flex justify-between items-center mt-auto border-t-[4px] border-t-brand-purple shrink-0">
        <span className="text-[11px] font-medium uppercase tracking-wider text-brand-h3">Status</span>
        <div className="flex items-center space-x-2 bg-app-bg border-2 border-border-ghost py-1.5 px-3 rounded-full">
          <span className={`relative flex h-2.5 w-2.5 rounded-full ${statusColor}`}></span>
          <span className="text-brand-h1 text-[13px] font-bold">{statusText}</span>
        </div>
      </section>
    </>
  );
};

const MetricCard = ({ label, value, unit, icon, iconColor, isString = false }) => (
  <div className="bg-app-bg border-2 border-border-rule p-3 rounded-[1rem] flex flex-col relative transition-all duration-300">
    <div className="flex justify-between items-start mb-1">
      <span className="text-label truncate">{label}</span>
      <div className={`${iconColor}`}>{icon}</div>
    </div>
    <span className={isString ? "text-brand-h1 text-lg font-semibold tracking-tight mt-1" : "text-brand-h1 text-xl font-semibold tracking-tight"}>
      {value}
      {unit && <small className="text-[10px] text-brand-h3 font-medium ml-1">{unit}</small>}
    </span>
  </div>
);

const BatteryWidget = ({ percent }) => {
  const display = percent != null ? `${percent}%` : '—';
  const widthPct = percent != null ? Math.max(0, Math.min(100, percent)) : 0;
  const barColor = percent == null ? 'bg-border-ghost' : percent <= 20 ? 'bg-red-500' : percent <= 50 ? 'bg-brand-amber' : 'bg-brand-green';
  const iconColor = percent == null ? 'text-brand-h3' : percent <= 20 ? 'text-red-500' : percent <= 50 ? 'text-brand-amber' : 'text-brand-green';
  return (
    <div className="bg-app-bg border-2 border-border-rule p-3 rounded-[1rem] flex flex-col relative transition-all duration-300">
      <div className="flex justify-between items-start mb-1">
        <span className="text-label">Carga</span>
        <div className={iconColor}><Battery size={14}/></div>
      </div>
      <span className="text-brand-h1 text-xl font-semibold tracking-tight">{display}</span>
      <div className="h-1.5 w-full bg-border-ghost mt-2 rounded-full overflow-hidden border border-border-rule">
        <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${widthPct}%` }}></div>
      </div>
    </div>
  );
};

const RankingPanel = ({ runs }) => {
  const ranking = useMemo(() => {
    const sizes = ['4x4', '8x8', '16x16'];
    const out = {};
    for (const size of sizes) {
      out[size] = runs
        .filter(r => r.maze === size && r.status === 'Centro Alcançado!')
        .sort((a, b) => parseTimeToSeconds(a.time) - parseTimeToSeconds(b.time))
        .slice(0, 5);
    }
    return out;
  }, [runs]);

  return (
    <div className="mb-6 shrink-0">
      <div className="flex items-center space-x-2 mb-3">
        <Zap size={16} className="text-brand-amber" />
        <h3 className="text-sm font-semibold text-brand-h2 uppercase tracking-wider">Ranking — Top 5 por Labirinto</h3>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {['4x4', '8x8', '16x16'].map(size => (
          <div key={size} className="bg-app-bg border-2 border-border-rule rounded-2xl p-3">
            <div className="text-brand-h3 text-[10px] uppercase tracking-wider font-bold mb-2">{size}</div>
            {ranking[size].length === 0 ? (
              <div className="text-brand-h3 text-xs italic py-2">Sem corridas concluídas</div>
            ) : (
              <ol className="space-y-1">
                {ranking[size].map((run, idx) => (
                  <li key={run.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center space-x-2 min-w-0">
                      <span className={`font-bold w-4 text-center ${idx === 0 ? 'text-brand-amber' : 'text-brand-h3'}`}>{idx + 1}</span>
                      <span className={`w-1.5 h-1.5 rounded-full ${run.source === 'simulator' ? 'bg-brand-purple-glow' : 'bg-brand-green'}`} title={run.source === 'simulator' ? 'Simulada' : 'Real'}></span>
                      <span className="text-brand-h1 font-mono truncate">{run.time}</span>
                    </div>
                    <span className="text-brand-h3 text-[10px]">{run.steps} pas</span>
                  </li>
                ))}
              </ol>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const HistoryView = ({ historyData, filter, setFilter, loading, error, onRefresh }) => {
  const [subTab, setSubTab] = useState('tabela'); // 'tabela' | 'ranking'
  const [selectedRun, setSelectedRun] = useState(null);
  const [replayPath, setReplayPath] = useState(null);
  const [replayLoading, setReplayLoading] = useState(false);
  const [replayError, setReplayError] = useState(null);

  // Quando uma corrida do backend é selecionada, busca o path completo.
  useEffect(() => {
    setReplayPath(null);
    setReplayError(null);
    if (!selectedRun) return;
    // Corridas locais do simulador (fallback) já têm mapSnapshot; pulam o fetch.
    if (selectedRun.mapSnapshot) return;
    const rawPath = selectedRun.raw?.path_traversed;
    if (rawPath && rawPath.length > 0) {
      setReplayPath(rawPath);
      return;
    }
    // Caso a corrida não tenha trazido o path (lista resumida no futuro), busca por id.
    const numericId = parseInt(String(selectedRun.id).replace(/^db-/, ''), 10);
    if (!Number.isFinite(numericId)) return;
    setReplayLoading(true);
    getCorrida(numericId)
      .then(data => setReplayPath(data?.path_traversed ?? []))
      .catch(err => setReplayError(err.message || 'Erro ao carregar replay'))
      .finally(() => setReplayLoading(false));
  }, [selectedRun]);

  // Lista já vem filtrada (sim+API combinados em App)
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
    // ── data-testid adicionado aqui ──
    <div data-testid="historico-view" className="flex-grow bg-panel p-6 flex flex-col relative overflow-hidden min-h-0 w-full rounded-3xl border-2 border-border-subtle">
      <div className="flex justify-between items-start mb-8 shrink-0">
        <div>
          <h2 className="text-4xl font-bold text-brand-h1 tracking-tight">Histórico de Corridas</h2>
        </div>
        <div className="flex items-center space-x-4 mt-2">
          <div className="relative">
            {/* ── data-testid adicionado aqui ── */}
            <select
              data-testid="filtro-labirinto"
              className="appearance-none bg-app-bg text-brand-h2 py-2 pl-4 pr-10 rounded-full focus:outline-none font-medium text-sm border-2 border-border-rule cursor-pointer"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="Todos">Todos os Labirintos</option>
              <option value="4x4">Pista 4x4</option>
              <option value="8x8">Pista 8x8</option>
              <option value="16x16">Pista 16x16</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-brand-h3">
              <ChevronDown size={16} />
            </div>
          </div>
          <button onClick={onRefresh} title="Recarregar do backend" className="flex items-center space-x-2 bg-app-bg border-2 border-border-dim hover:border-border-accent text-brand-h1 font-medium px-4 py-2.5 rounded-full transition-all text-sm">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /><span>{loading ? 'Carregando…' : 'Atualizar'}</span>
          </button>
          {subTab === 'tabela' && (
            <button onClick={exportCSV} className="flex items-center space-x-2 bg-[#6D28D9] hover:bg-brand-purple-glow hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] text-white font-medium px-5 py-2.5 rounded-full transition-all text-sm border-2 border-transparent">
              <Download size={16} /><span>Exportar CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub-abas: Tabela ↔ Ranking */}
      <div className="flex items-center space-x-1 bg-app-header p-1 rounded-full border-2 border-border-rule shadow-sm self-start mb-6 shrink-0">
        <button
          onClick={() => setSubTab('tabela')}
          className={`px-6 py-2 rounded-full font-medium text-sm transition-all flex items-center space-x-2 ${
            subTab === 'tabela'
              ? 'bg-brand-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
              : 'text-brand-h3 hover:text-brand-h1 hover:bg-border-ghost'
          }`}
        >
          <Footprints size={14} />
          <span>Tabela</span>
        </button>
        <button
          onClick={() => setSubTab('ranking')}
          className={`px-6 py-2 rounded-full font-medium text-sm transition-all flex items-center space-x-2 ${
            subTab === 'ranking'
              ? 'bg-brand-purple text-white shadow-[0_0_15px_rgba(124,58,237,0.3)]'
              : 'text-brand-h3 hover:text-brand-h1 hover:bg-border-ghost'
          }`}
        >
          <Zap size={14} />
          <span>Ranking</span>
        </button>
      </div>

      {error && (
        <div className="mb-4 bg-red-500/10 border-2 border-red-500/30 text-red-400 text-sm px-4 py-3 rounded-2xl shrink-0">
          Falha ao carregar histórico do backend: {error}. Mostrando apenas corridas do simulador.
        </div>
      )}

      {subTab === 'tabela' && (
        <div className="flex items-center flex-wrap gap-x-6 gap-y-2 bg-app-bg border-2 border-border-rule rounded-full px-5 py-2 mb-3 shrink-0 text-sm">
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider text-brand-h3 font-semibold">Corridas</span>
            <span className="text-brand-h1 font-bold">{totalRuns}</span>
          </div>
          <div className="w-px h-4 bg-border-rule"></div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider text-brand-h3 font-semibold">Sucesso</span>
            <span className="text-brand-green font-bold">{successRate}%</span>
          </div>
          <div className="w-px h-4 bg-border-rule"></div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider text-brand-h3 font-semibold">Melhor Tempo</span>
            <span className="text-brand-purple-glow font-bold font-mono">{bestTimeStr}</span>
          </div>
          <div className="w-px h-4 bg-border-rule"></div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] uppercase tracking-wider text-brand-h3 font-semibold">Velocidade Média</span>
            <span className="text-brand-h1 font-bold">{avgSpeed}</span>
          </div>
        </div>
      )}

      {subTab === 'ranking' && <RankingPanel runs={historyData} />}

      {subTab === 'tabela' && (
      <div className="overflow-y-auto max-h-[450px] rounded-2xl border-2 border-border-rule bg-app-bg">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 bg-app-header border-b-2 border-border-rule z-10 shadow-sm">
            <tr>
              <th className="p-4 text-xs font-semibold text-brand-h3 uppercase tracking-wider">Data / Hora</th>
              <th className="p-4 text-xs font-semibold text-brand-h3 uppercase tracking-wider">Tipo</th>
              <th className="p-4 text-xs font-semibold text-brand-h3 uppercase tracking-wider">Labirinto</th>
              <th className="p-4 text-xs font-semibold text-brand-h3 uppercase tracking-wider">Tempo</th>
              <th className="p-4 text-xs font-semibold text-brand-h3 uppercase tracking-wider">Velocidade</th>
              <th className="p-4 text-xs font-semibold text-brand-h3 uppercase tracking-wider">Bateria</th>
              <th className="p-4 text-xs font-semibold text-brand-h3 uppercase tracking-wider">Movimentos</th>
              <th className="p-4 text-xs font-semibold text-brand-h3 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border-rule">
            {filteredHistory.length > 0 ? filteredHistory.map((run) => (
              // ── data-testid adicionado aqui ──
              <tr key={run.id} data-testid="corrida-item" onClick={() => setSelectedRun(run)} className="hover:bg-app-hover transition-colors cursor-pointer group">
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar size={14} className="text-brand-h3 group-hover:text-brand-h2 transition-colors"/>
                    <span className="text-brand-h1 font-medium text-sm">{run.date}</span>
                  </div>
                </td>
                <td className="p-4">
                  {run.source === 'simulator' ? (
                    <span className="inline-flex items-center space-x-1.5 text-[11px] uppercase tracking-wider font-bold bg-brand-purple/15 text-brand-purple-glow border border-brand-purple/30 px-3 py-1 rounded-full" title="Corrida gerada no simulador local">
                      <Cpu size={12} />
                      <span>Simulada</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 text-[11px] uppercase tracking-wider font-bold bg-brand-green/10 text-brand-green border border-brand-green/30 px-3 py-1 rounded-full" title="Corrida do robô físico">
                      <Bot size={12} />
                      <span>Real</span>
                    </span>
                  )}
                </td>
                <td className="p-4 text-brand-h2 font-medium text-sm">
                  <div className="bg-app-raised inline-block px-3 py-1 rounded-full border border-border-dim">{run.maze}</div>
                </td>
                <td className="p-4 text-brand-h1 font-mono text-sm flex items-center space-x-2 h-14">
                  <span>{run.time}</span>
                  {bestRun && run.id === bestRun.id && (
                    <span className="bg-brand-amber/20 text-brand-amber text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-brand-amber/30">🏆 Record</span>
                  )}
                </td>
                <td className="p-4 text-brand-h2 text-sm">{run.speed}</td>
                <td className="p-4">
                  <div className="flex items-center space-x-1">
                    <Battery size={14} className="text-brand-green"/>
                    <span className="text-brand-h1 text-sm">{run.battery}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-1">
                    <Footprints size={14} className="text-brand-purple"/>
                    <span className="text-brand-h1 text-sm">{run.steps}</span>
                  </div>
                </td>
                <td className="p-4">
                  <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full w-fit ${run.status === 'Centro Alcançado!' ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {run.status === 'Centro Alcançado!' ? <CheckCircle2 size={18}/> : <XCircle size={18}/>}
                    <span className="text-[11px] font-bold uppercase tracking-wider">{run.status}</span>
                  </div>
                </td>
              </tr>
            )) : (
              // ── data-testid adicionado aqui ──
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
          <div className="bg-panel w-full max-w-2xl border-2 border-border-subtle shadow-2xl flex flex-col p-6" onClick={e => e.stopPropagation()}>
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
                    <span className="inline-flex items-center space-x-1.5 text-[11px] uppercase tracking-wider font-bold bg-brand-purple/15 text-brand-purple-glow border border-brand-purple/30 px-3 py-1 rounded-full">
                      <Cpu size={12} /><span>Simulada</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1.5 text-[11px] uppercase tracking-wider font-bold bg-brand-green/10 text-brand-green border border-brand-green/30 px-3 py-1 rounded-full">
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
                  <span className="text-brand-h1 font-bold">{selectedRun.maze}</span>
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
