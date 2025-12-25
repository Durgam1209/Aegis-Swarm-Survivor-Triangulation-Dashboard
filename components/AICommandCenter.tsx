
import React, { useState, useMemo, useEffect } from 'react';
import { 
  BrainCircuit, Target, RefreshCw, Layers, BarChart3, Compass, Sparkles, Clock
} from 'lucide-react';
import { AIPrediction } from '../types.ts';

interface AICommandCenterProps {
  predictions: AIPrediction[];
  onRefresh?: () => Promise<void>;
  isThinking: boolean;
  isSweeping: boolean;
}

const ConfidenceRankingChart: React.FC<{ predictions: AIPrediction[], updateKey: number }> = ({ predictions, updateKey }) => {
  const sorted = useMemo(() => 
    [...predictions].sort((a, b) => b.probability - a.probability).slice(0, 5),
    [predictions]
  );

  return (
    <div key={updateKey} className="bg-[#0f172a]/80 backdrop-blur-md rounded-[32px] p-7 border border-slate-800/80 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-500">
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-400" /> Confidence Ranking
        </h4>
        <span className="text-[8px] font-black text-slate-600 mono uppercase tracking-widest">Neural Leads</span>
      </div>
      <div className="space-y-5">
        {sorted.length > 0 ? sorted.map((p, i) => (
          <div key={i} className="space-y-2">
            <div className="flex justify-between text-[11px] mono">
              <span className="text-slate-300 font-bold">SECTOR [{p.x.toFixed(0)}, {p.y.toFixed(0)}]</span>
            </div>
            <div className="h-2 w-full bg-slate-800/50 rounded-full overflow-hidden border border-white/5">
              <div 
                className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 transition-all duration-1000" 
                style={{ width: `${p.probability * 100}%` }} 
              />
            </div>
          </div>
        )) : (
          <div className="h-24 flex items-center justify-center border-2 border-dashed border-slate-800/40 rounded-2xl">
            <span className="text-[9px] font-black text-slate-600 uppercase mono">Awaiting Data Stream...</span>
          </div>
        )}
      </div>
    </div>
  );
};

const SpatialMeshHeatmap: React.FC<{ predictions: AIPrediction[] }> = ({ predictions }) => {
  const gridSize = 10;
  const grid = useMemo(() => {
    const data = Array(gridSize).fill(0).map(() => Array(gridSize).fill(0));
    predictions.forEach(p => {
      const gx = Math.floor(Math.max(0, Math.min(99, p.x)) / 10);
      const gy = Math.floor(Math.max(0, Math.min(99, p.y)) / 10);
      data[gy][gx] = Math.max(data[gy][gx], p.probability);
    });
    return data;
  }, [predictions]);

  return (
    <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-[32px] p-7 border border-slate-800/80 shadow-2xl flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-5 px-1">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-400" /> Probability Mesh
        </h4>
        <div className="flex gap-1.5">
          {[1,2,3].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-blue-500/40 animate-pulse" />)}
        </div>
      </div>
      <div className="grid grid-cols-10 gap-1 bg-black/40 p-2.5 rounded-2xl border border-white/5 shadow-inner">
        {grid.map((row, y) => row.map((val, x) => (
          <div 
            key={`${x}-${y}`} 
            className="w-8 h-8 rounded-md transition-all duration-700"
            style={{ 
              backgroundColor: val > 0 ? `rgba(168, 85, 247, ${0.1 + val * 0.9})` : 'rgba(59, 130, 246, 0.05)',
              boxShadow: val > 0.6 ? `inset 0 0 10px rgba(168, 85, 247, ${val})` : 'none',
              border: '1px solid rgba(255,255,255,0.03)'
            }}
          />
        )))}
      </div>
      <div className="w-full flex justify-between mt-5 px-3 text-[9px] font-black text-slate-500 uppercase mono">
        <span>X 0-100</span>
        <span>Y 0-100</span>
      </div>
    </div>
  );
};

const TrendSignalRadar: React.FC<{ predictions: AIPrediction[] }> = ({ predictions }) => {
  const sectors = useMemo(() => {
    const buckets = Array(8).fill(0); // E, SE, S, SW, W, NW, N, NE
    predictions.forEach(p => {
      const dx = p.x - 50;
      const dy = p.y - 50;
      let angle = Math.atan2(dy, dx) * (180 / Math.PI);
      if (angle < 0) angle += 360;
      const bucket = Math.floor(((angle + 22.5) % 360) / 45);
      buckets[bucket] = Math.max(buckets[bucket], p.probability);
    });
    return buckets;
  }, [predictions]);

  const labels = ['E', 'SE', 'S', 'SW', 'W', 'NW', 'N', 'NE'];

  return (
    <div className="bg-[#0f172a]/80 backdrop-blur-md rounded-[32px] p-7 border border-slate-800/80 shadow-2xl flex flex-col items-center">
      <div className="w-full flex items-center justify-between mb-8 px-1">
        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Compass className="w-4 h-4 text-emerald-400" /> Signal Azimuth
        </h4>
        <span className="text-[8px] font-black text-slate-600 mono uppercase tracking-widest">SDR Scan</span>
      </div>
      
      <div className="relative w-56 h-56 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          {[20, 35, 50].map(r => (
            <circle key={r} cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
          ))}
          {sectors.map((val, i) => {
            const angleStart = (i * 45 - 22.5) * (Math.PI / 180);
            const angleEnd = ((i + 1) * 45 - 22.5) * (Math.PI / 180);
            const r = 10 + (val * 40);
            const x1 = 50 + r * Math.cos(angleStart);
            const y1 = 50 + r * Math.sin(angleStart);
            const x2 = 50 + r * Math.cos(angleEnd);
            const y2 = 50 + r * Math.sin(angleEnd);
            return (
              <path 
                key={i}
                d={`M 50 50 L ${x1} ${y1} A ${r} ${r} 0 0 1 ${x2} ${y2} Z`} 
                fill={val > 0 ? `rgba(16, 185, 129, ${0.15 + val * 0.55})` : 'transparent'} 
                stroke={val > 0 ? 'rgba(16, 185, 129, 0.5)' : 'transparent'}
                strokeWidth="0.7"
                className="transition-all duration-1000"
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex items-center justify-center text-slate-500 font-black text-[11px] pointer-events-none">
          {labels.map((l, i) => {
            const angle = i * 45;
            const r = 64; 
            const x = Math.cos(angle * (Math.PI / 180)) * r;
            const y = Math.sin(angle * (Math.PI / 180)) * r;
            return (
              <span key={l} style={{ position: 'absolute', transform: `translate(${x}px, ${y}px)` }}>
                {l}
              </span>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AICommandCenter: React.FC<AICommandCenterProps> = ({ predictions, onRefresh, isThinking, isSweeping }) => {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());
  const [updateCount, setUpdateCount] = useState(0);

  useEffect(() => {
    if (predictions.length > 0) {
      setLastUpdate(new Date().toLocaleTimeString());
      setUpdateCount(prev => prev + 1);
    }
  }, [predictions]);

  const handleManualRefresh = async () => {
    if (!onRefresh || isRefreshing) return;
    setIsRefreshing(true);
    await onRefresh();
    setIsRefreshing(false);
  };

  const noPredictions = predictions.length === 0;

  return (
    <div className="fixed right-6 top-24 w-[500px] h-[calc(100vh-8rem)] bg-[#020617]/90 backdrop-blur-2xl border border-blue-500/20 rounded-[48px] shadow-[0_40px_120px_rgba(0,0,0,0.95)] flex flex-col z-[60] overflow-hidden animate-in fade-in slide-in-from-right-16 duration-700">
      {/* Header */}
      <div className="p-9 border-b border-slate-800/60 flex items-center justify-between relative overflow-hidden shrink-0">
        <div className="flex items-center gap-6 relative z-10">
          <div className="bg-blue-600 p-3.5 rounded-2xl shadow-2xl flex items-center justify-center">
            <BrainCircuit className={`w-7 h-7 text-white ${isThinking || isSweeping ? 'animate-pulse' : ''}`} />
          </div>
          <div>
            <h3 className="text-xs font-black text-white uppercase tracking-[0.25em] mb-1.5 italic">AEGIS_CORE ANALYTICS</h3>
            <div className="flex items-center gap-2.5">
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <div key={i} className={`w-1.5 h-1.5 rounded-full ${isThinking || isSweeping ? 'bg-blue-500 animate-bounce' : 'bg-green-500'}`} style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
              <span className="text-[9px] text-slate-400 font-black uppercase mono tracking-[0.1em]">
                {isThinking || isSweeping ? 'PROCESSING NEURAL UPLINK' : 'SYSTEM LINK: NOMINAL'}
              </span>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
            <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing || isSweeping}
                className={`p-4 rounded-2xl border border-slate-800 hover:border-blue-500/50 transition-all active:scale-90 shadow-xl ${isRefreshing || isSweeping ? 'bg-blue-600/20 text-blue-400' : 'bg-slate-900/50 text-slate-400 hover:text-blue-400'}`}
            >
                <RefreshCw className={`w-5 h-5 ${isRefreshing || isSweeping ? 'animate-spin' : ''}`} />
            </button>
            <div className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase tracking-widest">
                <Clock className="w-2.5 h-2.5" />
                Updated {lastUpdate}
            </div>
        </div>
      </div>

      {/* Analytics Viewport */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-9 space-y-10 relative bg-dot-pattern">
        {/* Loading Overlay */}
        {isSweeping && (
          <div className="absolute inset-0 bg-[#020617]/40 backdrop-blur-[2px] z-50 flex flex-col items-center justify-center pointer-events-none animate-in fade-in duration-500">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
            <span className="text-[10px] font-black uppercase text-blue-400 tracking-[0.3em] animate-pulse">Syncing Tactical Matrix</span>
          </div>
        )}

        {/* Predictions Content */}
        <div className="space-y-10 pb-12 animate-in slide-in-from-bottom-4 duration-500">
          {noPredictions && !isSweeping ? (
            <div className="py-24 flex flex-col items-center justify-center text-center space-y-8 opacity-40">
              <Target className="w-16 h-16 text-slate-600 animate-pulse" />
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-white mb-3">Spatial Map Offline</p>
                <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest max-w-[240px] leading-relaxed mx-auto">Engage predictive scan to visualize probable signal voids</p>
              </div>
            </div>
          ) : (
            <>
              <ConfidenceRankingChart predictions={predictions} updateKey={updateCount} />
              <SpatialMeshHeatmap predictions={predictions} />
              <TrendSignalRadar predictions={predictions} />
              
              <div className="grid grid-cols-1 gap-6">
                {predictions.map((p, i) => (
                    <div key={`${updateCount}-${i}`} className="bg-[#0f172a]/70 backdrop-blur-md border border-slate-800/80 p-7 rounded-[40px] group transition-all duration-500 shadow-2xl animate-in fade-in slide-in-from-right-4">
                    <div className="flex justify-between items-center mb-5">
                        <div className="flex items-center gap-4">
                        <div className="p-2.5 bg-purple-600/15 rounded-2xl text-purple-400 border border-purple-500/20">
                            <Target className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-sm font-black text-white mono block leading-none tracking-tight">SECTOR_[{p.x.toFixed(0)}, {p.y.toFixed(0)}]</span>
                            <span className="text-[8px] text-slate-500 font-black uppercase tracking-[0.25em] mt-2 block">Tactical Coordinate</span>
                        </div>
                        </div>
                    </div>
                    <div className="bg-black/50 p-5 rounded-[24px] border border-white/5">
                        <p className="text-[11px] text-slate-400 leading-relaxed italic font-medium">"{p.reasoning}"</p>
                    </div>
                    </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer Branding */}
      <div className="p-9 bg-[#0a1120] border-t border-slate-800/60 flex items-center justify-center shrink-0">
        <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.5em] flex items-center gap-4">
          <Sparkles className="w-4 h-4 text-blue-500/40" /> AEGIS_CORE // V3.14_STABLE
        </p>
      </div>
    </div>
  );
};

export default AICommandCenter;
