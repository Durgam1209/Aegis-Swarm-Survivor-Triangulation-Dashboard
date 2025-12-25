
import React from 'react';
import { Play, Square, Sparkles, Activity } from 'lucide-react';

interface DemoControlPanelProps {
  isRunning: boolean;
  progress: number;
  description: string;
  onStart: () => void;
  onStop: () => void;
}

const DemoControlPanel: React.FC<DemoControlPanelProps> = ({ isRunning, progress, description, onStart, onStop }) => {
  return (
    <div className="bg-[#0f172a] rounded-[24px] border border-blue-500/20 p-5 mb-6 overflow-hidden relative group">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles className={`w-4 h-4 ${isRunning ? 'text-blue-400 animate-pulse' : 'text-slate-500'}`} />
          <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Mission Sim</h3>
        </div>
        {!isRunning ? (
          <button 
            onClick={onStart} 
            className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            <Play className="w-3 h-3 fill-current" /> Run
          </button>
        ) : (
          <button 
            onClick={onStop} 
            className="bg-red-600/20 hover:bg-red-600 border border-red-500/30 text-red-500 hover:text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Square className="w-3 h-3 fill-current" /> Abort
          </button>
        )}
      </div>
      
      {isRunning ? (
        <div className="space-y-3 animate-in fade-in duration-500">
          <div className="flex justify-between items-center">
             <span className="text-[8px] text-slate-500 font-bold uppercase mono">Execution Progress</span>
             <span className="text-[9px] text-blue-400 font-black mono">{progress.toFixed(0)}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
            <div className="h-full bg-blue-500 transition-all duration-700 shadow-[0_0_10px_rgba(59,130,246,0.5)]" style={{ width: `${progress}%` }} />
          </div>
          <p className="text-[9px] text-blue-300 font-bold italic leading-tight flex items-start gap-2">
            <Activity className="w-3 h-3 shrink-0 mt-0.5 animate-pulse" />
            {description}
          </p>
        </div>
      ) : (
        <p className="text-[9px] text-slate-500 italic font-medium leading-relaxed">
          Initialize AI-driven search scenario to demonstrate swarm coordination capabilities.
        </p>
      )}
      
      {/* Decorative background element */}
      <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/5 blur-3xl rounded-full group-hover:bg-blue-500/10 transition-colors" />
    </div>
  );
};

export default DemoControlPanel;
