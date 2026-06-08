
-- Create Question Bank tables

-- QB Courses table
CREATE TABLE public.qb_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QB Chapters table
CREATE TABLE public.qb_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.qb_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QB Questions table
CREATE TABLE public.qb_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.qb_courses(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.qb_chapters(id) ON DELETE CASCADE,
  qno INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq_single', 'mcq_multi', 'integer', 'numeric')),
  options JSONB,
  correct JSONB NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  marks JSONB NOT NULL DEFAULT '{"positive": 4, "negative": 1}'::jsonb,
  text_source TEXT NOT NULL DEFAULT 'inline' CHECK (text_source IN ('pdf', 'inline')),
  pdf_page INTEGER,
  pdf_coords JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- QB Bookmarks table for students
CREATE TABLE public.qb_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.qb_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);

-- QB Attempts table for tracking student attempts
CREATE TABLE public.qb_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.qb_questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL,
  is_correct BOOLEAN NOT NULL,
  marks_obtained INTEGER NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.qb_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_attempts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for qb_courses
CREATE POLICY "Anyone can view courses" ON public.qb_courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON public.qb_courses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for qb_chapters
CREATE POLICY "Anyone can view chapters" ON public.qb_chapters FOR SELECT USING (true);
CREATE POLICY "Admins can manage chapters" ON public.qb_chapters FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for qb_questions
CREATE POLICY "Anyone can view questions" ON public.qb_questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage questions" ON public.qb_questions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for qb_bookmarks
CREATE POLICY "Users can view own bookmarks" ON public.qb_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can manage own bookmarks" ON public.qb_bookmarks FOR ALL USING (auth.uid() = user_id);

-- RLS Policies for qb_attempts
CREATE POLICY "Users can view own attempts" ON public.qb_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own attempts" ON public.qb_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_qb_chapters_course ON public.qb_chapters(course_id);
CREATE INDEX idx_qb_questions_chapter ON public.qb_questions(chapter_id);
CREATE INDEX idx_qb_questions_course ON public.qb_questions(course_id);
CREATE INDEX idx_qb_questions_difficulty ON public.qb_questions(difficulty);
CREATE INDEX idx_qb_bookmarks_user ON public.qb_bookmarks(user_id);
CREATE INDEX idx_qb_attempts_user ON public.qb_attempts(user_id);

-- Seed data for JEE courses

-- Physics
INSERT INTO public.qb_courses (id, title, slug, description) VALUES 
('11111111-1111-1111-1111-111111111111', 'Physics', 'physics', 'Complete JEE Physics syllabus');

INSERT INTO public.qb_chapters (course_id, title, order_index) VALUES
('11111111-1111-1111-1111-111111111111', 'Units & Measurements', 1),
('11111111-1111-1111-1111-111111111111', 'Kinematics', 2),
('11111111-1111-1111-1111-111111111111', 'Laws of Motion', 3),
('11111111-1111-1111-1111-111111111111', 'Work, Energy & Power', 4),
('11111111-1111-1111-1111-111111111111', 'Rotational Motion', 5),
('11111111-1111-1111-1111-111111111111', 'Gravitation', 6),
('11111111-1111-1111-1111-111111111111', 'Properties of Solids', 7),
('11111111-1111-1111-1111-111111111111', 'Properties of Fluids', 8),
('11111111-1111-1111-1111-111111111111', 'Thermodynamics', 9),
('11111111-1111-1111-1111-111111111111', 'Kinetic Theory of Gases', 10),
('11111111-1111-1111-1111-111111111111', 'Oscillations', 11),
('11111111-1111-1111-1111-111111111111', 'Waves', 12),
('11111111-1111-1111-1111-111111111111', 'Electrostatics', 13),
('11111111-1111-1111-1111-111111111111', 'Current Electricity', 14),
('11111111-1111-1111-1111-111111111111', 'Magnetic Effects of Current', 15),
('11111111-1111-1111-1111-111111111111', 'Electromagnetic Induction', 16),
('11111111-1111-1111-1111-111111111111', 'Alternating Current', 17),
('11111111-1111-1111-1111-111111111111', 'Electromagnetic Waves', 18),
('11111111-1111-1111-1111-111111111111', 'Ray Optics', 19),
('11111111-1111-1111-1111-111111111111', 'Wave Optics', 20),
('11111111-1111-1111-1111-111111111111', 'Dual Nature of Matter', 21),
('11111111-1111-1111-1111-111111111111', 'Atoms & Nuclei', 22),
('11111111-1111-1111-1111-111111111111', 'Semiconductor Electronics', 23);

-- Chemistry
INSERT INTO public.qb_courses (id, title, slug, description) VALUES 
('22222222-2222-2222-2222-222222222222', 'Chemistry', 'chemistry', 'Complete JEE Chemistry syllabus');

INSERT INTO public.qb_chapters (course_id, title, order_index) VALUES
('22222222-2222-2222-2222-222222222222', 'Mole Concept', 1),
('22222222-2222-2222-2222-222222222222', 'Atomic Structure', 2),
('22222222-2222-2222-2222-222222222222', 'States of Matter', 3),
('22222222-2222-2222-2222-222222222222', 'Thermodynamics', 4),
('22222222-2222-2222-2222-222222222222', 'Chemical & Ionic Equilibrium', 5),
('22222222-2222-2222-2222-222222222222', 'Redox Reactions', 6),
('22222222-2222-2222-2222-222222222222', 'Electrochemistry', 7),
('22222222-2222-2222-2222-222222222222', 'Chemical Kinetics', 8),
('22222222-2222-2222-2222-222222222222', 'Surface Chemistry', 9),
('22222222-2222-2222-2222-222222222222', 'Solutions', 10),
('22222222-2222-2222-2222-222222222222', 'Basic Organic Chemistry (GOC)', 11),
('22222222-2222-2222-2222-222222222222', 'Hydrocarbons', 12),
('22222222-2222-2222-2222-222222222222', 'Haloalkanes & Haloarenes', 13),
('22222222-2222-2222-2222-222222222222', 'Alcohols, Phenols & Ethers', 14),
('22222222-2222-2222-2222-222222222222', 'Aldehydes & Ketones', 15),
('22222222-2222-2222-2222-222222222222', 'Carboxylic Acids', 16),
('22222222-2222-2222-2222-222222222222', 'Amines', 17),
('22222222-2222-2222-2222-222222222222', 'Biomolecules', 18),
('22222222-2222-2222-2222-222222222222', 'Polymers', 19),
('22222222-2222-2222-2222-222222222222', 'Periodic Table', 20),
('22222222-2222-2222-2222-222222222222', 'Chemical Bonding', 21),
('22222222-2222-2222-2222-222222222222', 'Coordination Compounds', 22),
('22222222-2222-2222-2222-222222222222', 's-block', 23),
('22222222-2222-2222-2222-222222222222', 'p-block', 24),
('22222222-2222-2222-2222-222222222222', 'd & f-block', 25),
('22222222-2222-2222-2222-222222222222', 'Metallurgy', 26),
('22222222-2222-2222-2222-222222222222', 'Environmental Chemistry', 27);

-- Mathematics
INSERT INTO public.qb_courses (id, title, slug, description) VALUES 
('33333333-3333-3333-3333-333333333333', 'Mathematics', 'mathematics', 'Complete JEE Mathematics syllabus');

INSERT INTO public.qb_chapters (course_id, title, order_index) VALUES
('33333333-3333-3333-3333-333333333333', 'Sets & Functions', 1),
('33333333-3333-3333-3333-333333333333', 'Trigonometry', 2),
('33333333-3333-3333-3333-333333333333', 'Complex Numbers', 3),
('33333333-3333-3333-3333-333333333333', 'Quadratic Equations', 4),
('33333333-3333-3333-3333-333333333333', 'Sequences & Series', 5),
('33333333-3333-3333-3333-333333333333', 'Permutations & Combinations', 6),
('33333333-3333-3333-3333-333333333333', 'Binomial Theorem', 7),
('33333333-3333-3333-3333-333333333333', 'Matrices & Determinants', 8),
('33333333-3333-3333-3333-333333333333', 'Probability', 9),
('33333333-3333-3333-3333-333333333333', 'Coordinate Geometry', 10),
('33333333-3333-3333-3333-333333333333', 'Limits', 11),
('33333333-3333-3333-3333-333333333333', 'Continuity & Differentiability', 12),
('33333333-3333-3333-3333-333333333333', 'Differentiation', 13),
('33333333-3333-3333-3333-333333333333', 'Applications of Derivatives', 14),
('33333333-3333-3333-3333-333333333333', 'Integration', 15),
('33333333-3333-3333-3333-333333333333', 'Differential Equations', 16),
('33333333-3333-3333-3333-333333333333', 'Vector Algebra', 17),
('33333333-3333-3333-3333-333333333333', '3D Geometry', 18),
('33333333-3333-3333-3333-333333333333', 'Mathematical Reasoning', 19);
