DROP POLICY IF EXISTS dppa_insert ON public.dpp_attempts;
CREATE POLICY dppa_insert ON public.dpp_attempts FOR INSERT TO authenticated
WITH CHECK(user_id=auth.uid() AND EXISTS(
 SELECT 1 FROM public.dpps d WHERE d.id=dpp_attempts.dpp_id AND d.is_published=true
 AND (d.institution_id IS NULL OR public.institution_is_active(d.institution_id))
 AND (
  (d.batch_id IS NULL AND d.institution_id IS NULL)
  OR (d.batch_id IS NULL AND d.institution_id IS NOT NULL AND public.is_institution_student(d.institution_id))
  OR EXISTS(SELECT 1 FROM public.batch_enrollments be WHERE be.batch_id=d.batch_id AND be.user_id=auth.uid() AND be.status='active')
 )
));