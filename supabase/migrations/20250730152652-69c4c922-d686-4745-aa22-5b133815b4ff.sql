-- Create feedback tracking table for AI rotation suggestions
CREATE TABLE public.rotation_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  suggestion_id TEXT NOT NULL,
  feedback_type TEXT NOT NULL CHECK (feedback_type IN ('thumbs_up', 'thumbs_down')),
  suggestion_data JSONB NOT NULL,
  game_context JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rotation_feedback ENABLE ROW LEVEL SECURITY;

-- Create policy for inserting feedback (public access for now since no auth)
CREATE POLICY "Anyone can insert rotation feedback" 
ON public.rotation_feedback 
FOR INSERT 
WITH CHECK (true);

-- Create policy for reading feedback (public access for analytics)
CREATE POLICY "Anyone can read rotation feedback" 
ON public.rotation_feedback 
FOR SELECT 
USING (true);

-- Create index for better query performance
CREATE INDEX idx_rotation_feedback_suggestion_id ON public.rotation_feedback(suggestion_id);
CREATE INDEX idx_rotation_feedback_type ON public.rotation_feedback(feedback_type);
CREATE INDEX idx_rotation_feedback_created_at ON public.rotation_feedback(created_at);

-- Create coach preferences table
CREATE TABLE public.coach_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  preference_key TEXT NOT NULL,
  preference_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for coach preferences
ALTER TABLE public.coach_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for coach preferences
CREATE POLICY "Anyone can read coach preferences" 
ON public.coach_preferences 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert coach preferences" 
ON public.coach_preferences 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update coach preferences" 
ON public.coach_preferences 
FOR UPDATE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_coach_preferences_updated_at
BEFORE UPDATE ON public.coach_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();