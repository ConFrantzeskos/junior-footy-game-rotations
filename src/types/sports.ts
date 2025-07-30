export interface Player {
  id: string;
  name: string;
  isActive: boolean;
  currentPosition: Position | null;
  lastInterchangeTime: number; // Total game time when player was last put on field
  timeStats: {
    forward: number;
    midfield: number;
    defense: number;
  };
  quarterStats: {
    [quarter: number]: {
      forward: number;
      midfield: number;
      defense: number;
    };
  };
}

export type Position = 'forward' | 'midfield' | 'defense';

export interface GameState {
  isPlaying: boolean;
  currentQuarter: number;
  quarterTime: number;
  totalTime: number;
  players: Player[];
  activePlayersByPosition: {
    forward: string[];
    midfield: string[];
    defense: string[];
  };
}