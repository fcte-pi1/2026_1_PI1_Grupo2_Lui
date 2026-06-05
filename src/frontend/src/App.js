import React, { useState, useEffect } from 'react';
import { Cpu, Wifi, Play, Pause, Bot, RotateCw, ChevronDown, Battery, Clock, Footprints, Gauge, RefreshCw, Zap, Usb, Timer, Radio, Download, CheckCircle2, XCircle, Calendar } from 'lucide-react';
import { useMazeSimulator } from './useMazeSimulator';

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

              if (explored[x][y]) {
                  style.backgroundColor = '#110E20';
              }
              
              const isGoal = goals.some(g => g.x === x && g.y === y);
              if (isGoal) {
                  style.backgroundColor = '#10B981';
              }

              const isRobot = robot && robot.x === x && robot.y === y;

              return (
                 <div key={i} style={style} className="relative flex items-center justify-center">
                    {isRobot && (
                        <div style={{
                           width: 0,
                           height: 0,
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

  const [history, setHistory] = useState([
    { id: 1, date: '04/06/2026 14:30', maze: '16x16', status: 'Centro Alcançado!', time: '1m 45s', speed: '22.4 cm/s', battery: '95%', steps: 142 },
    { id: 2, date: '04/06/2026 15:10', maze: '8x8', status: 'Preso!', time: '0m 32s', speed: '18.1 cm/s', battery: '89%', steps: 34 },
    { id: 3, date: '04/06/2026 16:05', maze: '4x4', status: 'Centro Alcançado!', time: '0m 12s', speed: '25.0 cm/s', battery: '88%', steps: 12 },
    { id: 4, date: '05/06/2026 09:20', maze: '16x16', status: 'Centro Alcançado!', time: '1m 20s', speed: '24.2 cm/s', battery: '82%', steps: 128 },
  ]);

  // Optionally listen for run completion to add to history if we want
  useEffect(() => {
    if (sim.memory.status === 'Centro Alcançado!' || sim.memory.status === 'Preso!') {
      const isDuplicate = history.some(h => h.id === sim.memory.bfsCount + 1000); // Simple hack to avoid duplicate
      if (!isDuplicate && sim.memory.timeMs > 0) {
        const newRun = {
          id: sim.memory.bfsCount + 1000,
          date: new Date().toLocaleString('pt-BR'),
          maze: `${sim.gridSize}x${sim.gridSize}`,
          status: sim.memory.status,
          time: `${Math.floor(sim.memory.timeMs / 60000)}m ${((sim.memory.timeMs % 60000)/1000).toFixed(1)}s`,
          speed: sim.memory.timeMs > 0 ? ((sim.memory.steps * 18) / (sim.memory.timeMs / 1000)).toFixed(1) + ' cm/s' : '0.0 cm/s',
          battery: '100%', // Mock
          steps: sim.memory.steps,
          mapSnapshot: {
              gridSize: sim.gridSize,
              knownWalls: JSON.parse(JSON.stringify(sim.memory.knownWalls)),
              explored: JSON.parse(JSON.stringify(sim.memory.explored)),
              goals: JSON.parse(JSON.stringify(sim.memory.goals)),
              robot: JSON.parse(JSON.stringify(sim.memory.robot))
          }
        };
        setHistory(prev => [newRun, ...prev]);
      }
    }
  }, [sim.memory.status, sim.memory.timeMs, sim.memory.steps, sim.gridSize, sim.memory.bfsCount, history, sim.memory.knownWalls, sim.memory.explored, sim.memory.goals, sim.memory.robot]);

  return (
    <div className="bg-app-bg font-sans h-screen p-2 sm:p-6 flex items-center justify-center overflow-hidden">
      
      {/* Main App Container */}
      <div className="w-full h-full max-h-screen flex flex-col overflow-hidden relative">

        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-grow flex flex-col lg:flex-row gap-6 h-full pb-2 min-h-0 overflow-hidden">
          {activeTab === 'Histórico' ? (
            <HistoryView historyData={history} />
          ) : (
            <>
              {/* Left Column - Maze Map Panel */}
              <section className="flex-grow bg-panel p-6 flex flex-col relative overflow-hidden min-h-0">
                <MazeCanvas sim={sim} />
              </section>

              {/* Right Column - Sidebar */}
              <aside className="w-full lg:w-[360px] flex flex-col space-y-3 overflow-hidden shrink-0">
                <TelemetrySidebar sim={sim} />
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
      {/* Brand */}
      <div className="flex items-center space-x-2">
        <Cpu className="text-brand-purple-glow" size={24} />
        <span className="text-2xl font-bold text-brand-h1 tracking-tighter">micromouse<span className="text-brand-purple">.</span></span>
      </div>

      {/* Navigation Pills */}
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

      {/* Connect Button */}
      <button className="flex items-center space-x-2 bg-app-raised border-2 border-border-dim hover:border-border-accent text-brand-h1 font-medium px-6 py-2.5 rounded-full transition-all text-sm">
        <Wifi className="text-brand-green" size={14} />
        <span>Conectar</span>
      </button>
    </header>
  );
};

const MazeCanvas = ({ sim }) => {
  const { memory, isRunning, setIsRunning, speed, setSpeed, showTruth, setShowTruth, resetSimulation, gridSize, changeGridSize } = sim;
  const mem = memory;
  
  if (!mem.truthWalls || mem.truthWalls.length === 0) {
     return (
        <div className="flex-grow flex items-center justify-center relative p-4 bg-app-raised rounded-3xl border-2 border-border-subtle overflow-hidden">
          <div className="text-brand-h3 font-medium text-sm">Carregando simulador...</div>
        </div>
     );
  }

  let maxD = 0;
  for(let x=0; x<gridSize; x++) {
      for(let y=0; y<gridSize; y++) {
          if (mem.distances[x][y] !== 255 && mem.distances[x][y] > maxD) maxD = mem.distances[x][y];
      }
  }

  const GOALS = mem.goals || [];

  return (
    <>
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center mb-6 z-10 space-y-4 xl:space-y-0 shrink-0">
        <div>
             <h2 className="text-2xl font-semibold text-brand-h1 tracking-tight">Mapa do Labirinto</h2>
        </div>

        {/* Mid Controls */}
        <div className="flex items-center space-x-6 bg-app-bg p-2 px-4 rounded-full border-2 border-border-rule shadow-inner">
            <div className="relative">
                <select 
                  className="appearance-none bg-transparent text-brand-h2 py-1 pl-3 pr-8 focus:outline-none font-medium text-xs cursor-pointer"
                  value={gridSize}
                  onChange={(e) => changeGridSize(parseInt(e.target.value))}
                >
                    <option value={4} className="bg-app-raised">Matriz 4x4</option>
                    <option value={8} className="bg-app-raised">Matriz 8x8</option>
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
             <label className="flex items-center cursor-pointer space-x-2">
                <div className="relative">
                    <input type="checkbox" className="sr-only peer" checked={showTruth} onChange={(e) => setShowTruth(e.target.checked)} />
                    <div className="w-9 h-5 bg-border-ghost peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-brand-purple-glow after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-brand-h3 after:border-border-subtle after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand-purple peer-checked:after:bg-white border-2 border-border-rule"></div>
                </div>
                <span className="text-brand-h3 text-[11px] font-medium uppercase tracking-wider">Raio-X</span>
            </label>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-3">
            <button onClick={() => setIsRunning(!isRunning)} className="flex items-center space-x-2 bg-app-raised border-2 border-border-dim hover:border-border-accent text-brand-h1 font-medium px-6 py-2 rounded-full transition-all text-sm">
                {isRunning ? <><Pause className="text-brand-amber" size={14} fill="currentColor"/> <span>Pausar</span></> : <><Play className="text-brand-green" size={14} fill="currentColor"/> <span>Iniciar</span></>}
            </button>
            <button onClick={() => resetSimulation(false)} className="bg-app-bg hover:bg-border-ghost text-brand-h1 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 border-2 border-border-dim transition-all">
                <Bot size={14} /> <span>Robô</span>
            </button>
            <button onClick={() => resetSimulation(true)} className="bg-app-bg hover:bg-border-ghost text-brand-h1 px-4 py-2 rounded-full text-sm font-medium flex items-center space-x-2 border-2 border-border-dim transition-all">
                <RotateCw size={14} /> <span>Novo</span>
            </button>
        </div>
      </div>

      {/* Maze Container */}
      <div className="flex-1 flex items-center justify-center relative p-4 bg-app-bg rounded-3xl border-2 border-border-rule overflow-hidden min-h-0" style={{ containerType: 'size' }}>
        <div 
          id="maze-container" 
          className={showTruth ? "show-truth" : ""} 
          style={{ 
            gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
            gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`
          }}
        >
          {Array.from({ length: gridSize * gridSize }).map((_, i) => {
              const y = Math.floor(i / gridSize);
              const x = i % gridSize;
              
              let classes = ["cell"];
              
              if (showTruth) {
                if (mem.truthWalls[x][y][0]) classes.push("truth-wall-n");
                if (mem.truthWalls[x][y][1]) classes.push("truth-wall-e");
                if (mem.truthWalls[x][y][2]) classes.push("truth-wall-s");
                if (mem.truthWalls[x][y][3]) classes.push("truth-wall-w");
              }

              if (mem.explored[x][y]) {
                  classes.push("explored");
                  if (mem.knownWalls[x][y][0]) classes.push("known-wall-n");
                  if (mem.knownWalls[x][y][1]) classes.push("known-wall-e");
                  if (mem.knownWalls[x][y][2]) classes.push("known-wall-s");
                  if (mem.knownWalls[x][y][3]) classes.push("known-wall-w");
              }

              const isGoal = GOALS.some(g => g.x === x && g.y === y);
              if (isGoal) classes.push("goal");

              let dataColor = null;
              const d = mem.distances[x][y];
              if (mem.explored[x][y]) {
                  if (d !== 0 && d !== 255) {
                      if (d <= maxD / 3) dataColor = "g";
                      else if (d <= 2 * maxD / 3) dataColor = "y";
                      else dataColor = "r";
                  }
              }

              const hasRobot = mem.robot.x === x && mem.robot.y === y;

              return (
                <div key={i} className={classes.join(" ")} data-color={dataColor}>
                  {hasRobot && (
                    <div id="robot" className={`dir-${mem.robot.dir}`}></div>
                  )}
                  {isGoal && !hasRobot && "G"}
                  {!isGoal && !hasRobot && mem.explored[x][y] && d !== 255 ? d : ""}
                </div>
              );
          })}
        </div>
      </div>
    </>
  );
};

const TelemetrySidebar = ({ sim }) => {
  const mem = sim.memory;
  let statusColor = "bg-brand-cyan";
  if (mem.status === "Centro Alcançado!") statusColor = "bg-brand-green";
  else if (mem.status === "Preso!") statusColor = "bg-red-500";
  else if (mem.status === "Mapeando...") statusColor = "bg-brand-amber";

  const timeSec = (mem.timeMs / 1000).toFixed(1);
  const distanceCm = mem.steps * 18;
  const avgSpeed = mem.timeMs > 0 ? (distanceCm / (mem.timeMs / 1000)).toFixed(1) : "0.0";

  return (
    <>
      <section className="bg-panel p-4 shrink-0">
        <div className="grid grid-cols-3 gap-2">
            <BatteryWidget />
            <MetricCard label="Tempo" value={timeSec} unit="s" icon={<Clock size={14} />} iconColor="text-brand-cyan" />
            <MetricCard label="Passos" value={mem.steps} unit="" icon={<Footprints size={14} />} iconColor="text-brand-purple-glow" />
            <MetricCard label="Veloc" value={avgSpeed} unit="cm/s" icon={<Gauge size={14} />} iconColor="text-brand-green" />
            <MetricCard label="Giros" value={mem.turns} unit="" icon={<RefreshCw size={14} />} iconColor="text-brand-amber" />
            <MetricCard label="Algoritmo" value="A-Star" unit="" icon={<Zap size={14} />} iconColor="text-brand-purple" isString={true} />
        </div>
      </section>

      <section className="bg-panel p-4 shrink-0 flex-1 min-h-0 flex flex-col justify-center">
         <h3 className="text-lg font-semibold text-brand-h1 mb-3">Conectividade</h3>
         <div className="space-y-3">
            <div className="flex justify-between items-center">
                <span className="text-brand-h3 text-[11px] font-medium uppercase tracking-wider flex items-center"><Usb className="mr-3 text-brand-h3 w-4 h-4" />WebSocket</span>
                <span className="text-brand-green text-[10px] uppercase tracking-wider font-bold flex items-center bg-brand-green/10 border-2 border-brand-green/20 px-3 py-1.5 rounded-full">
                    <span className="relative flex h-2 w-2 mr-2 rounded-full bg-brand-green"></span>
                    Conectado
                </span>
            </div>
            <div className="border-b border-border-rule"></div>
            <div className="flex justify-between items-center">
                <span className="text-brand-h3 text-[11px] font-medium uppercase tracking-wider flex items-center"><Timer className="mr-3 text-brand-h3 w-4 h-4" />Latência</span>
                <span className="text-brand-h2 font-semibold font-mono text-sm">23 ms</span>
            </div>
             <div className="border-b border-border-rule"></div>
            <div className="flex justify-between items-center">
                <span className="text-brand-h3 text-[11px] font-medium uppercase tracking-wider flex items-center"><Radio className="mr-3 text-brand-h3 w-4 h-4" />Pacotes RX</span>
                <span className="text-brand-h2 font-semibold font-mono text-sm">1.8k</span>
            </div>
         </div>
      </section>

      <section className="bg-panel p-3 flex justify-between items-center mt-auto border-t-[4px] border-t-brand-purple shrink-0">
          <span className="text-[11px] font-medium uppercase tracking-wider text-brand-h3">Status</span>
           <div className="flex items-center space-x-2 bg-app-bg border-2 border-border-ghost py-1.5 px-3 rounded-full">
              <span className={`relative flex h-2.5 w-2.5 rounded-full ${statusColor}`}></span>
              <span className="text-brand-h1 text-[13px] font-bold">{mem.status}</span>
          </div>
      </section>
    </>
  );
};

const MetricCard = ({ label, value, unit, icon, iconColor, isString = false }) => (
  <div className="bg-app-bg border-2 border-border-rule p-3 rounded-[1rem] flex flex-col relative transition-all duration-300">
      <div className="flex justify-between items-start mb-1">
          <span className="text-label truncate">{label}</span>
          <div className={`${iconColor}`}>
              {icon}
          </div>
      </div>
      <span className={isString ? "text-brand-h1 text-lg font-semibold tracking-tight mt-1" : "text-brand-h1 text-xl font-semibold tracking-tight"}>
        {value}
        {unit && <small className="text-[10px] text-brand-h3 font-medium ml-1">{unit}</small>}
      </span>
  </div>
);

const BatteryWidget = () => (
  <div className="bg-app-bg border-2 border-border-rule p-3 rounded-[1rem] flex flex-col relative transition-all duration-300">
      <div className="flex justify-between items-start mb-1">
          <span className="text-label">Carga</span>
          <div className="text-brand-green">
              <Battery size={14} />
          </div>
      </div>
      <span className="text-brand-h1 text-xl font-semibold tracking-tight">89%</span>
      <div className="h-1.5 w-full bg-border-ghost mt-2 rounded-full overflow-hidden border border-border-rule">
          <div className="h-full bg-brand-green w-[89%] rounded-full"></div>
      </div>
  </div>
);

const HistoryView = ({ historyData }) => {
  const [filter, setFilter] = useState('Todos');
  const [selectedRun, setSelectedRun] = useState(null);

  const filteredHistory = historyData.filter(run => filter === 'Todos' || run.maze.includes(filter));

  const successfulRuns = filteredHistory.filter(r => r.status === 'Centro Alcançado!');
  const bestRun = successfulRuns.length > 0 ? successfulRuns.reduce((prev, curr) => {
    const parseTime = (t) => {
      const parts = t.split(' ');
      const m = parseInt(parts[0]);
      const s = parseFloat(parts[1]);
      return m * 60 + s;
    };
    return parseTime(curr.time) < parseTime(prev.time) ? curr : prev;
  }) : null;

  const totalRuns = filteredHistory.length;
  const successRate = totalRuns > 0 ? Math.round((successfulRuns.length / totalRuns) * 100) : 0;
  const bestTimeStr = bestRun ? bestRun.time : '--';
  const avgSpeed = totalRuns > 0 ? (filteredHistory.reduce((acc, curr) => acc + parseFloat(curr.speed), 0) / totalRuns).toFixed(1) + ' cm/s' : '--';

  const exportCSV = () => {
    const headers = ['Data/Hora', 'Labirinto', 'Status', 'Tempo', 'Velocidade', 'Bateria', 'Movimentos'];
    const rows = filteredHistory.map(run => [
      run.date, run.maze, run.status, run.time, run.speed, run.battery, run.steps
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `historico_micromouse_${filter}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-grow bg-panel p-6 flex flex-col relative overflow-hidden min-h-0 w-full rounded-3xl border-2 border-border-subtle">
      <div className="flex justify-between items-start mb-8 shrink-0">
        <div>
          <h2 className="text-4xl font-bold text-brand-h1 tracking-tight">Histórico de Corridas</h2>
          <p className="text-brand-h3 text-base mt-2">Visualize e exporte execuções anteriores do Micromouse</p>
        </div>
        
        <div className="flex items-center space-x-4 mt-2">
          <div className="relative">
            <select 
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
          
          <button onClick={exportCSV} className="flex items-center space-x-2 bg-[#6D28D9] hover:bg-brand-purple-glow hover:shadow-[0_0_15px_rgba(124,58,237,0.3)] text-white font-medium px-5 py-2.5 rounded-full transition-all text-sm border-2 border-transparent">
            <Download size={16} />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6 shrink-0">
         <div className="bg-app-bg border-2 border-border-rule p-4 rounded-2xl flex flex-col">
            <span className="text-label text-brand-h3 mb-1">Corridas</span>
            <span className="text-brand-h1 text-2xl font-bold">{totalRuns}</span>
         </div>
         <div className="bg-app-bg border-2 border-border-rule p-4 rounded-2xl flex flex-col">
            <span className="text-label text-brand-h3 mb-1">Sucesso</span>
            <span className="text-brand-green text-2xl font-bold">{successRate}%</span>
         </div>
         <div className="bg-app-bg border-2 border-border-rule p-4 rounded-2xl flex flex-col">
            <span className="text-label text-brand-h3 mb-1">Melhor Tempo</span>
            <span className="text-brand-purple-glow text-2xl font-bold">{bestTimeStr}</span>
         </div>
         <div className="bg-app-bg border-2 border-border-rule p-4 rounded-2xl flex flex-col">
            <span className="text-label text-brand-h3 mb-1">Velocidade Média</span>
            <span className="text-brand-h1 text-2xl font-bold">{avgSpeed}</span>
         </div>
      </div>

      <div className="overflow-y-auto max-h-[450px] rounded-2xl border-2 border-border-rule bg-app-bg">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead className="sticky top-0 bg-app-header border-b-2 border-border-rule z-10 shadow-sm">
            <tr>
              <th className="p-4 text-xs font-semibold text-brand-h3 uppercase tracking-wider">Data / Hora</th>
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
              <tr key={run.id} onClick={() => setSelectedRun(run)} className="hover:bg-app-hover transition-colors cursor-pointer group">
                <td className="p-4">
                  <div className="flex items-center space-x-2">
                    <Calendar size={14} className="text-brand-h3 group-hover:text-brand-h2 transition-colors" />
                    <span className="text-brand-h1 font-medium text-sm">{run.date}</span>
                  </div>
                </td>
                <td className="p-4 text-brand-h2 font-medium text-sm">
                  <div className="bg-app-raised inline-block px-3 py-1 rounded-full border border-border-dim">
                    {run.maze}
                  </div>
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
                     <Battery size={14} className="text-brand-green" />
                     <span className="text-brand-h1 text-sm">{run.battery}</span>
                   </div>
                </td>
                <td className="p-4">
                  <div className="flex items-center space-x-1">
                     <Footprints size={14} className="text-brand-purple" />
                     <span className="text-brand-h1 text-sm">{run.steps}</span>
                   </div>
                </td>
                <td className="p-4">
                  <div className={`flex items-center space-x-1.5 px-3 py-1 rounded-full w-fit ${run.status === 'Centro Alcançado!' ? 'bg-brand-green/10 text-brand-green border border-brand-green/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                    {run.status === 'Centro Alcançado!' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                    <span className="text-[11px] font-bold uppercase tracking-wider">{run.status}</span>
                  </div>
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan="7" className="p-12 text-center text-brand-h3">
                  Nenhuma corrida encontrada para o filtro selecionado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selectedRun && (
        <div className="absolute inset-0 z-50 bg-app-bg/80 backdrop-blur-sm flex items-center justify-center p-6" onClick={() => setSelectedRun(null)}>
           <div className="bg-panel w-full max-w-2xl border-2 border-border-subtle shadow-2xl flex flex-col p-6" onClick={e => e.stopPropagation()}>
              <div className="flex justify-between items-start mb-6">
                 <div>
                    <h3 className="text-2xl font-bold text-brand-h1 mb-1">Detalhes da Corrida</h3>
                    <p className="text-brand-h3 text-sm">{selectedRun.date}</p>
                 </div>
                 <button onClick={() => setSelectedRun(null)} className="text-brand-h3 hover:text-white transition-colors">
                    <XCircle size={24} />
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                 <div className="space-y-4">
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
                    <MiniMap snapshot={selectedRun.mapSnapshot} />
                 ) : (
                    <div className="bg-app-bg rounded-xl border border-border-rule flex items-center justify-center p-4 relative overflow-hidden group h-full">
                       <div className="text-center z-10">
                          <Bot size={48} className="mx-auto text-brand-purple mb-2 opacity-20 group-hover:opacity-100 transition-opacity" />
                          <span className="text-brand-h3 text-xs uppercase tracking-widest font-semibold block">Mini-Mapa Simulado</span>
                          <span className="text-brand-h4 text-[10px] mt-1 block">Trajeto indisponível no mock atual</span>
                       </div>
                       <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px' }}></div>
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