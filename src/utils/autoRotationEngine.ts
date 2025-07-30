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
    
    // Analyze each position for rotation opportunities
    const positions: Position[] = ['forward', 'midfield', 'defence'];
    
    positions.forEach(position => {
      const positionSuggestions = this.analyzePosition(position);
      suggestions.push(...positionSuggestions);
    });

    // Sort by urgency score (highest first)
    suggestions.sort((a, b) => b.urgencyScore - a.urgencyScore);

    // Limit to top 6 suggestions to avoid overwhelming the coach
    const topSuggestions = suggestions.slice(0, 6);

    return {
      suggestions: topSuggestions,
      overallAssessment: this.generateOverallAssessment(topSuggestions),
      nextReviewTime: this.calculateNextReviewTime(),
    };
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

    // Find fresh legs opportunities
    const freshLegsSuggestion = this.analyzeFreshLegsOpportunity(position, availablePlayers, activePlayers);
    if (freshLegsSuggestion) {
      suggestions.push(freshLegsSuggestion);
    }

    // Check for equity balancing
    const equitySuggestion = this.analyzeEquityBalancing(position, availablePlayers, activePlayers);
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

  private analyzeFreshLegsOpportunity(
    position: Position,
    availablePlayers: Player[],
    activePlayers: Player[]
  ): RotationSuggestion | null {
    // Find the freshest player available
    const freshPlayer = availablePlayers
      .filter(p => this.getRestTime(p) > 3 * 60) // At least 3 minutes rest
      .sort((a, b) => this.getRestTime(b) - this.getRestTime(a))[0];

    if (!freshPlayer) return null;

    // Find most tired active player in position
    const tiredPlayer = activePlayers
      .sort((a, b) => (this.currentTime - a.lastInterchangeTime) - (this.currentTime - b.lastInterchangeTime))
      .pop(); // Get player with longest time on ground

    if (!tiredPlayer) return null;

    const freshRestTime = this.getRestTime(freshPlayer);
    const tiredGroundTime = this.currentTime - tiredPlayer.lastInterchangeTime;

    if (freshRestTime > 4 * 60 && tiredGroundTime > 4 * 60) {
      return {
        id: `fresh-${freshPlayer.id}-${Date.now()}`,
        type: 'swap',
        priority: 'recommended',
        reasoning: `Fresh legs: ${freshPlayer.name} (${Math.floor(freshRestTime/60)}min rest) for ${tiredPlayer.name} (${Math.floor(tiredGroundTime/60)}min on ground)`,
        playerIn: freshPlayer.id,
        playerOut: tiredPlayer.id,
        position,
        urgencyScore: 30 + Math.floor(freshRestTime / 60),
        factors: ['Fresh legs available', 'Player needs rest'],
      };
    }

    return null;
  }

  private analyzeEquityBalancing(
    position: Position,
    availablePlayers: Player[],
    activePlayers: Player[]
  ): RotationSuggestion | null {
    // Find players with significantly different game time
    const allPlayers = [...availablePlayers, ...activePlayers];
    const gameTimes = allPlayers.map(p => this.getTotalGameTime(p));
    const avgGameTime = gameTimes.reduce((a, b) => a + b, 0) / gameTimes.length;

    // Find underplayed bench player
    const underplayedPlayer = availablePlayers
      .filter(p => this.getTotalGameTime(p) < avgGameTime * 0.7) // Significantly under average
      .sort((a, b) => this.getTotalGameTime(a) - this.getTotalGameTime(b))[0];

    // Find overplayed active player
    const overplayedPlayer = activePlayers
      .filter(p => this.getTotalGameTime(p) > avgGameTime * 1.3) // Significantly over average
      .sort((a, b) => this.getTotalGameTime(b) - this.getTotalGameTime(a))[0];

    if (underplayedPlayer && overplayedPlayer) {
      const timeDifference = this.getTotalGameTime(overplayedPlayer) - this.getTotalGameTime(underplayedPlayer);
      
      if (timeDifference > 3 * 60) { // 3+ minute difference
        return {
          id: `equity-${underplayedPlayer.id}-${Date.now()}`,
          type: 'swap',
          priority: 'optional',
          reasoning: `Game time balance: ${underplayedPlayer.name} (${Math.floor(this.getTotalGameTime(underplayedPlayer)/60)}min) for ${overplayedPlayer.name} (${Math.floor(this.getTotalGameTime(overplayedPlayer)/60)}min)`,
          playerIn: underplayedPlayer.id,
          playerOut: overplayedPlayer.id,
          position,
          urgencyScore: 15 + Math.floor(timeDifference / 60),
          factors: ['Game time equity', 'Fair rotation needed'],
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
}

// Export convenience function
export const generateRotationSuggestions = (gameState: GameState): RotationAnalysis => {
  const engine = new AutoRotationEngine(gameState);
  return engine.generateSuggestions();
};