-- Add missing columns to test_section_questions for image and solution support
ALTER TABLE public.test_section_questions 
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS solution_text TEXT,
ADD COLUMN IF NOT EXISTS solution_image_url TEXT,
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium',
ADD COLUMN IF NOT EXISTS time_seconds INTEGER;