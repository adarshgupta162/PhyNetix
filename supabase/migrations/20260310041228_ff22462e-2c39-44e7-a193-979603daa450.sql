
ALTER TABLE public.test_section_questions 
ADD COLUMN IF NOT EXISTS image_urls jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS solution_image_urls jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.dpp_questions 
ADD COLUMN IF NOT EXISTS question_image_urls jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS solution_image_urls jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.phynetix_library 
ADD COLUMN IF NOT EXISTS question_image_urls jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS solution_image_urls jsonb DEFAULT '[]'::jsonb;
