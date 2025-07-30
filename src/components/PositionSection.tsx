import { useState } from 'react';
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
  const [isDragOver, setIsDragOver] = useState(false);
  const activePlayersData = players.filter(p => activePlayers.includes(p.id));
  const activeCount = activePlayers.length;

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const playerId = e.dataTransfer.getData('text/plain');
    const sourcePosition = e.dataTransfer.getData('application/source-position') as Position | undefined;
    
    if (playerId) {
      onMovePlayer(playerId, position, sourcePosition);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handlePlayerDragStart = (playerId: string, sourcePosition?: Position) => {
    onDragStart(playerId, sourcePosition);
  };

  const getPositionColor = () => {
    const colors = {
      forward: 'border-l-position-forward',
      midfield: 'border-l-position-midfield', 
      defense: 'border-l-position-defense',
    };
    return colors[position];
  };

  return (
    <Card 
      className={`
        p-xl card-elevated min-h-[480px] transition-all duration-300 ease-out
        ${isDragOver ? 'drop-zone-active' : ''}
        border-l-4 ${getPositionColor()}
        ${position === 'midfield' ? 'centre-square' : ''}
        ${position === 'forward' ? 'goal-posts' : ''}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center justify-between mb-xl">
        <h3 className="text-2xl font-bold font-system tracking-tight">{title}</h3>
        <Badge 
          variant={activeCount === maxPlayers ? "destructive" : "secondary"}
          className="text-sm font-semibold px-3 py-1"
        >
          {activeCount}/{maxPlayers}
        </Badge>
      </div>
      
      <div className="space-y-md min-h-[380px]">
        {activePlayersData.map((player) => (
          <div key={player.id} className="relative group">
            <DraggablePlayer 
              player={player}
              onDragStart={handlePlayerDragStart}
              onPlayerSwap={onPlayerSwap}
              showTime={true}
              className="w-full"
            />
            <button
              onClick={() => onRemovePlayer(player.id)}
              className="
                absolute -top-2 -right-2 w-6 h-6 
                bg-destructive text-destructive-foreground 
                rounded-full text-sm font-bold
                hover:bg-destructive/90 hover:scale-110
                transition-all duration-200
                opacity-0 group-hover:opacity-100
                shadow-md
              "
            >
              ×
            </button>
          </div>
        ))}
        
        {activeCount === 0 && (
          <div className="flex items-center justify-center h-[380px] border-2 border-dashed border-border/40 rounded-lg bg-muted/30">
            <div className="text-center text-muted-foreground">
              <div className="text-lg mb-2 font-semibold">Drop players here</div>
              <div className="text-sm opacity-70">Max {maxPlayers} players</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};