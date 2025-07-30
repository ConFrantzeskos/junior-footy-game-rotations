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
  
  // Calculate game time percentage (15 mins per quarter = 900 seconds, 4 quarters = 3600 seconds)
  const totalGameTime = 3600; // 60 minutes total
  const playTimePercentage = (totalTime / totalGameTime) * 100;
  
  const getTimeStatus = () => {
    if (playTimePercentage > 80) return 'overplayed';
    if (playTimePercentage < 50) return 'underplayed';
    return 'balanced';
  };
  
  const timeStatus = getTimeStatus();

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
        player-card cursor-grab active:cursor-grabbing relative
        ${isActive 
          ? 'bg-player-active/8 text-player-text border border-player-border/40' 
          : 'bg-card hover:bg-muted/30 border border-player-border/60'
        }
        rounded-lg p-lg card-elevated
        ${showTime ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Minimal Position Indicator */}
      {isActive && player.currentPosition && (
        <div className={`position-indicator position-${player.currentPosition}`} />
      )}
      
      {/* Game Time Status Indicator */}
      {totalTime > 0 && (
        <div 
          className={`time-status-indicator time-${timeStatus}`}
          title={
            timeStatus === 'overplayed' 
              ? `High usage: ${playTimePercentage.toFixed(0)}% of game time`
              : timeStatus === 'underplayed'
              ? `Low usage: ${playTimePercentage.toFixed(0)}% of game time`
              : `Balanced: ${playTimePercentage.toFixed(0)}% of game time`
          }
        />
      )}
      
      <div className="space-y-sm relative z-10">
        <div className="font-semibold text-lg font-system leading-tight">{player.name}</div>
        
        {isActive && player.currentPosition && (
          <div className={`text-xs font-medium capitalize opacity-70 text-position-${player.currentPosition}`}>
            {player.currentPosition}
          </div>
        )}
        
        {showTime && totalTime > 0 && (
          <div className="text-xs text-muted-foreground font-medium">
            {formatTime(totalTime)}
          </div>
        )}
        
        {showTime && showDetails && (
          <div className="mt-md space-y-sm animate-accordion-down">
            <div className="flex gap-xs flex-wrap">
              <Badge variant="outline" className="text-xs px-2 py-1 bg-white/50" title="Forward time">
                F: {formatTime(player.timeStats.forward)}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-1 bg-white/50" title="Midfield time">
                M: {formatTime(player.timeStats.midfield)}
              </Badge>
              <Badge variant="outline" className="text-xs px-2 py-1 bg-white/50" title="Defense time">
                D: {formatTime(player.timeStats.defense)}
              </Badge>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};