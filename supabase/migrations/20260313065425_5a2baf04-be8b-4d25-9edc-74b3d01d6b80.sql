-- Create paragraphs table for paragraph-based questions
CREATE TABLE public.question_paragraphs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID REFERENCES public.tests(id) ON DELETE CASCADE NOT NULL,
  section_id UUID REFERENCES public.test_sections(id) ON DELETE CASCADE NOT NULL,
  paragraph_text TEXT,
  paragraph_image_url TEXT,
  paragraph_image_urls JSONB DEFAULT '[]'::jsonb,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add paragraph_id to test_section_questions
ALTER TABLE public.test_section_questions 
  ADD COLUMN paragraph_id UUID REFERENCES public.question_paragraphs(id) ON DELETE SET NULL;

-- Enable RLS
ALTER TABLE public.question_paragraphs ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Admins can manage paragraphs"
  ON public.question_paragraphs FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view paragraphs for published tests"
  ON public.question_paragraphs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.tests 
      WHERE tests.id = question_paragraphs.test_id 
      AND (tests.is_published = true OR has_role(auth.uid(), 'admin'::app_role))
    )
  );
