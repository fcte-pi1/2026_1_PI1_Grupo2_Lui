import React, { useState } from 'react';
import { Cpu, Wifi, Play, Pause, Bot, RotateCw, ChevronDown, Battery, Clock, Footprints, Gauge, RefreshCw, Zap, Usb, Timer, Radio } from 'lucide-react';
import { useMazeSimulator } from './useMazeSimulator';

const App = () => {
  const [activeTab, setActiveTab] = useState('Mapa');
  const sim = useMazeSimulator();

  return (
    <div className="bg-app-bg font-sans h-screen p-2 sm:p-6 flex items-center justify-center overflow-hidden">
      
      {/* Main App Container */}
      <div className="w-full h-full max-h-screen flex flex-col overflow-hidden relative">

        <Header activeTab={activeTab} setActiveTab={setActiveTab} />
        
        <main className="flex-grow flex flex-col lg:flex-row gap-6 h-full pb-2 min-h-0 overflow-hidden">
          {/* Left Column - Maze Map Panel */}
          <section className="flex-grow bg-panel p-6 flex flex-col relative overflow-hidden min-h-0">
            <MazeCanvas sim={sim} />
          </section>

          {/* Right Column - Sidebar */}
          <aside className="w-full lg:w-[360px] flex flex-col space-y-3 overflow-hidden shrink-0">
            <TelemetrySidebar sim={sim} />
          </aside>
        </main>
      </div>
    </div>
  );
};

const Header = ({ activeTab, setActiveTab }) => {
  const tabs = ['Mapa', 'Telemetria', 'Corrida', 'Configurações'];
  
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
            className={`px-6 py-1.5 rounded-full font-medium text-sm transition-all ${
              activeTab === tab 
                ? 'bg-brand-purple text-white' 
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

export default App;