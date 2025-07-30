import { GameState, Player, Position } from "@/types/sports";
import { RotationSuggestion, RotationAnalysis } from "@/types/autoRotation";

export interface RotationHistory {
  playerId: string;
  action: 'in' | 'out';
  position: string;
  timestamp: number;
}

export interface RotationContext {
  recentHistory: RotationHistory[];
  quarterProgress: number;
  gamePhase: 'early' | 'mid' | 'late';
}

export class EnhancedRotationEngine {
  private gameState: GameState;
  private currentTime: number;
  private rotationHistory: RotationHistory[] = [];

  constructor(gameState: GameState, history: RotationHistory[] = []) {
    this.gameState = gameState;
    this.currentTime = gameState.totalTime;
    this.rotationHistory = history;
  }

  generateSuggestions(): RotationAnalysis {
    const context = this.buildContext();
    const allSuggestions: RotationSuggestion[] = [];

    // Unified intelligent scoring system
    const lateArrivalSuggestions = this.analyzeLateArrivals(context);
    const equitySuggestions = this.analyzeTimeEquity(context);
    const fatigueSuggestions = this.analyzeFatigue(context);
    const inclusionSuggestions = this.analyzeInclusion(context);
    const positionSuggestions = this.analyzePositionExperience(context);

    allSuggestions.push(...lateArrivalSuggestions, ...equitySuggestions, ...fatigueSuggestions, ...inclusionSuggestions, ...positionSuggestions);

    // Smart filtering to prevent flip-flopping
    const filteredSuggestions = this.applySmartFiltering(allSuggestions, context);

    // Unified scoring and ranking
    const rankedSuggestions = this.applyUnifiedScoring(filteredSuggestions, context);

    return {
      suggestions: rankedSuggestions.slice(0, 3), // Top 3 suggestions
      overallAssessment: this.generateAssessment(rankedSuggestions, context),
      nextReviewTime: this.calculateNextReviewTime(context)
    };
  }

  private buildContext(): RotationContext {
    const quarterProgress = this.gameState.quarterTime / (15 * 60); // Assuming 15-minute quarters
    const gamePhase = quarterProgress < 0.3 ? 'early' : quarterProgress < 0.7 ? 'mid' : 'late';
    
    return {
      recentHistory: this.rotationHistory.slice(-10), // Last 10 changes
      quarterProgress,
      gamePhase
    };
  }

  private analyzeLateArrivals(context: RotationContext): RotationSuggestion[] {
    const suggestions: RotationSuggestion[] = [];
    const positions = ['forward', 'midfield', 'defence'] as const;
    
    // Find players who haven't played at all (late arrivals)
    const lateArrivals = this.gameState.players.filter(p => 
      !this.isPlayerActive(p.id) && this.getTotalPlayTime(p) === 0
    );

    for (const lateArrival of lateArrivals) {
      // Find best position to substitute them into
      for (const position of positions) {
        const activePlayerIds = this.gameState.activePlayersByPosition[position] || [];
        
        // Find the player who has played the most in this position
        const mostPlayedPlayer = activePlayerIds
          .map(playerId => this.gameState.players.find(p => p.id === playerId))
          .filter(Boolean)
          .sort((a, b) => this.getCurrentStint(b!) - this.getCurrentStint(a!))[0];

        if (mostPlayedPlayer && this.getCurrentStint(mostPlayedPlayer) > 5 * 60) { // 5+ minutes
          suggestions.push({
            id: `late-arrival-${position}-${Date.now()}`,
            type: 'swap',
            priority: 'urgent',
            reasoning: `🔥 PRIORITY: ${lateArrival.name} just arrived and hasn't played yet - get them on field!`,
            playerIn: lateArrival.id,
            playerOut: mostPlayedPlayer.id,
            position,
            urgencyScore: 15, // Highest priority
            factors: ['late_arrival', 'inclusion', 'fairness']
          });
        }
      }
    }

    return suggestions;
  }

  private analyzeTimeEquity(context: RotationContext): RotationSuggestion[] {
    const suggestions: RotationSuggestion[] = [];
    const allPlayers = this.gameState.players;
    const positions = ['forward', 'midfield', 'defence'] as const;

    for (const position of positions) {
      const activePlayerIds = this.gameState.activePlayersByPosition[position] || [];
      const benchPlayers = allPlayers.filter(p => !this.isPlayerActive(p.id));

      // Find most overplayed active player
      const overplayedPlayer = activePlayerIds
        .map(playerId => allPlayers.find(p => p.id === playerId))
        .filter(Boolean)
        .sort((a, b) => this.getTotalPlayTime(b!) - this.getTotalPlayTime(a!))[0];

      // Find most underplayed bench player
      const underplayedPlayer = benchPlayers
        .sort((a, b) => this.getTotalPlayTime(a) - this.getTotalPlayTime(b))[0];

      if (overplayedPlayer && underplayedPlayer) {
        const timeDifference = this.getTotalPlayTime(overplayedPlayer) - this.getTotalPlayTime(underplayedPlayer);
        
        if (timeDifference > 120) { // 2 minutes difference
          suggestions.push({
            id: `equity-${position}-${Date.now()}`,
            type: 'swap',
            priority: timeDifference > 300 ? 'urgent' : 'recommended',
            reasoning: `Time equity: ${overplayedPlayer.name} has played ${Math.floor(timeDifference / 60)} minutes more than ${underplayedPlayer.name}`,
            playerIn: underplayedPlayer.id,
            playerOut: overplayedPlayer.id,
            position,
            urgencyScore: Math.min(10, timeDifference / 30),
            factors: ['time_equity', 'fairness']
          });
        }
      }
    }

    return suggestions;
  }

  private analyzeFatigue(context: RotationContext): RotationSuggestion[] {
    const suggestions: RotationSuggestion[] = [];
    const positions = ['forward', 'midfield', 'defence'] as const;
    const fatigueThreshold = context.gamePhase === 'late' ? 8 * 60 : 10 * 60; // More aggressive in late game

    for (const position of positions) {
      const activePlayerIds = this.gameState.activePlayersByPosition[position] || [];
      
      for (const playerId of activePlayerIds) {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) continue;

        const currentStint = this.getCurrentStint(player);
        
        if (currentStint > fatigueThreshold) {
          // Find fresh replacement
          const benchPlayers = this.gameState.players.filter(p => 
            !this.isPlayerActive(p.id) && this.getRestTime(p) > 3 * 60
          );
          
          const bestReplacement = benchPlayers
            .sort((a, b) => this.getRestTime(b) - this.getRestTime(a))[0];

          if (bestReplacement) {
            suggestions.push({
              id: `fatigue-${position}-${Date.now()}`,
              type: 'swap',
              priority: currentStint > 12 * 60 ? 'urgent' : 'recommended',
              reasoning: `${player.name} needs rest after ${Math.floor(currentStint / 60)} minutes on field`,
              playerIn: bestReplacement.id,
              playerOut: player.id,
              position,
              urgencyScore: Math.min(10, currentStint / 60),
              factors: ['fatigue', 'player_welfare']
            });
          }
        }
      }
    }

    return suggestions;
  }

  private analyzeInclusion(context: RotationContext): RotationSuggestion[] {
    const suggestions: RotationSuggestion[] = [];
    const benchPlayers = this.gameState.players.filter(p => !this.isPlayerActive(p.id));
    const positions = ['forward', 'midfield', 'defence'] as const;

    // Prioritize players who haven't played much
    const longestBenched = benchPlayers
      .sort((a, b) => this.getRestTime(b) - this.getRestTime(a))
      .slice(0, 2); // Top 2 longest benched

    for (const benchedPlayer of longestBenched) {
      if (this.getRestTime(benchedPlayer) > 5 * 60) { // Been off for 5+ minutes
        // Find best position to place them
        for (const position of positions) {
          const activePlayerIds = this.gameState.activePlayersByPosition[position] || [];
          const leastFreshPlayer = activePlayerIds
            .map(playerId => this.gameState.players.find(p => p.id === playerId))
            .filter(Boolean)
            .sort((a, b) => this.getCurrentStint(b!) - this.getCurrentStint(a!))[0];

          if (leastFreshPlayer && this.getCurrentStint(leastFreshPlayer) > 6 * 60) {
            suggestions.push({
              id: `inclusion-${position}-${Date.now()}`,
              type: 'swap',
              priority: 'recommended',
              reasoning: `Include ${benchedPlayer.name} who has been resting for ${Math.floor(this.getRestTime(benchedPlayer) / 60)} minutes`,
              playerIn: benchedPlayer.id,
              playerOut: leastFreshPlayer.id,
              position,
              urgencyScore: Math.min(8, this.getRestTime(benchedPlayer) / 60),
              factors: ['inclusion', 'rest_equity']
            });
            break; // Only suggest one position per benched player
          }
        }
      }
    }

    return suggestions;
  }

  private analyzePositionExperience(context: RotationContext): RotationSuggestion[] {
    const suggestions: RotationSuggestion[] = [];
    
    // Only suggest position changes in early-mid game and for development
    if (context.gamePhase === 'late') return suggestions;

    const positions = ['forward', 'midfield', 'defence'] as const;
    
    for (const position of positions) {
      const activePlayerIds = this.gameState.activePlayersByPosition[position] || [];
      
      for (const playerId of activePlayerIds) {
        const player = this.gameState.players.find(p => p.id === playerId);
        if (!player) continue;

        const positionTime = player.timeStats[position] || 0;
        const hasLimitedExperience = positionTime < 5 * 60; // Less than 5 minutes in this position
        const currentStint = this.getCurrentStint(player);
        
        if (hasLimitedExperience && currentStint > 6 * 60) {
          // Find a suitable player from another position who could benefit from this experience
          const otherPositions = positions.filter(p => p !== position);
          
          for (const otherPos of otherPositions) {
            const otherActivePlayerIds = this.gameState.activePlayersByPosition[otherPos] || [];
            const candidatePlayer = otherActivePlayerIds
              .map(id => this.gameState.players.find(p => p.id === id))
              .filter(Boolean)
              .find(p => (p!.timeStats[position] || 0) < positionTime);

            if (candidatePlayer) {
              suggestions.push({
                id: `experience-${position}-${Date.now()}`,
                type: 'swap',
                priority: 'optional',
                reasoning: `Give ${candidatePlayer.name} experience in ${position} position`,
                playerIn: candidatePlayer.id,
                playerOut: player.id,
                position,
                urgencyScore: 3,
                factors: ['position_experience', 'development']
              });
              break;
            }
          }
        }
      }
    }

    return suggestions;
  }

  private applySmartFiltering(suggestions: RotationSuggestion[], context: RotationContext): RotationSuggestion[] {
    // Remove suggestions that contradict recent history
    const filtered = suggestions.filter(suggestion => {
      if (!suggestion.playerIn || !suggestion.playerOut) return true;

      // Check if we recently made the opposite move
      const recentOpposite = context.recentHistory.find(h => 
        h.playerId === suggestion.playerIn && 
        h.action === 'out' && 
        h.position === suggestion.position &&
        (this.currentTime - h.timestamp) < 2 * 60 // Within last 2 minutes
      );

      if (recentOpposite) {
        console.log(`Filtered out flip-flop suggestion for ${suggestion.playerIn}`);
        return false;
      }

      return true;
    });

    // Remove duplicate suggestions for the same player
    const seen = new Set();
    return filtered.filter(suggestion => {
      const key = `${suggestion.playerIn}-${suggestion.playerOut}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private applyUnifiedScoring(suggestions: RotationSuggestion[], context: RotationContext): RotationSuggestion[] {
    return suggestions
      .map(suggestion => {
        let score = suggestion.urgencyScore;

        // HIGHEST PRIORITY: Late arrivals who haven't played
        if (suggestion.factors.includes('late_arrival')) {
          score += 10; // Massive boost
        }

        // Boost equity-based suggestions
        if (suggestion.factors.includes('time_equity')) {
          score += 3;
        }

        // Boost fatigue suggestions in late game
        if (suggestion.factors.includes('fatigue') && context.gamePhase === 'late') {
          score += 2;
        }

        // Boost inclusion suggestions for long-benched players
        if (suggestion.factors.includes('inclusion')) {
          score += 1;
        }

        return { ...suggestion, urgencyScore: score };
      })
      .sort((a, b) => b.urgencyScore - a.urgencyScore);
  }

  private generateAssessment(suggestions: RotationSuggestion[], context: RotationContext): string {
    if (suggestions.length === 0) {
      return "Current rotations look good. Continue monitoring player fatigue and time equity.";
    }

    const urgentCount = suggestions.filter(s => s.priority === 'urgent').length;
    const equityIssues = suggestions.filter(s => s.factors.includes('time_equity')).length;
    const fatigueIssues = suggestions.filter(s => s.factors.includes('fatigue')).length;

    if (urgentCount > 0) {
      return `${urgentCount} urgent rotation(s) needed - address player fatigue and time equity immediately.`;
    } else if (equityIssues > 0) {
      return `Focus on time equity: ${equityIssues} player(s) need more balanced playing time.`;
    } else if (fatigueIssues > 0) {
      return `Monitor player fatigue: ${fatigueIssues} player(s) could benefit from rest.`;
    } else {
      return "Good rotation opportunities available for player development.";
    }
  }

  private calculateNextReviewTime(context: RotationContext): number {
    // More frequent reviews in late game or when urgent issues exist
    if (context.gamePhase === 'late') return 30; // 30 seconds
    if (context.gamePhase === 'mid') return 60; // 1 minute
    return 90; // 1.5 minutes for early game
  }

  // Helper methods
  private isPlayerActive(playerId: string): boolean {
    return Object.values(this.gameState.activePlayersByPosition)
      .flat()
      .includes(playerId);
  }

  private getTotalPlayTime(player: Player): number {
    const timeStats = player.timeStats || { forward: 0, midfield: 0, defence: 0 };
    return timeStats.forward + timeStats.midfield + timeStats.defence;
  }

  private getRestTime(player: Player): number {
    if (player.isActive) return 0;
    return this.currentTime - player.lastInterchangeTime;
  }

  private getCurrentStint(player: Player): number {
    if (!player.isActive) return 0;
    return this.currentTime - player.lastInterchangeTime;
  }

  // Public method to add to rotation history
  addToHistory(playerId: string, action: 'in' | 'out', position: string): void {
    this.rotationHistory.push({
      playerId,
      action,
      position,
      timestamp: this.currentTime
    });

    // Keep only last 20 entries
    if (this.rotationHistory.length > 20) {
      this.rotationHistory = this.rotationHistory.slice(-20);
    }
  }
}

// Factory function for easy use
export function generateEnhancedRotationSuggestions(
  gameState: GameState, 
  history: RotationHistory[] = []
): RotationAnalysis {
  const engine = new EnhancedRotationEngine(gameState, history);
  return engine.generateSuggestions();
}
