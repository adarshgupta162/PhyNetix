-- 1. course_sections
CREATE TABLE IF NOT EXISTS public.course_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  name text NOT NULL,
  display_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS course_sections_batch_idx ON public.course_sections(batch_id, display_order);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.course_sections TO authenticated;
GRANT ALL ON public.course_sections TO service_role;

ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage course sections"
ON public.course_sections FOR ALL TO authenticated
USING (public.is_staff(auth.uid()))
WITH CHECK (public.is_staff(auth.uid()));

CREATE POLICY "Enrolled students view course sections"
ON public.course_sections FOR SELECT TO authenticated
USING (public.is_enrolled_in_batch(auth.uid(), batch_id) OR public.is_staff(auth.uid()));

CREATE TRIGGER course_sections_updated_at
BEFORE UPDATE ON public.course_sections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2. batch_tests additions
ALTER TABLE public.batch_tests
  ADD COLUMN IF NOT EXISTS section_id uuid REFERENCES public.course_sections(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS display_order int NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS batch_tests_section_idx ON public.batch_tests(batch_id, section_id, display_order);

-- 3. test_reviews
CREATE TABLE IF NOT EXISTS public.test_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  batch_id uuid REFERENCES public.batches(id) ON DELETE SET NULL,
  rating int NOT NULL CHECK (rating BETWEEN 1 AND 5),
  review text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, test_id)
);
CREATE INDEX IF NOT EXISTS test_reviews_test_idx ON public.test_reviews(test_id);
CREATE INDEX IF NOT EXISTS test_reviews_batch_idx ON public.test_reviews(batch_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_reviews TO authenticated;
GRANT ALL ON public.test_reviews TO service_role;

ALTER TABLE public.test_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can read reviews"
ON public.test_reviews FOR SELECT TO authenticated
USING (true);

CREATE POLICY "Users insert own review"
ON public.test_reviews FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own review"
ON public.test_reviews FOR UPDATE TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users delete own review"
ON public.test_reviews FOR DELETE TO authenticated
USING (auth.uid() = user_id);

CREATE TRIGGER test_reviews_updated_at
BEFORE UPDATE ON public.test_reviews
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();