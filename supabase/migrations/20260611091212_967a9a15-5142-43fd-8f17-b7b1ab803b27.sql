
-- Fix: edge function selects these columns but they don't exist → causes "No questions found"
ALTER TABLE public.test_section_questions
  ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS paragraph_id uuid REFERENCES public.question_paragraphs(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_tsq_paragraph_id ON public.test_section_questions(paragraph_id);

-- Profile: district + state already present; topic field reused
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS district text;
