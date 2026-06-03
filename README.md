# Aegis Swarm — Tactical Survivor Triangulation Dashboard

A high-tech tactical dashboard for controlling a drone swarm that locates survivors by triggering ultra-low-power wake-up signals on mobile devices. Uses simulated TDOA (Time Difference of Arrival) logic and Gemini AI for strategic analysis.

## What it does

Aegis Swarm simulates a Search and Rescue (SAR) operation where a drone swarm autonomously triangulates survivor locations using mobile device wake-up signals. The tactical dashboard gives an operator real-time visibility into swarm positions, signal detections, and AI-generated mission analysis.

## How I built it

**Platform:** Google AI Studio (Gemini)

**My contribution:** I designed the system prompts that instruct Gemini to act as a tactical AI analyst — interpreting swarm sensor data and generating strategic recommendations for the operator. This involved:
- Prompting Gemini to reason over simulated TDOA signal data and swarm positions
- Iteratively refining prompts to produce structured, actionable tactical analysis
- Designing the output format so Gemini's analysis integrates cleanly into the dashboard UI

## How it works

**1. Swarm Deployment** — Drones are dispatched across a search zone via the tactical dashboard

**2. Signal Detection** — Drones trigger ultra-low-power wake-up signals on mobile devices in range; TDOA logic triangulates survivor positions from the time differences between drone detections

**3. Gemini Strategic Analysis** — Gemini processes the incoming signal and position data and generates real-time tactical recommendations — identifying high-priority zones, flagging signal clusters, and advising swarm repositioning

**4. Dashboard Output** — Operator sees live swarm positions, survivor triangulation results, and AI analysis in one unified interface

## Tech stack

- Google AI Studio (Gemini) — strategic analysis and tactical reasoning
- Prompt engineering — iterative prompt design for structured mission analysis output
- Node.js / React — tactical dashboard frontend
- Simulated TDOA logic — survivor triangulation engine

## Live demo

https://aegis-swarm-survivor-triangulation.vercel.app/

## Key prompt engineering decisions

- Role-based system prompt: Gemini instructed to reason as a SAR tactical analyst
- Structured output format so analysis renders directly in the dashboard
- Prompts designed to handle sparse signal data gracefully — Gemini flags uncertainty rather than hallucinating confident recommendations
- Iterative refinement to reduce verbose output and keep tactical summaries concise and actionable

## What I'd do differently

Replace rule-based TDOA simulation with a learned signal propagation model. For the AI layer, move from single-turn Gemini analysis to a stateful agentic loop — Gemini continuously re-evaluates as new signals arrive rather than analyzing snapshots. Would also explore replacing prompt-based reasoning with a fine-tuned model on SAR mission data for more domain-specific accuracy.
