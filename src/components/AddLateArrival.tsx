import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { UserPlus, Clock } from 'lucide-react';
import { Player } from '@/types/sports';
import { useToast } from '@/hooks/use-toast';

interface AddLateArrivalProps {
  onAddPlayer: (playerId: string) => void;
  isGameActive: boolean;
  currentGameTime: number;
  currentGamePlayers: Player[];
  fullRoster: Player[]; // All team players
}

const AddLateArrival = ({ onAddPlayer, isGameActive, currentGameTime, currentGamePlayers, fullRoster }: AddLateArrivalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState('');
  const { toast } = useToast();

  // Get players who are in the roster but not in the current game
  const availableForLateArrival = (fullRoster || []).filter(rosterPlayer => 
    !currentGamePlayers.some(gamePlayer => gamePlayer.id === rosterPlayer.id)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPlayerId) {
      toast({
        title: "Player Required",
        description: "Please select a player",
        variant: "destructive"
      });
      return;
    }

    const selectedPlayer = fullRoster.find(p => p.id === selectedPlayerId);
    if (!selectedPlayer) {
      toast({
        title: "Player Not Found",
        description: "Selected player not found in roster",
        variant: "destructive"
      });
      return;
    }

    onAddPlayer(selectedPlayerId);
    
    toast({
      title: "Late Arrival Added!",
      description: `${selectedPlayer.name} is now available for rotation`,
    });

    // Reset form and close dialog
    setSelectedPlayerId('');
    setIsOpen(false);
  };

  if (!isGameActive || availableForLateArrival.length === 0) {
    return null; // Only show during active games when players are available
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
            <Label htmlFor="playerSelect">Select Player</Label>
            <Select value={selectedPlayerId} onValueChange={setSelectedPlayerId}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a player who just arrived..." />
              </SelectTrigger>
              <SelectContent>
                {availableForLateArrival.map(player => (
                  <SelectItem key={player.id} value={player.id}>
                    {player.name} {player.guernseyNumber ? `(#${player.guernseyNumber})` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Late arrival priority:</strong> This player will be prioritized for rotation since they haven't played yet this game.
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button type="submit" className="flex-1" disabled={!selectedPlayerId}>
              Add to Game
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