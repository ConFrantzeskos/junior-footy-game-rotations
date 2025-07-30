import { useState } from 'react';
import { Player, Position } from '@/types/sports';
import { Badge } from '@/components/ui/badge';
import { PlayerRank } from '@/utils/playerRanking';

interface DraggablePlayerProps {
  player: Player;
  onDragStart: (playerId: string, sourcePosition?: Position) => void;
  onPlayerSwap: (draggedPlayerId: string, targetPlayerId: string) => void;
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
  className = "", 
  showTime = false,
  ranking,
  currentGameTime
}: DraggablePlayerProps) => {
  
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


  const isActive = player.isActive;
  const totalTime = player.timeStats.forward + player.timeStats.midfield + player.timeStats.defense;
  
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
      className={`
        player-card cursor-grab active:cursor-grabbing relative overflow-hidden
        ${isActive 
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
        <div className="flex items-center justify-between">
          <div className="font-semibold text-sm font-system leading-tight">{player.name}</div>
          
          {/* Time since last interchange - for active players only */}
          {isActive && player.lastInterchangeTime !== undefined && (
            <div className="text-xs text-muted-foreground font-mono opacity-70">
              {formatTime(currentGameTime - player.lastInterchangeTime)}
            </div>
          )}
        </div>
        
        {showTime && totalTime > 0 && (
          <div className="space-y-xs">
            <div className="text-xs text-muted-foreground font-medium">
              Total: {formatTime(totalTime)}
            </div>
            
            {/* Position Time Breakdown - Mini Progress Bars */}
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
              {player.timeStats.defense > 0 && (
                <div 
                  className="h-1 bg-position-defense rounded-full opacity-60"
                  style={{ width: `${(player.timeStats.defense / totalTime) * 100}%`, minWidth: '4px' }}
                  title={`Defence: ${formatTime(player.timeStats.defense)}`}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};