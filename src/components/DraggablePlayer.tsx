import { useState } from 'react';
import { Player, Position } from '@/types/sports';
import { Badge } from '@/components/ui/badge';
import { PlayerRank } from '@/utils/playerRanking';

interface DraggablePlayerProps {
  player: Player;
  onDragStart: (playerId: string, sourcePosition?: Position) => void;
  onPlayerSwap: (draggedPlayerId: string, targetPlayerId: string) => void;
  onLongPress?: (player: Player, position: { x: number; y: number }) => void;
  className?: string;
  showTime?: boolean;
  ranking?: PlayerRank;
  currentGameTime: number;
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
  onLongPress,
  className = "", 
  showTime = false,
  ranking,
  currentGameTime
}: DraggablePlayerProps) => {
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const handleDragStart = (e: React.DragEvent) => {
    setIsDragging(true);
    e.dataTransfer.setData('text/plain', player.id);
    onDragStart(player.id, player.currentPosition || undefined);
    e.currentTarget.classList.add('drag-lift');
  };

  const handleDragEnd = (e: React.DragEvent) => {
    setIsDragging(false);
    if (e.currentTarget) {
      e.currentTarget.classList.remove('drag-lift');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const draggedPlayerId = e.dataTransfer.getData('text/plain');
    
    if (draggedPlayerId && draggedPlayerId !== player.id) {
      onPlayerSwap(draggedPlayerId, player.id);
      
      // Visual feedback for successful swap
      if (e.currentTarget) {
        e.currentTarget.classList.add('bg-green-100', 'border-green-500');
        setTimeout(() => {
          if (e.currentTarget) {
            e.currentTarget.classList.remove('bg-green-100', 'border-green-500');
          }
        }, 800);
      }
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    // Add visual feedback for valid drop zone
    if (e.currentTarget) {
      e.currentTarget.classList.add('ring-2', 'ring-blue-400', 'ring-opacity-50');
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Remove visual feedback when leaving drop zone
    if (e.currentTarget) {
      e.currentTarget.classList.remove('ring-2', 'ring-blue-400', 'ring-opacity-50');
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    // Only trigger long press if not dragging and onLongPress is available
    if (!isDragging && onLongPress) {
      const timer = setTimeout(() => {
        const touch = e.touches[0];
        onLongPress(player, { x: touch.clientX, y: touch.clientY });
      }, 800); // Longer delay to avoid conflict with drag
      setLongPressTimer(timer);
    }
  };

  const handleTouchEnd = () => {
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }
  };


  const isActive = player.isActive;
  const totalTime = player.timeStats.forward + player.timeStats.midfield + player.timeStats.defence;
  
  // Calculate game time usage percentage based on elapsed game time
  const gameTimeUsagePercentage = currentGameTime > 0 ? (totalTime / currentGameTime) * 100 : 0;
  
  const getUsageStatus = () => {
    if (gameTimeUsagePercentage > 80) return 'high';
    if (gameTimeUsagePercentage < 50) return 'low';
    return 'balanced';
  };
  
  const usageStatus = getUsageStatus();

  const getPositionBorderColor = () => {
    if (!isActive || !player.currentPosition) return '';
    const colors = {
      forward: 'border-l-position-forward',
      midfield: 'border-l-position-midfield', 
      defence: 'border-l-position-defence',
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
      onDragLeave={handleDragLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className={`
        player-card cursor-grab active:cursor-grabbing relative overflow-hidden
        min-h-[64px] min-w-[120px] touch-manipulation
        ${
          // Interchange indicators take priority - apply to all players regardless of field status
          ranking?.rank === 'most-1' || ranking?.rank === 'most-2' || ranking?.rank === 'most-3'
            ? 'bg-interchange-high border-interchange-high-border text-player-text' 
            : ranking?.rank === 'least-1' || ranking?.rank === 'least-2' || ranking?.rank === 'least-3'
            ? 'bg-interchange-low border-interchange-low-border text-player-text'
            : // Default styling based on active state
              isActive 
              ? 'bg-player-active/8 text-player-text border border-player-border/40' 
              : 'bg-card hover:bg-muted/30 border border-player-border/60'
        }
        ${ranking?.rank ? `ring-1 ring-rank-${ranking.rank}/30` : ''}
        rounded-lg p-md card-elevated
        ${className}
      `}
    >
      {/* Ranking Indicator */}
      {ranking?.rank && (
        <div 
          className={`absolute top-1 left-1 w-2 h-2 rounded-full bg-rank-${ranking.rank} opacity-75 shadow-sm`}
          title={
            ranking.rank.startsWith('most') 
              ? `High game time: Rank ${ranking.rank.split('-')[1]} of highest players`
              : `Low game time: Rank ${ranking.rank.split('-')[1]} of lowest players`
          }
        />
      )}
      
      {/* Minimal Position Indicator */}
      {isActive && player.currentPosition && (
        <div className={`position-indicator position-${player.currentPosition}`} />
      )}
      
      {/* Game Time Usage Indicator */}
      {totalTime > 0 && currentGameTime > 0 && (
        <div 
          className={`usage-indicator usage-${usageStatus}`}
          title={
            usageStatus === 'high' 
              ? `High usage: ${gameTimeUsagePercentage.toFixed(0)}% of elapsed game time`
              : usageStatus === 'low'
              ? `Low usage: ${gameTimeUsagePercentage.toFixed(0)}% of elapsed game time`
              : `Balanced: ${gameTimeUsagePercentage.toFixed(0)}% of elapsed game time`
          }
        />
      )}
      
      <div className="space-y-xs relative z-10">
        {/* Guernsey number and player name */}
        <div className="flex items-center gap-2">
          {player.guernseyNumber && (
            <div className="w-5 h-5 rounded-full bg-sherrin-red text-white text-xs font-bold flex items-center justify-center flex-shrink-0">
              {player.guernseyNumber}
            </div>
          )}
          <div className="font-semibold text-sm font-system leading-tight flex-1 min-w-0">
            <div className="truncate">{player.name}</div>
          </div>
        </div>
        
        {showTime && (
          <div className="space-y-xs">
            <div className="flex items-center justify-between text-xs text-muted-foreground font-medium">
              <span>{formatTime(totalTime)}</span>
              
              {/* Time display - context depends on active status */}
              <span className="font-mono opacity-70">
                {player.lastInterchangeTime !== undefined 
                  ? (() => {
                      const timeDiff = currentGameTime - player.lastInterchangeTime;
                      return formatTime(timeDiff);
                    })()
                  : formatTime(currentGameTime)
                }
              </span>
            </div>
            
            {/* Position Time Breakdown - Mini Progress Bars */}
            {totalTime > 0 && (
              <div className="flex gap-xs">
                {player.timeStats.forward > 0 && (
                  <div 
                    className="h-1 bg-position-forward rounded-full opacity-60"
                    style={{ width: `${(player.timeStats.forward / totalTime) * 100}%`, minWidth: '4px' }}
                    title={`Forward: ${formatTime(player.timeStats.forward)}`}
                  />
                )}
                {player.timeStats.midfield > 0 && (
                  <div 
                    className="h-1 bg-position-midfield rounded-full opacity-60"
                    style={{ width: `${(player.timeStats.midfield / totalTime) * 100}%`, minWidth: '4px' }}
                    title={`Midfield: ${formatTime(player.timeStats.midfield)}`}
                  />
                )}
                {player.timeStats.defence > 0 && (
                  <div 
                    className="h-1 bg-position-defence rounded-full opacity-60"
                    style={{ width: `${(player.timeStats.defence / totalTime) * 100}%`, minWidth: '4px' }}
                    title={`Defence: ${formatTime(player.timeStats.defence)}`}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};