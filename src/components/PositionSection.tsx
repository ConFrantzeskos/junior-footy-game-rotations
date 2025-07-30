import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Player, Position } from '@/types/sports';
import { DraggablePlayer } from './DraggablePlayer';
import { PlayerRank } from '@/utils/playerRanking';

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
  playerRankings: PlayerRank[];
  currentGameTime: number;
}

const positionColors = {
  forward: 'position-forward',
  midfield: 'position-midfield',
  defence: 'position-defence',
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
  playerRankings,
  currentGameTime,
}: PositionSectionProps) => {
  const [isDragOver, setIsDragOver] = useState(false);
  
  // Sort active players by time on field since last interchange (highest first)
  const activePlayersData = players
    .filter(p => activePlayers.includes(p.id))
    .sort((a, b) => {
      const timeOnFieldA = currentGameTime - a.lastInterchangeTime;
      const timeOnFieldB = currentGameTime - b.lastInterchangeTime;
      return timeOnFieldB - timeOnFieldA; // Highest first
    });
    
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
      defence: 'border-l-position-defence',
    };
    return colors[position];
  };

  return (
    <Card 
      className={`
        p-lg card-elevated min-h-[600px] transition-all duration-300 ease-out
        ${isDragOver ? 'drop-zone-active ring-2 ring-primary/50 bg-primary/5' : ''}
        border-l-4 ${getPositionColor()}
      `}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
    >
      <div className="flex items-center justify-between mb-lg">
        <h3 className="text-xl font-bold font-system tracking-tight">{title}</h3>
        <Badge 
          variant={activeCount === maxPlayers ? "destructive" : "secondary"}
          className="text-sm font-semibold px-3 py-1"
        >
          {activeCount}/{maxPlayers}
        </Badge>
      </div>
      
      <div className="space-y-sm min-h-[500px] flex flex-col">
        {activePlayersData.map((player) => {
          const ranking = playerRankings.find(r => r.id === player.id);
          return (
            <div key={player.id} className="relative group flex-shrink-0">
              <DraggablePlayer 
                player={player}
                onDragStart={handlePlayerDragStart}
                onPlayerSwap={onPlayerSwap}
                showTime={true}
                className="w-full transition-all duration-200 group-hover:scale-[1.02]"
                ranking={ranking}
                currentGameTime={currentGameTime}
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
                shadow-md z-10
              "
            >
              ×
            </button>
          </div>
          );
        })}
        
        {activeCount === 0 && (
          <div className={`
            flex items-center justify-center flex-1 min-h-[300px] 
            border-2 border-dashed transition-all duration-300
            ${isDragOver ? 'border-primary bg-primary/10' : 'border-border/40 bg-muted/30'}
            rounded-lg
          `}>
            <div className="text-center text-muted-foreground">
              <div className={`text-lg mb-2 font-semibold transition-colors duration-300 ${isDragOver ? 'text-primary' : ''}`}>
                {isDragOver ? 'Drop here!' : 'Drop players here'}
              </div>
              <div className="text-sm opacity-70">Max {maxPlayers} players</div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};