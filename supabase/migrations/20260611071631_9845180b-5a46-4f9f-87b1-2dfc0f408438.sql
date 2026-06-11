-- Extra app_role enum values
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='academic_admin' AND enumtypid='public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'academic_admin';
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='operations_admin' AND enumtypid='public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'operations_admin';
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='finance_admin' AND enumtypid='public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'finance_admin';
  END IF;
END$$;
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel='marketing_admin' AND enumtypid='public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'marketing_admin';
  END IF;
END$$;

-- batches
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS current_students integer DEFAULT 0;

-- phynetix_library: extend to act as question bank too
ALTER TABLE public.phynetix_library
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS library_id uuid,
  ADD COLUMN IF NOT EXISTS chapter text,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS question_text text,
  ADD COLUMN IF NOT EXISTS question_image_url text,
  ADD COLUMN IF NOT EXISTS options jsonb,
  ADD COLUMN IF NOT EXISTS correct_answer jsonb,
  ADD COLUMN IF NOT EXISTS question_type text,
  ADD COLUMN IF NOT EXISTS marks integer DEFAULT 4,
  ADD COLUMN IF NOT EXISTS negative_marks integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS difficulty text,
  ADD COLUMN IF NOT EXISTS time_seconds integer DEFAULT 120,
  ADD COLUMN IF NOT EXISTS solution_text text,
  ADD COLUMN IF NOT EXISTS solution_image_url text;

-- test_user_overrides
ALTER TABLE public.test_user_overrides
  ADD COLUMN IF NOT EXISTS submit_disabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS result_release_delay_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- proctoring_test_settings
ALTER TABLE public.proctoring_test_settings
  ADD COLUMN IF NOT EXISTS screenshot_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS screenshot_interval_seconds integer NOT NULL DEFAULT 120;

-- payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS refund_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS refunded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;
