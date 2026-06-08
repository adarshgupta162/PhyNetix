-- Base tables for commerce (batches, enrollments, payments, coupons)
-- and live monitoring. These were created in Supabase dashboard but never
-- committed; later migrations ALTER/ reference them and fail on fresh reset.
-- Runs after is_staff() exists (20260109) and before dpps batch_id FK (20260301).

-- =============================================================================
-- 1. BATCHES — test-series product catalog
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  short_description text,
  category text,
  price numeric NOT NULL DEFAULT 0,
  original_price numeric,
  start_date date,
  end_date date,
  enrollment_deadline date,
  max_students integer,
  current_students integer DEFAULT 0,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  features jsonb DEFAULT '[]'::jsonb,
  syllabus jsonb DEFAULT '[]'::jsonb,
  thumbnail_url text,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_batches_active ON public.batches (is_active, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_batches_category ON public.batches (category);

DROP TRIGGER IF EXISTS update_batches_updated_at ON public.batches;
CREATE TRIGGER update_batches_updated_at
  BEFORE UPDATE ON public.batches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.batches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active batches" ON public.batches;
CREATE POLICY "Anyone can view active batches"
  ON public.batches FOR SELECT
  USING (is_active = true OR public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Staff can manage batches" ON public.batches;
CREATE POLICY "Staff can manage batches"
  ON public.batches FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- =============================================================================
-- 2. PAYMENTS — payment gateway transactions
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  currency text DEFAULT 'INR',
  status text DEFAULT 'pending',
  payment_gateway text,
  payment_method text,
  transaction_id text,
  gateway_order_id text,
  gateway_response jsonb,
  refund_amount numeric,
  refund_reason text,
  refunded_at timestamptz,
  refunded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_payments_user ON public.payments (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payments_batch ON public.payments (batch_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments (status);

DROP TRIGGER IF EXISTS update_payments_updated_at ON public.payments;
CREATE TRIGGER update_payments_updated_at
  BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own payments" ON public.payments;
CREATE POLICY "Users can view own payments"
  ON public.payments FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Users can create own payments" ON public.payments;
CREATE POLICY "Users can create own payments"
  ON public.payments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can manage payments" ON public.payments;
CREATE POLICY "Staff can manage payments"
  ON public.payments FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- =============================================================================
-- 3. BATCH ENROLLMENTS — student ↔ batch membership
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.batch_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  enrollment_type text DEFAULT 'paid',
  payment_status text DEFAULT 'pending',
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  is_active boolean DEFAULT false,
  enrolled_at timestamptz DEFAULT now(),
  enrolled_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  expires_at timestamptz,
  notes text,
  UNIQUE (user_id, batch_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_enrollments_user ON public.batch_enrollments (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_batch_enrollments_batch ON public.batch_enrollments (batch_id, is_active);

ALTER TABLE public.batch_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own enrollments" ON public.batch_enrollments;
CREATE POLICY "Users can view own enrollments"
  ON public.batch_enrollments FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Users can create own enrollments" ON public.batch_enrollments;
CREATE POLICY "Users can create own enrollments"
  ON public.batch_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Staff can manage enrollments" ON public.batch_enrollments;
CREATE POLICY "Staff can manage enrollments"
  ON public.batch_enrollments FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- =============================================================================
-- 4. BATCH TESTS — links tests to batches with unlock schedule
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.batch_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  unlock_date timestamptz,
  is_bonus boolean DEFAULT false,
  order_index integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE (batch_id, test_id)
);

CREATE INDEX IF NOT EXISTS idx_batch_tests_batch ON public.batch_tests (batch_id, order_index);
CREATE INDEX IF NOT EXISTS idx_batch_tests_test ON public.batch_tests (test_id);

ALTER TABLE public.batch_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enrolled users can view batch tests" ON public.batch_tests;
CREATE POLICY "Enrolled users can view batch tests"
  ON public.batch_tests FOR SELECT
  USING (
    public.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.batch_enrollments be
      WHERE be.batch_id = batch_tests.batch_id
        AND be.user_id = auth.uid()
        AND be.is_active = true
    )
  );

DROP POLICY IF EXISTS "Staff can manage batch tests" ON public.batch_tests;
CREATE POLICY "Staff can manage batch tests"
  ON public.batch_tests FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- =============================================================================
-- 5. COUPONS & COUPON USAGE — discount codes
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  description text,
  discount_type text DEFAULT 'percentage',
  discount_value numeric NOT NULL,
  max_uses integer,
  current_uses integer DEFAULT 0,
  min_purchase_amount numeric,
  applicable_batches uuid[],
  valid_from timestamptz,
  valid_until timestamptz,
  is_active boolean DEFAULT true,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_coupons_code ON public.coupons (upper(code));
CREATE INDEX IF NOT EXISTS idx_coupons_active ON public.coupons (is_active, valid_until);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active coupons" ON public.coupons;
CREATE POLICY "Anyone can view active coupons"
  ON public.coupons FOR SELECT
  USING (is_active = true OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can manage coupons" ON public.coupons;
CREATE POLICY "Staff can manage coupons"
  ON public.coupons FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

CREATE TABLE IF NOT EXISTS public.coupon_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id uuid NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payment_id uuid REFERENCES public.payments(id) ON DELETE SET NULL,
  used_at timestamptz DEFAULT now(),
  UNIQUE (coupon_id, user_id, payment_id)
);

CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon ON public.coupon_usage (coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user ON public.coupon_usage (user_id);

ALTER TABLE public.coupon_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own coupon usage" ON public.coupon_usage;
CREATE POLICY "Users can view own coupon usage"
  ON public.coupon_usage FOR SELECT
  USING (auth.uid() = user_id OR public.is_staff(auth.uid()));

DROP POLICY IF EXISTS "Staff can manage coupon usage" ON public.coupon_usage;
CREATE POLICY "Staff can manage coupon usage"
  ON public.coupon_usage FOR ALL
  USING (public.is_staff(auth.uid()))
  WITH CHECK (public.is_staff(auth.uid()));

-- =============================================================================
-- 6. MONITORING SESSIONS & EVENTS — live proctoring (frontend path)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.monitoring_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id uuid REFERENCES public.test_attempts(id) ON DELETE CASCADE,
  student_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id uuid REFERENCES public.tests(id) ON DELETE SET NULL,
  student_name text,
  test_name text,
  status text DEFAULT 'active',
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  last_heartbeat_at timestamptz,
  cf_session_id text,
  cf_camera_track text,
  cf_microphone_track text,
  cf_screen_track text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_attempt ON public.monitoring_sessions (attempt_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_student ON public.monitoring_sessions (student_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_test ON public.monitoring_sessions (test_id);
CREATE INDEX IF NOT EXISTS idx_monitoring_sessions_status ON public.monitoring_sessions (status, started_at DESC);

ALTER TABLE public.monitoring_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_all_monitoring_sessions ON public.monitoring_sessions;
CREATE POLICY allow_all_monitoring_sessions
  ON public.monitoring_sessions FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.monitoring_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid REFERENCES public.monitoring_sessions(id) ON DELETE CASCADE,
  event_type text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_monitoring_events_session ON public.monitoring_events (session_id, created_at DESC);

ALTER TABLE public.monitoring_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS allow_all_monitoring_events ON public.monitoring_events;
CREATE POLICY allow_all_monitoring_events
  ON public.monitoring_events FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- =============================================================================
-- 7. HELPER FUNCTIONS — referenced by later migrations / RLS
-- =============================================================================
CREATE OR REPLACE FUNCTION public.is_enrolled_in_batch(_user_id uuid, _batch_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.batch_enrollments
    WHERE user_id = _user_id
      AND batch_id = _batch_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > now())
  );
$$;

CREATE OR REPLACE FUNCTION public.has_test_access(_user_id uuid, _test_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'admin'::app_role)
    OR public.is_staff(_user_id)
    OR EXISTS (
      SELECT 1
      FROM public.batch_tests bt
      JOIN public.batch_enrollments be ON be.batch_id = bt.batch_id
      WHERE bt.test_id = _test_id
        AND be.user_id = _user_id
        AND be.is_active = true
        AND (be.expires_at IS NULL OR be.expires_at > now())
        AND (bt.unlock_date IS NULL OR bt.unlock_date <= now())
    )
    OR EXISTS (
      SELECT 1 FROM public.tests t
      WHERE t.id = _test_id AND t.is_published = true
        AND NOT EXISTS (SELECT 1 FROM public.batch_tests WHERE test_id = _test_id)
    );
$$;
