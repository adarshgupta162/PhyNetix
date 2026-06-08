-- Add time_per_question column to store time spent on each question
ALTER TABLE public.test_attempts 
ADD COLUMN IF NOT EXISTS time_per_question JSONB DEFAULT '{}';