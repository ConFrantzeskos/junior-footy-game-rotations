# Junior Footy Game Rotations

Smart rotation management for Australian Rules Football. Plan, run, and analyze junior footy rotations with live timing, AI-enhanced suggestions, season tracking, and a simple drag-and-drop interface.

## Table of contents
- Overview
- Key features (coach-friendly)
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

## Key features (coach-friendly)
- Live game clock with automatic catch-up
  - Time keeps running based on when the quarter started, even if you close the app or switch devices. The quarter auto-pauses at 15:00.
- Drag-and-drop player management
  - Move players between Forwards, Midfielders, Defenders, and the Interchange bench. Hot-swap when a line is full.
- Auto rotation suggestions
  - Data-driven suggestions considering fatigue, fairness, position fit, rest time, and inclusion. Bench/late-arrival prompts appear quickly when relevant.
- AI-enhanced tactical insight (optional)
  - Uses Supabase Edge Functions to add brief tactical insights to the top suggestion.
- Planned interchanges
  - Queue up interchanges with priorities and execute them in one tap.
- Late arrivals
  - Add players who turn up after the bounce; they’ll be considered in auto-suggestions.
- Season statistics
  - Complete a game to record per-player and per-position time, longest stints, rotation frequency, trends, and more.
- Awards & insights
  - AI award nominations and player insights available via Edge Functions.
- Works offline
  - Everything you do during a game persists locally and continues if the tab reloads.

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

