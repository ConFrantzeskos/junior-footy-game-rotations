import { useState } from 'react';
import { Player, Position } from '@/types/sports';
import { Badge } from '@/components/ui/badge';

interface DraggablePlayerProps {
  player: Player;
  onDragStart: (playerId: string, sourcePosition?: Position) => void;
  onPlayerSwap: (draggedPlayerId: string, targetPlayerId: string) => void;
  className?: string;
  showTime?: boolean;
}

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export const DraggablePlayer = ({ 
  player, 
  onDragStart, 
  onPlayerSwap,
  className = "", 
  showTime = false 
}: DraggablePlayerProps) => {
  const [showDetails, setShowDetails] = useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', player.id);
    onDragStart(player.id, player.currentPosition || undefined);
    e.currentTarget.classList.add('drag-lift');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('drag-lift');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedPlayerId = e.dataTransfer.getData('text/plain');
    
    if (draggedPlayerId && draggedPlayerId !== player.id) {
      onPlayerSwap(draggedPlayerId, player.id);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleClick = () => {
    if (showTime) {
      setShowDetails(!showDetails);
    }
  };

  const isActive = player.isActive;
  const totalTime = player.timeStats.forward + player.timeStats.midfield + player.timeStats.defense;

  const getPositionBorderColor = () => {
    if (!isActive || !player.currentPosition) return '';
    const colors = {
      forward: 'border-l-position-forward',
      midfield: 'border-l-position-midfield', 
      defense: 'border-l-position-defense',
    };
    return colors[player.currentPosition];
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onClick={handleClick}
      className={`
        player-card cursor-grab active:cursor-grabbing
        ${isActive 
          ? `bg-player-active/10 text-player-text border-l-4 ${getPositionBorderColor()} border-y border-r border-player-border` 
          : 'bg-card hover:bg-muted/50 border border-player-border'
        }
        rounded-lg p-3 card-elevated
        ${showTime ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div className="space-y-1">
        <div className="font-medium text-base font-system">{player.name}</div>
        
        {isActive && player.currentPosition && (
          <div className="text-xs text-muted-foreground capitalize font-medium">
            {player.currentPosition}
          </div>
        )}
        
        {showTime && totalTime > 0 && (
          <div className="text-xs text-muted-foreground">
            Total: {formatTime(totalTime)}
          </div>
        )}
        
        {showTime && showDetails && (
          <div className="mt-2 space-y-1 animate-accordion-down">
            <div className="flex gap-1 flex-wrap">
              <Badge variant="outline" className="text-xs px-2 py-0.5" title="Forward time">
                F: {formatTime(player.timeStats.forward)}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0.5" title="Midfield time">
                M: {formatTime(player.timeStats.midfield)}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-0.5" title="Defense time">
                D: {formatTime(player.timeStats.defense)}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};