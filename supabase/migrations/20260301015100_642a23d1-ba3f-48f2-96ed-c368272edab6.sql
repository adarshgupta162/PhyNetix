
-- Create DPPs table (Daily Practice Problems sets)
CREATE TABLE public.dpps (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  subject TEXT NOT NULL,
  chapter TEXT,
  topic TEXT,
  difficulty TEXT DEFAULT 'medium',
  duration_minutes INTEGER DEFAULT 30,
  is_published BOOLEAN DEFAULT false,
  is_timed BOOLEAN DEFAULT false,
  access_type TEXT DEFAULT 'public', -- 'public', 'batch_only'
  batch_id UUID REFERENCES public.batches(id),
  publish_date DATE DEFAULT CURRENT_DATE,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create DPP questions table
CREATE TABLE public.dpp_questions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  dpp_id UUID NOT NULL REFERENCES public.dpps(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT,
  question_image_url TEXT,
  question_type TEXT NOT NULL DEFAULT 'single_choice',
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer JSONB NOT NULL,
  marks INTEGER DEFAULT 4,
  negative_marks INTEGER DEFAULT 1,
  solution_text TEXT,
  solution_image_url TEXT,
  difficulty TEXT DEFAULT 'medium',
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create DPP attempts table
CREATE TABLE public.dpp_attempts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  dpp_id UUID NOT NULL REFERENCES public.dpps(id),
  answers JSONB DEFAULT '{}'::jsonb,
  score INTEGER,
  total_marks INTEGER,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  time_taken_seconds INTEGER
);

-- Create platform_settings table for feature toggles
CREATE TABLE public.platform_settings (
  key TEXT NOT NULL PRIMARY KEY,
  value JSONB NOT NULL DEFAULT 'true'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Insert default settings
INSERT INTO public.platform_settings (key, value) VALUES
  ('show_pdf_tests', 'true'::jsonb),
  ('show_leaderboard', 'true'::jsonb),
  ('allow_signups', 'true'::jsonb),
  ('maintenance_mode', 'false'::jsonb);

-- Enable RLS on all tables
ALTER TABLE public.dpps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpp_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dpp_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

-- DPPs policies
CREATE POLICY "Staff can manage dpps" ON public.dpps FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Anyone can view published dpps" ON public.dpps FOR SELECT USING (
  is_published = true OR is_staff(auth.uid())
);

-- DPP questions policies
CREATE POLICY "Staff can manage dpp questions" ON public.dpp_questions FOR ALL USING (is_staff(auth.uid()));
CREATE POLICY "Anyone can view dpp questions for published dpps" ON public.dpp_questions FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.dpps WHERE dpps.id = dpp_questions.dpp_id AND (dpps.is_published = true OR is_staff(auth.uid())))
);

-- DPP attempts policies
CREATE POLICY "Users can create own dpp attempts" ON public.dpp_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dpp attempts" ON public.dpp_attempts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can view own dpp attempts" ON public.dpp_attempts FOR SELECT USING (auth.uid() = user_id OR is_staff(auth.uid()));

-- Platform settings policies
CREATE POLICY "Anyone can view platform settings" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage platform settings" ON public.platform_settings FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Timestamp trigger for dpps
CREATE TRIGGER update_dpps_updated_at BEFORE UPDATE ON public.dpps
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Timestamp trigger for dpp_questions
CREATE TRIGGER update_dpp_questions_updated_at BEFORE UPDATE ON public.dpp_questions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
