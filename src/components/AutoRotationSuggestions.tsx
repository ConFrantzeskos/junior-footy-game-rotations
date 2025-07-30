import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotationAnalysis, RotationSuggestion } from '@/types/autoRotation';
import { Player } from '@/types/sports';
import { RefreshCw, AlertTriangle, Clock, CheckCircle2, ArrowRight, Battery, Timer, Zap } from 'lucide-react';

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
    return players.find(p => p.id === playerId)?.guernseyNumber || '?';
  };

  const getPriorityConfig = (priority: RotationSuggestion['priority']) => {
    switch (priority) {
      case 'urgent': 
        return {
          icon: <AlertTriangle className="w-4 h-4" />,
          color: 'text-destructive',
          bgColor: 'bg-destructive/5',
          borderColor: 'border-destructive/20'
        };
      case 'recommended': 
        return {
          icon: <Clock className="w-4 h-4" />,
          color: 'text-sherrin-red',
          bgColor: 'bg-sherrin-red/5',
          borderColor: 'border-sherrin-red/20'
        };
      case 'optional': 
        return {
          icon: <CheckCircle2 className="w-4 h-4" />,
          color: 'text-position-midfield',
          bgColor: 'bg-position-midfield/5',
          borderColor: 'border-position-midfield/20'
        };
    }
  };

  const getPositionConfig = (position: string) => {
    const configs = {
      forward: { bg: 'bg-position-forward', text: 'text-white', label: 'F' },
      midfield: { bg: 'bg-position-midfield', text: 'text-white', label: 'M' },
      defence: { bg: 'bg-position-defence', text: 'text-white', label: 'D' },
    };
    return configs[position as keyof typeof configs] || { bg: 'bg-muted', text: 'text-foreground', label: 'P' };
  };

  const getReasonConfig = (reasoning: string) => {
    if (reasoning.includes('rest') || reasoning.includes('Rested')) {
      return { icon: <Battery className="w-3 h-3" />, label: 'Fresh', color: 'text-status-balanced' };
    }
    if (reasoning.includes('break') || reasoning.includes('Tired')) {
      return { icon: <Timer className="w-3 h-3" />, label: 'Tired', color: 'text-sherrin-red' };
    }
    if (reasoning.includes('field') || reasoning.includes('Bench')) {
      return { icon: <Zap className="w-3 h-3" />, label: 'Bench', color: 'text-position-midfield' };
    }
    return { icon: <Zap className="w-3 h-3" />, label: 'Rotate', color: 'text-muted-foreground' };
  };

  if (!isGameActive) return null;

  if (!rotationAnalysis || rotationAnalysis.suggestions.length === 0) {
    return (
      <Card className="bg-gradient-to-r from-status-balanced/10 to-status-balanced/5 border-status-balanced/20">
        <CardContent className="py-xl">
          <div className="flex flex-col items-center gap-md">
            <div className="w-12 h-12 rounded-full bg-status-balanced/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-status-balanced" />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-status-balanced">Team Looking Good</h3>
              <p className="text-sm text-muted-foreground mt-sm">No rotation suggestions needed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-lg">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-md">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sherrin-red to-position-forward flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-foreground">Smart Rotations</h3>
            <p className="text-sm text-muted-foreground">{rotationAnalysis.overallAssessment}</p>
          </div>
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

      {/* Suggestions Grid */}
      <div className="grid gap-lg">
        {rotationAnalysis.suggestions.map((suggestion) => {
          const priorityConfig = getPriorityConfig(suggestion.priority);
          const positionConfig = getPositionConfig(suggestion.position);
          const reasonConfig = getReasonConfig(suggestion.reasoning);

          return (
            <Card
              key={suggestion.id}
              className={`card-elevated border-l-4 ${priorityConfig.borderColor} ${priorityConfig.bgColor}`}
            >
              <CardContent className="p-xl">
                <div className="grid grid-cols-[auto_1fr_auto] gap-xl items-center">
                  
                  {/* Priority & Position Indicator */}
                  <div className="flex flex-col items-center gap-md">
                    <div className={`p-md rounded-lg ${priorityConfig.bgColor} border ${priorityConfig.borderColor}`}>
                      <div className={priorityConfig.color}>
                        {priorityConfig.icon}
                      </div>
                    </div>
                    <Badge className={`${positionConfig.bg} ${positionConfig.text} font-bold px-md py-sm`}>
                      {positionConfig.label}
                    </Badge>
                  </div>

                  {/* Player Swap Visual */}
                  <div className="flex items-center justify-center">
                    <div className="grid grid-cols-[1fr_auto_1fr] gap-xl items-center w-full max-w-md">
                      
                      {/* Player OUT */}
                      <div className="flex flex-col items-center gap-md">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-muted to-muted-foreground/20 border-2 border-muted-foreground/30 flex items-center justify-center shadow-md">
                            <span className="text-lg font-bold text-muted-foreground">
                              {getPlayerGuernsey(suggestion.playerOut!)}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-destructive rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-sm font-bold">−</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-foreground">
                            {getPlayerName(suggestion.playerOut!)}
                          </div>
                          <div className="text-xs text-muted-foreground">OUT</div>
                        </div>
                      </div>

                      {/* Arrow & Reason */}
                      <div className="flex flex-col items-center gap-sm">
                        <ArrowRight className="w-8 h-8 text-sherrin-red" />
                        <div className={`flex items-center gap-xs text-xs ${reasonConfig.color}`}>
                          {reasonConfig.icon}
                          <span className="font-medium">{reasonConfig.label}</span>
                        </div>
                      </div>

                      {/* Player IN */}
                      <div className="flex flex-col items-center gap-md">
                        <div className="relative">
                          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-status-balanced to-position-midfield border-2 border-status-balanced flex items-center justify-center shadow-md">
                            <span className="text-lg font-bold text-white">
                              {getPlayerGuernsey(suggestion.playerIn!)}
                            </span>
                          </div>
                          <div className="absolute -top-1 -right-1 w-6 h-6 bg-sherrin-red rounded-full flex items-center justify-center shadow-sm">
                            <span className="text-white text-sm font-bold">+</span>
                          </div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium text-foreground">
                            {getPlayerName(suggestion.playerIn!)}
                          </div>
                          <div className="text-xs text-muted-foreground">IN</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Execute Button */}
                  <div className="flex justify-center">
                    <Button
                      onClick={() => onExecuteSwap(suggestion.playerIn!, suggestion.playerOut!)}
                      size="lg"
                      className={`
                        ${suggestion.priority === 'urgent' 
                          ? 'bg-destructive hover:bg-destructive/90 border-destructive' 
                          : 'bg-sherrin-red hover:bg-sherrin-red/90 border-sherrin-red'
                        } 
                        text-white font-semibold px-xl shadow-lg
                      `}
                    >
                      Execute
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-sm text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>Next review in {Math.floor(rotationAnalysis.nextReviewTime / 60)} minutes</span>
      </div>
    </div>
  );
};

export default AutoRotationSuggestions;