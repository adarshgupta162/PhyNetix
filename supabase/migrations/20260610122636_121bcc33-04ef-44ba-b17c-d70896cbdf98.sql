CREATE TYPE public.app_role AS ENUM ('admin', 'student');

CREATE TABLE public.profiles (
  id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT, avatar_url TEXT, target_exam TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL DEFAULT 'student',
  UNIQUE (user_id, role)
);

CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, description TEXT, icon TEXT,
  color TEXT DEFAULT '#8b5cf6',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID NOT NULL REFERENCES public.chapters(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL DEFAULT 'mcq',
  options JSONB, correct_answer TEXT NOT NULL, explanation TEXT,
  difficulty TEXT NOT NULL DEFAULT 'medium',
  marks INTEGER DEFAULT 4, negative_marks INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL, description TEXT,
  test_type TEXT NOT NULL DEFAULT 'chapter',
  duration_minutes INTEGER NOT NULL DEFAULT 60,
  is_published BOOLEAN DEFAULT false,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TABLE public.test_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id) ON DELETE CASCADE,
  order_index INTEGER DEFAULT 0,
  UNIQUE (test_id, question_id)
);

CREATE TABLE public.test_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE,
  score INTEGER, total_marks INTEGER,
  answers JSONB, time_taken_seconds INTEGER
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.courses TO authenticated;
GRANT SELECT ON public.courses TO anon;
GRANT ALL ON public.courses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.chapters TO authenticated;
GRANT SELECT ON public.chapters TO anon;
GRANT ALL ON public.chapters TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.questions TO authenticated;
GRANT ALL ON public.questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tests TO authenticated;
GRANT SELECT ON public.tests TO anon;
GRANT ALL ON public.tests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_questions TO authenticated;
GRANT SELECT ON public.test_questions TO anon;
GRANT ALL ON public.test_questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_attempts TO authenticated;
GRANT ALL ON public.test_attempts TO service_role;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name) VALUES (new.id, new.raw_user_meta_data ->> 'full_name');
  INSERT INTO public.user_roles (user_id, role) VALUES (new.id, 'student');
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can create own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can manage all roles" ON public.user_roles FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view courses" ON public.courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON public.courses FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view chapters" ON public.chapters FOR SELECT USING (true);
CREATE POLICY "Admins can manage chapters" ON public.chapters FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage questions" ON public.questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view published tests" ON public.tests FOR SELECT USING (is_published = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can manage tests" ON public.tests FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Anyone can view test questions" ON public.test_questions FOR SELECT USING (true);
CREATE POLICY "Admins can manage test questions" ON public.test_questions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can view own attempts" ON public.test_attempts FOR SELECT USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users can create own attempts" ON public.test_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own attempts" ON public.test_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can delete test attempts" ON public.test_attempts FOR DELETE USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$
LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_questions_updated_at BEFORE UPDATE ON public.questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_tests_updated_at BEFORE UPDATE ON public.tests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'jee_mains' CHECK (exam_type IN ('jee_mains', 'jee_advanced'));
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS instructions_json JSONB;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS pdf_page_number INTEGER DEFAULT 1;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS partial_marking BOOLEAN DEFAULT false;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_number INTEGER;
ALTER TABLE public.test_attempts ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE public.test_attempts ADD COLUMN IF NOT EXISTS fullscreen_exit_count INTEGER DEFAULT 0;
ALTER TABLE public.test_attempts ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE public.test_attempts ADD COLUMN IF NOT EXISTS percentile NUMERIC(5,2);
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

CREATE OR REPLACE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.test_subjects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  name TEXT NOT NULL, order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE TABLE public.test_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject_id UUID NOT NULL REFERENCES public.test_subjects(id) ON DELETE CASCADE,
  name TEXT, section_type TEXT NOT NULL DEFAULT 'single_choice',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE TABLE public.test_section_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_id UUID NOT NULL REFERENCES public.test_sections(id) ON DELETE CASCADE,
  test_id UUID NOT NULL REFERENCES public.tests(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL, question_text TEXT,
  options JSONB, correct_answer JSONB NOT NULL,
  marks INTEGER DEFAULT 4, negative_marks INTEGER DEFAULT 1,
  pdf_page INTEGER DEFAULT 1, order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_subjects TO authenticated;
GRANT SELECT ON public.test_subjects TO anon;
GRANT ALL ON public.test_subjects TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_sections TO authenticated;
GRANT SELECT ON public.test_sections TO anon;
GRANT ALL ON public.test_sections TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.test_section_questions TO authenticated;
GRANT ALL ON public.test_section_questions TO service_role;

ALTER TABLE public.test_subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_section_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage test subjects" ON public.test_subjects FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone view test subjects" ON public.test_subjects FOR SELECT USING (true);
CREATE POLICY "Admins manage test sections" ON public.test_sections FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone view test sections" ON public.test_sections FOR SELECT USING (true);
CREATE POLICY "Admins manage section questions" ON public.test_section_questions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_test_section_questions_updated_at BEFORE UPDATE ON public.test_section_questions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS roll_number TEXT UNIQUE;

CREATE OR REPLACE FUNCTION public.generate_roll_number()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public'
AS $$
DECLARE new_roll_number TEXT;
BEGIN
  new_roll_number := TO_CHAR(NOW(), 'DDMMYY') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  WHILE EXISTS (SELECT 1 FROM public.profiles WHERE roll_number = new_roll_number) LOOP
    new_roll_number := TO_CHAR(NOW(), 'DDMMYY') || LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
  END LOOP;
  NEW.roll_number := new_roll_number;
  RETURN NEW;
END;
$$;

CREATE TRIGGER generate_profile_roll_number BEFORE INSERT ON public.profiles
FOR EACH ROW WHEN (NEW.roll_number IS NULL) EXECUTE FUNCTION public.generate_roll_number();

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS phone TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS address TEXT,
  ADD COLUMN IF NOT EXISTS city TEXT,
  ADD COLUMN IF NOT EXISTS state TEXT,
  ADD COLUMN IF NOT EXISTS is_banned BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS banned_reason TEXT;

CREATE POLICY "Admins view all profiles" ON public.profiles FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins update all profiles" ON public.profiles FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS scheduled_at timestamp with time zone DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS fullscreen_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS answer_key_uploaded boolean DEFAULT true;

ALTER TABLE public.test_attempts ADD COLUMN IF NOT EXISTS awaiting_result boolean DEFAULT false;
ALTER TABLE public.test_section_questions ADD COLUMN IF NOT EXISTS is_bonus boolean DEFAULT false;

CREATE POLICY "Only admins view questions directly" ON public.questions FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

CREATE OR REPLACE FUNCTION public.user_completed_test(_user_id uuid, _test_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.test_attempts WHERE user_id = _user_id AND test_id = _test_id AND completed_at IS NOT NULL) $$;

CREATE POLICY "Secure access to section questions" ON public.test_section_questions FOR SELECT
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR EXISTS (SELECT 1 FROM test_attempts WHERE test_attempts.test_id = test_section_questions.test_id AND test_attempts.user_id = auth.uid())
  OR EXISTS (SELECT 1 FROM tests WHERE tests.id = test_section_questions.test_id AND tests.is_published = true)
);

CREATE TABLE public.qb_courses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE TABLE public.qb_chapters (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.qb_courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL, order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE TABLE public.qb_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.qb_courses(id) ON DELETE CASCADE,
  chapter_id UUID NOT NULL REFERENCES public.qb_chapters(id) ON DELETE CASCADE,
  qno INTEGER NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('mcq_single', 'mcq_multi', 'integer', 'numeric')),
  options JSONB, correct JSONB NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
  marks JSONB NOT NULL DEFAULT '{"positive": 4, "negative": 1}'::jsonb,
  text_source TEXT NOT NULL DEFAULT 'inline' CHECK (text_source IN ('pdf', 'inline')),
  pdf_page INTEGER, pdf_coords JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);
CREATE TABLE public.qb_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.qb_questions(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, question_id)
);
CREATE TABLE public.qb_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  question_id UUID NOT NULL REFERENCES public.qb_questions(id) ON DELETE CASCADE,
  answer JSONB NOT NULL, is_correct BOOLEAN NOT NULL, marks_obtained INTEGER NOT NULL,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.qb_courses TO authenticated;
GRANT SELECT ON public.qb_courses TO anon;
GRANT ALL ON public.qb_courses TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qb_chapters TO authenticated;
GRANT SELECT ON public.qb_chapters TO anon;
GRANT ALL ON public.qb_chapters TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qb_questions TO authenticated;
GRANT SELECT ON public.qb_questions TO anon;
GRANT ALL ON public.qb_questions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qb_bookmarks TO authenticated;
GRANT ALL ON public.qb_bookmarks TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.qb_attempts TO authenticated;
GRANT ALL ON public.qb_attempts TO service_role;

ALTER TABLE public.qb_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_bookmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qb_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view qb courses" ON public.qb_courses FOR SELECT USING (true);
CREATE POLICY "Admins manage qb courses" ON public.qb_courses FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone view qb chapters" ON public.qb_chapters FOR SELECT USING (true);
CREATE POLICY "Admins manage qb chapters" ON public.qb_chapters FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Anyone view qb questions" ON public.qb_questions FOR SELECT USING (true);
CREATE POLICY "Admins manage qb questions" ON public.qb_questions FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users view own qb bookmarks" ON public.qb_bookmarks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users manage own qb bookmarks" ON public.qb_bookmarks FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users view own qb attempts" ON public.qb_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users create own qb attempts" ON public.qb_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_qb_chapters_course ON public.qb_chapters(course_id);
CREATE INDEX idx_qb_questions_chapter ON public.qb_questions(chapter_id);
CREATE INDEX idx_qb_questions_course ON public.qb_questions(course_id);
CREATE INDEX idx_qb_questions_difficulty ON public.qb_questions(difficulty);
CREATE INDEX idx_qb_bookmarks_user ON public.qb_bookmarks(user_id);
CREATE INDEX idx_qb_attempts_user ON public.qb_attempts(user_id);

ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS image_url text DEFAULT NULL;
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS academic_status text,
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'english',
  ADD COLUMN IF NOT EXISTS coaching_type text,
  ADD COLUMN IF NOT EXISTS coaching_name text,
  ADD COLUMN IF NOT EXISTS telegram_id text,
  ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS show_solutions boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS solution_reopen_mode boolean DEFAULT true;

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL, message text NOT NULL,
  type text DEFAULT 'info', is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins create notifications" ON public.notifications FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

ALTER TABLE public.test_section_questions
  ADD COLUMN IF NOT EXISTS image_url TEXT,
  ADD COLUMN IF NOT EXISTS solution_text TEXT,
  ADD COLUMN IF NOT EXISTS solution_image_url TEXT,
  ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS time_seconds INTEGER;