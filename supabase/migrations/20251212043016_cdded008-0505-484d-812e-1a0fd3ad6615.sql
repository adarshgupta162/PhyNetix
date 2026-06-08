-- Add new columns to tests table for scheduling, fullscreen control, and answer key management
ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS fullscreen_enabled boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS answer_key_uploaded boolean DEFAULT true;

-- Update JEE Mains integer marking scheme (negative marks to 1)
-- This is handled in code, no schema change needed

-- Add awaiting_result state to test_attempts
ALTER TABLE public.test_attempts
ADD COLUMN IF NOT EXISTS awaiting_result boolean DEFAULT false;