-- =========================================================
-- 1. INSTITUTIONS: tenant lifecycle + branding
-- =========================================================
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'institution_status') THEN
    CREATE TYPE public.institution_status AS ENUM ('pending','active','rejected','suspended');
  END IF;
END $$;

ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS status public.institution_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS contact_email text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS country text DEFAULT 'India',
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS primary_color text,
  ADD COLUMN IF NOT EXISTS secondary_color text,
  ADD COLUMN IF NOT EXISTS welcome_message text,
  ADD COLUMN IF NOT EXISTS rejection_reason text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid,
  ADD COLUMN IF NOT EXISTS owner_user_id uuid,
  ADD COLUMN IF NOT EXISTS last_activity_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS institutions_code_key ON public.institutions (upper(code));
CREATE UNIQUE INDEX IF NOT EXISTS institutions_slug_key ON public.institutions (lower(slug));
CREATE INDEX IF NOT EXISTS institutions_status_idx ON public.institutions (status);

-- =========================================================
-- 2. Human readable code generator (shared)
-- =========================================================
CREATE OR REPLACE FUNCTION public.gen_readable_code(_len int DEFAULT 8)
RETURNS text
LANGUAGE plpgsql
VOLATILE
SET search_path = public
AS $$
DECLARE
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no I,O,0,1
  out text := '';
  i int;
BEGIN
  FOR i IN 1.._len LOOP
    out := out || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
  END LOOP;
  RETURN out;
END $$;

CREATE OR REPLACE FUNCTION public.set_institution_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c text; n int := 0;
BEGIN
  IF NEW.code IS NOT NULL AND NEW.code <> '' THEN
    NEW.code := upper(NEW.code);
    RETURN NEW;
  END IF;
  LOOP
    c := public.gen_readable_code(6);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.institutions WHERE upper(code) = c);
    n := n + 1; EXIT WHEN n > 20;
  END LOOP;
  NEW.code := c;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_institution_code ON public.institutions;
CREATE TRIGGER trg_institution_code BEFORE INSERT ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.set_institution_code();

UPDATE public.institutions SET code = public.gen_readable_code(6) WHERE code IS NULL;

-- =========================================================
-- 3. INSTITUTION MEMBERS: staff + permissions
-- =========================================================
ALTER TABLE public.institution_members
  ADD COLUMN IF NOT EXISTS is_primary boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS permissions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS institution_members_unique
  ON public.institution_members (institution_id, user_id);
CREATE INDEX IF NOT EXISTS institution_members_user_idx ON public.institution_members (user_id);

-- =========================================================
-- 4. TENANT OWNERSHIP COLUMNS ON EXISTING TABLES
-- =========================================================
ALTER TABLE public.batches          ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE;
ALTER TABLE public.tests            ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE;
ALTER TABLE public.phynetix_library ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE;
ALTER TABLE public.dpps             ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE CASCADE;
ALTER TABLE public.audit_logs       ADD COLUMN IF NOT EXISTS institution_id uuid REFERENCES public.institutions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS batches_institution_idx  ON public.batches (institution_id);
CREATE INDEX IF NOT EXISTS tests_institution_idx    ON public.tests (institution_id);
CREATE INDEX IF NOT EXISTS library_institution_idx  ON public.phynetix_library (institution_id);
CREATE INDEX IF NOT EXISTS dpps_institution_idx     ON public.dpps (institution_id);
CREATE INDEX IF NOT EXISTS audit_institution_idx    ON public.audit_logs (institution_id);
CREATE INDEX IF NOT EXISTS batch_enrollments_batch_idx ON public.batch_enrollments (batch_id);

-- =========================================================
-- 5. BATCH JOIN CODES (globally unique, regeneratable)
-- =========================================================
CREATE UNIQUE INDEX IF NOT EXISTS batches_join_code_key ON public.batches (upper(join_code)) WHERE join_code IS NOT NULL;

CREATE OR REPLACE FUNCTION public.set_batch_join_code()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE c text; n int := 0;
BEGIN
  IF NEW.join_code IS NOT NULL AND NEW.join_code <> '' THEN
    NEW.join_code := upper(NEW.join_code);
    RETURN NEW;
  END IF;
  LOOP
    c := public.gen_readable_code(8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.batches WHERE upper(join_code) = c);
    n := n + 1; EXIT WHEN n > 25;
  END LOOP;
  NEW.join_code := c;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_batch_join_code ON public.batches;
CREATE TRIGGER trg_batch_join_code BEFORE INSERT ON public.batches
FOR EACH ROW EXECUTE FUNCTION public.set_batch_join_code();

UPDATE public.batches SET join_code = public.gen_readable_code(8) WHERE join_code IS NULL OR join_code = '';

-- =========================================================
-- 6. TENANT CONTEXT HELPERS (server-derived, never client)
-- =========================================================
CREATE OR REPLACE FUNCTION public.get_user_institution_id()
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT m.institution_id
  FROM public.institution_members m
  WHERE m.user_id = auth.uid() AND m.status = 'active'
  ORDER BY (m.role = 'owner') DESC, m.is_primary DESC, m.created_at ASC
  LIMIT 1
$$;

CREATE OR REPLACE FUNCTION public.is_institution_member(_institution_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _institution_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE institution_id = _institution_id AND user_id = auth.uid() AND status = 'active'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_institution_admin(_institution_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT _institution_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE institution_id = _institution_id AND user_id = auth.uid()
      AND status = 'active' AND role IN ('owner','admin')
  )
$$;

CREATE OR REPLACE FUNCTION public.institution_is_active(_institution_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.institutions WHERE id = _institution_id AND status = 'active')
$$;

-- institute admin allowed to WRITE inside a tenant (blocked while suspended)
CREATE OR REPLACE FUNCTION public.can_write_institution(_institution_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT public.is_institution_admin(_institution_id)
     AND public.institution_is_active(_institution_id)
$$;

CREATE OR REPLACE FUNCTION public.has_institution_permission(_institution_id uuid, _perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.institution_members
    WHERE institution_id = _institution_id AND user_id = auth.uid() AND status = 'active'
      AND (role IN ('owner','admin') OR permissions ? _perm)
  )
$$;

-- is the current user a student of this institution (member of one of its batches)?
CREATE OR REPLACE FUNCTION public.is_institution_student(_institution_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.batch_enrollments be
    JOIN public.batches b ON b.id = be.batch_id
    WHERE b.institution_id = _institution_id AND be.user_id = auth.uid() AND be.status = 'active'
  )
$$;

-- =========================================================
-- 7. GUARD: only platform super admin can change status
-- =========================================================
CREATE OR REPLACE FUNCTION public.protect_institution_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.status IS DISTINCT FROM OLD.status AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only platform administrators can change institute status';
  END IF;
  IF NEW.owner_user_id IS DISTINCT FROM OLD.owner_user_id AND NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only platform administrators can change the institute owner';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_protect_institution_status ON public.institutions;
CREATE TRIGGER trg_protect_institution_status BEFORE UPDATE ON public.institutions
FOR EACH ROW EXECUTE FUNCTION public.protect_institution_status();

-- =========================================================
-- 8. RLS — institutions
-- =========================================================
ALTER TABLE public.institutions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS inst_read ON public.institutions;
DROP POLICY IF EXISTS inst_admin_write ON public.institutions;

CREATE POLICY inst_platform_admin_all ON public.institutions
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY inst_read ON public.institutions
  FOR SELECT TO authenticated
  USING (
    status = 'active'
    OR public.is_institution_member(id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY inst_admin_update_own ON public.institutions
  FOR UPDATE TO authenticated
  USING (public.can_write_institution(id))
  WITH CHECK (public.can_write_institution(id));

-- =========================================================
-- 9. RLS — institution_members
-- =========================================================
ALTER TABLE public.institution_members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS im_read ON public.institution_members;
DROP POLICY IF EXISTS im_admin_write ON public.institution_members;

CREATE POLICY im_read ON public.institution_members
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_institution_member(institution_id)
    OR public.has_role(auth.uid(), 'admin')
  );

CREATE POLICY im_platform_write ON public.institution_members
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY im_inst_admin_write ON public.institution_members
  FOR ALL TO authenticated
  USING (public.can_write_institution(institution_id))
  WITH CHECK (public.can_write_institution(institution_id) AND role <> 'owner');

GRANT SELECT, INSERT, UPDATE, DELETE ON public.institutions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.institution_members TO authenticated;
GRANT ALL ON public.institutions TO service_role;
GRANT ALL ON public.institution_members TO service_role;

-- =========================================================
-- 10. RLS — batches (tenant aware)
-- =========================================================
DROP POLICY IF EXISTS batches_read ON public.batches;
DROP POLICY IF EXISTS batches_admin_write ON public.batches;

CREATE POLICY batches_read ON public.batches
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (institution_id IS NOT NULL AND (public.is_institution_member(institution_id) OR public.is_enrolled_in_batch(auth.uid(), id)))
    OR (institution_id IS NULL AND (
          COALESCE(is_published,false) OR COALESCE(is_active,false)
          OR public.is_enrolled_in_batch(auth.uid(), id)
          OR public.is_staff(auth.uid())
        ))
  );

CREATE POLICY batches_platform_write ON public.batches
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY batches_institution_write ON public.batches
  FOR ALL TO authenticated
  USING (public.can_write_institution(institution_id))
  WITH CHECK (public.can_write_institution(institution_id));

-- =========================================================
-- 11. RLS — tests (tenant aware, keeps existing behaviour for platform tests)
-- =========================================================
DROP POLICY IF EXISTS "Anyone can view published tests" ON public.tests;
DROP POLICY IF EXISTS "Admins can manage tests" ON public.tests;

CREATE POLICY tests_read ON public.tests
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (institution_id IS NULL AND is_published = true)
    OR (institution_id IS NOT NULL AND (
          public.is_institution_member(institution_id)
          OR (is_published = true AND EXISTS (
                SELECT 1 FROM public.batch_tests bt
                JOIN public.batch_enrollments be ON be.batch_id = bt.batch_id
                WHERE bt.test_id = tests.id AND be.user_id = auth.uid() AND be.status = 'active'
             ))
       ))
  );

CREATE POLICY tests_platform_write ON public.tests
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY tests_institution_write ON public.tests
  FOR ALL TO authenticated
  USING (public.can_write_institution(institution_id))
  WITH CHECK (public.can_write_institution(institution_id));

-- =========================================================
-- 12. RLS — batch_enrollments (institute admins manage their students)
-- =========================================================
DROP POLICY IF EXISTS be_read ON public.batch_enrollments;
DROP POLICY IF EXISTS be_admin_write ON public.batch_enrollments;

CREATE POLICY be_read ON public.batch_enrollments
  FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_id AND b.institution_id IS NOT NULL AND public.is_institution_member(b.institution_id))
    OR (public.is_staff(auth.uid()) AND EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_id AND b.institution_id IS NULL))
  );

CREATE POLICY be_platform_write ON public.batch_enrollments
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY be_institution_write ON public.batch_enrollments
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_id AND public.can_write_institution(b.institution_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.batches b WHERE b.id = batch_id AND public.can_write_institution(b.institution_id)));

-- =========================================================
-- 13. RLS — phynetix_library + dpps tenant scoping
-- =========================================================
DROP POLICY IF EXISTS lib_read ON public.phynetix_library;
DROP POLICY IF EXISTS lib_staff_write ON public.phynetix_library;

CREATE POLICY lib_read ON public.phynetix_library
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (institution_id IS NULL AND (COALESCE(is_published,false) OR public.is_staff(auth.uid())))
    OR (institution_id IS NOT NULL AND public.is_institution_member(institution_id))
  );

CREATE POLICY lib_platform_write ON public.phynetix_library
  FOR ALL
  USING (public.is_staff(auth.uid()) AND institution_id IS NULL)
  WITH CHECK (public.is_staff(auth.uid()) AND institution_id IS NULL);

CREATE POLICY lib_institution_write ON public.phynetix_library
  FOR ALL TO authenticated
  USING (public.can_write_institution(institution_id))
  WITH CHECK (public.can_write_institution(institution_id));

-- dpps
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='dpps' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.dpps', p.policyname);
  END LOOP;
END $$;

CREATE POLICY dpps_read ON public.dpps
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR public.is_staff(auth.uid())
    OR (institution_id IS NULL AND COALESCE(is_published,false))
    OR (institution_id IS NOT NULL AND (
          public.is_institution_member(institution_id)
          OR (COALESCE(is_published,false) AND public.is_institution_student(institution_id))
       ))
  );

CREATE POLICY dpps_platform_write ON public.dpps
  FOR ALL
  USING (public.is_staff(auth.uid()) AND institution_id IS NULL)
  WITH CHECK (public.is_staff(auth.uid()) AND institution_id IS NULL);

CREATE POLICY dpps_institution_write ON public.dpps
  FOR ALL TO authenticated
  USING (public.can_write_institution(institution_id))
  WITH CHECK (public.can_write_institution(institution_id));

-- =========================================================
-- 14. RLS — audit logs scoped by institute
-- =========================================================
DROP POLICY IF EXISTS "Staff view audit logs" ON public.audit_logs;
CREATE POLICY "Staff view audit logs" ON public.audit_logs
  FOR SELECT
  USING (
    public.has_role(auth.uid(), 'admin')
    OR (institution_id IS NULL AND public.is_staff(auth.uid()))
    OR (institution_id IS NOT NULL AND public.is_institution_admin(institution_id))
  );

-- =========================================================
-- 15. RPC — validate + join batch by code (no payment)
-- =========================================================
CREATE OR REPLACE FUNCTION public.preview_batch_code(_code text)
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE b record; inst record;
BEGIN
  SELECT * INTO b FROM public.batches WHERE upper(join_code) = upper(trim(_code)) LIMIT 1;
  IF b.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid joining code');
  END IF;
  IF NOT COALESCE(b.is_active, true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This batch is no longer active');
  END IF;
  IF b.institution_id IS NOT NULL THEN
    SELECT * INTO inst FROM public.institutions WHERE id = b.institution_id;
    IF inst.status <> 'active' THEN
      RETURN jsonb_build_object('success', false, 'error', 'This institute is not active');
    END IF;
  END IF;
  RETURN jsonb_build_object(
    'success', true,
    'batch_id', b.id,
    'batch_name', b.name,
    'institution_id', b.institution_id,
    'institution_name', COALESCE(inst.name, 'PhyNetix'),
    'already_member', EXISTS (
      SELECT 1 FROM public.batch_enrollments
      WHERE batch_id = b.id AND user_id = auth.uid() AND status = 'active'
    )
  );
END $$;

CREATE OR REPLACE FUNCTION public.join_batch_with_code(_code text)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE b record; inst record; uid uuid := auth.uid();
BEGIN
  IF uid IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'You must be signed in');
  END IF;

  SELECT * INTO b FROM public.batches WHERE upper(join_code) = upper(trim(_code)) LIMIT 1;
  IF b.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid joining code');
  END IF;
  IF NOT COALESCE(b.is_active, true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This batch is no longer active');
  END IF;

  IF b.institution_id IS NOT NULL THEN
    SELECT * INTO inst FROM public.institutions WHERE id = b.institution_id;
    IF inst.status <> 'active' THEN
      RETURN jsonb_build_object('success', false, 'error', 'This institute is not active');
    END IF;
  END IF;

  IF EXISTS (SELECT 1 FROM public.batch_enrollments WHERE batch_id = b.id AND user_id = uid AND status = 'active') THEN
    RETURN jsonb_build_object('success', false, 'error', 'You have already joined this batch', 'batch_id', b.id);
  END IF;

  INSERT INTO public.batch_enrollments (user_id, batch_id, status, enrollment_type, payment_status, is_active)
  VALUES (uid, b.id, 'active', 'code', 'free', true)
  ON CONFLICT (user_id, batch_id) DO UPDATE
    SET status = 'active', is_active = true, enrollment_type = 'code', updated_at = now();

  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, institution_id, new_value)
  VALUES (uid, 'student_joined_batch', 'batch', b.id, b.institution_id, jsonb_build_object('via', 'code'));

  RETURN jsonb_build_object('success', true, 'batch_id', b.id, 'batch_name', b.name,
                            'institution_name', COALESCE(inst.name, 'PhyNetix'));
END $$;

CREATE OR REPLACE FUNCTION public.regenerate_batch_code(_batch_id uuid)
RETURNS jsonb LANGUAGE plpgsql VOLATILE SECURITY DEFINER SET search_path = public AS $$
DECLARE b record; c text; n int := 0;
BEGIN
  SELECT * INTO b FROM public.batches WHERE id = _batch_id;
  IF b.id IS NULL THEN RETURN jsonb_build_object('success', false, 'error', 'Batch not found'); END IF;
  IF NOT (public.has_role(auth.uid(), 'admin') OR public.can_write_institution(b.institution_id)) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not allowed');
  END IF;
  LOOP
    c := public.gen_readable_code(8);
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.batches WHERE upper(join_code) = c);
    n := n + 1; EXIT WHEN n > 25;
  END LOOP;
  UPDATE public.batches SET join_code = c, updated_at = now() WHERE id = _batch_id;
  INSERT INTO public.audit_logs (user_id, action, entity_type, entity_id, institution_id, old_value, new_value)
  VALUES (auth.uid(), 'batch_code_regenerated', 'batch', _batch_id, b.institution_id,
          jsonb_build_object('join_code', b.join_code), jsonb_build_object('join_code', c));
  RETURN jsonb_build_object('success', true, 'join_code', c);
END $$;

-- =========================================================
-- 16. RPC — platform institute stats (real DB numbers)
-- =========================================================
CREATE OR REPLACE FUNCTION public.platform_institute_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN jsonb_build_object(
    'total',      (SELECT count(*) FROM public.institutions),
    'active',     (SELECT count(*) FROM public.institutions WHERE status='active'),
    'pending',    (SELECT count(*) FROM public.institutions WHERE status='pending'),
    'suspended',  (SELECT count(*) FROM public.institutions WHERE status='suspended'),
    'rejected',   (SELECT count(*) FROM public.institutions WHERE status='rejected'),
    'students',   (SELECT count(DISTINCT be.user_id) FROM public.batch_enrollments be JOIN public.batches b ON b.id=be.batch_id WHERE b.institution_id IS NOT NULL),
    'batches',    (SELECT count(*) FROM public.batches WHERE institution_id IS NOT NULL),
    'tests',      (SELECT count(*) FROM public.tests WHERE institution_id IS NOT NULL),
    'attempts',   (SELECT count(*) FROM public.test_attempts ta JOIN public.tests t ON t.id=ta.test_id WHERE t.institution_id IS NOT NULL)
  );
END $$;

CREATE OR REPLACE FUNCTION public.institution_summaries()
RETURNS TABLE (
  id uuid, name text, slug text, code text, logo_url text, status public.institution_status,
  contact_email text, contact_phone text, city text, state text, website text,
  created_at timestamptz, last_activity_at timestamptz, rejection_reason text,
  owner_user_id uuid, owner_name text, owner_email text,
  students bigint, batches bigint, tests bigint, attempts bigint
)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Not allowed';
  END IF;
  RETURN QUERY
  SELECT i.id, i.name, i.slug, i.code, i.logo_url, i.status,
         i.contact_email, i.contact_phone, i.city, i.state, i.website,
         i.created_at, i.last_activity_at, i.rejection_reason,
         i.owner_user_id,
         (SELECT p.full_name FROM public.profiles p WHERE p.id = i.owner_user_id),
         (SELECT m.email FROM public.institution_members m WHERE m.institution_id = i.id AND m.role='owner' LIMIT 1),
         (SELECT count(DISTINCT be.user_id) FROM public.batch_enrollments be JOIN public.batches b ON b.id=be.batch_id WHERE b.institution_id=i.id),
         (SELECT count(*) FROM public.batches b WHERE b.institution_id=i.id),
         (SELECT count(*) FROM public.tests t WHERE t.institution_id=i.id),
         (SELECT count(*) FROM public.test_attempts ta JOIN public.tests t ON t.id=ta.test_id WHERE t.institution_id=i.id)
  FROM public.institutions i
  ORDER BY i.created_at DESC;
END $$;

-- institute workspace dashboard stats (tenant derived from membership)
CREATE OR REPLACE FUNCTION public.institution_dashboard_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE inst uuid := public.get_user_institution_id();
BEGIN
  IF inst IS NULL THEN RAISE EXCEPTION 'No institute context'; END IF;
  RETURN jsonb_build_object(
    'institution_id', inst,
    'students', (SELECT count(DISTINCT be.user_id) FROM public.batch_enrollments be JOIN public.batches b ON b.id=be.batch_id WHERE b.institution_id=inst AND be.status='active'),
    'batches',  (SELECT count(*) FROM public.batches WHERE institution_id=inst AND COALESCE(is_active,true)),
    'tests',    (SELECT count(*) FROM public.tests WHERE institution_id=inst),
    'attempts', (SELECT count(*) FROM public.test_attempts ta JOIN public.tests t ON t.id=ta.test_id WHERE t.institution_id=inst),
    'avg_score',(SELECT COALESCE(round(avg(ta.score)::numeric,2),0) FROM public.test_attempts ta JOIN public.tests t ON t.id=ta.test_id WHERE t.institution_id=inst AND ta.completed_at IS NOT NULL)
  );
END $$;

-- institute students listing (paginated, tenant scoped)
CREATE OR REPLACE FUNCTION public.institution_students(_search text DEFAULT NULL, _batch_id uuid DEFAULT NULL, _limit int DEFAULT 25, _offset int DEFAULT 0)
RETURNS TABLE (user_id uuid, full_name text, roll_number text, phone text, batches text[], joined_at timestamptz, attempts bigint, total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public AS $$
DECLARE inst uuid := public.get_user_institution_id();
BEGIN
  IF inst IS NULL THEN RAISE EXCEPTION 'No institute context'; END IF;
  RETURN QUERY
  WITH base AS (
    SELECT be.user_id AS uid,
           min(be.enrolled_at) AS joined,
           array_agg(DISTINCT b.name) AS bnames
    FROM public.batch_enrollments be
    JOIN public.batches b ON b.id = be.batch_id
    WHERE b.institution_id = inst AND be.status = 'active'
      AND (_batch_id IS NULL OR be.batch_id = _batch_id)
    GROUP BY be.user_id
  ), filtered AS (
    SELECT base.*, p.full_name AS fname, p.roll_number AS roll, p.phone AS ph
    FROM base LEFT JOIN public.profiles p ON p.id = base.uid
    WHERE _search IS NULL OR _search = ''
       OR p.full_name ILIKE '%'||_search||'%' OR p.roll_number ILIKE '%'||_search||'%'
  )
  SELECT f.uid, f.fname, f.roll, f.ph, f.bnames, f.joined,
         (SELECT count(*) FROM public.test_attempts ta JOIN public.tests t ON t.id=ta.test_id WHERE t.institution_id=inst AND ta.user_id=f.uid),
         (SELECT count(*) FROM filtered)
  FROM filtered f
  ORDER BY f.joined DESC
  LIMIT _limit OFFSET _offset;
END $$;

-- profiles readable by institute admins for their own students
DROP POLICY IF EXISTS "Institute admins view their students" ON public.profiles;
CREATE POLICY "Institute admins view their students" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.batch_enrollments be
      JOIN public.batches b ON b.id = be.batch_id
      WHERE be.user_id = profiles.id
        AND b.institution_id IS NOT NULL
        AND public.is_institution_member(b.institution_id)
    )
  );

REVOKE ALL ON FUNCTION public.gen_readable_code(int) FROM PUBLIC, anon, authenticated;