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
import { calculatePlayerRankings } from '@/utils/playerRanking';

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
  
  // Calculate player rankings based on total game time
  const playerRankings = calculatePlayerRankings(players);

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
            title="FORWARDS"
            position="forward"
            players={players}
            activePlayers={activePlayersByPosition.forward}
            onTogglePlayer={togglePlayer}
            onMovePlayer={movePlayer}
            onRemovePlayer={removePlayer}
            onDragStart={handleDragStart}
            onPlayerSwap={swapPlayers}
            maxPlayers={6}
            playerRankings={playerRankings}
            currentGameTime={totalTime}
          />
          
          <PositionSection
            title="MIDFIELDERS"
            position="midfield"
            players={players}
            activePlayers={activePlayersByPosition.midfield}
            onTogglePlayer={togglePlayer}
            onMovePlayer={movePlayer}
            onRemovePlayer={removePlayer}
            onDragStart={handleDragStart}
            onPlayerSwap={swapPlayers}
            maxPlayers={6}
            playerRankings={playerRankings}
            currentGameTime={totalTime}
          />
          
          <PositionSection
            title="DEFENDERS"
            position="defense"
            players={players}
            activePlayers={activePlayersByPosition.defense}
            onTogglePlayer={togglePlayer}
            onMovePlayer={movePlayer}
            onRemovePlayer={removePlayer}
            onDragStart={handleDragStart}
            onPlayerSwap={swapPlayers}
            maxPlayers={6}
            playerRankings={playerRankings}
            currentGameTime={totalTime}
          />
        </div>

        {/* Interchange Section */}
        <Card className="mt-2xl p-xl card-elevated">
          <div className="flex items-center justify-between mb-xl">
            <h3 className="text-2xl font-bold font-system tracking-tight">Interchange</h3>
            <div className="text-sm text-muted-foreground font-semibold">
              On Field: {activePlayersByPosition.forward.length + activePlayersByPosition.midfield.length + activePlayersByPosition.defense.length}/18
            </div>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-md">
            {availablePlayers.map((player) => {
              const ranking = playerRankings.find(r => r.id === player.id);
              return (
                <DraggablePlayer
                  key={player.id}
                  player={player}
                  onDragStart={handleDragStart}
                  onPlayerSwap={swapPlayers}
                  className="min-h-[70px]"
                  showTime={true}
                  ranking={ranking}
                  currentGameTime={totalTime}
                />
              );
            })}
          </div>
          
          {availablePlayers.length === 0 && (
            <div className="text-center py-2xl text-muted-foreground">
              <div className="font-semibold text-lg mb-sm">All players are on the field</div>
              <div className="text-sm opacity-70">Drag players here to substitute them</div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default Game;