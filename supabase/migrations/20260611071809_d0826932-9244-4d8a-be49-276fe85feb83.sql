-- batches
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS instructions text,
  ADD COLUMN IF NOT EXISTS welcome_message text;

-- batch_enrollments
ALTER TABLE public.batch_enrollments
  ADD COLUMN IF NOT EXISTS enrolled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS notes text;

-- proctoring_test_settings
ALTER TABLE public.proctoring_test_settings
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- proctoring_user_overrides
ALTER TABLE public.proctoring_user_overrides
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- monitoring_sessions
ALTER TABLE public.monitoring_sessions
  ADD COLUMN IF NOT EXISTS ended_at timestamptz,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}'::jsonb;

-- phynetix_library
ALTER TABLE public.phynetix_library
  ALTER COLUMN title DROP NOT NULL,
  ADD COLUMN IF NOT EXISTS usage_count integer NOT NULL DEFAULT 0;

-- test_section_questions
ALTER TABLE public.test_section_questions
  ADD COLUMN IF NOT EXISTS chapter text,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS library_question_id uuid REFERENCES public.phynetix_library(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'mcq';

-- payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS transaction_id text,
  ADD COLUMN IF NOT EXISTS payment_method text;

-- dpp_questions: keep order_index in sync with sort_order
ALTER TABLE public.dpp_questions
  ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;
