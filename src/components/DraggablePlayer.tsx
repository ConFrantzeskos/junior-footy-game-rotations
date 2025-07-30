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
  ranking
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
      className={`
        player-card cursor-grab active:cursor-grabbing relative
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
      
      <div className="space-y-xs relative z-10">
        <div className="font-semibold text-sm font-system leading-tight">{player.name}</div>
        
        {/* Interesting Analysis */}
        {totalTime > 0 && (
          <div className="text-xs text-muted-foreground">
            {(() => {
              const { forward, midfield, defense } = player.timeStats;
              const positions = [
                { name: 'Forward', time: forward, short: 'F' },
                { name: 'Midfield', time: midfield, short: 'M' },
                { name: 'Defence', time: defense, short: 'D' }
              ].filter(p => p.time > 0).sort((a, b) => b.time - a.time);
              
              if (positions.length === 0) return null;
              
              const topPosition = positions[0];
              const percentage = Math.round((topPosition.time / totalTime) * 100);
              
              if (positions.length === 1) {
                return `${topPosition.short}: ${percentage}%`;
              } else {
                const distribution = positions.map(p => 
                  `${p.short}${Math.round((p.time / totalTime) * 100)}`
                ).join(' ');
                return distribution;
              }
            })()}
          </div>
        )}
        
        {showTime && totalTime > 0 && (
          <div className="space-y-xs">
            <div className="text-xs text-muted-foreground font-medium">
              {formatTime(totalTime)}
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