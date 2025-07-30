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
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="py-8 text-center">
          <div className="text-gray-500 text-sm">
            Start the game to see rotation suggestions
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!rotationAnalysis || rotationAnalysis.suggestions.length === 0) {
    return (
      <Card className="bg-green-50 border-green-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
            <CheckCircle2 className="w-5 h-5" />
            Rotation Status
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <div className="text-green-700 text-sm">
              All rotations looking good - no changes needed right now
            </div>
            <Button
              onClick={onRefresh}
              variant="outline"
              size="sm"
              className="border-green-300 text-green-700 hover:bg-green-100"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white border-gray-200">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Zap className="w-5 h-5 text-orange-600" />
            Smart Rotation Suggestions
          </CardTitle>
          <Button
            onClick={onRefresh}
            variant="outline"
            size="sm"
            className="h-8"
          >
            <RefreshCw className="w-3 h-3 mr-1" />
            Refresh
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          {rotationAnalysis.overallAssessment}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {rotationAnalysis.suggestions.map((suggestion) => (
          <div
            key={suggestion.id}
            className={`p-3 rounded-lg border ${getPriorityColor(suggestion.priority)}`}
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  {getPriorityIcon(suggestion.priority)}
                  <Badge
                    variant="outline"
                    className={`text-xs ${getPositionColor(suggestion.position)}`}
                  >
                    {suggestion.position}
                  </Badge>
                  <Badge
                    variant={suggestion.priority === 'urgent' ? 'destructive' : 'default'}
                    className="text-xs"
                  >
                    {suggestion.priority}
                  </Badge>
                </div>

                <div className="text-sm font-medium mb-1">
                  {suggestion.reasoning}
                </div>

                {suggestion.playerIn && suggestion.playerOut && (
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      <span>Swap:</span>
                    </div>
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

                {suggestion.factors.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {suggestion.factors.map((factor, index) => (
                      <span
                        key={index}
                        className="text-xs px-1.5 py-0.5 bg-white/50 rounded text-gray-600"
                      >
                        {factor}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {suggestion.playerIn && suggestion.playerOut && (
                <Button
                  onClick={() => onExecuteSwap(suggestion.playerIn!, suggestion.playerOut!)}
                  size="sm"
                  variant={suggestion.priority === 'urgent' ? 'default' : 'outline'}
                  className="flex-shrink-0 h-8 px-3"
                >
                  Execute
                </Button>
              )}
            </div>
          </div>
        ))}

        <div className="pt-2 text-xs text-muted-foreground text-center">
          Next analysis in {Math.floor(rotationAnalysis.nextReviewTime / 60)} minutes
        </div>
      </CardContent>
    </Card>
  );
};

export default AutoRotationSuggestions;