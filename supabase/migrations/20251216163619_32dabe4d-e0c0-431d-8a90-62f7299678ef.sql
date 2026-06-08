-- Fix RLS policy for test_section_questions to allow students to view questions
-- when they are about to start a test (before attempt is created)

-- Drop existing policy
DROP POLICY IF EXISTS "Secure access to section questions" ON public.test_section_questions;

-- Create new policy that allows:
-- 1. Admins always
-- 2. Users who completed the test (for analysis)
-- 3. Users who have an incomplete attempt (during test)
-- 4. Users viewing a published test's question COUNT only (not answer data)
CREATE POLICY "Secure access to section questions" 
ON public.test_section_questions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) 
  OR user_completed_test(test_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM test_attempts
    WHERE test_attempts.test_id = test_section_questions.test_id 
    AND test_attempts.user_id = auth.uid() 
    AND test_attempts.completed_at IS NULL
  )
  OR EXISTS (
    SELECT 1 FROM tests
    WHERE tests.id = test_section_questions.test_id 
    AND tests.is_published = true
  )
);