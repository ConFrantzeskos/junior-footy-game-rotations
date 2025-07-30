import { useGameState } from '@/hooks/useGameState';
import { GameHeader } from '@/components/GameHeader';
import { PositionSection } from '@/components/PositionSection';
import { DraggablePlayer } from '@/components/DraggablePlayer';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { Position } from '@/types/sports';

const Game = () => {
  const navigate = useNavigate();
  const [draggedPlayer, setDraggedPlayer] = useState<{ id: string; sourcePosition?: Position } | null>(null);
  
  const {
    gameState,
    togglePlayer,
    movePlayer,
    removePlayer,
    swapPlayers,
    startGame,
    pauseGame,
    nextQuarter,
    resetGame,
  } = useGameState();

  const { players, activePlayersByPosition, isPlaying, currentQuarter, quarterTime, totalTime } = gameState;

  const handleDragStart = (playerId: string, sourcePosition?: Position) => {
    setDraggedPlayer({ id: playerId, sourcePosition });
  };

  const handleDragEnd = () => {
    setDraggedPlayer(null);
  };

  const availablePlayers = players.filter(p => !p.isActive);

  if (players.length === 0) {
    return (
      <div className="min-h-screen bg-background p-4 flex items-center justify-center">
        <div className="text-center bg-card rounded-lg p-8 card-elevated">
          <h2 className="text-2xl font-bold mb-4 font-system">No Players Configured</h2>
          <p className="text-muted-foreground mb-6">
            Please set up your team roster before starting a game.
          </p>
          <Button onClick={() => navigate('/settings')} size="lg">
            <Settings className="w-5 h-5 mr-2" />
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        <div className="flex justify-between items-center mb-8">
          <div></div>
          <Button 
            onClick={() => navigate('/settings')} 
            variant="outline"
            className="card-elevated"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
        </div>

        <GameHeader
          isPlaying={isPlaying}
          currentQuarter={currentQuarter}
          quarterTime={quarterTime}
          totalTime={totalTime}
          onStart={startGame}
          onPause={pauseGame}
          onNextQuarter={nextQuarter}
          onReset={resetGame}
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <PositionSection
            title="FORWARD"
            position="forward"
            players={players}
            activePlayers={activePlayersByPosition.forward}
            onTogglePlayer={togglePlayer}
            onMovePlayer={movePlayer}
            onRemovePlayer={removePlayer}
            onDragStart={handleDragStart}
            onPlayerSwap={swapPlayers}
            maxPlayers={6}
          />
          
          <div className="lg:col-span-1 lg:scale-110 lg:mx-4">
            <PositionSection
              title="MIDFIELD"
              position="midfield"
              players={players}
              activePlayers={activePlayersByPosition.midfield}
              onTogglePlayer={togglePlayer}
              onMovePlayer={movePlayer}
              onRemovePlayer={removePlayer}
              onDragStart={handleDragStart}
              onPlayerSwap={swapPlayers}
              maxPlayers={6}
            />
          </div>
          
          <PositionSection
            title="DEFENSE"
            position="defense"
            players={players}
            activePlayers={activePlayersByPosition.defense}
            onTogglePlayer={togglePlayer}
            onMovePlayer={movePlayer}
            onRemovePlayer={removePlayer}
            onDragStart={handleDragStart}
            onPlayerSwap={swapPlayers}
            maxPlayers={6}
          />
        </div>

        {/* Interchange Section */}
        <Card className="mt-8 p-6 card-elevated">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold font-system">Interchange</h3>
            <div className="text-sm text-muted-foreground font-medium">
              Players on Field: {activePlayersByPosition.forward.length + activePlayersByPosition.midfield.length + activePlayersByPosition.defense.length}/18
            </div>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {availablePlayers.map((player) => (
              <DraggablePlayer
                key={player.id}
                player={player}
                onDragStart={handleDragStart}
                onPlayerSwap={swapPlayers}
                className="min-h-[80px]"
                showTime={true}
              />
            ))}
          </div>
          
          {availablePlayers.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              All players are currently on the field
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Game;