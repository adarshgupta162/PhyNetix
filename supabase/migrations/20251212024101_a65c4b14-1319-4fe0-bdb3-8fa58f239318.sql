-- Add roll_number to profiles table for permanent student roll numbers
ALTER TABLE public.profiles
ADD COLUMN roll_number TEXT UNIQUE;

-- Create function to generate roll number on profile creation
CREATE OR REPLACE FUNCTION public.generate_roll_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_roll_number TEXT;
BEGIN
  -- Generate roll number: DDMMYY + 4 random digits
  new_roll_number := TO_CHAR(NOW(), 'DDMMYY') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  
  -- Keep generating until we get a unique one
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE roll_number = new_roll_number) LOOP
    new_roll_number := TO_CHAR(NOW(), 'DDMMYY') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END LOOP;
  
  NEW.roll_number := new_roll_number;
  RETURN NEW;
END;
$$;

-- Create trigger to auto-generate roll number for new profiles
CREATE TRIGGER generate_profile_roll_number
BEFORE INSERT ON public.profiles
FOR EACH ROW
WHEN (NEW.roll_number IS NULL)
EXECUTE FUNCTION public.generate_roll_number();