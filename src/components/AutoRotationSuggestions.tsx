import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotationAnalysis, RotationSuggestion } from '@/types/autoRotation';
import { Player, GameState } from '@/types/sports';
import { RefreshCw, ArrowRight, Clock, CheckCircle2, Brain, Sparkles, Target, Loader2 } from 'lucide-react';
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

  const topSuggestion = (aiEnhancedSuggestions.length > 0 ? aiEnhancedSuggestions : rotationAnalysis.suggestions)[0];
  
  if (!topSuggestion) return null;

  // Generate contextual AI insight for this specific swap
  const getContextualInsight = () => {
    if (!aiInsights) {
      if (topSuggestion.playerOut && topSuggestion.playerIn) {
        return `Fresh legs for ${topSuggestion.position} - swap recommended`;
      }
      return 'Keep the rotation active';
    }
    return aiInsights;
  };

  // Generate timing guidance
  const getTimingGuidance = () => {
    const reviewMinutes = Math.round(rotationAnalysis.nextReviewTime / 60);
    return `Best timing: Next ${reviewMinutes} minutes`;
  };

  // Generate confidence level
  const getConfidence = () => {
    if (topSuggestion.priority === 'urgent') return 'High confidence';
    if (topSuggestion.priority === 'recommended') return 'Medium confidence';
    return 'Low confidence';
  };

  return (
    <Card className="mb-6 overflow-hidden">
      {/* Top Row: AI Tactical Insight */}
      <div className="bg-primary/5 border-b border-primary/10 px-6 py-3">
        <div className="flex items-center gap-2">
          <Brain className={`w-4 h-4 ${aiEnabled ? 'text-primary' : 'text-muted-foreground'}`} />
          <span className="text-sm font-medium text-foreground">
            {isLoadingAI ? 'Analyzing...' : getContextualInsight()}
          </span>
          <div className="ml-auto flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setAiEnabled(!aiEnabled)}
              className={`h-7 text-xs ${aiEnabled ? 'text-primary' : 'text-muted-foreground'}`}
            >
              AI {aiEnabled ? 'On' : 'Off'}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoadingAI}
              className="h-7"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </div>
      </div>

      {/* Main Row: Player Swap Interface */}
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Player OUT */}
          <div className="text-center min-w-0 flex-shrink-0">
            <div className="text-xs text-muted-foreground mb-1 font-medium">OUT</div>
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center border-2 border-muted-foreground/20 mx-auto mb-1">
              <span className="text-sm font-bold text-muted-foreground">
                {topSuggestion.playerOut ? getPlayerGuernsey(topSuggestion.playerOut) : '?'}
              </span>
            </div>
            <div className="font-semibold text-sm">
              {topSuggestion.playerOut ? getPlayerName(topSuggestion.playerOut) : 'TBD'}
            </div>
          </div>
          
          <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          
          {/* AI Reason */}
          <div className="text-center flex-1 min-w-0 px-4">
            <div className="text-xs text-muted-foreground mb-1 font-medium">REASON</div>
            <div className="text-sm font-medium text-foreground leading-tight">
              {getDataDrivenReason(topSuggestion.reasoning, topSuggestion.playerOut, topSuggestion.playerIn)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {topSuggestion.position}
            </div>
          </div>
          
          <ArrowRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
          
          {/* Player IN */}
          <div className="text-center min-w-0 flex-shrink-0">
            <div className="text-xs text-muted-foreground mb-1 font-medium">IN</div>
            <div className="w-12 h-12 rounded-full bg-sherrin-red flex items-center justify-center border-2 border-sherrin-red shadow-sm mx-auto mb-1">
              <span className="text-sm font-bold text-white">
                {topSuggestion.playerIn ? getPlayerGuernsey(topSuggestion.playerIn) : '?'}
              </span>
            </div>
            <div className="font-semibold text-sm">
              {topSuggestion.playerIn ? getPlayerName(topSuggestion.playerIn) : 'TBD'}
            </div>
          </div>
          
          {/* Swap Button */}
          <Button
            onClick={() => {
              if (topSuggestion.playerOut && topSuggestion.playerIn) {
                onExecuteSwap(topSuggestion.playerIn, topSuggestion.playerOut);
                toast({
                  title: "Swap Executed",
                  description: `${getPlayerName(topSuggestion.playerOut)} → ${getPlayerName(topSuggestion.playerIn)}`,
                });
              }
            }}
            disabled={!topSuggestion.playerOut || !topSuggestion.playerIn || isLoadingAI}
            className="bg-sherrin-red hover:bg-sherrin-red/90 text-white font-medium px-6 flex-shrink-0"
            size="lg"
          >
            Swap
          </Button>
        </div>
      </CardContent>

      {/* Bottom Row: Timing and Confidence */}
      <div className="bg-muted/30 border-t px-6 py-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>{getTimingGuidance()}</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Target className="w-3 h-3" />
            <span>{getConfidence()}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};

export default AutoRotationSuggestions;