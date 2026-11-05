DROP POLICY IF EXISTS dppq_staff_write ON public.dpp_questions;
CREATE POLICY dppq_staff_write ON public.dpp_questions FOR ALL TO authenticated
USING(has_role(auth.uid(),'admin'::app_role) OR EXISTS(SELECT 1 FROM public.dpps d WHERE d.id=dpp_questions.dpp_id AND d.institution_id IS NOT NULL AND public.has_institution_permission(d.institution_id,'dpps.manage') AND public.institution_is_active(d.institution_id)))
WITH CHECK(has_role(auth.uid(),'admin'::app_role) OR EXISTS(SELECT 1 FROM public.dpps d WHERE d.id=dpp_questions.dpp_id AND d.institution_id IS NOT NULL AND public.has_institution_permission(d.institution_id,'dpps.manage') AND public.institution_is_active(d.institution_id)));
REVOKE EXECUTE ON FUNCTION public.is_institution_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_institution_permission(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.institution_dashboard_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.institution_students(text,uuid,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_institution_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_institution_permission(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.institution_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.institution_students(text,uuid,integer,integer) TO authenticated;