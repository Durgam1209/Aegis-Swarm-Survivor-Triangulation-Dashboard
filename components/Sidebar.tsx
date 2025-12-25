
import React from 'react';
import { Battery, Radar, Target, PlusCircle, FileText, Trash2, Cpu, Joystick, Info, Activity, Clock, ChevronRight, Zap, TrendingDown, DollarSign } from 'lucide-react';
import { Drone, SwarmMetrics } from '../types.ts';
import DemoControlPanel from './DemoControlPanel.tsx';

interface SidebarProps {
  drones: Drone[];
  metrics: SwarmMetrics;
  selectedDroneId: string | null;
  onSelectDrone: (id: string) => void;
  onAddDrone: () => void;
  onRemoveDrone: (id: string) => void;
  onExport: () => void;
  onToggleManual: (id: string) => void;
  isDemoRunning: boolean;
  demoProgress: number;
  currentStepDescription: string;
  onStartDemo: () => void;
  onStopDemo: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  drones, metrics, selectedDroneId, onSelectDrone, onAddDrone, onRemoveDrone, onExport, onToggleManual,
  isDemoRunning, demoProgress, currentStepDescription, onStartDemo, onStopDemo
}) => {
  const selectedDrone = drones.find(d => d.id === selectedDroneId);

  return (
    <aside className="w-80 bg-[#020617] flex flex-col border-r border-slate-800 z-50 shadow-2xl h-full overflow-hidden">
      <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
        
        {/* Aggregated Swarm Health */}
        <div className="space-y-4">
           <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Tactical Readiness</h2>
           <div className="bg-[#0f172a] p-5 rounded-3xl border border-slate-800/60 shadow-xl overflow-hidden relative">
              <div className="flex justify-between items-center mb-4">
                 <div>
                    <span className="text-[8px] font-black text-slate-500 uppercase">Operational Swarm Strength</span>
                    <span className={`text-2xl font-black mono ${metrics.swarmReadiness < 20 ? 'text-red-500' : 'text-white'}`}>{metrics.swarmReadiness}%</span>
                 </div>
                 <Zap className={`w-8 h-8 ${metrics.swarmReadiness < 20 ? 'text-red-500/30 animate-pulse' : 'text-blue-500/20'}`} />
              </div>
              <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden border border-white/5">
                <div 
                  className={`h-full transition-all duration-1000 ${metrics.swarmReadiness < 20 ? 'bg-red-500' : 'bg-gradient-to-r from-blue-600 to-blue-400'}`} 
                  style={{ width: `${metrics.swarmReadiness}%` }} 
                />
              </div>
           </div>
        </div>

        {/* Mission Economics (ROI Card) */}
        <div className="space-y-4">
          <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Mission Economics</h2>
          <div className="bg-[#0f172a] p-5 rounded-3xl border border-slate-800/60 shadow-xl overflow-hidden relative bg-gradient-to-br from-[#0f172a] to-[#1e293b]/50">
            <div className="flex items-center gap-2 mb-3">
               <div className="p-1.5 bg-green-500/10 rounded-lg border border-green-500/20">
                 <DollarSign className="w-3.5 h-3.5 text-green-500" />
               </div>
               <span className="text-[9px] font-black uppercase text-slate-500 tracking-widest">OpEx Savings Generated</span>
            </div>
            
            <div className="flex items-baseline gap-2 mb-4">
              <span className="text-3xl font-black text-green-400 mono tracking-tighter">
                ${metrics.costSavings.toLocaleString()}
              </span>
              <span className="text-[9px] font-bold text-slate-500 uppercase mono">Saved</span>
            </div>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-[10px] mono border-t border-slate-800 pt-3">
                <span className="text-slate-500">Traditional SAR:</span>
                <span className="text-slate-300 font-bold">${metrics.traditionalCostEquivalent.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-[10px] mono">
                <span className="text-slate-500">AEGIS Ops:</span>
                <span className="text-blue-400 font-bold">${metrics.estimatedCost.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="mt-4 pt-3 border-t border-slate-800/50 flex items-center justify-between">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Savings ROI</span>
              <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-black mono">
                <TrendingDown className="w-3 h-3" />
                99.9%
              </div>
            </div>

            {/* Decorative background pulse for "Profit" feeling */}
            <div className="absolute -right-6 -top-6 w-16 h-16 bg-green-500/5 blur-3xl rounded-full" />
          </div>
        </div>

        {/* Mission Simulation Module */}
        <DemoControlPanel 
          isRunning={isDemoRunning} 
          progress={demoProgress} 
          description={currentStepDescription} 
          onStart={onStartDemo} 
          onStop={onStopDemo} 
        />

        {/* Selected Unit Drill-Down Telemetry */}
        <div className="relative min-h-[160px]">
          {selectedDrone ? (
            <div className="bg-blue-600/10 p-5 rounded-[28px] border border-blue-500/30 animate-in slide-in-from-right-8 duration-300 shadow-2xl">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-600 rounded-xl shadow-lg">
                    <Target className="w-4 h-4 text-white" />
                  </div>
                  <div>
                     <h3 className="text-sm font-black text-white mono tracking-tighter">{selectedDrone.id}</h3>
                     <span className="text-[8px] font-black text-blue-400 uppercase tracking-[0.2em]">{selectedDrone.status}</span>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                   <Battery className={`w-5 h-5 ${selectedDrone.battery < 15 ? 'text-red-500 animate-pulse' : 'text-green-400'}`} />
                   <span className="text-[8px] font-black text-slate-500 mono mt-1">{selectedDrone.battery.toFixed(0)}%</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 mb-6">
                 <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                    <span className="text-[7px] font-black text-slate-500 uppercase mb-1 block">Z-ALTITUDE</span>
                    <div className="text-xs font-black text-white mono">{selectedDrone.altitude.toFixed(0)}m</div>
                 </div>
                 <div className="bg-black/30 p-3 rounded-2xl border border-white/5">
                    <span className="text-[7px] font-black text-slate-500 uppercase mb-1 block">SIG_PKT</span>
                    <div className="text-xs font-black text-white mono">{selectedDrone.signalsDetected}</div>
                 </div>
              </div>

              <button 
                onClick={() => onToggleManual(selectedDrone.id)}
                className={`w-full py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 border ${
                  selectedDrone.isManualControl 
                    ? 'bg-yellow-500/20 border-yellow-500/50 text-yellow-500' 
                    : 'bg-blue-600/20 border-blue-500/50 text-blue-400 hover:bg-blue-600/30'
                }`}
              >
                <Joystick className={`w-4 h-4 ${selectedDrone.isManualControl ? 'animate-bounce' : ''}`} />
                {selectedDrone.isManualControl ? 'Manual Engage' : 'Request Override'}
              </button>
            </div>
          ) : (
            <div className="h-full border-2 border-dashed border-slate-800/50 rounded-[28px] flex flex-col items-center justify-center p-8 opacity-40">
               <Info className="w-6 h-6 text-slate-600 mb-2" />
               <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest text-center leading-relaxed">Select active mesh node<br/>to drill down telemetry</p>
            </div>
          )}
        </div>

        {/* Active Nodes Overview */}
        <div className="space-y-4 pb-10">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Mesh Fleet</h2>
            <button 
              onClick={onAddDrone} 
              className="p-1.5 bg-blue-600/10 rounded-lg text-blue-400 hover:bg-blue-600 hover:text-white transition-all border border-blue-500/20 active:scale-95"
            >
              <PlusCircle className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-1 gap-2.5">
            {drones.map(drone => (
              <div 
                key={drone.id} 
                onClick={() => onSelectDrone(drone.id)}
                className={`group p-3.5 px-5 rounded-2xl border transition-all cursor-pointer flex items-center justify-between ${
                  selectedDroneId === drone.id 
                    ? 'bg-blue-900/10 border-blue-500/60 shadow-lg' 
                    : 'bg-slate-900/20 border-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3.5">
                  <div className={`w-1.5 h-1.5 rounded-sm rotate-45 ${drone.battery < 15 ? 'bg-red-500 animate-pulse' : selectedDroneId === drone.id ? 'bg-blue-400' : 'bg-slate-700'}`} />
                  <span className="text-[11px] font-black text-slate-200 mono">{drone.id}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className={`text-[10px] font-black mono ${drone.battery < 15 ? 'text-red-500' : 'text-slate-500'}`}>{drone.battery.toFixed(0)}%</span>
                  <ChevronRight className={`w-3.5 h-3.5 text-slate-700 group-hover:text-blue-500 transition-all ${selectedDroneId === drone.id ? 'rotate-90' : ''}`} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="p-6 border-t border-slate-800 bg-[#0a1120] flex flex-col gap-3">
        <button 
          onClick={onExport}
          className="w-full bg-[#020617] hover:bg-slate-900 text-slate-300 py-4.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all border border-slate-800 hover:border-blue-500/50 shadow-2xl"
        >
          <FileText className="w-4 h-4 text-blue-400" /> MISSION_ARCHIVE
        </button>
      </div>
    </aside>
  );
};
