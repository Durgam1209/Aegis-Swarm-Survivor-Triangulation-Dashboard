
import React, { useState, useEffect } from 'react';
import { Clock, ShieldCheck, Activity, Zap, AlertTriangle, ShieldAlert } from 'lucide-react';

interface StatusOverlayProps {
  survivorsFound: number;
  activeDrones: number;
  missionStartTime: number;
  isFullscreen?: boolean;
}

export const StatusOverlay: React.FC<StatusOverlayProps> = ({ survivorsFound, activeDrones, missionStartTime, isFullscreen }) => {
  const [elapsed, setElapsed] = useState('00:00:00');

  useEffect(() => {
    const timer = setInterval(() => {
      const seconds = Math.floor((Date.now() - missionStartTime) / 1000);
      const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
      const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
      const s = (seconds % 60).toString().padStart(2, '0');
      setElapsed(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, [missionStartTime]);

  return (
    <div className={`absolute inset-0 pointer-events-none p-6 z-30 transition-all duration-500 ${isFullscreen ? 'bg-black/10' : ''}`}>
      {/* Top Left: Temporal Context */}
      <div className={`absolute ${isFullscreen ? 'top-8 left-8' : 'top-6 left-6'} flex flex-col gap-3 items-start transition-all`}>
         <div className="bg-[#0f172a]/90 backdrop-blur-xl border border-slate-800/80 p-4 rounded-2xl shadow-2xl min-w-[180px]">
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-400" /> {isFullscreen ? 'MISSION_CLOCK' : 'Mission Elapsed Time'}
            </span>
            <div className={`${isFullscreen ? 'text-4xl' : 'text-3xl'} font-black text-white mono tracking-tighter tabular-nums leading-none transition-all`}>
              {elapsed}
            </div>
         </div>
         
         {/* Critical Detection Warning */}
         {survivorsFound > 0 && (
           <div className={`bg-red-600/95 border border-red-500 ${isFullscreen ? 'p-5 px-6' : 'p-4'} rounded-2xl shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-in slide-in-from-left-4 flex items-center gap-4 transition-all`}>
              <div className="p-1.5 bg-white rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 animate-pulse" />
              </div>
              <div className="flex flex-col">
                 <span className={`${isFullscreen ? 'text-[12px]' : 'text-[11px]'} font-black text-white uppercase tracking-tighter leading-none`}>Phase Lock Active</span>
                 <span className={`${isFullscreen ? 'text-[10px]' : 'text-[9px]'} font-bold text-red-100 uppercase mono mt-1`}>{survivorsFound} Target(s) Localized</span>
              </div>
           </div>
         )}
      </div>

      {/* Network Stability Metrics (Moved if in fullscreen to avoid overlapping toggle) */}
      <div className={`absolute ${isFullscreen ? 'bottom-8 right-8' : 'top-6 right-20'} flex items-center gap-4 transition-all`}>
        <div className="bg-slate-900/90 backdrop-blur-xl border border-slate-700/60 px-6 py-3.5 rounded-2xl flex items-center gap-8 shadow-2xl">
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2"><Zap className="w-3 h-3 text-blue-400" /> Latency</span>
            <span className="text-sm text-white font-black mono">4.2ms</span>
          </div>
          <div className="w-[1px] h-8 bg-slate-800/80" />
          <div className="flex flex-col">
            <span className="text-[8px] text-slate-500 font-black uppercase tracking-widest mb-1 flex items-center gap-2"><Activity className="w-3 h-3 text-green-400" /> Nodes</span>
            <span className="text-sm text-white font-black mono">{activeDrones} ONLINE</span>
          </div>
        </div>
      </div>

      {/* Fullscreen Overlay Tag */}
      {isFullscreen && (
        <div className="absolute bottom-8 left-8 flex items-center gap-4">
           <div className="bg-blue-600/20 backdrop-blur-md border border-blue-500/30 px-4 py-2 rounded-full flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500 animate-ping" />
              <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Live Tactical Feed // Mesh Enabled</span>
           </div>
        </div>
      )}
    </div>
  );
};
