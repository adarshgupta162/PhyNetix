-- Drop existing permissive SELECT policies on questions table
DROP POLICY IF EXISTS "Anyone can view questions" ON public.questions;

-- Create new restrictive policy: Only admins can view questions directly
-- Students access questions through Edge Functions which exclude correct_answer
CREATE POLICY "Only admins can view questions directly" 
ON public.questions 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Drop existing permissive SELECT policies on test_section_questions table
DROP POLICY IF EXISTS "Anyone can view section questions" ON public.test_section_questions;

-- Create function to check if user has completed a test
CREATE OR REPLACE FUNCTION public.user_completed_test(_user_id uuid, _test_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.test_attempts
    WHERE user_id = _user_id
      AND test_id = _test_id
      AND completed_at IS NOT NULL
  )
$$;

-- Create new policy: Admins can view all, students can only view questions for completed tests (for analysis)
CREATE POLICY "Secure access to section questions" 
ON public.test_section_questions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_completed_test(auth.uid(), test_id)
);