import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RotationAnalysis, RotationSuggestion } from '@/types/autoRotation';
import { Player } from '@/types/sports';
import { RefreshCw, ArrowRight, Clock, CheckCircle2 } from 'lucide-react';

interface AutoRotationSuggestionsProps {
  rotationAnalysis: RotationAnalysis | null;
  players: Player[];
  onExecuteSwap: (playerInId: string, playerOutId: string) => void;
  onRefresh: () => void;
  isGameActive: boolean;
}

const AutoRotationSuggestions = ({
  rotationAnalysis,
  players,
  onExecuteSwap,
  onRefresh,
  isGameActive,
}: AutoRotationSuggestionsProps) => {
  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || 'Unknown';
  };

  const getPlayerGuernsey = (playerId: string) => {
    return players.find(p => p.id === playerId)?.guernseyNumber;
  };

  const getSimpleReason = (reasoning: string) => {
    if (reasoning.includes('rest') || reasoning.includes('Fresh') || reasoning.includes('Rested')) {
      return 'Give them a break';
    }
    if (reasoning.includes('break') || reasoning.includes('Tired')) {
      return 'Player is tired';
    }
    if (reasoning.includes('field') || reasoning.includes('Bench')) {
      return 'Get them on field';
    }
    return 'Rotate for balance';
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
      {/* Clean Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground">Smart Rotations</h3>
          <p className="text-sm text-muted-foreground">{rotationAnalysis.overallAssessment}</p>
        </div>
        <Button
          onClick={onRefresh}
          variant="outline"
          size="sm"
          className="w-10 h-10 p-0"
        >
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Clean Suggestion Cards */}
      <div className="space-y-4">
        {rotationAnalysis.suggestions.map((suggestion) => (
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
                    <div className="text-xs text-muted-foreground">Coming off</div>
                  </div>
                </div>

                {/* Arrow & Reason */}
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex items-center gap-3 text-center">
                    <ArrowRight className="w-5 h-5 text-sherrin-red" />
                    <div className="text-xs text-muted-foreground max-w-24">
                      {getSimpleReason(suggestion.reasoning)}
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
                    <div className="text-xs text-muted-foreground">Going on</div>
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