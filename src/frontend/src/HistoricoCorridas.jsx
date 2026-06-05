import React, { useState, useEffect } from 'react';
import { Clock, Gauge, Battery, Trophy, Filter } from 'lucide-react';

const API = 'http://localhost:8000';
const FILTROS = ['Todos', '4x4', '8x8', '16x16'];

const HistoricoCorridas = () => {
  const [corridas, setCorridas] = useState([]);
  const [filtro, setFiltro]     = useState('Todos');
  const [loading, setLoading]   = useState(false);

  useEffect(() => {
    const buscar = async () => {
      setLoading(true);
      try {
        const url = filtro === 'Todos'
          ? `${API}/historico`
          : `${API}/historico?maze_type=${filtro}`;
        const res  = await fetch(url);
        const json = await res.json();
        // O backend retorna { data: [...] } ou lista direta
        setCorridas(Array.isArray(json) ? json : json.data ?? []);
      } catch (err) {
        console.error('Erro ao buscar corridas:', err);
        setCorridas([]);
      } finally {
        setLoading(false);
      }
    };
    buscar();
  }, [filtro]);

  return (
    <div className="flex flex-col h-full gap-4" data-testid="historico-corridas">

      {/* Filtros */}
      <div className="flex items-center gap-2 shrink-0">
        <Filter size={14} className="text-brand-h3" />
        {FILTROS.map(f => (
          <button
            key={f}
            data-testid={`filtro-${f.toLowerCase()}`}
            onClick={() => setFiltro(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all border-2 ${
              filtro === f
                ? 'bg-brand-purple border-brand-purple text-white'
                : 'bg-app-raised border-border-dim text-brand-h3 hover:border-border-accent'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto space-y-3" data-testid="lista-corridas">
        {loading && (
          <p className="text-brand-h3 text-sm text-center mt-8">Carregando...</p>
        )}

        {!loading && corridas.length === 0 && (
          <div
            data-testid="estado-vazio"
            className="flex flex-col items-center justify-center h-full gap-3 text-brand-h3"
          >
            <Trophy size={32} className="opacity-30" />
            <p className="text-sm">Nenhuma corrida registrada.</p>
          </div>
        )}

        {!loading && corridas.map(c => (
          <div
            key={c.id}
            data-testid="corrida-item"
            className="bg-app-raised border-2 border-border-rule rounded-2xl p-4 flex flex-col gap-3"
          >
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold uppercase tracking-wider text-brand-purple-glow bg-brand-purple/10 border border-brand-purple/20 px-3 py-1 rounded-full">
                {c.maze_type}
              </span>
              <span className="text-[10px] text-brand-h3">{c.finished_at}</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Metrica icon={<Clock size={12}/>}   label="Tempo"      value={`${(c.elapsed_time_ms/1000).toFixed(1)}s`}     color="text-brand-cyan"/>
              <Metrica icon={<Gauge size={12}/>}   label="Vel. Méd."  value={`${c.avg_speed_mm_s.toFixed(0)} mm/s`}         color="text-brand-green"/>
              <Metrica icon={<Battery size={12}/>} label="Bateria"    value={`${c.battery_start_v}V→${c.battery_end_v}V`}  color="text-brand-amber"/>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-[10px] text-brand-h3">Passos: {c.step_count}</span>
              <span className="text-[10px] text-brand-h3">ID: {c.robot_id}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const Metrica = ({ icon, label, value, color }) => (
  <div className="bg-app-bg border border-border-rule rounded-xl p-2 flex flex-col gap-1">
    <div className={`flex items-center gap-1 ${color}`}>{icon}<span className="text-[10px] text-brand-h3">{label}</span></div>
    <span className="text-brand-h1 text-xs font-semibold">{value}</span>
  </div>
);

export default HistoricoCorridas;
