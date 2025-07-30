import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { RotationAnalysis, RotationSuggestion } from '@/types/autoRotation';
import { Player } from '@/types/sports';
import { RefreshCw, AlertTriangle, CheckCircle2, Clock, Zap, Users } from 'lucide-react';

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
      case 'urgent': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      case 'recommended': return <Clock className="w-4 h-4 text-orange-600" />;
      case 'optional': return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
    }
  };

  const getPriorityColor = (priority: RotationSuggestion['priority']) => {
    switch (priority) {
      case 'urgent': return 'bg-red-50 border-red-200';
      case 'recommended': return 'bg-orange-50 border-orange-200';
      case 'optional': return 'bg-blue-50 border-blue-200';
    }
  };

  const getPositionColor = (position: string) => {
    const colors = {
      forward: 'bg-position-forward/10 text-position-forward border-position-forward/20',
      midfield: 'bg-position-midfield/10 text-position-midfield border-position-midfield/20',
      defence: 'bg-position-defence/10 text-position-defence border-position-defence/20',
    };
    return colors[position as keyof typeof colors] || 'bg-gray-100';
  };

  if (!isGameActive) {
    return null; // Don't show anything when game is not active
  }

  if (!rotationAnalysis || rotationAnalysis.suggestions.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-green-700 text-sm">
              <CheckCircle2 className="w-4 h-4" />
              All rotations looking good
            </div>
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="h-6 px-2 text-xs border-green-300 text-green-700 hover:bg-green-100"
            >
              <RefreshCw className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Zap className="w-4 h-4 text-orange-600" />
            Smart Rotation Suggestions
          </CardTitle>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="h-6 px-2 text-xs"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
        <div className="text-xs text-muted-foreground">
          {rotationAnalysis.overallAssessment}
        </div>
      </CardHeader>
      <CardContent className="pt-0 space-y-2">
        {rotationAnalysis.suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`p-2 rounded border ${getPriorityColor(suggestion.priority)}`}
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1 mb-1">
                  {getPriorityIcon(suggestion.priority)}
                  <Badge
                    variant="outline"
                    className={`text-xs px-1 py-0 ${getPositionColor(suggestion.position)}`}
                  >
                    {suggestion.position}
                  </Badge>
                </div>

                <div className="text-xs font-medium mb-1 leading-tight">
                  {suggestion.reasoning}
                </div>

                {suggestion.playerIn && suggestion.playerOut && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      {getPlayerGuernsey(suggestion.playerOut) && (
                        <div className="w-3 h-3 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center">
                          {getPlayerGuernsey(suggestion.playerOut)}
                        </div>
                      )}
                      <span className="line-through opacity-75">
                        {getPlayerName(suggestion.playerOut)}
                      </span>
                    </div>
                    <span>→</span>
                    <div className="flex items-center gap-1">
                      {getPlayerGuernsey(suggestion.playerIn) && (
                        <div className="w-3 h-3 rounded-full bg-sherrin-red text-white text-xs font-bold flex items-center justify-center">
                          {getPlayerGuernsey(suggestion.playerIn)}
                        </div>
                      )}
                      <span className="font-medium">
                        {getPlayerName(suggestion.playerIn)}
                      </span>
                    </div>
                  </div>
                )}

              </div>

              {suggestion.playerIn && suggestion.playerOut && (
                <Button
                  onClick={() => onExecuteSwap(suggestion.playerIn!, suggestion.playerOut!)}
                  size="sm"
                  variant={suggestion.priority === 'urgent' ? 'default' : 'outline'}
                  className="flex-shrink-0 h-6 px-2 text-xs"
                >
                  Execute
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="pt-1 text-xs text-muted-foreground text-center">
          Next analysis in {Math.floor(rotationAnalysis.nextReviewTime / 60)} minutes
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoRotationSuggestions;