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
   * Generates intelligent rotation suggestions based on multiple factors
   */
  generateSuggestions(): RotationAnalysis {
    const suggestions: RotationSuggestion[] = [];
    
    // PRIORITY 1: Critical Gap Filling - Fill empty positions first
    const gapFillSuggestions = this.analyzeGapFilling();
    suggestions.push(...gapFillSuggestions);
    
    // PRIORITY 2: Smart-Fill for optimal team balance
    const positions: Position[] = ['forward', 'midfield', 'defence'];
    
    positions.forEach(position => {
      const positionSuggestions = this.analyzePosition(position);
      suggestions.push(...positionSuggestions);
    });

    // Sort by urgency score (highest first)
    suggestions.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // Limit to top 8 suggestions to include Smart-Fill
    const topSuggestions = suggestions.slice(0, 8);

    return {
      suggestions: topSuggestions,
      overallAssessment: this.generateOverallAssessment(topSuggestions),
      nextReviewTime: this.calculateNextReviewTime(),
    };
  }

  /**
   * PRIORITY 1: Critical Gap Filling - Essential positions left empty
   */
  private analyzeGapFilling(): RotationSuggestion[] {
    const suggestions: RotationSuggestion[] = [];
    const positions: Position[] = ['forward', 'midfield', 'defence'];
    const minPlayersPerPosition = { forward: 2, midfield: 2, defence: 2 }; // Minimum coverage
    
    positions.forEach(position => {
      const activePlayers = this.getActivePlayersInPosition(position);
      const availablePlayers = this.getAvailablePlayersForPosition(position);
      const shortage = minPlayersPerPosition[position] - activePlayers.length;
      
      if (shortage > 0 && availablePlayers.length > 0) {
        // Fill gaps with best available players
        for (let i = 0; i < shortage && i < availablePlayers.length; i++) {
          const bestPlayer = this.findBestPlayerForPosition(position, availablePlayers);
          if (bestPlayer) {
            suggestions.push({
              id: `gap-fill-${bestPlayer.id}-${Date.now()}-${i}`,
              type: 'substitute_on',
              priority: 'urgent',
              reasoning: `Smart-Fill: Critical gap in ${position} - ${bestPlayer.name} best available`,
              playerIn: bestPlayer.id,
              position,
              urgencyScore: 100 + (shortage * 10), // Highest priority
              factors: ['Critical position gap', 'Smart-Fill recommendation'],
            });
            // Remove from available for next iteration
            availablePlayers.splice(availablePlayers.indexOf(bestPlayer), 1);
          }
        }
      }
    });
    
    return suggestions;
  }

  private analyzePosition(position: Position): RotationSuggestion[] {
    const suggestions: RotationSuggestion[] = [];
    const activePlayers = this.getActivePlayersInPosition(position);
    const availablePlayers = this.getAvailablePlayersForPosition(position);

    // Find players who need a spell
    activePlayers.forEach(player => {
      const spellSuggestion = this.analyzePlayerForSpell(player, position, availablePlayers);
      if (spellSuggestion) {
        suggestions.push(spellSuggestion);
      }
    });

    // PRIORITY 3: Fresh Legs Optimization - Enhanced analysis
    const freshLegsSuggestion = this.analyzeEnhancedFreshLegs(position, availablePlayers, activePlayers);
    if (freshLegsSuggestion) {
      suggestions.push(freshLegsSuggestion);
    }

    // PRIORITY 2: Equity Balancing - Enhanced for Smart-Fill
    const equitySuggestion = this.analyzeEnhancedEquityBalancing(position, availablePlayers, activePlayers);
    if (equitySuggestion) {
      suggestions.push(equitySuggestion);
    }

    return suggestions;
  }

  private analyzePlayerForSpell(
    player: Player, 
    position: Position, 
    availablePlayers: Player[]
  ): RotationSuggestion | null {
    const factors: string[] = [];
    let urgencyScore = 0;

    // Time on ground analysis
    const timeOnGround = this.currentTime - player.lastInterchangeTime;
    if (timeOnGround > 8 * 60) { // 8+ minutes
      factors.push('Long stint on ground');
      urgencyScore += 40;
    } else if (timeOnGround > 5 * 60) { // 5+ minutes
      factors.push('Extended time on ground');
      urgencyScore += 25;
    }

    // Position-specific time analysis
    const positionTime = player.timeStats[position];
    const totalPositionTime = this.gameState.players
      .reduce((sum, p) => sum + p.timeStats[position], 0);
    const avgPositionTime = totalPositionTime / this.gameState.players.length;
    
    if (positionTime > avgPositionTime * 1.5) {
      factors.push('Above average time in position');
      urgencyScore += 20;
    }

    // Quarter context
    const quarterContext = this.getQuarterContext();
    if (quarterContext === 'final_quarter' && timeOnGround > 6 * 60) {
      factors.push('Final quarter - fresh legs needed');
      urgencyScore += 30;
    }

    // Find best replacement
    const bestReplacement = this.findBestReplacement(player, position, availablePlayers);
    
    if (urgencyScore >= 25 && bestReplacement && factors.length > 0) {
      const priority = urgencyScore >= 50 ? 'urgent' : urgencyScore >= 35 ? 'recommended' : 'optional';
      
      return {
        id: `spell-${player.id}-${Date.now()}`,
        type: 'swap',
        priority,
        reasoning: this.generateSpellReasoning(player, bestReplacement, factors),
        playerIn: bestReplacement.id,
        playerOut: player.id,
        position,
        urgencyScore,
        factors,
      };
    }

    return null;
  }

  /**
   * PRIORITY 3: Enhanced Fresh Legs Optimization
   */
  private analyzeEnhancedFreshLegs(
    position: Position,
    availablePlayers: Player[],
    activePlayers: Player[]
  ): RotationSuggestion | null {
    // Enhanced fresh player selection with multiple criteria
    const suitableFreshPlayers = availablePlayers
      .filter(p => this.getRestTime(p) > 2 * 60) // Minimum 2 minutes rest
      .map(p => ({
        player: p,
        freshScore: this.calculateFreshScore(p, position)
      }))
      .sort((a, b) => b.freshScore - a.freshScore);

    if (suitableFreshPlayers.length === 0) return null;

    const freshPlayer = suitableFreshPlayers[0].player;

    // Enhanced tired player analysis
    const tiredPlayer = activePlayers
      .map(p => ({
        player: p,
        fatigueScore: this.calculateFatigueScore(p, position)
      }))
      .sort((a, b) => b.fatigueScore - a.fatigueScore)[0]?.player;

    if (!tiredPlayer) return null;

    const freshRestTime = this.getRestTime(freshPlayer);
    const tiredGroundTime = this.currentTime - tiredPlayer.lastInterchangeTime;
    const freshScore = suitableFreshPlayers[0].freshScore;

    // Smart-Fill logic: lower threshold for swaps if fresh player is significantly better
    if (freshRestTime > 2 * 60 && (tiredGroundTime > 3 * 60 || freshScore > 40)) {
      const urgencyScore = 25 + Math.floor(freshRestTime / 60) + Math.floor(freshScore / 10);
      
      return {
        id: `smart-fresh-${freshPlayer.id}-${Date.now()}`,
        type: 'swap',
        priority: urgencyScore > 40 ? 'recommended' : 'optional',
        reasoning: `Smart-Fill Fresh Legs: ${freshPlayer.name} (${Math.floor(freshRestTime/60)}min rest, optimal fit) for ${tiredPlayer.name}`,
        playerIn: freshPlayer.id,
        playerOut: tiredPlayer.id,
        position,
        urgencyScore,
        factors: ['Smart fresh legs optimization', 'Position-specific fitness'],
      };
    }

    return null;
  }

  /**
   * PRIORITY 2: Enhanced Equity Balancing for Smart-Fill
   */
  private analyzeEnhancedEquityBalancing(
    position: Position,
    availablePlayers: Player[],
    activePlayers: Player[]
  ): RotationSuggestion | null {
    // Enhanced equity analysis with season stats consideration
    const allPlayers = [...availablePlayers, ...activePlayers];
    const gameAvg = this.getAverageGameTime();
    const seasonAvg = this.getAverageSeasonGameTime();

    // Smart selection: consider both current game and season equity
    const underplayedCandidates = availablePlayers
      .map(p => ({
        player: p,
        equityScore: this.calculateEquityScore(p, gameAvg, seasonAvg, position),
        currentTime: this.getTotalGameTime(p),
        seasonTime: p.seasonStats.averageGameTime
      }))
      .filter(p => p.equityScore > 20) // Significant equity imbalance
      .sort((a, b) => b.equityScore - a.equityScore);

    const overplayedCandidates = activePlayers
      .map(p => ({
        player: p,
        overplayScore: this.calculateOverplayScore(p, gameAvg, position),
        currentTime: this.getTotalGameTime(p)
      }))
      .filter(p => p.overplayScore > 15)
      .sort((a, b) => b.overplayScore - a.overplayScore);

    if (underplayedCandidates.length > 0 && overplayedCandidates.length > 0) {
      const underplayed = underplayedCandidates[0];
      const overplayed = overplayedCandidates[0];
      const timeDifference = overplayed.currentTime - underplayed.currentTime;
      
      if (timeDifference > 2 * 60) { // Lowered threshold for Smart-Fill
        const urgencyScore = 15 + underplayed.equityScore + Math.floor(timeDifference / 60);
        
        return {
          id: `smart-equity-${underplayed.player.id}-${Date.now()}`,
          type: 'swap',
          priority: urgencyScore > 35 ? 'recommended' : 'optional',
          reasoning: `Smart-Fill Equity: ${underplayed.player.name} (${Math.floor(underplayed.currentTime/60)}min game, ${Math.floor(underplayed.seasonTime)}min season avg) needs more time`,
          playerIn: underplayed.player.id,
          playerOut: overplayed.player.id,
          position,
          urgencyScore,
          factors: ['Smart equity balancing', 'Season-aware rotation'],
        };
      }
    }

    return null;
  }

  private findBestReplacement(player: Player, position: Position, availablePlayers: Player[]): Player | null {
    if (availablePlayers.length === 0) return null;

    // Score potential replacements
    return availablePlayers
      .map(p => ({
        player: p,
        score: this.scoreReplacement(p, position)
      }))
      .sort((a, b) => b.score - a.score)[0]?.player || null;
  }

  private scoreReplacement(player: Player, position: Position): number {
    let score = 0;

    // Rest time factor (more rest = better)
    const restTime = this.getRestTime(player);
    score += Math.min(restTime / 60, 10) * 5; // Max 50 points for rest

    // Position experience factor
    const positionTime = player.timeStats[position];
    score += Math.min(positionTime / 60, 5) * 3; // Max 15 points for experience

    // Game time equity (less game time = better for equity)
    const totalTime = this.getTotalGameTime(player);
    const avgTime = this.getAverageGameTime();
    if (totalTime < avgTime) {
      score += (avgTime - totalTime) / 60 * 2; // Bonus for underplayed
    }

    return score;
  }

  private generateSpellReasoning(player: Player, replacement: Player, factors: string[]): string {
    const timeOnGround = Math.floor((this.currentTime - player.lastInterchangeTime) / 60);
    const restTime = Math.floor(this.getRestTime(replacement) / 60);
    
    return `Give ${player.name} a spell (${timeOnGround}min on ground) - bring on ${replacement.name} (${restTime}min rest)`;
  }

  private generateOverallAssessment(suggestions: RotationSuggestion[]): string {
    if (suggestions.length === 0) {
      return "Current rotations look good - no urgent changes needed.";
    }

    const urgentCount = suggestions.filter(s => s.priority === 'urgent').length;
    const recommendedCount = suggestions.filter(s => s.priority === 'recommended').length;

    if (urgentCount > 0) {
      return `${urgentCount} urgent rotation${urgentCount > 1 ? 's' : ''} recommended - players need immediate attention.`;
    } else if (recommendedCount > 0) {
      return `${recommendedCount} rotation${recommendedCount > 1 ? 's' : ''} suggested to optimise player freshness.`;
    } else {
      return "Some optional rotations available for game time equity.";
    }
  }

  private calculateNextReviewTime(): number {
    // Review more frequently if there are urgent suggestions
    const hasUrgent = this.gameState.totalTime > 0; // Simple check for now
    return hasUrgent ? 2 * 60 : 3 * 60; // 2-3 minutes
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
}

// Export convenience function
export const generateRotationSuggestions = (gameState: GameState): RotationAnalysis => {
  const engine = new AutoRotationEngine(gameState);
  return engine.generateSuggestions();
};