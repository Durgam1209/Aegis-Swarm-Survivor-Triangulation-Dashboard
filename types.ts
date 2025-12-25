
export interface TrailPoint {
  x: number;
  y: number;
  opacity: number;
}

export interface Drone {
  id: string;
  x: number;
  y: number;
  status: 'searching' | 'triangulating' | 'intercepting' | 'offline' | 'manual';
  battery: number;
  altitude: number;
  signalsDetected: number;
  targetId?: string | null;
  rangeFinderNoise: number;
  receiverSignalStrength: number;
  trail: TrailPoint[];
  isManualControl?: boolean;
}

export interface Survivor {
  id: string;
  x: number;
  y: number;
  confidence: number;
  signalType: 'WUR' | 'LTE' | 'SOS';
  lastSeen: string;
  depthEstimate: number;
  classification: 'CIVILIAN' | 'OFFICER' | 'UNKNOWN';
  isFriendly: boolean;
  isSaving?: boolean;
  isReached?: boolean;
  isManual?: boolean;
}

export interface MissionLog {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'critical' | 'ai' | 'success';
  message: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'ai';
  content: string;
  time: Date;
}

export interface SwarmMetrics {
  activeDrones: number;
  coverage: number;
  survivorsFound: number;
  survivorsSaved: number;
  avgTriangulationAccuracy: number;
  missionStartTime: number;
  swarmReadiness: number;
  missionDurationSec: number;
  estimatedCost: number;
  traditionalCostEquivalent: number;
  costSavings: number;
}

export interface AIInsight {
  type: 'tactical' | 'prediction' | 'optimization' | 'alert' | 'strategy';
  priority: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  actionable: boolean;
  suggestedActions?: string[];
  confidence: number;
}

export interface AIPrediction {
  x: number;
  y: number;
  probability: number;
  reasoning: string;
}
