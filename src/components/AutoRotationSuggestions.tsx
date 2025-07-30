import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotationAnalysis, RotationSuggestion } from '@/types/autoRotation';
import { Player } from '@/types/sports';
import { RefreshCw, AlertTriangle, Clock, Zap, CheckCircle2, ArrowRight, Timer, Battery } from 'lucide-react';

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

  const getPriorityIcon = (priority: RotationSuggestion['priority']) => {
    switch (priority) {
      case 'urgent': return <AlertTriangle className="w-5 h-5 text-destructive" />;
      case 'recommended': return <Clock className="w-5 h-5 text-sherrin-red" />;
      case 'optional': return <CheckCircle2 className="w-5 h-5 text-position-midfield" />;
    }
  };

  const getPositionColor = (position: string) => {
    const colors = {
      forward: 'bg-position-forward text-white',
      midfield: 'bg-position-midfield text-white', 
      defence: 'bg-position-defence text-white',
    };
    return colors[position as keyof typeof colors] || 'bg-muted';
  };

  const getReasonIcon = (reasoning: string) => {
    if (reasoning.includes('rest') || reasoning.includes('break')) return <Battery className="w-4 h-4" />;
    if (reasoning.includes('field') || reasoning.includes('on field')) return <Timer className="w-4 h-4" />;
    return <Zap className="w-4 h-4" />;
  };

  const getSimpleReason = (reasoning: string) => {
    if (reasoning.includes('rest')) return 'Rested';
    if (reasoning.includes('break') || reasoning.includes('tired')) return 'Tired';
    if (reasoning.includes('field')) return 'Bench';
    if (reasoning.includes('experience')) return 'Experience';
    return 'Rotation';
  };

  if (!isGameActive) {
    return null;
  }

  if (!rotationAnalysis || rotationAnalysis.suggestions.length === 0) {
    return (
      <Card className="bg-status-balanced/5 border-status-balanced/20">
        <CardContent className="py-lg">
          <div className="flex items-center justify-center gap-md text-status-balanced">
            <CheckCircle2 className="w-5 h-5" />
            <span className="font-medium">All Good</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-md">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-sm">
            <Zap className="w-5 h-5 text-sherrin-red" />
            Smart Rotations
          </CardTitle>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="h-8 w-8 p-0"
          >
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0 space-y-md">
        {rotationAnalysis.suggestions.map((suggestion) => (
          <Card
            key={suggestion.id}
            className="border-l-4 border-l-sherrin-red/30 bg-gradient-to-r from-sherrin-red/5 to-transparent"
          >
            <CardContent className="p-lg">
              <div className="flex items-center justify-between">
                
                {/* Visual Priority & Position */}
                <div className="flex items-center gap-md">
                  <div className="flex flex-col items-center gap-sm">
                    {getPriorityIcon(suggestion.priority)}
                    <Badge className={`text-xs px-sm py-0 ${getPositionColor(suggestion.position)}`}>
                      {suggestion.position.charAt(0).toUpperCase()}
                    </Badge>
                  </div>

                  {/* Player Swap Visual */}
                  {suggestion.playerIn && suggestion.playerOut && (
                    <div className="flex items-center gap-md">
                      {/* Player Out */}
                      <div className="flex flex-col items-center gap-sm text-center">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-muted border-2 border-muted-foreground/30 flex items-center justify-center">
                            {getPlayerGuernsey(suggestion.playerOut) ? (
                              <span className="text-sm font-bold text-muted-foreground">
                                {getPlayerGuernsey(suggestion.playerOut)}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground">OUT</span>
                            )}
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-destructive rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">−</span>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground max-w-[60px] truncate">
                          {getPlayerName(suggestion.playerOut)}
                        </div>
                      </div>

                      {/* Arrow with reason icon */}
                      <div className="flex flex-col items-center gap-sm">
                        <ArrowRight className="w-6 h-6 text-sherrin-red" />
                        <div className="flex items-center gap-xs text-xs text-muted-foreground">
                          {getReasonIcon(suggestion.reasoning)}
                          <span>{getSimpleReason(suggestion.reasoning)}</span>
                        </div>
                      </div>

                      {/* Player In */}
                      <div className="flex flex-col items-center gap-sm text-center">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-status-balanced border-2 border-status-balanced flex items-center justify-center">
                            {getPlayerGuernsey(suggestion.playerIn) ? (
                              <span className="text-sm font-bold text-white">
                                {getPlayerGuernsey(suggestion.playerIn)}
                              </span>
                            ) : (
                              <span className="text-xs text-white">IN</span>
                            )}
                          </div>
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-sherrin-red rounded-full flex items-center justify-center">
                            <span className="text-white text-xs">+</span>
                          </div>
                        </div>
                        <div className="text-xs font-medium max-w-[60px] truncate">
                          {getPlayerName(suggestion.playerIn)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Execute Button */}
                {suggestion.playerIn && suggestion.playerOut && (
                  <Button
                    onClick={() => onExecuteSwap(suggestion.playerIn!, suggestion.playerOut!)}
                    size="sm"
                    className={`${
                      suggestion.priority === 'urgent' 
                        ? 'bg-destructive hover:bg-destructive/90' 
                        : 'bg-sherrin-red hover:bg-sherrin-red/90'
                    } text-white font-semibold px-lg`}
                  >
                    Execute
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Next Review - Visual */}
        <div className="flex items-center justify-center gap-sm text-xs text-muted-foreground pt-sm">
          <Clock className="w-3 h-3" />
          <span>Next check: {Math.floor(rotationAnalysis.nextReviewTime / 60)}min</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoRotationSuggestions;