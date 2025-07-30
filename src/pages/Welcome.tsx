import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Users, Target, Clock, Zap, ArrowRight, Settings } from 'lucide-react';

const Welcome = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      {/* Header with title */}
      <div className="bg-gradient-to-br from-card via-card to-accent/30 border-b">
        <div className="h-2 bg-gradient-to-r from-sherrin-red via-position-forward to-position-midfield" />
        <div className="container mx-auto max-w-4xl px-6 py-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-sherrin-red via-position-forward to-position-midfield bg-clip-text text-transparent mb-4">
              Junior Footy Manager
            </h1>
            <p className="text-lg text-muted-foreground">
              Smart rotation management for Australian Rules Football
            </p>
          </div>
        </div>
      </div>

      {/* Welcome content */}
      <div className="container mx-auto max-w-4xl px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Welcome to Your Team Management System! 👋
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            You're just a few steps away from giving every kid fair playing time and position experience. 
            Let's get your team set up!
          </p>
        </div>

        {/* Features grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <Card className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-sherrin-red/10 flex items-center justify-center mx-auto mb-4">
              <Clock className="w-6 h-6 text-sherrin-red" />
            </div>
            <h3 className="font-semibold mb-2">Fair Time Tracking</h3>
            <p className="text-sm text-muted-foreground">
              Ensure every player gets equal opportunities on the field
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-position-forward/10 flex items-center justify-center mx-auto mb-4">
              <Target className="w-6 h-6 text-position-forward" />
            </div>
            <h3 className="font-semibold mb-2">Position Rotation</h3>
            <p className="text-sm text-muted-foreground">
              Help kids experience all positions and find where they shine
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-position-midfield/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-6 h-6 text-position-midfield" />
            </div>
            <h3 className="font-semibold mb-2">Smart Suggestions</h3>
            <p className="text-sm text-muted-foreground">
              AI-powered rotation recommendations based on game flow
            </p>
          </Card>

          <Card className="p-6 text-center">
            <div className="w-12 h-12 rounded-full bg-position-defence/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-6 h-6 text-position-defence" />
            </div>
            <h3 className="font-semibold mb-2">Team Analytics</h3>
            <p className="text-sm text-muted-foreground">
              Track development and maintain transparent parent communication
            </p>
          </Card>
        </div>

        {/* Getting started section */}
        <Card className="p-8 text-center bg-gradient-to-br from-primary/5 to-accent/5 border-primary/20">
          <div className="max-w-2xl mx-auto">
            <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
            <p className="text-muted-foreground mb-6">
              First, let's add your players to the roster. You can set up their names, guernsey numbers, 
              and preferred positions. Don't worry - you can always make changes later!
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                onClick={() => navigate('/settings')}
                size="lg"
                className="bg-sherrin-red hover:bg-sherrin-red/90 text-white"
              >
                <Settings className="w-5 h-5 mr-2" />
                Set Up Your Team
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
              
              <Button 
                onClick={() => navigate('/')}
                variant="outline"
                size="lg"
              >
                Continue to Game View
              </Button>
            </div>
            
            <div className="mt-6 p-4 bg-background/50 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Quick tip:</strong> You'll need at least a few players to start managing rotations effectively. 
                Most junior teams have 15-25 players on their roster.
              </p>
            </div>
          </div>
        </Card>

        {/* Steps preview */}
        <div className="mt-12 text-center">
          <h4 className="font-semibold mb-6 text-muted-foreground">What comes next:</h4>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-sherrin-red text-white flex items-center justify-center text-xs font-bold">1</div>
              <span>Add players</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/50 transform sm:transform-none rotate-90 sm:rotate-0" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-position-forward text-white flex items-center justify-center text-xs font-bold">2</div>
              <span>Start your first game</span>
            </div>
            <ArrowRight className="w-4 h-4 text-muted-foreground/50 transform sm:transform-none rotate-90 sm:rotate-0" />
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-position-midfield text-white flex items-center justify-center text-xs font-bold">3</div>
              <span>Get smart rotation suggestions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Welcome;