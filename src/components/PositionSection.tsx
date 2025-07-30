import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Player, Position } from '@/types/sports';

interface PositionSectionProps {
  title: string;
  position: Position;
  players: Player[];
  activePlayers: string[];
  onTogglePlayer: (playerId: string, position: Position) => void;
  maxPlayers: number;
}

const positionColors = {
  forward: 'position-forward',
  midfield: 'position-midfield',
  defense: 'position-defense',
};

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const PositionSection = ({
  title,
  position,
  players,
  activePlayers,
  onTogglePlayer,
  maxPlayers,
}: PositionSectionProps) => {
  const availablePlayers = players.filter(p => !p.isActive || p.currentPosition === position);
  const activeCount = activePlayers.length;

  return (
    <Card className={`p-4 border-2 bg-gradient-to-b from-${positionColors[position]}/10 to-${positionColors[position]}/5`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <Badge 
          variant={activeCount === maxPlayers ? "destructive" : "secondary"}
          className="text-sm"
        >
          {activeCount}/{maxPlayers}
        </Badge>
      </div>
      
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {availablePlayers.map((player) => {
          const isActive = activePlayers.includes(player.id);
          const timeInPosition = player.timeStats[position];
          
          return (
            <Button
              key={player.id}
              onClick={() => onTogglePlayer(player.id, position)}
              variant={isActive ? "default" : "outline"}
              className={`w-full h-auto p-3 flex justify-between items-center transition-all duration-200 ${
                isActive 
                  ? `bg-${positionColors[position]} hover:bg-${positionColors[position]}/90 text-white` 
                  : 'hover:bg-muted'
              }`}
              disabled={!isActive && activeCount >= maxPlayers}
            >
              <span className="font-medium">{player.name}</span>
              <div className="text-sm opacity-80">
                {formatTime(timeInPosition)}
              </div>
            </Button>
          );
        })}
        
        {availablePlayers.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            All players are on the field
          </div>
        )}
      </div>
    </Card>
  );
};