-- test_attempts
ALTER TABLE public.test_attempts
  ADD COLUMN IF NOT EXISTS extra_time_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS submit_disabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS result_release_delay_minutes integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS result_available_at timestamptz,
  ADD COLUMN IF NOT EXISTS time_per_question jsonb DEFAULT '{}'::jsonb;

-- batches
ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS syllabus jsonb DEFAULT '[]'::jsonb;

-- tests
ALTER TABLE public.tests
  ADD COLUMN IF NOT EXISTS result_release_delay_minutes integer DEFAULT 0;

-- dpps
ALTER TABLE public.dpps
  ADD COLUMN IF NOT EXISTS chapter text,
  ADD COLUMN IF NOT EXISTS topic text,
  ADD COLUMN IF NOT EXISTS duration_minutes integer,
  ADD COLUMN IF NOT EXISTS is_timed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_type text DEFAULT 'public',
  ADD COLUMN IF NOT EXISTS publish_date date;

-- dpp_questions
ALTER TABLE public.dpp_questions
  ADD COLUMN IF NOT EXISTS question_number integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS question_text text,
  ADD COLUMN IF NOT EXISTS question_image_url text,
  ADD COLUMN IF NOT EXISTS question_image_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS question_type text DEFAULT 'mcq',
  ADD COLUMN IF NOT EXISTS options jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS correct_answer jsonb,
  ADD COLUMN IF NOT EXISTS negative_marks integer DEFAULT 1,
  ADD COLUMN IF NOT EXISTS solution_text text,
  ADD COLUMN IF NOT EXISTS solution_image_url text,
  ADD COLUMN IF NOT EXISTS solution_image_urls text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS difficulty text DEFAULT 'medium';

-- question_bookmarks
ALTER TABLE public.question_bookmarks
  ADD COLUMN IF NOT EXISTS test_id uuid REFERENCES public.tests(id) ON DELETE CASCADE;
