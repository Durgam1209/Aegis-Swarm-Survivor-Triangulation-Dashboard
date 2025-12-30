// Fix for the 'aistudio' property error
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

import React,{ useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  ShieldAlert, BrainCircuit, MapPin, Send, Download, ShieldCheck, X, Video, Activity, Info, FileText, Sparkles, Navigation, Cpu, RefreshCw, Maximize2, Minimize2
} from 'lucide-react';
import { TacticalMap } from './components/TacticalMap.tsx';
import { Sidebar } from './components/Sidebar.tsx';
import { StatusOverlay } from './components/StatusOverlay.tsx';
import AICommandCenter from './components/AICommandCenter.tsx';
import { useDroneSimulation } from './hooks/useDroneSimulation.ts';
import { useAIDemoOrchestrator } from './hooks/useAIDemoOrchestrator.ts';
import { enhancedAI } from './services/enhancedAIService.ts';
import { MissionLog, Survivor, AIInsight, AIPrediction } from './types.ts';

const App: React.FC = () => {
  const { 
    drones, survivors, metrics, moveDrones, simulateDetection, 
    completeIntervention, removeDrone, addDrone, addManualSurvivor,
    toggleManualControl, moveManualDrone, setDronePosition
  } = useDroneSimulation();

  const [logs, setLogs] = useState<MissionLog[]>([]);
  const [isAIThinking, setIsAIThinking] = useState(false);
  const [isAIAutopilot, setIsAIAutopilot] = useState(false);
  const [isSweeping, setIsSweeping] = useState(false);
  const [selectedDroneId, setSelectedDroneId] = useState<string | null>(null);
  const [notification, setNotification] = useState<string | null>(null);
  const [showDebrief, setShowDebrief] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [predictions, setPredictions] = useState<AIPrediction[]>([]);
  const [showAICenter, setShowAICenter] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isMapFullscreen, setIsMapFullscreen] = useState(false);

  const latestLogs = useRef(logs);
  const latestMetrics = useRef(metrics);
  const latestSurvivors = useRef(survivors);
  const latestDrones = useRef(drones);

  useEffect(() => { latestLogs.current = logs; }, [logs]);
  useEffect(() => { latestMetrics.current = metrics; }, [metrics]);
  useEffect(() => { latestSurvivors.current = survivors; }, [survivors]);
  useEffect(() => { latestDrones.current = drones; }, [drones]);

  const addLog = useCallback((message: string, type: MissionLog['type'] = 'info') => {
    setLogs(prev => [{
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toLocaleTimeString(),
      type,
      message
    }, ...prev].slice(0, 50));
  }, []);

  const { 
    runDemo, stopDemo, isDemoRunning, demoProgress, currentStepDescription 
  } = useAIDemoOrchestrator(drones, survivors, metrics, addLog, setInsights, setPredictions);

  useEffect(() => {
    if (isDemoRunning) setShowAICenter(true);
  }, [isDemoRunning]);

  const isAIBusy = useMemo(() => isAIThinking || isDemoRunning || isAIAutopilot, [isAIThinking, isDemoRunning, isAIAutopilot]);

  useEffect(() => {
    const interval = setInterval(() => {
      moveDrones();
      simulateDetection(addLog);
    }, 100);
    return () => clearInterval(interval);
  }, [moveDrones, simulateDetection, addLog]);

  const runIntelligenceSweep = useCallback(async () => {
    if (isDemoRunning) return;
    
    setIsSweeping(true);
    try {
      const dronePositions = latestDrones.current.map(d => ({ x: d.x, y: d.y, radius: 15 }));
      const newPreds = await enhancedAI.predictSurvivorLocations(latestSurvivors.current, dronePositions);
      
      if (newPreds && newPreds.length > 0) {
        setPredictions(newPreds);
        addLog(`AI ADVISORY: Intelligence mesh updated. ${newPreds.length} probability vectors identified.`, 'ai');
      }

      const newInsights = await enhancedAI.detectAnomalies(latestLogs.current, latestMetrics.current);
      if (newInsights && newInsights.length > 0) {
        setInsights(newInsights);
      }
    } catch (e) {
      console.error("Intelligence sweep failed", e);
      addLog(`AI ERROR: Analytical handshake failed.`, 'critical');
    } finally {
      setIsSweeping(false);
    }
  }, [isDemoRunning, addLog]);

  useEffect(() => {
    let aiInterval: any;
    if (showAICenter && !isDemoRunning) {
      runIntelligenceSweep();
      aiInterval = setInterval(() => {
        runIntelligenceSweep();
      }, 12000);
    }
    return () => {
      if (aiInterval) clearInterval(aiInterval);
    };
  }, [showAICenter, isDemoRunning, runIntelligenceSweep]);

  useEffect(() => {
    if (isAIAutopilot) {
      const reached = survivors.find(s => s.isReached && !s.isFriendly);
      if (reached) {
        addLog(`AI AUTO-RESOLVE: Verification for ${reached.id} confirmed. Dispatching extraction.`, 'ai');
        handleDeployLocation(reached);
      }
    }
  }, [survivors, isAIAutopilot, addLog]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isMapFullscreen) {
        setIsMapFullscreen(false);
        return;
      }
      if (!selectedDroneId) return;
      const drone = drones.find(d => d.id === selectedDroneId);
      if (!drone || !drone.isManualControl) return;
      if (e.key === 'ArrowUp') moveManualDrone(selectedDroneId, 'up');
      if (e.key === 'ArrowDown') moveManualDrone(selectedDroneId, 'down');
      if (e.key === 'ArrowLeft') moveManualDrone(selectedDroneId, 'left');
      if (e.key === 'ArrowRight') moveManualDrone(selectedDroneId, 'right');
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedDroneId, drones, moveManualDrone, isMapFullscreen]);

  const handleExportArchive = async () => {
    if (isExporting) return;
    
    if (typeof window.aistudio !== 'undefined') {
      const hasKey = await window.aistudio.hasSelectedApiKey();
      if (!hasKey) {
        await window.aistudio.openSelectKey();
        return;
      }
    }

    setIsExporting(true);
    addLog('Synthesizing post-mission intelligence report...', 'info');
    
    try {
      const reportContent = await enhancedAI.generateMissionReport(latestMetrics.current);
      const blob = new Blob([reportContent], { type: 'text/markdown;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `AEGIS_SAR_REPORT_${new Date().toISOString().replace(/[:.]/g, '-')}.md`;
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      }, 200);
      
      addLog('MISSION ARCHIVE: Report successfully generated and downloaded.', 'success');
      setNotification('ARCHIVE DOWNLOADED');
      setTimeout(() => setNotification(null), 3000);
    } catch (err) {
      console.error("Failed to export mission archive:", err);
      addLog('ARCHIVE ERROR: Failed to synthesize report.', 'critical');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeployLocation = (survivor: Survivor) => {
    completeIntervention(survivor.id);
    setNotification(`RESCUE OPS: DISPATCHED TO ${survivor.id}`);
    addLog(`RESCUE TASK FORCE DISPATCHED: ${survivor.id} is being secured.`, 'success');
    setTimeout(() => setNotification(null), 3000);
  };

  const sortedSurvivors = [...survivors].sort((a, b) => {
    if (a.isFriendly !== b.isFriendly) return a.isFriendly ? 1 : -1;
    if (a.isReached !== b.isReached) return a.isReached ? -1 : 1;
    if (a.signalType === 'SOS' && b.signalType !== 'SOS') return -1;
    return b.confidence - a.confidence;
  });

  return (
    <div className="flex h-screen w-full bg-[#020617] overflow-hidden text-slate-100 font-sans">
      {!isMapFullscreen && (
        <Sidebar 
          drones={drones} metrics={metrics} selectedDroneId={selectedDroneId} 
          onSelectDrone={setSelectedDroneId} onAddDrone={() => addDrone(addLog)}
          onRemoveDrone={(id) => removeDrone(id, addLog)}
          onExport={() => setShowDebrief(true)}
          onDownload={handleExportArchive}
          isExporting={isExporting}
          onToggleManual={(id) => toggleManualControl(id, addLog)}
          isDemoRunning={isDemoRunning}
          demoProgress={demoProgress}
          currentStepDescription={currentStepDescription}
          onStartDemo={runDemo}
          onStopDemo={stopDemo}
        />
      )}

      <main className={`flex-1 flex flex-col relative ${!isMapFullscreen ? 'border-x border-slate-800' : ''} h-full overflow-hidden transition-all duration-500`}>
        {!isMapFullscreen && (
          <header className="h-20 border-b border-slate-800 flex items-center justify-between px-8 bg-[#0a1120]/95 backdrop-blur-xl z-40 shrink-0">
            <div className="flex items-center gap-4">
              <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30">
                <ShieldAlert className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-xl font-black uppercase italic tracking-tighter leading-none">AEGIS <span className="text-blue-500">SWARM</span></h1>
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest mt-1 block">Tactical SAR Command</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsAIAutopilot(!isAIAutopilot)}
                className={`flex items-center gap-3 border px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                  isAIAutopilot ? 'bg-red-600 border-red-500 text-white shadow-xl shadow-red-900/40' : 'bg-slate-800/50 hover:bg-slate-700 text-slate-400 border-slate-700'
                }`}
              >
                <Cpu className={`w-4 h-4 ${isAIAutopilot ? 'animate-spin' : ''}`} />
                {isAIAutopilot ? 'AI AUTOPILOT: ON' : 'ENGAGE AUTOPILOT'}
              </button>
              <button 
                onClick={() => setShowAICenter(!showAICenter)} 
                className={`flex items-center gap-3 border px-6 py-3 rounded-2xl transition-all font-black text-[10px] uppercase tracking-widest ${
                  showAICenter ? 'bg-blue-600 border-blue-500 text-white shadow-xl shadow-blue-900/40' : 'bg-blue-600/10 hover:bg-blue-600/20 border-blue-500/30 text-blue-400'
                }`}
              >
                <BrainCircuit className={`w-4 h-4 ${isAIThinking || isSweeping ? 'animate-spin' : ''}`} />
                AEGIS_AI ANALYTICS
              </button>
            </div>
          </header>
        )}

        <div className="flex-1 flex overflow-hidden relative">
          <div className="flex-1 relative flex flex-col bg-[#020617] bg-dot-pattern min-w-0">
            <StatusOverlay 
              survivorsFound={metrics.survivorsFound} 
              activeDrones={metrics.activeDrones} 
              missionStartTime={metrics.missionStartTime}
              isFullscreen={isMapFullscreen}
            />
            
            {/* Fullscreen Toggle Button */}
            <button 
              onClick={() => setIsMapFullscreen(!isMapFullscreen)}
              className="absolute top-6 right-6 z-[45] p-4 bg-slate-900/80 backdrop-blur-md border border-slate-700 hover:border-blue-500 rounded-2xl text-blue-400 shadow-2xl transition-all group"
              title={isMapFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isMapFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5 group-hover:scale-110 transition-transform" />}
            </button>

            <TacticalMap 
              drones={drones} 
              survivors={survivors} 
              selectedDroneId={selectedDroneId}
              onSelectDrone={setSelectedDroneId} 
              onMapClick={(x, y) => addManualSurvivor(x, y, addLog)}
              onDeploy={handleDeployLocation}
            />
          </div>

          {showAICenter && !isMapFullscreen && (
            <div className="w-[450px] border-l border-slate-800 flex flex-col h-full animate-in slide-in-from-right duration-500 shrink-0">
              <AICommandCenter 
                predictions={predictions} 
                onRefresh={runIntelligenceSweep}
                isThinking={isAIThinking} 
                isSweeping={isSweeping}
              />
            </div>
          )}
          
          {notification && (
            <div className="fixed top-24 left-1/2 -translate-x-1/2 z-50 bg-blue-600 text-white px-10 py-4 rounded-[32px] font-black text-[10px] uppercase shadow-2xl animate-bounce flex items-center gap-3 border-4 border-blue-400/50">
              <ShieldCheck className="w-5 h-5" /> {notification}
            </div>
          )}

          {survivors.find(s => s.isReached && !s.isFriendly) && !isAIBusy && (
            <div className="fixed inset-0 z-50 bg-[#020617]/98 backdrop-blur-2xl flex items-center justify-center p-4">
              <div className="bg-[#0f172a] border border-blue-500/40 w-full max-w-sm rounded-[56px] p-10 shadow-2xl animate-in zoom-in-95 duration-500">
                <div className="w-16 h-16 bg-blue-600/20 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-blue-500/30">
                   <Navigation className="w-8 h-8 text-blue-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-black text-white uppercase text-center mb-6 tracking-tighter italic">Signal Lock Established</h2>
                <div className="space-y-6">
                  <div className="bg-black/60 p-6 rounded-[32px] border border-slate-800/80 mono text-xs text-center">
                    <p className="text-slate-500 mb-2 uppercase font-black text-[9px] tracking-[0.2em]">Target Identification</p>
                    <p className="text-white text-xl font-black mb-4 tracking-tight">{survivors.find(s => s.isReached && !s.isFriendly)?.id}</p>
                    <div className="h-[1px] w-full bg-slate-800 mb-4" />
                    <p className="text-blue-400 font-black flex items-center justify-center gap-2 italic text-[10px]">
                       ESTIMATED DEPTH: -{survivors.find(s => s.isReached && !s.isFriendly)?.depthEstimate}m
                    </p>
                  </div>
                  <button onClick={() => handleDeployLocation(survivors.find(s => s.isReached && !s.isFriendly)!)} className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-[32px] font-black uppercase text-xs flex items-center justify-center gap-4 transition-all shadow-xl active:scale-95">
                    <Send className="w-5 h-5" /> Confirm Extraction
                  </button>
                  <button onClick={() => completeIntervention(survivors.find(s => s.isReached && !s.isFriendly)!.id)} className="w-full text-slate-500 text-[10px] uppercase font-black hover:text-slate-300 transition-colors">Discard Signal</button>
                </div>
              </div>
            </div>
          )}
        </div>

        {!isMapFullscreen && (
          <div className="h-48 border-t border-slate-800 bg-[#0a1120]/95 backdrop-blur-2xl p-6 overflow-hidden flex gap-10 shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
            <div className="flex-1 flex flex-col gap-4 overflow-hidden border-r border-slate-800/50 pr-6">
              <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><FileText className="w-3.5 h-3.5" /> Operations Log</h3>
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
                {logs.map(log => (
                  <div key={log.id} className="text-[10px] mono flex gap-4 hover:bg-white/5 p-1.5 rounded-lg transition-colors group">
                    <span className="text-slate-600 shrink-0 font-bold">[{log.timestamp}]</span>
                    <span className={`uppercase font-black tracking-tight ${log.type === 'ai' ? 'text-blue-400' : log.type === 'critical' ? 'text-red-500' : log.type === 'success' ? 'text-green-500' : 'text-slate-500'}`}>{log.type}</span>
                    <span className="text-slate-300 group-hover:text-white transition-colors leading-relaxed">{log.message}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="w-80 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Activity className="w-3.5 h-3.5" /> Signal Monitor</h3>
                <span className="text-[8px] font-black text-blue-500/80 uppercase">Confidence</span>
              </div>
              <div className="flex-1 space-y-2 overflow-y-auto custom-scrollbar">
                {sortedSurvivors.map(s => (
                  <div key={s.id} className={`flex justify-between items-center bg-slate-900/40 p-3 rounded-2xl border transition-all ${s.isFriendly ? 'border-green-500/30 bg-green-900/5' : s.isReached ? 'border-blue-500/50 bg-blue-900/10' : s.signalType === 'SOS' ? 'border-red-900/50 bg-red-900/5' : 'border-slate-800'}`}>
                    <div className="flex flex-col gap-0.5">
                      <span className="text-[10px] font-black text-white mono leading-none">{s.id}</span>
                      <span className={`text-[7px] font-black uppercase tracking-tighter ${s.isFriendly ? 'text-green-400' : s.signalType === 'SOS' ? 'text-red-400' : 'text-slate-500'}`}>{s.isFriendly ? 'OFFICER' : s.signalType}_BAND</span>
                    </div>
                    <div className="flex flex-col items-end gap-1.5">
                      <div className="w-28 h-1 bg-slate-800 rounded-full overflow-hidden">
                        <div className={`h-full transition-all duration-1000 ${s.isFriendly ? 'bg-green-500' : s.isReached ? 'bg-blue-400' : s.signalType === 'SOS' ? 'bg-red-500' : 'bg-yellow-500'}`} style={{ width: `${s.confidence * 100}%` }} />
                      </div>
                      <span className="text-[8px] font-black mono text-slate-500">{Math.round(s.confidence * 100)}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {showDebrief && (
        <div className="fixed inset-0 z-[100] bg-black/98 flex items-center justify-center p-8 backdrop-blur-3xl animate-in fade-in duration-500">
          <div className="bg-[#0a1120] border border-slate-800 w-full max-w-6xl h-[92vh] rounded-[64px] overflow-hidden flex flex-col shadow-2xl relative">
            <div className="p-12 border-b border-slate-800 flex justify-between items-center bg-slate-900/40 shrink-0">
              <div className="flex items-center gap-6">
                 <div className="bg-blue-600 p-5 rounded-[28px] shadow-2xl shadow-blue-900/20"><FileText className="w-8 h-8 text-white" /></div>
                 <div>
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tighter leading-none">After Action Report</h2>
                    <p className="text-[11px] text-slate-500 font-bold mono mt-2 uppercase tracking-[0.4em]">AEGIS COMMAND // MISSION ARCHIVE</p>
                 </div>
              </div>
              <button onClick={() => setShowDebrief(false)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-full transition-all active:scale-90 shadow-lg"><X className="w-10 h-10 text-slate-400 hover:text-white" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-12 custom-scrollbar grid grid-cols-1 lg:grid-cols-2 gap-20">
              <div className="space-y-12">
                <div className="aspect-video bg-black rounded-[48px] border-[12px] border-slate-800/80 flex flex-col items-center justify-center relative overflow-hidden group shadow-2xl">
                  <div className="absolute inset-0 z-0 opacity-20 group-hover:opacity-40 transition-opacity duration-1000">
                       <TacticalMap drones={drones} survivors={survivors} selectedDroneId={null} onSelectDrone={()=>{}} onMapClick={()=>{}} onDeploy={()=>{}} />
                  </div>
                  <Video className="w-20 h-20 text-white/5 relative z-10" />
                  <div className="scanner-line" />
                </div>
                <div className="bg-slate-900/20 p-12 rounded-[56px] border border-slate-800/40">
                  <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-10 flex items-center gap-4"><Activity className="w-6 h-6 text-green-500" /> Success Metrics</h3>
                  <div className="grid grid-cols-2 gap-10">
                    <div className="p-8 bg-black/40 rounded-[40px] border border-white/5 text-center shadow-inner">
                      <p className="text-[11px] text-slate-500 uppercase font-black mb-4 tracking-widest">Lives Saved</p>
                      <p className="text-5xl font-black text-green-500 mono tracking-tighter">{metrics.survivorsSaved}</p>
                    </div>
                    <div className="p-8 bg-black/40 rounded-[40px] border border-white/5 text-center shadow-inner">
                      <p className="text-[11px] text-slate-500 uppercase font-black mb-4 tracking-widest">Total Savings</p>
                      <p className="text-4xl font-black text-blue-500 mono tracking-tighter">${metrics.costSavings.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-slate-900/20 p-12 rounded-[64px] border border-slate-800 flex flex-col h-full overflow-hidden shadow-2xl">
                <div className="flex-1 bg-black/80 rounded-[40px] p-10 font-mono text-[11px] text-slate-400 overflow-y-auto custom-scrollbar border border-white/5 shadow-inner leading-relaxed">
                  <p className="text-blue-500 mb-10 font-black uppercase tracking-[0.2em] flex items-center gap-3">
                    <Sparkles className="w-4 h-4 animate-pulse" /> // NEURAL_MISSION_LOG
                  </p>
                  <div className="space-y-6">
                    {logs.slice(0, 30).map(l => (
                      <div key={l.id} className="flex gap-6 opacity-70 border-l-2 border-slate-800 pl-6 py-0.5 group hover:opacity-100 transition-opacity">
                        <span className="text-slate-600 shrink-0 font-bold">[{l.timestamp}]</span>
                        <span className="text-slate-300">{l.message}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <button 
                  onClick={handleExportArchive} 
                  disabled={isExporting}
                  className={`mt-12 w-full ${isExporting ? 'bg-slate-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'} text-white py-8 rounded-[40px] font-black uppercase text-sm flex items-center justify-center gap-5 transition-all shadow-2xl active:scale-95 group shrink-0`}
                >
                  {isExporting ? (
                    <RefreshCw className="w-6 h-6 animate-spin" />
                  ) : (
                    <Download className="w-6 h-6 group-hover:animate-bounce" />
                  )}
                  {isExporting ? 'Synthesizing...' : 'Export Strategic Debrief'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
