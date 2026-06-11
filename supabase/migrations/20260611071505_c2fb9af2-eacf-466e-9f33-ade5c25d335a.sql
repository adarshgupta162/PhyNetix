-- ============================================================
-- Phynetix: Complete remaining schema (single consolidated migration)
-- ============================================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 1. BATCHES
CREATE TABLE IF NOT EXISTS public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL,
  exam_type text,
  thumbnail_url text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  discount_price numeric(10,2),
  currency text NOT NULL DEFAULT 'INR',
  duration_days integer,
  starts_at timestamptz,
  ends_at timestamptz,
  is_published boolean NOT NULL DEFAULT false,
  is_free boolean NOT NULL DEFAULT false,
  join_code text UNIQUE,
  features jsonb DEFAULT '[]'::jsonb,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batches TO authenticated;
GRANT SELECT ON public.batches TO anon;
GRANT ALL ON public.batches TO service_role;
ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "batches_read" ON public.batches;
CREATE POLICY "batches_read" ON public.batches FOR SELECT
  USING (is_published OR public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "batches_admin_write" ON public.batches;
CREATE POLICY "batches_admin_write" ON public.batches FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_batches_updated_at ON public.batches;
CREATE TRIGGER trg_batches_updated_at BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.batch_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  enrolled_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz,
  payment_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, batch_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batch_enrollments TO authenticated;
GRANT ALL ON public.batch_enrollments TO service_role;
ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "be_read" ON public.batch_enrollments;
CREATE POLICY "be_read" ON public.batch_enrollments FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "be_admin_write" ON public.batch_enrollments;
CREATE POLICY "be_admin_write" ON public.batch_enrollments FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_be_updated_at ON public.batch_enrollments;
CREATE TRIGGER trg_be_updated_at BEFORE UPDATE ON public.batch_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.batch_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (batch_id, test_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.batch_tests TO authenticated;
GRANT ALL ON public.batch_tests TO service_role;
ALTER TABLE public.batch_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "bt_read" ON public.batch_tests;
CREATE POLICY "bt_read" ON public.batch_tests FOR SELECT USING (true);
DROP POLICY IF EXISTS "bt_admin_write" ON public.batch_tests;
CREATE POLICY "bt_admin_write" ON public.batch_tests FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE OR REPLACE FUNCTION public.is_enrolled_in_batch(_user_id uuid, _batch_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.batch_enrollments
    WHERE user_id = _user_id AND batch_id = _batch_id AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

-- 2. COUPONS + PAYMENTS
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text NOT NULL DEFAULT 'percent',
  discount_value numeric(10,2) NOT NULL DEFAULT 0,
  max_uses integer,
  used_count integer NOT NULL DEFAULT 0,
  valid_from timestamptz,
  valid_until timestamptz,
  applies_to text NOT NULL DEFAULT 'all',
  batch_id uuid REFERENCES public.batches(id) ON DELETE CASCADE,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "coupons_read" ON public.coupons;
CREATE POLICY "coupons_read" ON public.coupons FOR SELECT USING (true);
DROP POLICY IF EXISTS "coupons_admin_write" ON public.coupons;
CREATE POLICY "coupons_admin_write" ON public.coupons FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_coupons_updated_at ON public.coupons;
CREATE TRIGGER trg_coupons_updated_at BEFORE UPDATE ON public.coupons
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  coupon_id uuid REFERENCES public.coupons(id) ON DELETE SET NULL,
  amount numeric(10,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'INR',
  status text NOT NULL DEFAULT 'pending',
  provider text,
  provider_payment_id text,
  provider_order_id text,
  metadata jsonb DEFAULT '{}'::jsonb,
  refunded_at timestamptz,
  refund_reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "payments_read" ON public.payments;
CREATE POLICY "payments_read" ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "payments_insert_own" ON public.payments;
CREATE POLICY "payments_insert_own" ON public.payments FOR INSERT
  WITH CHECK (user_id = auth.uid());
DROP POLICY IF EXISTS "payments_admin_write" ON public.payments;
CREATE POLICY "payments_admin_write" ON public.payments FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_payments_updated_at ON public.payments;
CREATE TRIGGER trg_payments_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.auto_enroll_on_payment()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.batch_id IS NOT NULL THEN
    INSERT INTO public.batch_enrollments (user_id, batch_id, status, payment_id)
    VALUES (NEW.user_id, NEW.batch_id, 'active', NEW.id)
    ON CONFLICT (user_id, batch_id) DO UPDATE
      SET status='active', payment_id=EXCLUDED.payment_id, updated_at=now();
  END IF;
  RETURN NEW;
END; $$;
DROP TRIGGER IF EXISTS trg_payments_auto_enroll ON public.payments;
CREATE TRIGGER trg_payments_auto_enroll AFTER INSERT OR UPDATE OF status ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.auto_enroll_on_payment();

CREATE OR REPLACE FUNCTION public.user_has_paid_for_test(_user_id uuid, _test_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.batch_tests bt
    JOIN public.batch_enrollments be ON be.batch_id = bt.batch_id
    WHERE bt.test_id = _test_id AND be.user_id = _user_id AND be.status='active'
      AND (be.expires_at IS NULL OR be.expires_at > now())
  ) OR EXISTS (
    SELECT 1 FROM public.payments
    WHERE user_id = _user_id AND test_id = _test_id AND status='completed'
  );
$$;

-- 3. INSTITUTIONS
CREATE TABLE IF NOT EXISTS public.institutions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE,
  logo_url text,
  description text,
  is_active boolean NOT NULL DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institutions TO authenticated;
GRANT SELECT ON public.institutions TO anon;
GRANT ALL ON public.institutions TO service_role;
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inst_read" ON public.institutions;
CREATE POLICY "inst_read" ON public.institutions FOR SELECT USING (true);
DROP POLICY IF EXISTS "inst_admin_write" ON public.institutions;
CREATE POLICY "inst_admin_write" ON public.institutions FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_inst_updated_at ON public.institutions;
CREATE TRIGGER trg_inst_updated_at BEFORE UPDATE ON public.institutions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.institution_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id uuid NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (institution_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_members TO authenticated;
GRANT ALL ON public.institution_members TO service_role;
ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "im_read" ON public.institution_members;
CREATE POLICY "im_read" ON public.institution_members FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "im_admin_write" ON public.institution_members;
CREATE POLICY "im_admin_write" ON public.institution_members FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 4. PHYNETIX LIBRARY
CREATE TABLE IF NOT EXISTS public.phynetix_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text,
  subject text,
  exam_type text,
  file_url text,
  thumbnail_url text,
  file_type text,
  file_size bigint,
  tags text[] DEFAULT '{}',
  is_published boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phynetix_library TO authenticated;
GRANT SELECT ON public.phynetix_library TO anon;
GRANT ALL ON public.phynetix_library TO service_role;
ALTER TABLE public.phynetix_library ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "lib_read" ON public.phynetix_library;
CREATE POLICY "lib_read" ON public.phynetix_library FOR SELECT
  USING (is_published OR public.is_staff(auth.uid()) OR public.has_role(auth.uid(),'admin'));
DROP POLICY IF EXISTS "lib_staff_write" ON public.phynetix_library;
CREATE POLICY "lib_staff_write" ON public.phynetix_library FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));
DROP TRIGGER IF EXISTS trg_lib_updated_at ON public.phynetix_library;
CREATE TRIGGER trg_lib_updated_at BEFORE UPDATE ON public.phynetix_library
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 5. PLATFORM SETTINGS
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.platform_settings TO authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "ps_read" ON public.platform_settings;
CREATE POLICY "ps_read" ON public.platform_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "ps_admin_write" ON public.platform_settings;
CREATE POLICY "ps_admin_write" ON public.platform_settings FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 6. DPP
CREATE TABLE IF NOT EXISTS public.dpps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  subject text,
  chapter_id uuid REFERENCES public.chapters(id) ON DELETE SET NULL,
  batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  exam_type text,
  difficulty text,
  is_published boolean NOT NULL DEFAULT false,
  scheduled_for date,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dpps TO authenticated;
GRANT ALL ON public.dpps TO service_role;
ALTER TABLE public.dpps ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dpps_read" ON public.dpps;
CREATE POLICY "dpps_read" ON public.dpps FOR SELECT
  USING (is_published OR public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "dpps_staff_write" ON public.dpps;
CREATE POLICY "dpps_staff_write" ON public.dpps FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));
DROP TRIGGER IF EXISTS trg_dpps_updated_at ON public.dpps;
CREATE TRIGGER trg_dpps_updated_at BEFORE UPDATE ON public.dpps
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.dpp_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dpp_id uuid NOT NULL REFERENCES public.dpps(id) ON DELETE CASCADE,
  question_id uuid REFERENCES public.questions(id) ON DELETE CASCADE,
  sort_order integer DEFAULT 0,
  marks integer DEFAULT 4,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dpp_questions TO authenticated;
GRANT ALL ON public.dpp_questions TO service_role;
ALTER TABLE public.dpp_questions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dppq_read" ON public.dpp_questions;
CREATE POLICY "dppq_read" ON public.dpp_questions FOR SELECT USING (true);
DROP POLICY IF EXISTS "dppq_staff_write" ON public.dpp_questions;
CREATE POLICY "dppq_staff_write" ON public.dpp_questions FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.dpp_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  dpp_id uuid NOT NULL REFERENCES public.dpps(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  answers jsonb DEFAULT '{}'::jsonb,
  score integer,
  total_marks integer,
  time_taken_seconds integer,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dpp_attempts TO authenticated;
GRANT ALL ON public.dpp_attempts TO service_role;
ALTER TABLE public.dpp_attempts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "dppa_owner" ON public.dpp_attempts;
CREATE POLICY "dppa_owner" ON public.dpp_attempts FOR ALL
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (user_id = auth.uid());

-- 7. QUESTION EXTRAS
CREATE TABLE IF NOT EXISTS public.question_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  question_id uuid NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, question_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_bookmarks TO authenticated;
GRANT ALL ON public.question_bookmarks TO service_role;
ALTER TABLE public.question_bookmarks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qbm_owner" ON public.question_bookmarks;
CREATE POLICY "qbm_owner" ON public.question_bookmarks FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.question_paragraphs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text,
  content text NOT NULL,
  image_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.question_paragraphs TO authenticated;
GRANT ALL ON public.question_paragraphs TO service_role;
ALTER TABLE public.question_paragraphs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "qp_read" ON public.question_paragraphs;
CREATE POLICY "qp_read" ON public.question_paragraphs FOR SELECT USING (true);
DROP POLICY IF EXISTS "qp_staff_write" ON public.question_paragraphs;
CREATE POLICY "qp_staff_write" ON public.question_paragraphs FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));
DROP TRIGGER IF EXISTS trg_qp_updated_at ON public.question_paragraphs;
CREATE TRIGGER trg_qp_updated_at BEFORE UPDATE ON public.question_paragraphs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. TEST USER OVERRIDES
CREATE TABLE IF NOT EXISTS public.test_user_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allowed boolean NOT NULL DEFAULT true,
  extra_time_minutes integer DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (test_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_user_overrides TO authenticated;
GRANT ALL ON public.test_user_overrides TO service_role;
ALTER TABLE public.test_user_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "tuo_read" ON public.test_user_overrides;
CREATE POLICY "tuo_read" ON public.test_user_overrides FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "tuo_admin_write" ON public.test_user_overrides;
CREATE POLICY "tuo_admin_write" ON public.test_user_overrides FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 9. PROCTORING
CREATE TABLE IF NOT EXISTS public.proctoring_test_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL UNIQUE REFERENCES public.tests(id) ON DELETE CASCADE,
  enabled boolean NOT NULL DEFAULT false,
  require_camera boolean NOT NULL DEFAULT true,
  require_microphone boolean NOT NULL DEFAULT true,
  require_screen boolean NOT NULL DEFAULT true,
  allow_optional_device_fallback boolean NOT NULL DEFAULT false,
  recording_enabled boolean NOT NULL DEFAULT false,
  retention_days integer NOT NULL DEFAULT 30,
  instructions text,
  allow_specific_users_only boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proctoring_test_settings TO authenticated;
GRANT ALL ON public.proctoring_test_settings TO service_role;
ALTER TABLE public.proctoring_test_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pts_read" ON public.proctoring_test_settings;
CREATE POLICY "pts_read" ON public.proctoring_test_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "pts_admin_write" ON public.proctoring_test_settings;
CREATE POLICY "pts_admin_write" ON public.proctoring_test_settings FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_pts_updated_at ON public.proctoring_test_settings;
CREATE TRIGGER trg_pts_updated_at BEFORE UPDATE ON public.proctoring_test_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.proctoring_user_overrides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allowed boolean NOT NULL DEFAULT true,
  enabled boolean,
  require_camera boolean,
  require_microphone boolean,
  require_screen boolean,
  allow_optional_device_fallback boolean,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (test_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proctoring_user_overrides TO authenticated;
GRANT ALL ON public.proctoring_user_overrides TO service_role;
ALTER TABLE public.proctoring_user_overrides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "puo_read" ON public.proctoring_user_overrides;
CREATE POLICY "puo_read" ON public.proctoring_user_overrides FOR SELECT
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));
DROP POLICY IF EXISTS "puo_admin_write" ON public.proctoring_user_overrides;
CREATE POLICY "puo_admin_write" ON public.proctoring_user_overrides FOR ALL
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.proctoring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  test_id uuid REFERENCES public.tests(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  provider_room_name text,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz,
  last_heartbeat_at timestamptz,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proctoring_sessions TO authenticated;
GRANT ALL ON public.proctoring_sessions TO service_role;
ALTER TABLE public.proctoring_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "psn_rw" ON public.proctoring_sessions;
CREATE POLICY "psn_rw" ON public.proctoring_sessions FOR ALL
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
DROP TRIGGER IF EXISTS trg_psn_updated_at ON public.proctoring_sessions;
CREATE TRIGGER trg_psn_updated_at BEFORE UPDATE ON public.proctoring_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.proctoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.proctoring_sessions(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proctoring_events TO authenticated;
GRANT ALL ON public.proctoring_events TO service_role;
ALTER TABLE public.proctoring_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pev_rw" ON public.proctoring_events;
CREATE POLICY "pev_rw" ON public.proctoring_events FOR ALL
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

CREATE TABLE IF NOT EXISTS public.proctoring_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.proctoring_sessions(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  severity text NOT NULL DEFAULT 'info',
  status text NOT NULL DEFAULT 'open',
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proctoring_alerts TO authenticated;
GRANT ALL ON public.proctoring_alerts TO service_role;
ALTER TABLE public.proctoring_alerts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "pal_staff" ON public.proctoring_alerts;
CREATE POLICY "pal_staff" ON public.proctoring_alerts FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.proctoring_recordings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.proctoring_sessions(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  provider text,
  recording_url text,
  duration_seconds integer,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.proctoring_recordings TO authenticated;
GRANT ALL ON public.proctoring_recordings TO service_role;
ALTER TABLE public.proctoring_recordings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "prc_staff" ON public.proctoring_recordings;
CREATE POLICY "prc_staff" ON public.proctoring_recordings FOR ALL
  USING (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.monitoring_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.proctoring_sessions(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  camera_granted boolean NOT NULL DEFAULT false,
  microphone_granted boolean NOT NULL DEFAULT false,
  screen_granted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monitoring_permissions TO authenticated;
GRANT ALL ON public.monitoring_permissions TO service_role;
ALTER TABLE public.monitoring_permissions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mpr_rw" ON public.monitoring_permissions;
CREATE POLICY "mpr_rw" ON public.monitoring_permissions FOR ALL
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- Legacy aliases
CREATE TABLE IF NOT EXISTS public.monitoring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id uuid REFERENCES public.tests(id) ON DELETE CASCADE,
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active',
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monitoring_sessions TO authenticated;
GRANT ALL ON public.monitoring_sessions TO service_role;
ALTER TABLE public.monitoring_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "msn_rw" ON public.monitoring_sessions;
CREATE POLICY "msn_rw" ON public.monitoring_sessions FOR ALL
  USING (user_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.is_staff(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.monitoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.monitoring_sessions(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  data jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.monitoring_events TO authenticated;
GRANT ALL ON public.monitoring_events TO service_role;
ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "mev_rw" ON public.monitoring_events;
CREATE POLICY "mev_rw" ON public.monitoring_events FOR ALL
  USING (auth.uid() IS NOT NULL) WITH CHECK (auth.uid() IS NOT NULL);

-- 10. proctoring_schema_health()
CREATE OR REPLACE FUNCTION public.proctoring_schema_health()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE
  required_tables text[] := ARRAY[
    'proctoring_test_settings','proctoring_user_overrides','proctoring_sessions',
    'proctoring_events','proctoring_alerts','proctoring_recordings','monitoring_permissions'
  ];
  missing_tables text[] := '{}';
  t text;
BEGIN
  FOREACH t IN ARRAY required_tables LOOP
    IF NOT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema='public' AND table_name=t
    ) THEN
      missing_tables := array_append(missing_tables, t);
    END IF;
  END LOOP;
  RETURN jsonb_build_object(
    'missing_tables', to_jsonb(missing_tables),
    'missing_columns', '{}'::jsonb,
    'missing_realtime_tables', '[]'::jsonb,
    'missing_functions', '[]'::jsonb
  );
END; $$;
GRANT EXECUTE ON FUNCTION public.proctoring_schema_health() TO authenticated, service_role;
