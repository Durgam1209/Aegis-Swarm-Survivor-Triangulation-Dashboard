import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { Drone, Survivor, SwarmMetrics, AIInsight, AIPrediction } from '../types';

// --- CONFIGURATION ---
const MODEL_NAME = "gemini-1.5-flash"; 

/**
 * Enhanced AI Service for Aegis Swarm.
 * Converted to @google/generative-ai for standard Web/Vite environments.
 */
export class EnhancedAIService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    // Vite requires import.meta.env for environment variable access
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || "";
    if (!apiKey) console.warn("VITE_GEMINI_API_KEY is missing. AI features will fail.");
    this.genAI = new GoogleGenerativeAI(apiKey);
  }

  /** Centralized Helper to get model instance with specific config */
  private getModel(systemInstruction?: string, schema?: any) {
    return this.genAI.getGenerativeModel({
      model: MODEL_NAME,
      systemInstruction: systemInstruction,
      generationConfig: schema ? {
        responseMimeType: "application/json",
        responseSchema: schema
      } : undefined
    });
  }

  /** 1. Predict likely undiscovered survivor locations */
  async predictSurvivorLocations(
    knownSurvivors: Survivor[],
    searchedAreas: Array<{ x: number, y: number, radius: number }>
  ): Promise<AIPrediction[]> {
    // Define Schema using SchemaType enum
    const schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          x: { type: SchemaType.NUMBER },
          y: { type: SchemaType.NUMBER },
          probability: { type: SchemaType.NUMBER },
          reasoning: { type: SchemaType.STRING },
        },
        required: ['x', 'y', 'probability', 'reasoning']
      }
    };

    const model = this.getModel(undefined, schema);
    const prompt = `Based on current signals ${JSON.stringify(knownSurvivors.map(s => ({id:s.id, x:s.x, y:s.y, conf:s.confidence})))} and the drone swarm coverage ${JSON.stringify(searchedAreas)}, predict 3 NEW undiscovered survivor locations. Prioritize unexplored gaps. Seed: ${Date.now()}.`;
    
    try {
      const result = await model.generateContent(prompt);
      // SDK v0.21.0 uses .text() as a method
      const text = result.response.text();
      return JSON.parse(text || '[]');
    } catch (e) {
      console.error("AI Prediction failure, using fallback", e);
      return [
        { x: 20 + Math.random() * 20, y: 60 + Math.random() * 30, probability: 0.6, reasoning: "Fallback: Signal shadowing in SW quad." },
        { x: 70 + Math.random() * 20, y: 10 + Math.random() * 20, probability: 0.4, reasoning: "Fallback: Latent signal northern ridge." },
        { x: 40 + Math.random() * 20, y: 40 + Math.random() * 20, probability: 0.8, reasoning: "Fallback: TDOA handshake node 01-04." }
      ];
    }
  }

  /** 2. Analyze mission logs and metrics for anomalies */
  async detectAnomalies(logs: any[], metrics: SwarmMetrics): Promise<AIInsight[]> {
    const schema = {
      type: SchemaType.ARRAY,
      items: {
        type: SchemaType.OBJECT,
        properties: {
          type: { type: SchemaType.STRING },
          priority: { type: SchemaType.STRING },
          message: { type: SchemaType.STRING },
          actionable: { type: SchemaType.BOOLEAN },
          confidence: { type: SchemaType.NUMBER }
        },
        required: ['type', 'priority', 'message', 'actionable', 'confidence']
      }
    };

    const model = this.getModel(undefined, schema);
    const prompt = `Analyze mission metrics ${JSON.stringify(metrics)}. Identify 3 strategic anomalies. Include specific values like "Efficiency: 82%". Output JSON.`;
    
    try {
      const result = await model.generateContent(prompt);
      return JSON.parse(result.response.text() || '[]');
    } catch (e) {
      console.error("Anomaly Detection Error", e);
      return [];
    }
  }

  /** 3. Generate a formal mission report */
  async generateMissionReport(metrics: SwarmMetrics): Promise<string> {
    const model = this.getModel("Write a professional SAR report in Markdown.");
    const prompt = `Create SAR Mission report: ${JSON.stringify(metrics)}`;
    
    try {
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (e) {
      return "ERROR: Uplink failure.";
    }
  }

  /** 4. Streaming Tactical Updates */
  async streamTacticalAdvice(metrics: SwarmMetrics, onChunk: (text: string) => void): Promise<void> {
    const model = this.getModel("Provide a high-intensity 1-sentence tactical update.");
    const prompt = `Update operator on swarm efficiency: ${metrics.swarmReadiness}%`;

    try {
      const result = await model.generateContentStream(prompt);
      // Stream chunks for real-time UI updates
      for await (const chunk of result.stream) {
        const chunkText = chunk.text();
        if (chunkText) onChunk(chunkText);
      }
    } catch (e) {
      console.error("Streaming error", e);
      onChunk("UPLINK_ERR");
    }
  }
}

export const enhancedAI = new EnhancedAIService();