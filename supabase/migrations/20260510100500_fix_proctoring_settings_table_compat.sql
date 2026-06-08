-- Fix legacy typo: protecting_test_settings -> proctoring_test_settings
DO $$
BEGIN
  IF to_regclass('public.proctoring_test_settings') IS NULL
     AND to_regclass('public.protecting_test_settings') IS NOT NULL THEN
    ALTER TABLE public.protecting_test_settings RENAME TO proctoring_test_settings;
  END IF;
END
$$;

-- Ensure canonical table exists for monitoring settings
CREATE TABLE IF NOT EXISTS public.proctoring_test_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE UNIQUE,
  enabled boolean NOT NULL DEFAULT false,
  allow_specific_users_only boolean NOT NULL DEFAULT false,
  require_camera boolean NOT NULL DEFAULT true,
  require_microphone boolean NOT NULL DEFAULT true,
  require_screen boolean NOT NULL DEFAULT true,
  allow_optional_device_fallback boolean NOT NULL DEFAULT false,
  recording_enabled boolean NOT NULL DEFAULT false,
  retention_days integer NOT NULL DEFAULT 30 CHECK (retention_days BETWEEN 1 AND 3650),
  instructions text,
  created_by uuid REFERENCES auth.users(id),
  updated_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proctoring_settings_test_id ON public.proctoring_test_settings(test_id);

ALTER TABLE public.proctoring_test_settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'proctoring_test_settings'
      AND policyname = 'Admins manage proctoring settings'
  ) THEN
    CREATE POLICY "Admins manage proctoring settings" ON public.proctoring_test_settings
      FOR ALL USING (public.has_role(auth.uid(), 'admin'::app_role))
      WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'proctoring_test_settings'
      AND policyname = 'Students view published proctoring settings'
  ) THEN
    CREATE POLICY "Students view published proctoring settings" ON public.proctoring_test_settings
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM public.tests
          WHERE tests.id = proctoring_test_settings.test_id
          AND (tests.is_published = true OR public.has_role(auth.uid(), 'admin'::app_role))
        )
      );
  END IF;
END
$$;

DO $$
BEGIN
  IF to_regprocedure('public.touch_proctoring_updated_at()') IS NOT NULL
     AND NOT EXISTS (
       SELECT 1 FROM pg_trigger
       WHERE tgname = 'touch_proctoring_test_settings_updated_at'
     ) THEN
    CREATE TRIGGER touch_proctoring_test_settings_updated_at
      BEFORE UPDATE ON public.proctoring_test_settings
      FOR EACH ROW EXECUTE FUNCTION public.touch_proctoring_updated_at();
  END IF;
END
$$;
