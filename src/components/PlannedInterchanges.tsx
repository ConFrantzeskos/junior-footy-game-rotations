import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PlannedInterchange, Player, Position } from '@/types/sports';
import { Clock, Play, X } from 'lucide-react';

interface PlannedInterchangesProps {
  plannedInterchanges: PlannedInterchange[];
  players: Player[];
  onExecuteInterchange: (subId: string) => void;
  onRemoveInterchange: (subId: string) => void;
}

const PlannedInterchanges = ({
  plannedInterchanges,
  players,
  onExecuteInterchange,
  onRemoveInterchange,
}: PlannedInterchangesProps) => {
  const getPlayerName = (playerId: string) => {
    return players.find(p => p.id === playerId)?.name || 'Unknown Player';
  };

  const getPlayerGuernsey = (playerId: string) => {
    return players.find(p => p.id === playerId)?.guernseyNumber;
  };

  const getPriorityColor = (priority: 'high' | 'medium' | 'low') => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'default';
      case 'low': return 'secondary';
    }
  };

  const getPositionColor = (position: Position) => {
    const colors = {
      forward: 'bg-position-forward/10 text-position-forward border-position-forward/20',
      midfield: 'bg-position-midfield/10 text-position-midfield border-position-midfield/20',
      defence: 'bg-position-defence/10 text-position-defence border-position-defence/20',
    };
    return colors[position];
  };

  if (plannedInterchanges.length === 0) {
    return null;
  }

  return (
    <Card className="bg-white border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="w-5 h-5 text-orange-600" />
          Planned Interchanges ({plannedInterchanges.length})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {plannedInterchanges.map((sub) => (
          <div
            key={sub.id}
            className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg border border-orange-100"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                {getPlayerGuernsey(sub.playerId) && (
                  <div className="w-4 h-4 rounded-full bg-sherrin-red text-white text-xs font-bold flex items-center justify-center">
                    {getPlayerGuernsey(sub.playerId)}
                  </div>
                )}
                <span className="font-medium text-sm truncate">
                  {getPlayerName(sub.playerId)}
                </span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-muted-foreground">to</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs px-1.5 py-0.5 ${getPositionColor(sub.targetPosition)}`}
                >
                  {sub.targetPosition}
                </Badge>
                <Badge 
                  variant={getPriorityColor(sub.priority)} 
                  className="text-xs px-1.5 py-0.5"
                >
                  {sub.priority}
                </Badge>
              </div>
            </div>
            <div className="flex gap-1">
              <Button
                onClick={() => onExecuteInterchange(sub.id)}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 border-green-200 text-green-700 hover:bg-green-50"
              >
                <Play className="w-3 h-3" />
              </Button>
              <Button
                onClick={() => onRemoveInterchange(sub.id)}
                size="sm"
                variant="outline"
                className="h-8 w-8 p-0 border-red-200 text-red-700 hover:bg-red-50"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default PlannedInterchanges;