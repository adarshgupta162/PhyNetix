-- Restrict institute DPP visibility to the institute or the exact enrolled batch.
DROP POLICY IF EXISTS dpps_read ON public.dpps;
CREATE POLICY dpps_read ON public.dpps FOR SELECT TO authenticated
USING (
 has_role(auth.uid(),'admin'::app_role)
 OR (institution_id IS NULL AND (COALESCE(is_published,false) OR is_staff(auth.uid())))
 OR (institution_id IS NOT NULL AND public.is_institution_staff(institution_id))
 OR (institution_id IS NOT NULL AND COALESCE(is_published,false) AND (
   (batch_id IS NULL AND public.is_institution_student(institution_id))
   OR EXISTS(SELECT 1 FROM public.batch_enrollments be WHERE be.batch_id=dpps.batch_id AND be.user_id=auth.uid() AND be.status='active')
 ))
);
DROP POLICY IF EXISTS dppq_read ON public.dpp_questions;
CREATE POLICY dppq_read ON public.dpp_questions FOR SELECT TO authenticated
USING (EXISTS(SELECT 1 FROM public.dpps d WHERE d.id=dpp_questions.dpp_id AND (
 has_role(auth.uid(),'admin'::app_role)
 OR (d.institution_id IS NULL AND d.is_published=true AND (d.batch_id IS NULL OR EXISTS(SELECT 1 FROM public.batch_enrollments be WHERE be.batch_id=d.batch_id AND be.user_id=auth.uid() AND be.status='active')))
 OR (d.institution_id IS NOT NULL AND public.is_institution_staff(d.institution_id))
 OR (d.institution_id IS NOT NULL AND d.is_published=true AND d.batch_id IS NULL AND public.is_institution_student(d.institution_id))
 OR (d.batch_id IS NOT NULL AND d.is_published=true AND EXISTS(SELECT 1 FROM public.batch_enrollments be WHERE be.batch_id=d.batch_id AND be.user_id=auth.uid() AND be.status='active'))
)));
DROP POLICY IF EXISTS dppa_owner ON public.dpp_attempts;
CREATE POLICY dppa_read ON public.dpp_attempts FOR SELECT TO authenticated
USING(user_id=auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR EXISTS(
 SELECT 1 FROM public.dpps d WHERE d.id=dpp_attempts.dpp_id AND d.institution_id IS NOT NULL
 AND (public.has_institution_permission(d.institution_id,'results.view') OR public.has_institution_permission(d.institution_id,'analytics.view'))
));
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
CREATE POLICY dppa_update ON public.dpp_attempts FOR UPDATE TO authenticated USING(user_id=auth.uid()) WITH CHECK(user_id=auth.uid());
CREATE POLICY dppa_delete_admin ON public.dpp_attempts FOR DELETE TO authenticated USING(has_role(auth.uid(),'admin'::app_role));