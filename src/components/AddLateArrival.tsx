import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Clock } from 'lucide-react';
import { Player } from '@/types/sports';
import { useToast } from '@/hooks/use-toast';

interface AddLateArrivalProps {
  onAddPlayer: (player: Omit<Player, 'id'>) => void;
  isGameActive: boolean;
  currentGameTime: number;
  existingPlayers: Player[];
}

const AddLateArrival = ({ onAddPlayer, isGameActive, currentGameTime, existingPlayers }: AddLateArrivalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [guernseyNumber, setGuernseyNumber] = useState('');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter the player's name",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate names
    if (existingPlayers.some(p => p.name.toLowerCase() === playerName.trim().toLowerCase())) {
      toast({
        title: "Duplicate Name",
        description: "A player with this name already exists",
        variant: "destructive"
      });
      return;
    }

    // Check for duplicate guernsey numbers
    const guernseyNum = guernseyNumber ? parseInt(guernseyNumber) : undefined;
    if (guernseyNum && existingPlayers.some(p => p.guernseyNumber === guernseyNum)) {
      toast({
        title: "Duplicate Number",
        description: "This guernsey number is already taken",
        variant: "destructive"
      });
      return;
    }

    const newPlayer: Omit<Player, 'id'> = {
      name: playerName.trim(),
      guernseyNumber: guernseyNum,
      isActive: false,
      currentPosition: null,
      lastInterchangeTime: currentGameTime, // Start from current game time
      timeStats: {
        forward: 0,
        midfield: 0,
        defence: 0
      },
      quarterStats: {},
      attributes: {
        fitness: 5,
        speed: 5,
        endurance: 5,
        positionalVersatility: 5,
        gameReadiness: 8, // High readiness since they just arrived
        dateJoined: new Date().toISOString(),
        isAvailable: true,
        injuryHistory: []
      },
      seasonStats: {
        totalGameTime: 0,
        gamesPlayed: 1, // This game counts
        gamesCompleted: 0,
        gamesStarted: 0,
        positionTotals: {
          forward: 0,
          midfield: 0,
          defence: 0
        },
        positionPerformance: {
          forward: { games: 0, averageTime: 0, effectiveness: 5 },
          midfield: { games: 0, averageTime: 0, effectiveness: 5 },
          defence: { games: 0, averageTime: 0, effectiveness: 5 }
        },
        averageGameTime: 0,
        longestGameTime: 0,
        shortestGameTime: 0,
        consistencyScore: 5,
        monthlyStats: {},
        rotationFrequency: 0,
        versatilityScore: 5,
        reliabilityScore: 8, // High since they showed up!
        gameHistory: []
      },
      currentGamePerformance: {
        interchanges: 0,
        positionSwitches: 0,
        longestStint: 0,
        lastPositionChangeTime: currentGameTime
      }
    };

    onAddPlayer(newPlayer);
    
    toast({
      title: "Player Added!",
      description: `${playerName} is now available for rotation`,
    });

    // Reset form and close dialog
    setPlayerName('');
    setGuernseyNumber('');
    setIsOpen(false);
  };

  if (!isGameActive) {
    return null; // Only show during active games
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <UserPlus className="w-4 h-4" />
          Late Arrival
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-primary" />
            Add Late Arrival
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="playerName">Player Name *</Label>
            <Input
              id="playerName"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player's name"
              autoFocus
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="guernseyNumber">Guernsey Number (optional)</Label>
            <Input
              id="guernseyNumber"
              type="number"
              value={guernseyNumber}
              onChange={(e) => setGuernseyNumber(e.target.value)}
              placeholder="Enter number"
              min="1"
              max="999"
            />
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Late arrival priority:</strong> This player will be prioritized for rotation since they haven't played yet.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1">
              Add Player
            </Button>
            <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddLateArrival;