-- PhyNetix Question Library table for storing reusable questions
CREATE TABLE public.phynetix_library (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  library_id TEXT NOT NULL UNIQUE DEFAULT (
    UPPER(
      CONCAT(
        CHR(65 + FLOOR(RANDOM() * 26)::INT),
        CHR(65 + FLOOR(RANDOM() * 26)::INT),
        LPAD(FLOOR(RANDOM() * 100000000)::TEXT, 8, '0')
      )
    )
  ),
  created_by UUID REFERENCES auth.users(id),
  subject TEXT NOT NULL,
  chapter TEXT,
  topic TEXT,
  question_text TEXT,
  question_image_url TEXT,
  options JSONB DEFAULT '[]'::JSONB,
  correct_answer JSONB NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'single_choice',
  marks NUMERIC DEFAULT 4,
  negative_marks NUMERIC DEFAULT 1,
  difficulty TEXT DEFAULT 'medium',
  time_seconds INTEGER DEFAULT 60,
  solution_text TEXT,
  solution_image_url TEXT,
  tags TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT TRUE,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.phynetix_library ENABLE ROW LEVEL SECURITY;

-- Staff can view all questions
CREATE POLICY "Staff can view library questions"
ON public.phynetix_library FOR SELECT
USING (public.is_staff(auth.uid()));

-- Staff can insert questions
CREATE POLICY "Staff can create library questions"
ON public.phynetix_library FOR INSERT
WITH CHECK (public.is_staff(auth.uid()));

-- Staff can update questions
CREATE POLICY "Staff can update library questions"
ON public.phynetix_library FOR UPDATE
USING (public.is_staff(auth.uid()));

-- Staff can delete questions
CREATE POLICY "Staff can delete library questions"
ON public.phynetix_library FOR DELETE
USING (public.is_staff(auth.uid()));

-- Create updated_at trigger
CREATE TRIGGER update_phynetix_library_updated_at
BEFORE UPDATE ON public.phynetix_library
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add indexes for common queries
CREATE INDEX idx_phynetix_library_subject ON public.phynetix_library(subject);
CREATE INDEX idx_phynetix_library_chapter ON public.phynetix_library(chapter);
CREATE INDEX idx_phynetix_library_type ON public.phynetix_library(question_type);
CREATE INDEX idx_phynetix_library_difficulty ON public.phynetix_library(difficulty);
CREATE INDEX idx_phynetix_library_id ON public.phynetix_library(library_id);

-- Add new fields to test_section_questions for metadata
ALTER TABLE public.test_section_questions 
ADD COLUMN IF NOT EXISTS chapter TEXT,
ADD COLUMN IF NOT EXISTS topic TEXT,
ADD COLUMN IF NOT EXISTS library_question_id UUID REFERENCES public.phynetix_library(id);

-- Create index for library reference
CREATE INDEX IF NOT EXISTS idx_test_section_questions_library ON public.test_section_questions(library_question_id);