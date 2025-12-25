/// <reference types="vite/client" />

import { GoogleGenerativeAI } from "@google/generative-ai";

export const GeminiService = {
  analyzeTacticalStateStream: async (prompt: string, onChunk: (text: string) => void): Promise<void> => {
    try {
      // 1. Correct Constructor: Use GoogleGenerativeAI (not GoogleGenAI)
      // 2. Vite Env: Use import.meta.env and VITE_ prefix
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      
      if (!apiKey) {
        throw new Error("VITE_GEMINI_API_KEY is not defined in .env.local");
      }

      const ai = new GoogleGenerativeAI(apiKey);

      // 3. Correct Model Name: 'gemini-3-flash-preview' is the latest for Dec 2025
      const model = ai.getGenerativeModel({ 
        model: 'gemini-1.5-flash-001',
        systemInstruction: `You are a military search and rescue AI specialist. 
          Use technical jargon like 'Multi-lateration', 'TDOA', and 'Phase-lock'.
          Provide concise, high-impact tactical recommendations based on swarm telemetry.`,
      });

      // 4. Correct Streaming Syntax: stream is an object containing 'stream' property
      const result = await model.generateContentStream(prompt);

      for await (const chunk of result.stream) {
        const chunkText = chunk.text(); // chunk.text is a function, not a property
        if (chunkText) {
          onChunk(chunkText);
        }
      }
    } catch (error) {
      console.error("Gemini streaming error:", error);
      onChunk("TACTICAL_LINK_ERR: Handshake failure. Retrying...");
    }
  }
};