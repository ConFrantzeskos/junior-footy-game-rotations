import { Player, Position, GameState } from '@/types/sports';
import { RotationSuggestion, RotationAnalysis } from '@/types/autoRotation';

export class AutoRotationEngine {
  private gameState: GameState;
  private currentTime: number;

  constructor(gameState: GameState) {
    this.gameState = gameState;
    this.currentTime = gameState.totalTime;
  }

  /**
   * Simple Smart Rotation Logic:
   * 1. Priority: Get bench players onto the field
   * 2. Keep kids fresh and impactful
   * 3. Give position rotation experience
   */
  generateSuggestions(): RotationAnalysis {
    const suggestions: RotationSuggestion[] = [];
    
    // PRIORITY 1: Get bench kids onto the field
    const benchToFieldSuggestions = this.analyzeBenchToField();
    suggestions.push(...benchToFieldSuggestions);
    
    // PRIORITY 2: Keep kids fresh (rest tired players)
    const freshnessSuggestions = this.analyzeFreshness();
    suggestions.push(...freshnessSuggestions);
    
    // PRIORITY 3: Position rotation for experience
    const positionRotationSuggestions = this.analyzePositionRotation();
    suggestions.push(...positionRotationSuggestions);

    // Remove duplicates and sort by priority
    const uniqueSuggestions = this.deduplicateSuggestions(suggestions);
    uniqueSuggestions.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // Keep top 4 suggestions for simplicity
    const topSuggestions = uniqueSuggestions.slice(0, 4);

    return {
      suggestions: topSuggestions,
      overallAssessment: this.generateSimpleAssessment(topSuggestions),
      nextReviewTime: 3 * 60, // Review every 3 minutes
    };
  }

  /**
   * PRIORITY 1: Get bench players onto the field
   */
  private analyzeBenchToField(): RotationSuggestion[] {
    const suggestions: RotationSuggestion[] = [];
    const benchPlayers = this.gameState.players.filter(p => !p.isActive);
    const positions: Position[] = ['forward', 'midfield', 'defence'];
    
    // For each bench player, find if they can replace someone on field
    benchPlayers.forEach(benchPlayer => {
      const bestSwap = this.findBestSwapForBenchPlayer(benchPlayer, positions);
      if (bestSwap) {
        suggestions.push({
          id: `bench-to-field-${benchPlayer.id}-${Date.now()}`,
          type: 'swap',
          priority: 'recommended',
          reasoning: `Get ${benchPlayer.name} on field - ${this.getMinutesFormat(this.getRestTime(benchPlayer))} rest`,
          playerIn: benchPlayer.id,
          playerOut: bestSwap.playerId,
          position: bestSwap.position,
          urgencyScore: 80 + Math.floor(this.getRestTime(benchPlayer) / 60), // High priority
          factors: ['Bench player needs game time', 'Fresh legs available'],
        });
      }
    });

    return suggestions;
  }

  /**
   * PRIORITY 2: Keep kids fresh and impactful
   */
  private analyzeFreshness(): RotationSuggestion[] {
    const suggestions: RotationSuggestion[] = [];
    const positions: Position[] = ['forward', 'midfield', 'defence'];
    
    positions.forEach(position => {
      const activePlayers = this.getActivePlayersInPosition(position);
      const benchPlayers = this.gameState.players.filter(p => !p.isActive);
      
      // Find tired players (more than 6 minutes on field)
      const tiredPlayers = activePlayers.filter(p => {
        const timeOnField = this.currentTime - p.lastInterchangeTime;
        return timeOnField > 6 * 60; // 6 minutes
      });

      tiredPlayers.forEach(tiredPlayer => {
        const freshReplacement = this.findFreshReplacement(benchPlayers);
        if (freshReplacement) {
          const timeOnField = this.currentTime - tiredPlayer.lastInterchangeTime;
          suggestions.push({
            id: `freshness-${tiredPlayer.id}-${Date.now()}`,
            type: 'swap',
            priority: timeOnField > 8 * 60 ? 'urgent' : 'recommended',
            reasoning: `${tiredPlayer.name} needs a break - ${this.getMinutesFormat(timeOnField)} on field`,
            playerIn: freshReplacement.id,
            playerOut: tiredPlayer.id,
            position,
            urgencyScore: 60 + Math.floor(timeOnField / 60),
            factors: ['Player fatigue', 'Fresh replacement available'],
          });
        }
      });
    });

    return suggestions;
  }

  /**
   * PRIORITY 3: Position rotation for experience
   */
  private analyzePositionRotation(): RotationSuggestion[] {
    const suggestions: RotationSuggestion[] = [];
    const positions: Position[] = ['forward', 'midfield', 'defence'];
    
    // Find players who could benefit from position experience
    positions.forEach(currentPosition => {
      const activePlayers = this.getActivePlayersInPosition(currentPosition);
      
      activePlayers.forEach(player => {
        const bestRotationPosition = this.findBestRotationPosition(player, currentPosition);
        if (bestRotationPosition) {
          const timeInPosition = player.timeStats[currentPosition];
          suggestions.push({
            id: `rotation-${player.id}-${Date.now()}`,
            type: 'swap',
            priority: 'optional',
            reasoning: `Try ${player.name} in ${bestRotationPosition.position} - gain experience`,
            playerIn: bestRotationPosition.replacement.id,
            playerOut: player.id,
            position: bestRotationPosition.position,
            urgencyScore: 30 + Math.floor(timeInPosition / 60),
            factors: ['Position development', 'Experience building'],
          });
        }
      });
    });

    return suggestions;
  }

  // Helper Methods

  private findBestSwapForBenchPlayer(benchPlayer: Player, positions: Position[]): { playerId: string; position: Position } | null {
    let bestSwap: { playerId: string; position: Position; score: number } | null = null;

    positions.forEach(position => {
      const activePlayers = this.getActivePlayersInPosition(position);
      
      activePlayers.forEach(activePlayer => {
        const timeOnField = this.currentTime - activePlayer.lastInterchangeTime;
        const totalGameTime = this.getTotalGameTime(activePlayer);
        const benchRestTime = this.getRestTime(benchPlayer);
        
        // Score based on: field time, total game time, bench rest time
        let score = 0;
        score += Math.min(timeOnField / 60, 15) * 2; // Up to 30 points for time on field
        score += Math.min(totalGameTime / 60, 10) * 1; // Up to 10 points for total game time
        score += Math.min(benchRestTime / 60, 10) * 3; // Up to 30 points for bench rest
        
        if (!bestSwap || score > bestSwap.score) {
          bestSwap = { playerId: activePlayer.id, position, score };
        }
      });
    });

    // Only suggest if score is reasonable (at least 25)
    return bestSwap && bestSwap.score > 25 ? { playerId: bestSwap.playerId, position: bestSwap.position } : null;
  }

  private findFreshReplacement(benchPlayers: Player[]): Player | null {
    // Find bench player with most rest time
    return benchPlayers
      .filter(p => this.getRestTime(p) > 2 * 60) // At least 2 minutes rest
      .sort((a, b) => this.getRestTime(b) - this.getRestTime(a))[0] || null;
  }

  private findBestRotationPosition(player: Player, currentPosition: Position): { position: Position; replacement: Player } | null {
    const positions: Position[] = ['forward', 'midfield', 'defence'];
    const otherPositions = positions.filter(p => p !== currentPosition);
    
    // Find position where player has least experience
    const leastExperiencePosition = otherPositions.reduce((least, pos) => {
      return player.timeStats[pos] < player.timeStats[least] ? pos : least;
    }, otherPositions[0]);

    // Find a suitable replacement from bench or other positions
    const benchPlayers = this.gameState.players.filter(p => !p.isActive);
    const replacement = benchPlayers[0]; // Simple - take first available bench player

    return replacement ? { position: leastExperiencePosition, replacement } : null;
  }

  private getMinutesFormat(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    return `${mins}min`;
  }

  private generateSimpleAssessment(suggestions: RotationSuggestion[]): string {
    if (suggestions.length === 0) {
      return "Team looks good - no immediate rotation needs.";
    }

    const urgentCount = suggestions.filter(s => s.priority === 'urgent').length;
    const recommendedCount = suggestions.filter(s => s.priority === 'recommended').length;

    if (urgentCount > 0) {
      return `${urgentCount} player${urgentCount > 1 ? 's' : ''} need${urgentCount === 1 ? 's' : ''} immediate rest.`;
    } else if (recommendedCount > 0) {
      return `${recommendedCount} rotation suggestion${recommendedCount > 1 ? 's' : ''} to keep kids fresh.`;
    } else {
      return "Optional rotations available for player development.";
    }
  }

  // Helper methods
  private getActivePlayersInPosition(position: Position): Player[] {
    const activeIds = this.gameState.activePlayersByPosition[position];
    return this.gameState.players.filter(p => activeIds.includes(p.id));
  }

  private getAvailablePlayersForPosition(position: Position): Player[] {
    return this.gameState.players.filter(p => !p.isActive);
  }

  private getRestTime(player: Player): number {
    if (player.isActive) return 0;
    return this.currentTime - player.lastInterchangeTime;
  }

  private getTotalGameTime(player: Player): number {
    return player.timeStats.forward + player.timeStats.midfield + player.timeStats.defence;
  }

  private getAverageGameTime(): number {
    const totalTime = this.gameState.players.reduce((sum, p) => sum + this.getTotalGameTime(p), 0);
    return totalTime / Math.max(this.gameState.players.length, 1);
  }

  private getQuarterContext(): string {
    if (this.gameState.currentQuarter === 4) return 'final_quarter';
    if (this.gameState.currentQuarter === 1) return 'first_quarter';
    return 'middle_quarters';
  }

  // Smart-Fill Helper Methods

  /**
   * Finds the best player for a specific position considering multiple factors
   */
  private findBestPlayerForPosition(position: Position, availablePlayers: Player[]): Player | null {
    if (availablePlayers.length === 0) return null;

    return availablePlayers
      .map(p => ({
        player: p,
        score: this.calculatePositionFitScore(p, position)
      }))
      .sort((a, b) => b.score - a.score)[0]?.player || null;
  }

  /**
   * Calculates how well a player fits a specific position
   */
  private calculatePositionFitScore(player: Player, position: Position): number {
    let score = 0;

    // Rest time factor (longer rest = better)
    const restTime = this.getRestTime(player);
    score += Math.min(restTime / 60, 15) * 4; // Max 60 points

    // Position experience (season stats)
    const seasonPositionTime = player.seasonStats.positionTotals[position];
    score += Math.min(seasonPositionTime / 60, 10) * 3; // Max 30 points

    // Current game position time (less time = better for equity)
    const gamePositionTime = player.timeStats[position];
    const avgPositionTime = this.getAveragePositionTime(position);
    if (gamePositionTime < avgPositionTime * 0.8) {
      score += 20; // Bonus for underutilized in this position
    }

    // Total game time equity factor
    const totalTime = this.getTotalGameTime(player);
    const avgTime = this.getAverageGameTime();
    if (totalTime < avgTime * 0.7) {
      score += 25; // Significant bonus for underplayed players
    }

    return score;
  }

  /**
   * Calculates freshness score for fresh legs optimization
   */
  private calculateFreshScore(player: Player, position: Position): number {
    let score = 0;

    // Rest time is primary factor
    const restTime = this.getRestTime(player);
    score += Math.min(restTime / 60, 12) * 5; // Max 60 points

    // Position suitability
    const positionExp = player.seasonStats.positionTotals[position];
    score += Math.min(positionExp / 60, 5) * 4; // Max 20 points

    // Game time equity bonus
    const totalTime = this.getTotalGameTime(player);
    const avgTime = this.getAverageGameTime();
    if (totalTime < avgTime) {
      score += (avgTime - totalTime) / 60 * 2; // Variable bonus
    }

    return score;
  }

  /**
   * Calculates fatigue score for players on field
   */
  private calculateFatigueScore(player: Player, position: Position): number {
    let score = 0;

    // Time on ground
    const timeOnGround = this.currentTime - player.lastInterchangeTime;
    score += Math.min(timeOnGround / 60, 10) * 6; // Max 60 points

    // Total game time this match
    const totalTime = this.getTotalGameTime(player);
    const avgTime = this.getAverageGameTime();
    if (totalTime > avgTime * 1.2) {
      score += 20; // Penalty for overplayed
    }

    // Quarter context
    if (this.getQuarterContext() === 'final_quarter' && timeOnGround > 4 * 60) {
      score += 25; // High fatigue concern in final quarter
    }

    return score;
  }

  /**
   * Calculates equity score for balancing purposes
   */
  private calculateEquityScore(player: Player, gameAvg: number, seasonAvg: number, position: Position): number {
    let score = 0;

    // Current game equity gap
    const currentTime = this.getTotalGameTime(player);
    const gameGap = gameAvg - currentTime;
    if (gameGap > 1 * 60) { // 1+ minute behind
      score += Math.min(gameGap / 60, 8) * 5; // Max 40 points
    }

    // Season equity consideration
    const seasonGap = seasonAvg - player.seasonStats.averageGameTime;
    if (seasonGap > 2 * 60) { // 2+ minutes behind season average
      score += Math.min(seasonGap / 60, 6) * 3; // Max 18 points
    }

    // Position-specific equity
    const positionTime = player.timeStats[position];
    const avgPositionTime = this.getAveragePositionTime(position);
    if (positionTime < avgPositionTime * 0.6) {
      score += 15; // Position-specific underutilization
    }

    return score;
  }

  /**
   * Calculates overplay score for active players
   */
  private calculateOverplayScore(player: Player, gameAvg: number, position: Position): number {
    let score = 0;

    // Current game overplay
    const currentTime = this.getTotalGameTime(player);
    const gameOverplay = currentTime - gameAvg;
    if (gameOverplay > 1 * 60) {
      score += Math.min(gameOverplay / 60, 6) * 4; // Max 24 points
    }

    // Time on ground factor
    const timeOnGround = this.currentTime - player.lastInterchangeTime;
    if (timeOnGround > 5 * 60) {
      score += Math.min(timeOnGround / 60 - 5, 5) * 3; // Max 15 points
    }

    return score;
  }

  /**
   * Gets average season game time across all players
   */
  private getAverageSeasonGameTime(): number {
    const totalSeasonTime = this.gameState.players.reduce(
      (sum, p) => sum + p.seasonStats.averageGameTime, 0
    );
    return totalSeasonTime / Math.max(this.gameState.players.length, 1);
  }

  /**
   * Gets average time for a specific position in current game
   */
  private getAveragePositionTime(position: Position): number {
    const totalPositionTime = this.gameState.players.reduce(
      (sum, p) => sum + p.timeStats[position], 0
    );
    return totalPositionTime / Math.max(this.gameState.players.length, 1);
  }

  /**
   * Removes duplicate suggestions based on player combinations and positions
   */
  private deduplicateSuggestions(suggestions: RotationSuggestion[]): RotationSuggestion[] {
    const uniqueMap = new Map<string, RotationSuggestion>();

    for (const suggestion of suggestions) {
      const key = this.generateSuggestionKey(suggestion);
      
      // If we haven't seen this key, or this suggestion has higher urgency, use it
      if (!uniqueMap.has(key) || suggestion.urgencyScore > uniqueMap.get(key)!.urgencyScore) {
        uniqueMap.set(key, suggestion);
      }
    }

    return Array.from(uniqueMap.values());
  }

  /**
   * Generates a unique key for a suggestion to identify duplicates
   */
  private generateSuggestionKey(suggestion: RotationSuggestion): string {
    if (suggestion.type === 'swap' && suggestion.playerIn && suggestion.playerOut) {
      // For swaps, create bidirectional key (A->B same as B->A in different direction)
      const players = [suggestion.playerIn, suggestion.playerOut].sort();
      return `swap-${players[0]}-${players[1]}-${suggestion.position}`;
    } else if (suggestion.type === 'substitute_on' && suggestion.playerIn) {
      return `sub_on-${suggestion.playerIn}-${suggestion.position}`;
    } else if (suggestion.type === 'substitute_off' && suggestion.playerOut) {
      return `sub_off-${suggestion.playerOut}-${suggestion.position}`;
    }
    return `other-${suggestion.id}`;
  }

  /**
   * Checks if a suggestion is unique within the current position analysis
   */
  private isUniqueSuggestion(suggestion: RotationSuggestion, suggestedSwaps: Set<string>): boolean {
    const key = this.generateSuggestionKey(suggestion);
    return !suggestedSwaps.has(key);
  }

  /**
   * Adds a suggestion to the set of already suggested swaps
   */
  private addToSuggestedSwaps(suggestion: RotationSuggestion, suggestedSwaps: Set<string>): void {
    const key = this.generateSuggestionKey(suggestion);
    suggestedSwaps.add(key);
  }
}

// Export convenience function
export const generateRotationSuggestions = (gameState: GameState): RotationAnalysis => {
  const engine = new AutoRotationEngine(gameState);
  return engine.generateSuggestions();
};