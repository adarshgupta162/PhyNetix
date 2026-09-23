CREATE TABLE public.test_similar_questions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id uuid NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  parent_question_id uuid NOT NULL REFERENCES public.test_section_questions(id) ON DELETE CASCADE,
  question_type text NOT NULL DEFAULT 'single_choice',
  question_text text,
  image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  options jsonb,
  correct_answer jsonb,
  solution_text text,
  solution_image_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  difficulty text DEFAULT 'medium',
  library_question_id uuid REFERENCES public.phynetix_library(id) ON DELETE SET NULL,
  order_index integer NOT NULL DEFAULT 0,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_similar_q_parent ON public.test_similar_questions(parent_question_id);
CREATE INDEX idx_similar_q_test ON public.test_similar_questions(test_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_similar_questions TO authenticated;
GRANT ALL ON public.test_similar_questions TO service_role;

ALTER TABLE public.test_similar_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage similar questions"
ON public.test_similar_questions FOR ALL TO authenticated
USING (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.tests t WHERE t.id = test_id AND t.institution_id IS NOT NULL AND public.can_write_institution(t.institution_id))
)
WITH CHECK (
  public.is_staff(auth.uid())
  OR EXISTS (SELECT 1 FROM public.tests t WHERE t.id = test_id AND t.institution_id IS NOT NULL AND public.can_write_institution(t.institution_id))
);

CREATE POLICY "Students see similar questions after submitting"
ON public.test_similar_questions FOR SELECT TO authenticated
USING (public.user_completed_test(auth.uid(), test_id));

CREATE TRIGGER update_test_similar_questions_updated_at
BEFORE UPDATE ON public.test_similar_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();