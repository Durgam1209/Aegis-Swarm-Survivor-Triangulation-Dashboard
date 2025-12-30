
// Added React to imports to resolve namespace errors
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { enhancedAI } from '../services/enhancedAIService.ts';
import { Drone, Survivor, SwarmMetrics, MissionLog, AIPrediction, AIInsight } from '../types.ts';

interface DemoStep {
  delay: number;
  action: () => Promise<void>;
  description: string;
}

export const useAIDemoOrchestrator = (
  drones: Drone[],
  survivors: Survivor[],
  metrics: SwarmMetrics,
  addLog: (message: string, type?: MissionLog['type']) => void,
  setInsights: React.Dispatch<React.SetStateAction<AIInsight[]>>,
  setPredictions: React.Dispatch<React.SetStateAction<AIPrediction[]>>
) => {
  const [isDemoRunning, setIsDemoRunning] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [demoProgress, setDemoProgress] = useState(0);
  const abortControllerRef = useRef<boolean>(false);

  // Keep latest state in refs to avoid stale closures during the async demo loop
  const dronesRef = useRef(drones);
  const survivorsRef = useRef(survivors);
  const metricsRef = useRef(metrics);

  useEffect(() => { dronesRef.current = drones; }, [drones]);
  useEffect(() => { survivorsRef.current = survivors; }, [survivors]);
  useEffect(() => { metricsRef.current = metrics; }, [metrics]);

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const demoScenario: DemoStep[] = [
    {
      delay: 500,
      description: "🚀 Initializing Swarm autonomous deployment protocol",
      action: async () => {
        addLog('AEGIS SWARM AI DEMONSTRATION INITIATED', 'critical');
        await sleep(1000);
        addLog(`✓ MESH NETWORK: ${dronesRef.current.length} nodes verified.`, 'success');
      }
    },
    {
      delay: 1500,
      description: "🔍 AI: Scanning for unsearched structural voids",
      action: async () => {
        addLog('━━━ AI PREDICTIVE SCANNING ━━━', 'ai');
        const dronePositions = dronesRef.current.map(d => ({ x: d.x, y: d.y, radius: 15 }));
        const preds = await enhancedAI.predictSurvivorLocations(survivorsRef.current, dronePositions);
        setPredictions(preds);
        if (preds.length > 0) {
          addLog(`AI identified ${preds.length} high-probability signal sources.`, 'ai');
        }
      }
    },
    {
      delay: 2000,
      description: "🤖 Recalculating swarm formation for maximum TDOA accuracy",
      action: async () => {
        addLog('━━━ TACTICAL OPTIMIZATION ━━━', 'ai');
        const tacticalInsights = await enhancedAI.detectAnomalies([], metricsRef.current);
        setInsights(tacticalInsights);
        addLog('SWARM: Re-routing nodes to cover predictive voids.', 'success');
      }
    }
  ];

  const runDemo = useCallback(async () => {
    if (isDemoRunning) return;
    setIsDemoRunning(true);
    abortControllerRef.current = false;
    setDemoProgress(0);

    try {
      for (let i = 0; i < demoScenario.length; i++) {
        if (abortControllerRef.current) break;
        setCurrentStep(i);
        setDemoProgress(((i + 1) / demoScenario.length) * 100);
        await demoScenario[i].action();
        await sleep(demoScenario[i].delay);
      }
      if (!abortControllerRef.current) addLog('DEMONSTRATION SEQUENCE COMPLETED', 'success');
    } catch (error) {
      console.error('Demo error:', error);
    } finally {
      setIsDemoRunning(false);
      setDemoProgress(0);
    }
  }, [isDemoRunning, addLog, setInsights, setPredictions]);

  const stopDemo = useCallback(() => {
    abortControllerRef.current = true;
    setIsDemoRunning(false);
    addLog('MISSION SIMULATION ABORTED', 'warning');
  }, [addLog]);

  return { 
    runDemo, stopDemo, isDemoRunning, currentStep, demoProgress, 
    currentStepDescription: isDemoRunning ? demoScenario[currentStep]?.description : 'Mission Simulation Idle'
  };
};
