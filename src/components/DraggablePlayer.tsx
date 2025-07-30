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
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData('text/plain', player.id);
    onDragStart(player.id, player.currentPosition || undefined);
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

  const isActive = player.isActive;
  const positionColors = {
    forward: 'bg-position-forward',
    midfield: 'bg-position-midfield',
    defense: 'bg-position-defense',
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      className={`
        cursor-grab active:cursor-grabbing p-2 rounded-lg border transition-all duration-200
        ${isActive 
          ? `${positionColors[player.currentPosition!]} text-white border-transparent` 
          : 'bg-white hover:bg-muted border-border'
        }
        ${className}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="font-medium text-sm truncate">{player.name}</span>
        {showTime && player.currentPosition && (
          <Badge variant="secondary" className="text-xs ml-1">
            {formatTime(player.timeStats[player.currentPosition])}
          </Badge>
        )}
      </div>
      {isActive && player.currentPosition && (
        <div className="text-xs opacity-80 capitalize">
          {player.currentPosition}
        </div>
      )}
    </div>
  );
};