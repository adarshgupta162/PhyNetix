-- Extend institute DPP management to platform staff only for platform-owned DPPs.
DROP POLICY IF EXISTS dppq_staff_write ON public.dpp_questions;
CREATE POLICY dppq_staff_write ON public.dpp_questions FOR ALL TO authenticated
USING(has_role(auth.uid(),'admin'::app_role) OR (EXISTS(SELECT 1 FROM public.dpps d WHERE d.id=dpp_questions.dpp_id AND d.institution_id IS NULL) AND is_staff(auth.uid())) OR EXISTS(SELECT 1 FROM public.dpps d WHERE d.id=dpp_questions.dpp_id AND d.institution_id IS NOT NULL AND public.has_institution_permission(d.institution_id,'dpps.manage') AND public.institution_is_active(d.institution_id)))
WITH CHECK(has_role(auth.uid(),'admin'::app_role) OR (EXISTS(SELECT 1 FROM public.dpps d WHERE d.id=dpp_questions.dpp_id AND d.institution_id IS NULL) AND is_staff(auth.uid())) OR EXISTS(SELECT 1 FROM public.dpps d WHERE d.id=dpp_questions.dpp_id AND d.institution_id IS NOT NULL AND public.has_institution_permission(d.institution_id,'dpps.manage') AND public.institution_is_active(d.institution_id)));
-- Institute proctoring viewers can inspect only sessions belonging to their own institute.
CREATE POLICY institute_proctoring_sessions_read ON public.proctoring_sessions FOR SELECT TO authenticated
USING(EXISTS(SELECT 1 FROM public.tests t WHERE t.id=proctoring_sessions.test_id AND t.institution_id IS NOT NULL AND public.has_institution_permission(t.institution_id,'proctoring.view')));
DROP POLICY IF EXISTS pev_rw ON public.proctoring_events;
CREATE POLICY pev_read_authorized_session ON public.proctoring_events FOR SELECT TO authenticated
USING(EXISTS(SELECT 1 FROM public.proctoring_sessions ps LEFT JOIN public.tests t ON t.id=ps.test_id WHERE ps.id=proctoring_events.session_id AND (ps.user_id=auth.uid() OR has_role(auth.uid(),'admin'::app_role) OR (t.institution_id IS NULL AND is_staff(auth.uid())) OR (t.institution_id IS NOT NULL AND public.has_institution_permission(t.institution_id,'proctoring.view')))));
CREATE POLICY pev_insert_own_session ON public.proctoring_events FOR INSERT TO authenticated
WITH CHECK(EXISTS(SELECT 1 FROM public.proctoring_sessions ps WHERE ps.id=proctoring_events.session_id AND ps.user_id=auth.uid()));
CREATE POLICY institute_proctoring_alerts_read ON public.proctoring_alerts FOR SELECT TO authenticated
USING(EXISTS(SELECT 1 FROM public.proctoring_sessions ps JOIN public.tests t ON t.id=ps.test_id WHERE ps.id=proctoring_alerts.session_id AND t.institution_id IS NOT NULL AND public.has_institution_permission(t.institution_id,'proctoring.view')));
CREATE POLICY institute_proctoring_recordings_read ON public.proctoring_recordings FOR SELECT TO authenticated
USING(EXISTS(SELECT 1 FROM public.proctoring_sessions ps JOIN public.tests t ON t.id=ps.test_id WHERE ps.id=proctoring_recordings.session_id AND t.institution_id IS NOT NULL AND public.has_institution_permission(t.institution_id,'proctoring.view')));