-- Add image_url column to questions table for normal tests
ALTER TABLE public.questions 
ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;

-- Add a comment for clarity
COMMENT ON COLUMN public.questions.image_url IS 'URL path to image stored in Supabase storage for image-based questions';