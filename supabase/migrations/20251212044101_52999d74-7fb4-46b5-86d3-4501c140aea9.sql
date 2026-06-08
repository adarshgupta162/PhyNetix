-- Add bonus column to test_section_questions
ALTER TABLE public.test_section_questions
ADD COLUMN IF NOT EXISTS is_bonus boolean DEFAULT false;