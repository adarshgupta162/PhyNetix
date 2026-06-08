
-- Create bookmarks table for test questions
CREATE TABLE public.question_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.test_section_questions(id) ON DELETE CASCADE,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- Enable RLS
ALTER TABLE public.question_bookmarks ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own bookmarks"
ON public.question_bookmarks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own bookmarks"
ON public.question_bookmarks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
ON public.question_bookmarks FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own bookmarks"
ON public.question_bookmarks FOR UPDATE
USING (auth.uid() = user_id);
