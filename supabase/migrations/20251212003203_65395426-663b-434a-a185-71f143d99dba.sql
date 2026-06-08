-- Create test_subjects table for subjects within a test
CREATE TABLE public.test_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_sections table for sections within a subject
CREATE TABLE public.test_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.test_subjects(id) ON DELETE CASCADE,
  name TEXT,
  section_type TEXT NOT NULL DEFAULT 'single_choice', -- single_choice, multiple_choice, integer
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create test_section_questions table for questions within a section
CREATE TABLE public.test_section_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.test_sections(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT,
  options JSONB, -- ["Option A", "Option B", "Option C", "Option D"]
  correct_answer JSONB NOT NULL, -- "0" for single, ["0","2"] for multi, "42" for integer
  marks INTEGER DEFAULT 4,
  negative_marks INTEGER DEFAULT 1,
  pdf_page INTEGER DEFAULT 1,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.test_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_section_questions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for test_subjects
CREATE POLICY "Admins can manage test subjects" ON public.test_subjects FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view test subjects" ON public.test_subjects FOR SELECT USING (true);

-- RLS Policies for test_sections
CREATE POLICY "Admins can manage test sections" ON public.test_sections FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view test sections" ON public.test_sections FOR SELECT USING (true);

-- RLS Policies for test_section_questions
CREATE POLICY "Admins can manage section questions" ON public.test_section_questions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone can view section questions" ON public.test_section_questions FOR SELECT USING (true);

-- Add trigger for updated_at on test_section_questions
CREATE TRIGGER update_test_section_questions_updated_at
BEFORE UPDATE ON public.test_section_questions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Seed data: Create a sample test with 2 subjects, 1 section each, 2 questions each
DO $$
DECLARE
  v_test_id UUID;
  v_physics_subject_id UUID;
  v_chemistry_subject_id UUID;
  v_physics_section_id UUID;
  v_chemistry_section_id UUID;
BEGIN
  -- Create a sample test
  INSERT INTO public.tests (name, description, exam_type, duration_minutes, test_type, is_published)
  VALUES ('JEE Mains Sample Test', 'A sample test with Physics and Chemistry', 'jee_mains', 180, 'full', false)
  RETURNING id INTO v_test_id;
  
  -- Create Physics subject
  INSERT INTO public.test_subjects (test_id, name, order_index)
  VALUES (v_test_id, 'Physics', 0)
  RETURNING id INTO v_physics_subject_id;
  
  -- Create Chemistry subject
  INSERT INTO public.test_subjects (test_id, name, order_index)
  VALUES (v_test_id, 'Chemistry', 1)
  RETURNING id INTO v_chemistry_subject_id;
  
  -- Create Mechanics section under Physics
  INSERT INTO public.test_sections (subject_id, name, section_type, order_index)
  VALUES (v_physics_subject_id, 'Mechanics', 'single_choice', 0)
  RETURNING id INTO v_physics_section_id;
  
  -- Create Organic Chemistry section under Chemistry
  INSERT INTO public.test_sections (subject_id, name, section_type, order_index)
  VALUES (v_chemistry_subject_id, 'Organic Chemistry', 'multiple_choice', 0)
  RETURNING id INTO v_chemistry_section_id;
  
  -- Add 2 questions to Physics section
  INSERT INTO public.test_section_questions (section_id, test_id, question_number, question_text, options, correct_answer, marks, negative_marks, pdf_page, order_index)
  VALUES 
    (v_physics_section_id, v_test_id, 1, 'A ball is thrown vertically upward. What is the acceleration at the highest point?', '["0 m/s²", "9.8 m/s² downward", "9.8 m/s² upward", "Depends on mass"]', '"1"', 4, 1, 1, 0),
    (v_physics_section_id, v_test_id, 2, 'What is the SI unit of momentum?', '["kg·m/s", "N·s", "Both A and B", "None"]', '"2"', 4, 1, 1, 1);
  
  -- Add 2 questions to Chemistry section  
  INSERT INTO public.test_section_questions (section_id, test_id, question_number, question_text, options, correct_answer, marks, negative_marks, pdf_page, order_index)
  VALUES 
    (v_chemistry_section_id, v_test_id, 3, 'Which of the following are aromatic compounds?', '["Benzene", "Cyclohexane", "Naphthalene", "Cyclopentane"]', '["0","2"]', 4, 2, 2, 0),
    (v_chemistry_section_id, v_test_id, 4, 'Select all alkenes:', '["Ethene", "Propane", "Butene", "Methane"]', '["0","2"]', 4, 2, 2, 1);
END $$;