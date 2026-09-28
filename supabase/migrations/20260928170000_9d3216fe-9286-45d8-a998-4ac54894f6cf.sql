ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
COMMENT ON COLUMN public.profiles.country IS 'Student country used for profile and checkout details';