import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Player } from '@/types/sports';
import { generateAwardNominations, getCategoryColor, getIconComponent } from '@/utils/awardSystem';
import { Trophy, Award, Sparkles } from 'lucide-react';

interface AwardNominationsProps {
  players: Player[];
}

const AwardNominations = ({ players }: AwardNominationsProps) => {
  const nominations = generateAwardNominations(players);
  
  if (nominations.length === 0) {
    return (
      <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="flex flex-col items-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Trophy className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2">Season Awards</h3>
          <p className="text-muted-foreground mb-4">
            Play a few games to start seeing award nominations for your players based on their performance and development!
          </p>
          <div className="text-sm text-muted-foreground/80 space-y-1">
            <p>Awards include: Best & Fairest, Most Versatile, Rising Star, Team Player, and more!</p>
            <p>Each award recognizes different aspects of junior footy development.</p>
          </div>
        </div>
      </Card>
    );
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'performance': return <Trophy className="w-4 h-4" />;
      case 'character': return <Sparkles className="w-4 h-4" />;
      case 'development': return <Award className="w-4 h-4" />;
      case 'team': return <Award className="w-4 h-4" />;
      default: return <Award className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-sherrin-red/5 to-position-forward/5 border-sherrin-red/20">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg bg-sherrin-red/10 flex items-center justify-center">
            <Trophy className="w-5 h-5 text-sherrin-red" />
          </div>
          <div>
            <h2 className="text-xl font-bold">Season Award Nominations</h2>
            <p className="text-sm text-muted-foreground">
              Recognizing excellence in junior Australian Rules Football
            </p>
          </div>
        </div>
        
        <div className="bg-white/50 rounded-lg p-4">
          <p className="text-sm text-foreground/80 leading-relaxed">
            These awards celebrate the diverse ways players contribute to the team. From consistent performers 
            to rising stars, every player has the opportunity to be recognized for their unique strengths and development.
          </p>
        </div>
      </Card>

      <div className="grid gap-6">
        {nominations.map(({ player, awards }) => (
          <Card key={player.id} className="p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-sherrin-red flex items-center justify-center text-white font-bold text-lg">
                  {player.guernseyNumber || '?'}
                </div>
                <div>
                  <h3 className="text-lg font-bold">{player.name}</h3>
                  <div className="text-sm text-muted-foreground">
                    {player.seasonStats.gamesCompleted} games • {Math.floor(player.seasonStats.totalGameTime / 60)}m total
                  </div>
                </div>
              </div>
              <Badge variant="secondary" className="bg-primary/10 text-primary">
                {awards.length} nomination{awards.length > 1 ? 's' : ''}
              </Badge>
            </div>

            <div className="space-y-3">
              {awards.map((award) => {
                const IconComponent = getIconComponent(award.icon);
                return (
                  <div key={award.id} className={`rounded-lg border p-4 ${getCategoryColor(award.category)}`}>
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold">{award.name}</h4>
                          <div className="flex items-center gap-1 text-xs">
                            {getCategoryIcon(award.category)}
                            <span className="capitalize">{award.category}</span>
                          </div>
                        </div>
                        <p className="text-sm opacity-90 mb-2">{award.description}</p>
                        <p className="text-xs opacity-80 italic">{award.reasoning(player)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-6 bg-muted/50">
        <h3 className="font-semibold mb-3">About Junior Footy Awards</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-muted-foreground">
          <div>
            <h4 className="font-medium text-foreground mb-2">Award Categories</h4>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Trophy className="w-3 h-3 text-sherrin-red" />
                <span><strong>Performance:</strong> Outstanding on-field achievements</span>
              </div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-3 h-3 text-position-midfield" />
                <span><strong>Character:</strong> Positive attitude and sportsmanship</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-3 h-3 text-position-forward" />
                <span><strong>Development:</strong> Growth and learning over the season</span>
              </div>
              <div className="flex items-center gap-2">
                <Award className="w-3 h-3 text-position-defence" />
                <span><strong>Team:</strong> Contributing to team success and unity</span>
              </div>
            </div>
          </div>
          <div>
            <h4 className="font-medium text-foreground mb-2">Recognition Philosophy</h4>
            <p className="leading-relaxed">
              These awards focus on celebrating effort, improvement, and positive contribution rather than just winning. 
              Every player has unique strengths that deserve recognition.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AwardNominations;