import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Game from "./Game";
import Welcome from "./Welcome";

const Index = () => {
  const [hasPlayers, setHasPlayers] = useState<boolean | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if players are configured in localStorage
    const playersData = localStorage.getItem('sport-rotation-players');
    
    if (playersData) {
      try {
        const players = JSON.parse(playersData);
        if (Array.isArray(players) && players.length > 0) {
          setHasPlayers(true);
        } else {
          setHasPlayers(false);
        }
      } catch (error) {
        console.error('Error parsing players data:', error);
        setHasPlayers(false);
      }
    } else {
      setHasPlayers(false);
    }
  }, []);

  // Show loading state while checking
  if (hasPlayers === null) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your team...</p>
        </div>
      </div>
    );
  }

  // If no players configured, show welcome page
  if (!hasPlayers) {
    return <Welcome />;
  }

  // If players are configured, show the game interface
  return <Game />;
};

export default Index;