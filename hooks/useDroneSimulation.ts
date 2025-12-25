
import { useState, useCallback, useEffect } from 'react';
import { Drone, Survivor, SwarmMetrics } from '../types.ts';

const MAX_TRAIL_LENGTH = 15;
const SCAN_RADIUS = 12; 
const DETECTION_GAIN_BASE = 0.025;
const MANUAL_STEP = 1.5;

// Mission Economics Constants
const COST_PER_DRONE_HOUR = 0.85;  // Electricity + Wear
const HELICOPTER_COST_PER_HOUR = 2500; // Standard SAR Helicopter rate

const calculateSignalStrength = (drone: { x: number, y: number }, survivor: Survivor) => {
  const distance = Math.sqrt(Math.pow(drone.x - survivor.x, 2) + Math.pow(drone.y - survivor.y, 2));
  const normalizedDist = Math.max(0.1, distance); 
  const frequency = 2400; 
  const pathLoss = 20 * Math.log10(normalizedDist) + 20 * Math.log10(frequency) + 32.44;
  const signalStrength = 145 - pathLoss;
  
  return {
    strength: Math.max(0, Math.min(100, signalStrength)),
    distance
  };
};

const createDrone = (id: string, x: number, y: number): Drone => ({
  id,
  x,
  y,
  status: 'searching',
  battery: 98 + Math.random() * 2,
  altitude: 35 + Math.random() * 20,
  signalsDetected: 0,
  rangeFinderNoise: Math.random() * 0.1,
  receiverSignalStrength: 0,
  trail: [],
  isManualControl: false,
});

const generateLatentSurvivor = (idSuffix: string, isFriendly: boolean = false): Survivor => ({
  id: isFriendly ? `BFT-${idSuffix}` : `SIG-${idSuffix}-${Math.random().toString(36).substr(2, 2).toUpperCase()}`,
  x: 10 + Math.random() * 80, // Map bounds 0-100, survivors 10-90 for safety
  y: 10 + Math.random() * 80,
  confidence: isFriendly ? 1.0 : 0.02, 
  signalType: isFriendly ? 'LTE' : (Math.random() > 0.7 ? 'SOS' : (Math.random() > 0.5 ? 'WUR' : 'LTE')),
  lastSeen: new Date().toISOString(),
  depthEstimate: Number((0.5 + Math.random() * 1.5).toFixed(1)),
  classification: isFriendly ? 'OFFICER' : 'CIVILIAN',
  isFriendly,
  isReached: isFriendly
});

export const useDroneSimulation = () => {
  const [drones, setDrones] = useState<Drone[]>([]);
  const [survivors, setSurvivors] = useState<Survivor[]>([]);
  const [metrics, setMetrics] = useState<SwarmMetrics>({
    activeDrones: 0,
    coverage: 0,
    survivorsFound: 0,
    survivorsSaved: 0,
    avgTriangulationAccuracy: 0.2,
    missionStartTime: Date.now(),
    swarmReadiness: 100,
    missionDurationSec: 0,
    estimatedCost: 0,
    traditionalCostEquivalent: 0,
    costSavings: 0
  });

  // Initialize swarm and signals
  useEffect(() => {
    const initialDrones = [
      createDrone('ALPHA-01', 10, 10),
      createDrone('ALPHA-02', 90, 10),
      createDrone('BETA-01', 50, 90),
      createDrone('BETA-02', 10, 90),
    ];
    const initialSurvivors = [
      generateLatentSurvivor('P1'),
      generateLatentSurvivor('P2'),
      generateLatentSurvivor('P3'),
      generateLatentSurvivor('P4'),
      generateLatentSurvivor('P5'),
      generateLatentSurvivor('CMD-01', true), // Blue Force Tracker officer
    ];
    setDrones(initialDrones);
    setSurvivors(initialSurvivors);
  }, []);

  // Operational Cost & Duration Real-time Tracker
  useEffect(() => {
    const costInterval = setInterval(() => {
      setMetrics(prev => {
        const durationSec = Math.floor((Date.now() - prev.missionStartTime) / 1000);
        const durationHours = durationSec / 3600;
        
        const swarmCost = prev.activeDrones * COST_PER_DRONE_HOUR * durationHours;
        const traditionalCost = HELICOPTER_COST_PER_HOUR * durationHours;

        return {
          ...prev,
          missionDurationSec: durationSec,
          estimatedCost: Number(swarmCost.toFixed(2)),
          traditionalCostEquivalent: Number(traditionalCost.toFixed(2)),
          costSavings: Number((traditionalCost - swarmCost).toFixed(2))
        };
      });
    }, 1000);

    return () => clearInterval(costInterval);
  }, []);

  const addDrone = useCallback((addLog: (m: string, t?: any) => void) => {
    const newId = `DELTA-${drones.length + 1}`;
    setDrones(prev => [...prev, createDrone(newId, 50, 50)]);
    addLog(`NETWORK: Unit ${newId} synchronized. Search grid expanded.`, 'info');
  }, [drones.length]);

  const removeDrone = useCallback((id: string, addLog: (m: string, t?: any) => void) => {
    setDrones(prev => prev.filter(d => d.id !== id));
    addLog(`DECOMMISSION: Unit ${id} offline.`, 'warning');
  }, []);

  const setDronePosition = useCallback((id: string, x: number, y: number) => {
    setDrones(prev => prev.map(d => d.id === id ? { ...d, x: Math.max(0, Math.min(100, x)), y: Math.max(0, Math.min(100, y)) } : d));
  }, []);

  const toggleManualControl = useCallback((id: string, addLog: (m: string, t?: any) => void) => {
    setDrones(prev => prev.map(d => {
      if (d.id === id) {
        const newState = !d.isManualControl;
        addLog(`CONTROL: Unit ${id} ${newState ? 'switched to MANUAL OVERRIDE' : 'returned to AUTONOMOUS patrol'}.`, newState ? 'warning' : 'info');
        return { ...d, isManualControl: newState, status: newState ? 'manual' : 'searching' };
      }
      return d;
    }));
  }, []);

  const moveManualDrone = useCallback((id: string, direction: 'up' | 'down' | 'left' | 'right') => {
    setDrones(prev => prev.map(d => {
      if (d.id === id && d.isManualControl) {
        let nx = d.x;
        let ny = d.y;
        if (direction === 'up') ny -= MANUAL_STEP;
        if (direction === 'down') ny += MANUAL_STEP;
        if (direction === 'left') nx -= MANUAL_STEP;
        if (direction === 'right') nx += MANUAL_STEP;
        
        return {
          ...d,
          x: Math.max(2, Math.min(98, nx)),
          y: Math.max(2, Math.min(98, ny))
        };
      }
      return d;
    }));
  }, []);

  const addManualSurvivor = useCallback((x: number, y: number, addLog: (m: string, t?: any) => void) => {
    const safeX = Math.max(5, Math.min(95, x));
    const safeY = Math.max(5, Math.min(95, y));
    const newS = { ...generateLatentSurvivor('USR'), x: safeX, y: safeY, confidence: 0.15 };
    setSurvivors(prev => [...prev, newS]);
    addLog(`SIGNAL ACQUIRED: Target logged at [${safeX.toFixed(0)}, ${safeY.toFixed(0)}]`, 'success');
  }, []);

  const moveDrones = useCallback(() => {
    setDrones(prev => prev.map(drone => {
      if (drone.isManualControl) {
        const newTrail = [{ x: drone.x, y: drone.y, opacity: 1 }, ...drone.trail]
          .map(t => ({ ...t, opacity: t.opacity * 0.82 }))
          .slice(0, MAX_TRAIL_LENGTH);
        return { ...drone, trail: newTrail, battery: Math.max(0, drone.battery - 0.012) };
      }

      // Targeting: Only civilian signals with sufficient confidence
      const target = survivors.find(s => !s.isReached && !s.isFriendly && s.confidence > 0.45);
      let dx = 0, dy = 0;
      const step = 0.85;

      if (target) {
        const dist = Math.sqrt(Math.pow(target.x - drone.x, 2) + Math.pow(target.y - drone.y, 2));
        if (dist > 1.2) {
          dx = (target.x - drone.x) / dist * step;
          dy = (target.y - drone.y) / dist * step;
        }
      } else {
        const time = Date.now() / 5000;
        const droneIndex = drones.findIndex(d => d.id === drone.id);
        const phase = droneIndex * (Math.PI / 2);
        const fx = 0.7 + (droneIndex * 0.1);
        const fy = 1.1 + (droneIndex * 0.05);
        const targetX = 50 + Math.sin(time * fx + phase) * 45;
        const targetY = 50 + Math.cos(time * fy + phase) * 45;
        const dist = Math.sqrt(Math.pow(targetX - drone.x, 2) + Math.pow(targetY - drone.y, 2));
        if (dist > 0.5) {
          dx = (targetX - drone.x) / dist * step;
          dy = (targetY - drone.y) / dist * step;
        }
      }
      
      const newTrail = [{ x: drone.x, y: drone.y, opacity: 1 }, ...drone.trail]
        .map(t => ({ ...t, opacity: t.opacity * 0.82 }))
        .slice(0, MAX_TRAIL_LENGTH);

      const newAlt = Math.max(20, Math.min(100, drone.altitude + (Math.random() - 0.5) * 0.5));

      return {
        ...drone,
        x: Math.max(2, Math.min(98, drone.x + dx)),
        y: Math.max(2, Math.min(98, drone.y + dy)),
        trail: newTrail,
        battery: Math.max(0, drone.battery - 0.008),
        altitude: newAlt,
        status: target ? 'triangulating' : 'searching'
      };
    }));
  }, [survivors, drones.length]);

  const simulateDetection = useCallback((addLog: (m: string, t?: any) => void) => {
    setSurvivors(prev => {
      return prev.map(s => {
        if (s.isFriendly) return s;

        let maxLocalStrength = 0;
        let activeScanners = 0;

        drones.forEach(d => {
          const { strength, distance } = calculateSignalStrength(d, s);
          if (distance < SCAN_RADIUS) {
            if (strength > maxLocalStrength) maxLocalStrength = strength;
            activeScanners++;
          }
        });

        const updated = { ...s };
        
        if (activeScanners > 0) {
          const gain = (maxLocalStrength / 1000) * DETECTION_GAIN_BASE + (activeScanners * 0.012);
          updated.confidence = Math.min(1, updated.confidence + gain);
        } else {
          updated.confidence = Math.max(0.02, updated.confidence - 0.0015);
        }

        const minProx = Math.min(...drones.map(d => Math.sqrt(Math.pow(d.x - s.x, 2) + Math.pow(d.y - s.y, 2))));
        if (minProx < 3.5 && updated.confidence > 0.92 && !updated.isReached) {
          updated.isReached = true;
          addLog(`PHASE-LOCK: Verification for ${s.id} complete. Sector localized.`, 'critical');
        }
        return updated;
      });
    });

    setMetrics(m => {
      const avgBattery = drones.length > 0 ? drones.reduce((acc, d) => acc + d.battery, 0) / drones.length : 0;
      return {
        ...m,
        coverage: Math.min(100, m.coverage + 0.05),
        survivorsFound: survivors.filter(s => s.confidence > 0.45 && !s.isFriendly).length,
        activeDrones: drones.length,
        swarmReadiness: Math.round(avgBattery)
      };
    });
  }, [drones, survivors]);

  const completeIntervention = useCallback((id: string) => {
    setSurvivors(prev => prev.filter(s => s.id !== id));
    setMetrics(m => ({ ...m, survivorsSaved: m.survivorsSaved + 1 }));
  }, []);

  return { 
    drones, survivors, metrics, moveDrones, simulateDetection, 
    completeIntervention, removeDrone, addDrone, addManualSurvivor,
    toggleManualControl, moveManualDrone, setDronePosition
  };
};
