ALTER TABLE public.test_attempts
  ADD COLUMN IF NOT EXISTS last_submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS reopened_at timestamptz;

ALTER TABLE public.monitoring_events
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;
