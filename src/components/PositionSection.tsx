import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Player, Position } from '@/types/sports';
import { DraggablePlayer } from './DraggablePlayer';

interface PositionSectionProps {
  title: string;
  position: Position;
  players: Player[];
  activePlayers: string[];
  onTogglePlayer: (playerId: string, position: Position) => void;
  onMovePlayer: (playerId: string, targetPosition: Position, sourcePosition?: Position) => void;
  onRemovePlayer: (playerId: string) => void;
  onDragStart: (playerId: string, sourcePosition?: Position) => void;
  onPlayerSwap: (draggedPlayerId: string, targetPlayerId: string) => void;
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
  onMovePlayer,
  onRemovePlayer,
  onDragStart,
  onPlayerSwap,
  maxPlayers,
}: PositionSectionProps) => {
  const activePlayersData = players.filter(p => activePlayers.includes(p.id));
  const activeCount = activePlayers.length;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const playerId = e.dataTransfer.getData('text/plain');
    const sourcePosition = e.dataTransfer.getData('application/source-position') as Position | undefined;
    
    if (playerId) {
      onMovePlayer(playerId, position, sourcePosition);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handlePlayerDragStart = (playerId: string, sourcePosition?: Position) => {
    onDragStart(playerId, sourcePosition);
  };

  return (
    <Card 
      className={`p-4 border-2 bg-gradient-to-b from-${positionColors[position]}/10 to-${positionColors[position]}/5 min-h-[400px]`}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <Badge 
          variant={activeCount === maxPlayers ? "destructive" : "secondary"}
          className="text-sm"
        >
          {activeCount}/{maxPlayers}
        </Badge>
      </div>
      
      <div className="space-y-2 min-h-[300px]">
        {activePlayersData.map((player) => (
          <div key={player.id} className="relative">
            <DraggablePlayer 
              player={player}
              onDragStart={handlePlayerDragStart}
              onPlayerSwap={onPlayerSwap}
              showTime={true}
              className="w-full"
            />
            <button
              onClick={() => onRemovePlayer(player.id)}
              className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs hover:bg-red-600 transition-colors"
            >
              ×
            </button>
          </div>
        ))}
        
        {activeCount === 0 && (
          <div className="flex items-center justify-center h-[300px] border-2 border-dashed border-muted-foreground/30 rounded-lg">
            <div className="text-center text-muted-foreground">
              <div className="text-lg mb-2">Drop players here</div>
              <div className="text-sm">Max {maxPlayers} players</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};