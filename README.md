# junior-footy-game-rotations

Smart rotation management for Australian Rules Football. Plan, run, and analyze junior footy rotations with live timing, AI-enhanced suggestions, season tracking, and a simple drag-and-drop interface.

## Table of contents
- Overview
- Coach value-first: In-game features
- Other features
- Technical features & architecture
- Project structure
- Getting started
- Configuration
- Data & persistence
- Supabase Edge Functions (AI)
- Development tips
- Roadmap

## Overview
This app helps coaches manage on-field rotations for junior Australian Rules Football. It keeps accurate game time even if the app is backgrounded or the device is restarted, suggests interchanges, tracks season statistics, and supports planning and on-the-fly changes.

## Coach value-first: In-game features (ranked by impact)

1) Per-player Time on Ground (TOG) and Bench Time
- Live TOG per player and "time since last interchange" so you know who needs a rest or a run immediately.
- Clear indicators for current stint length to avoid overplaying.

2) Position Management with Drag-and-Drop
- Place players into field positions and move them between lines/zones quickly.
- Prevent conflicts and see who is currently on vs off at a glance.

3) Quick Interchange Execution
- One-tap execute flows from suggested or planned swaps.
- Smart hot-swap handling when a position is full.

4) Smart Auto-Rotation Suggestions (Client + Optional AI)
- Local Enhanced Rotation Engine balances equity, fatigue, and development.
- Optional Supabase AI layer adds rationale and context-sensitive recommendations.

5) Planned Interchanges (Ahead-of-time)
- Queue interchanges by priority and execute when the moment is right.
- Visual list with remove/execute controls.

6) Late Arrivals Handling
- Bring late players straight into the game with clean stat resets.
- Suggestions prioritize fair minutes for latecomers without disrupting structure.

7) Accurate, Resilient Game Clock
- Start/Pause/Next-Quarter controls with reliable timekeeping.
- Recovers from tab switches and minor interruptions, using a delta-based timer.

## Other features
- Season statistics and post-game summaries: per-player and per-position time, longest stints, rotation frequency, trends.
- AI coaching assistant (optional): context-aware tips for inclusivity, engagement, and fairness.
- Player insights (optional): concise per-player observations from time/usage.
- Award nominations (optional): end-of-game nomination prompts.
- Settings and customization: simple preferences across sessions.
- Works offline: state persists locally and continues after reloads.

## Technical features & architecture
- React + TypeScript + Vite + Tailwind (with shadcn-ui components)
- Resilient, delta-based game timer
  - The useGameState hook stores lastTickAt and updates time by real elapsed seconds (catch-up on mount, focus, and visibility changes).
- Local-first persistence
  - Game state and roster stored in localStorage with live sync across tabs via Storage events.
- Rotation engines
  - Enhanced client engine (src/utils/enhancedRotationEngine.ts) generates suggestions locally.
  - Optional AI layer (src/services/aiRotationService.ts) enriches the top suggestion via Supabase Edge Functions.
- Strong typing
  - Central domain types in src/types/sports.ts and src/types/autoRotation.ts.
- Modular UI
  - Key components include GameHeader, PositionSection, DraggablePlayer, AutoRotationSuggestions, PlannedInterchanges, SeasonStats, Settings, and Welcome.

### High-level data flow
- useGameState manages:
  - Players, active positions, timers, interchanges, and game lifecycle
  - Persisted to localStorage under gameState; roster under sport-rotation-players
- Game page renders layout, handles DnD, and wires suggestion execution
- AutoRotationSuggestions shows local suggestions and optionally calls AI for insights

## Project structure
```
src/
  components/
    AutoRotationSuggestions.tsx
    DraggablePlayer.tsx
    PositionSection.tsx
    PlannedInterchanges.tsx
    SeasonStats.tsx
    AddLateArrival.tsx
    AppHeader.tsx
    GameHeader.tsx
    ui/… (shadcn components)
  hooks/
    useGameState.ts  // game logic, timers, persistence, interchanges
  pages/
    Game.tsx, Settings.tsx, Welcome.tsx, NotFound.tsx
  services/
    aiRotationService.ts, aiPlayerInsightsService.ts, aiCoachingAssistantService.ts,
    aiAwardService.ts, aiSeasonAnalysisService.ts, feedbackService.ts
  utils/
    enhancedRotationEngine.ts, autoRotationEngine.ts, playerAnalytics.ts, seasonManager.ts, …
  types/
    sports.ts, autoRotation.ts
supabase/
  functions/
    ai-rotation-suggestions/, ai-player-insights/, ai-coaching-assistant/,
    ai-award-nominations/, ai-season-analysis/
```

## Getting started
Prerequisites: Node.js 18+ and npm

- Install: npm install
- Start dev server: npm run dev
- Build: npm run build
- Preview production build: npm run preview

Open the dev URL shown in your terminal. On first run, go to Welcome to set up your roster.

## Configuration
- Supabase (optional AI features)
  - A public URL and anon key are pre-configured in src/integrations/supabase/client.ts.
  - If you fork this project, update those values to your own Supabase project.

## Data & persistence
- LocalStorage keys
  - sport-rotation-players: persistent roster across games
  - gameState: current game-only state (timers, active players, planned interchanges, etc.)
- Timer behavior
  - lastTickAt is stored to compute real elapsed seconds on resume, focus, or visibility changes.
  - Quarter auto-pauses at 15 minutes.

## Supabase Edge Functions (AI)
- ai-rotation-suggestions: Enhances the top local suggestion with short tactical context.
- ai-player-insights, ai-coaching-assistant, ai-award-nominations, ai-season-analysis: Additional insights and season analysis endpoints.
- The UI gracefully falls back to standard logic if AI calls fail or are disabled.

## Development tips
- Source of truth is useGameState; keep UI components presentational where possible.
- Rotation suggestion logic lives in src/utils/enhancedRotationEngine.ts; adjust thresholds there.
- Multiple tabs stay in sync via the Storage event; device-to-device sync would require a backend.

## Roadmap
- Optional cloud sync for rosters and game state via authenticated profiles
- Export game reports (CSV/PDF)
- More configurable quarter length and coaching styles

