-- Update existing tables to add user_id columns and fix RLS policies
-- This migration secures the database by adding user context and proper RLS policies

-- Add user_id column to coach_preferences table
ALTER TABLE public.coach_preferences 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Add user_id column to rotation_feedback table  
ALTER TABLE public.rotation_feedback
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Create profiles table for user data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing public RLS policies on coach_preferences
DROP POLICY IF EXISTS "Anyone can insert coach preferences" ON public.coach_preferences;
DROP POLICY IF EXISTS "Anyone can read coach preferences" ON public.coach_preferences;
DROP POLICY IF EXISTS "Anyone can update coach preferences" ON public.coach_preferences;

-- Drop existing public RLS policies on rotation_feedback
DROP POLICY IF EXISTS "Anyone can insert rotation feedback" ON public.rotation_feedback;
DROP POLICY IF EXISTS "Anyone can read rotation feedback" ON public.rotation_feedback;

-- Create secure RLS policies for coach_preferences
CREATE POLICY "Users can manage own preferences" 
ON public.coach_preferences 
FOR ALL 
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create secure RLS policies for rotation_feedback
CREATE POLICY "Users can manage own feedback"
ON public.rotation_feedback
FOR ALL
TO authenticated  
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for profiles
CREATE POLICY "Users can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" 
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.email)
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create updated_at trigger for profiles
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();