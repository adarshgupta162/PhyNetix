
-- Fix 1: Fix swapped arguments in test_section_questions RLS policy
DROP POLICY IF EXISTS "Secure access to section questions" ON public.test_section_questions;

CREATE POLICY "Secure access to section questions"
ON public.test_section_questions
FOR SELECT
TO public
USING (
  has_role(auth.uid(), 'admin'::app_role)
  OR user_completed_test(auth.uid(), test_id)
  OR (EXISTS (
    SELECT 1
    FROM test_attempts
    WHERE test_attempts.test_id = test_section_questions.test_id
      AND test_attempts.user_id = auth.uid()
      AND test_attempts.completed_at IS NULL
  ))
);

-- Fix 2: Restrict batch_enrollments INSERT to only allow pending/inactive enrollments
DROP POLICY IF EXISTS "Users can create own enrollments" ON public.batch_enrollments;

CREATE POLICY "Users can create own enrollments"
ON public.batch_enrollments
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND payment_status = 'pending'
  AND is_active = false
);

-- Fix 3: Restrict payments INSERT to only allow pending status
DROP POLICY IF EXISTS "Users can create own payments" ON public.payments;

CREATE POLICY "Users can create own payments"
ON public.payments
FOR INSERT
TO public
WITH CHECK (
  auth.uid() = user_id
  AND status = 'pending'
);
