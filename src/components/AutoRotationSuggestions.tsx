import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotationAnalysis, RotationSuggestion } from '@/types/autoRotation';
import { Player, GameState } from '@/types/sports';
import { RefreshCw, ArrowRight, Clock, CheckCircle2, Brain, Sparkles } from 'lucide-react';
import { AIRotationService, AIRotationContext } from '@/services/aiRotationService';
import { useState, useEffect } from 'react';
import { useToast } from './ui/use-toast';

interface AutoRotationSuggestionsProps {
  rotationAnalysis: RotationAnalysis | null;
  players: Player[];
  onExecuteSwap: (playerInId: string, playerOutId: string) => void;
  onRefresh: () => void;
  isGameActive: boolean;
  currentGameTime: number;
  gameState: GameState;
  currentQuarter: number;
  quarterTime: number;
}

const AutoRotationSuggestions = ({
  rotationAnalysis,
  players,
  onExecuteSwap,
  onRefresh,
  isGameActive,
  currentGameTime,
  gameState,
  currentQuarter,
  quarterTime,
}: AutoRotationSuggestionsProps) => {
  const { toast } = useToast();
  const [aiEnhancedSuggestions, setAiEnhancedSuggestions] = useState<any[]>([]);
  const [aiInsights, setAiInsights] = useState<string>('');
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [aiEnabled, setAiEnabled] = useState(true);
  const [lastAICall, setLastAICall] = useState<number>(0);
  const AI_CALL_COOLDOWN = 20000; // 20 seconds between AI calls

  // Get AI-enhanced suggestions with rate limiting
  useEffect(() => {
    if (!rotationAnalysis || !aiEnabled || rotationAnalysis.suggestions.length === 0) {
      setAiEnhancedSuggestions([]);
      setAiInsights('');
      return;
    }

    // Rate limiting: only call AI every 20 seconds
    const now = Date.now();
    if (now - lastAICall < AI_CALL_COOLDOWN) {
      return;
    }

    const enhanceWithAI = async () => {
      setIsLoadingAI(true);
      setLastAICall(now);
      
      try {
        const context: AIRotationContext = {
          gameState,
          players,
          currentQuarter,
          quarterTime,
          totalTime: currentGameTime,
          suggestions: rotationAnalysis.suggestions.slice(0, 1) // Only analyze top suggestion
        };

        const result = await AIRotationService.enhanceRotationSuggestions(context);
        
        if (result.fallbackMode) {
          setAiInsights('');
        } else {
          // Extract just the first key insight, not the full detailed reasoning
          const insights = result.aiInsights.split('\n').find(line => 
            line.includes('**') && (line.includes('rest') || line.includes('break') || line.includes('field'))
          ) || '';
          
          setAiInsights(insights.replace(/\*\*/g, '').trim());
        }
        
        setAiEnhancedSuggestions(result.enhancedSuggestions.slice(0, 1)); // Only show one suggestion
      } catch (error) {
        console.error('AI enhancement failed:', error);
        setAiEnhancedSuggestions(rotationAnalysis.suggestions.slice(0, 1));
        setAiInsights('');
      } finally {
        setIsLoadingAI(false);
      }
    };

    enhanceWithAI();
  }, [rotationAnalysis, gameState, currentQuarter, quarterTime, players, currentGameTime, aiEnabled, lastAICall]);
  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  const getPlayerGuernsey = (playerId: string) => {
    return players.find(p => p.id === playerId)?.guernseyNumber;
  };

  const getDataDrivenReason = (reasoning: string, playerOutId: string, playerInId: string) => {
    const playerOut = players.find(p => p.id === playerOutId);
    const playerIn = players.find(p => p.id === playerInId);
    
    if (!playerOut || !playerIn) return 'Rotation needed';
    
    if (reasoning.includes('rest') || reasoning.includes('Fresh') || reasoning.includes('Rested')) {
      const benchTime = Math.floor((currentGameTime - playerIn.lastInterchangeTime) / 60);
      return `${benchTime}min rest`;
    }
    if (reasoning.includes('break') || reasoning.includes('Tired')) {
      const fieldTime = Math.floor((currentGameTime - playerOut.lastInterchangeTime) / 60);
      return `${fieldTime}min on field`;
    }
    if (reasoning.includes('field') || reasoning.includes('Bench')) {
      return 'Fresh legs';
    }
    return 'Balance team';
  };

  if (!isGameActive) return null;

  if (!rotationAnalysis || rotationAnalysis.suggestions.length === 0) {
    return (
      <Card className="bg-status-balanced/10 border-status-balanced/30">
        <CardContent className="py-8 text-center">
          <CheckCircle2 className="w-8 h-8 text-status-balanced mx-auto mb-3" />
          <h3 className="font-semibold text-status-balanced mb-1">Looking Good</h3>
          <p className="text-sm text-muted-foreground">No rotation suggestions right now</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Enhanced Header with AI */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            {aiEnabled ? (
              <Brain className={`w-5 h-5 ${isLoadingAI ? 'animate-pulse text-primary' : 'text-primary'}`} />
            ) : (
              <Sparkles className="w-5 h-5 text-muted-foreground" />
            )}
            <h3 className="text-lg font-bold text-foreground">
              {aiEnabled ? 'AI-Enhanced Rotations' : 'Smart Rotations'}
            </h3>
          </div>
          <Button
            onClick={() => setAiEnabled(!aiEnabled)}
            variant="ghost"
            size="sm"
            className="text-xs px-2 py-1 h-6"
          >
            {aiEnabled ? 'AI On' : 'AI Off'}
          </Button>
        </div>
        <div className="flex items-center gap-2">
          {isLoadingAI && (
            <div className="text-xs text-muted-foreground">Analyzing...</div>
          )}
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="w-10 h-10 p-0"
            disabled={isLoadingAI}
          >
            <RefreshCw className={`w-4 h-4 ${isLoadingAI ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* AI Insights - Simplified */}
      {aiInsights && (
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-primary" />
            <div className="text-sm text-foreground font-medium">{aiInsights}</div>
          </div>
        </div>
      )}

      {/* Overall Assessment */}
      {rotationAnalysis?.overallAssessment && (
        <p className="text-sm text-muted-foreground">{rotationAnalysis.overallAssessment}</p>
      )}

      {/* Single Top Suggestion */}
      <div className="space-y-4">
        {(aiEnhancedSuggestions.length > 0 ? aiEnhancedSuggestions : rotationAnalysis.suggestions.slice(0, 1)).map((suggestion) => (
          <Card key={suggestion.id} className="overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-6">
                
                {/* Player OUT */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-muted-foreground/20">
                    <span className="text-sm font-bold text-muted-foreground">
                      {getPlayerGuernsey(suggestion.playerOut!) || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{getPlayerName(suggestion.playerOut!)}</div>
                    <div className="text-xs text-muted-foreground">Give them a spell</div>
                  </div>
                </div>

                {/* Arrow & Data-Driven Reason */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-3 text-center">
                    <ArrowRight className="w-5 h-5 text-sherrin-red" />
                    <div className="text-sm font-medium text-foreground">
                      {getDataDrivenReason(suggestion.reasoning, suggestion.playerOut!, suggestion.playerIn!)}
                    </div>
                  </div>
                </div>

                {/* Player IN */}
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-sherrin-red flex items-center justify-center border-2 border-sherrin-red shadow-sm">
                    <span className="text-sm font-bold text-white">
                      {getPlayerGuernsey(suggestion.playerIn!) || '?'}
                    </span>
                  </div>
                  <div>
                    <div className="font-medium text-sm">{getPlayerName(suggestion.playerIn!)}</div>
                    <div className="text-xs text-muted-foreground">Put them on</div>
                  </div>
                </div>

                {/* Execute */}
                <Button
                  onClick={() => onExecuteSwap(suggestion.playerIn!, suggestion.playerOut!)}
                  className="bg-sherrin-red hover:bg-sherrin-red/90 text-white font-medium px-6"
                >
                  Swap
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Simple Footer */}
      <div className="text-center text-xs text-muted-foreground">
        <Clock className="w-3 h-3 inline mr-1" />
        Next check in {Math.floor(rotationAnalysis.nextReviewTime / 60)} minutes
      </div>
    </div>
  );
};

export default AutoRotationSuggestions;