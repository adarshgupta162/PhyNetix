-- Add INSERT policy for profiles table
CREATE POLICY "Users can create own profile" 
ON public.profiles FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = id);