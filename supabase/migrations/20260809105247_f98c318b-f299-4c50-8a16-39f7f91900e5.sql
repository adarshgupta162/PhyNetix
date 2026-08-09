DROP POLICY IF EXISTS batches_read ON public.batches;

CREATE POLICY batches_read ON public.batches
FOR SELECT
USING (
  COALESCE(is_published, false)
  OR COALESCE(is_active, false)
  OR public.is_enrolled_in_batch(auth.uid(), id)
  OR EXISTS (
    SELECT 1 FROM public.batch_enrollments be
    WHERE be.batch_id = batches.id AND be.user_id = auth.uid()
  )
  OR public.has_role(auth.uid(), 'admin'::app_role)
  OR public.is_staff(auth.uid())
);