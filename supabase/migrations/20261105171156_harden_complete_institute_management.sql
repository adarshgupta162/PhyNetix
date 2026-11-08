-- Institute tenant authorization hardening.
CREATE OR REPLACE FUNCTION public.is_institution_staff(_institution_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _institution_id IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.institution_members m
  WHERE m.institution_id=_institution_id AND m.user_id=auth.uid()
   AND m.status='active' AND m.role IN ('owner','admin','teacher','staff')
 )
$$;
CREATE OR REPLACE FUNCTION public.has_institution_permission(_institution_id uuid,_perm text)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
 SELECT _institution_id IS NOT NULL AND EXISTS (
  SELECT 1 FROM public.institution_members m
  WHERE m.institution_id=_institution_id AND m.user_id=auth.uid() AND m.status='active'
   AND (m.role IN ('owner','admin') OR COALESCE(m.permissions,'[]'::jsonb) ? _perm)
 )
$$;
CREATE OR REPLACE FUNCTION public.institution_dashboard_stats()
RETURNS jsonb LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE inst uuid:=public.get_user_institution_id();
BEGIN
 IF inst IS NULL OR NOT public.is_institution_staff(inst) THEN RAISE EXCEPTION 'Institute staff access required'; END IF;
 RETURN jsonb_build_object(
  'institution_id',inst,
  'students',(SELECT count(DISTINCT be.user_id) FROM public.batch_enrollments be JOIN public.batches b ON b.id=be.batch_id WHERE b.institution_id=inst AND be.status='active'),
  'batches',(SELECT count(*) FROM public.batches WHERE institution_id=inst AND COALESCE(is_active,true)),
  'tests',(SELECT count(*) FROM public.tests WHERE institution_id=inst),
  'attempts',(SELECT count(*) FROM public.test_attempts ta JOIN public.tests t ON t.id=ta.test_id WHERE t.institution_id=inst),
  'avg_score',(SELECT COALESCE(round(avg(ta.score)::numeric,2),0) FROM public.test_attempts ta JOIN public.tests t ON t.id=ta.test_id WHERE t.institution_id=inst AND ta.completed_at IS NOT NULL)
 );
END $$;
CREATE OR REPLACE FUNCTION public.institution_students(_search text DEFAULT NULL,_batch_id uuid DEFAULT NULL,_limit integer DEFAULT 25,_offset integer DEFAULT 0)
RETURNS TABLE(user_id uuid,full_name text,roll_number text,phone text,batches text[],joined_at timestamptz,attempts bigint,total_count bigint)
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path=public AS $$
DECLARE inst uuid:=public.get_user_institution_id();
BEGIN
 IF inst IS NULL OR NOT (public.has_institution_permission(inst,'students.view') OR public.has_institution_permission(inst,'analytics.view')) THEN RAISE EXCEPTION 'Student directory permission required'; END IF;
 IF _batch_id IS NOT NULL AND NOT EXISTS(SELECT 1 FROM public.batches b WHERE b.id=_batch_id AND b.institution_id=inst) THEN RAISE EXCEPTION 'Batch does not belong to this institute'; END IF;
 RETURN QUERY WITH base AS (
  SELECT be.user_id uid,min(be.enrolled_at) joined,array_agg(DISTINCT b.name) bnames
  FROM public.batch_enrollments be JOIN public.batches b ON b.id=be.batch_id
  WHERE b.institution_id=inst AND be.status='active' AND (_batch_id IS NULL OR be.batch_id=_batch_id) GROUP BY be.user_id
 ), filtered AS (
  SELECT base.*,p.full_name fname,p.roll_number roll,p.phone ph FROM base LEFT JOIN public.profiles p ON p.id=base.uid
  WHERE _search IS NULL OR _search='' OR p.full_name ILIKE '%'||_search||'%' OR p.roll_number ILIKE '%'||_search||'%'
 )
 SELECT f.uid,f.fname,f.roll,f.ph,f.bnames,f.joined,
  (SELECT count(*) FROM public.test_attempts ta JOIN public.tests t ON t.id=ta.test_id WHERE t.institution_id=inst AND ta.user_id=f.uid),
  (SELECT count(*) FROM filtered)
 FROM filtered f ORDER BY f.joined DESC LIMIT LEAST(GREATEST(COALESCE(_limit,25),1),100) OFFSET GREATEST(COALESCE(_offset,0),0);
END $$;
DROP POLICY IF EXISTS batches_institution_write ON public.batches;
CREATE POLICY batches_institution_write ON public.batches FOR ALL TO authenticated
USING(institution_id IS NOT NULL AND public.has_institution_permission(institution_id,'batches.manage') AND public.institution_is_active(institution_id))
WITH CHECK(institution_id IS NOT NULL AND public.has_institution_permission(institution_id,'batches.manage') AND public.institution_is_active(institution_id));
DROP POLICY IF EXISTS be_institution_write ON public.batch_enrollments;
CREATE POLICY be_institution_write ON public.batch_enrollments FOR ALL TO authenticated
USING(EXISTS(SELECT 1 FROM public.batches b WHERE b.id=batch_enrollments.batch_id AND public.has_institution_permission(b.institution_id,'students.manage') AND public.institution_is_active(b.institution_id)))
WITH CHECK(EXISTS(SELECT 1 FROM public.batches b WHERE b.id=batch_enrollments.batch_id AND public.has_institution_permission(b.institution_id,'students.manage') AND public.institution_is_active(b.institution_id)));
DROP POLICY IF EXISTS bt_admin_write ON public.batch_tests;
CREATE POLICY bt_admin_write ON public.batch_tests FOR ALL TO authenticated
USING(has_role(auth.uid(),'admin'::app_role) OR EXISTS(SELECT 1 FROM public.batches b JOIN public.tests t ON t.id=batch_tests.test_id WHERE b.id=batch_tests.batch_id AND b.institution_id IS NOT NULL AND b.institution_id=t.institution_id AND public.has_institution_permission(b.institution_id,'tests.edit') AND public.institution_is_active(b.institution_id)))
WITH CHECK(has_role(auth.uid(),'admin'::app_role) OR EXISTS(SELECT 1 FROM public.batches b JOIN public.tests t ON t.id=batch_tests.test_id WHERE b.id=batch_tests.batch_id AND b.institution_id IS NOT NULL AND b.institution_id=t.institution_id AND public.has_institution_permission(b.institution_id,'tests.edit') AND public.institution_is_active(b.institution_id)));
DROP POLICY IF EXISTS bt_read ON public.batch_tests;
CREATE POLICY bt_read ON public.batch_tests FOR SELECT TO authenticated
USING(has_role(auth.uid(),'admin'::app_role) OR EXISTS(SELECT 1 FROM public.batches b WHERE b.id=batch_tests.batch_id AND public.is_institution_staff(b.institution_id)) OR EXISTS(SELECT 1 FROM public.batch_enrollments be WHERE be.batch_id=batch_tests.batch_id AND be.user_id=auth.uid() AND be.status='active'));
DROP POLICY IF EXISTS tests_institution_write ON public.tests;
CREATE POLICY tests_institution_insert ON public.tests FOR INSERT TO authenticated WITH CHECK(institution_id IS NOT NULL AND public.has_institution_permission(institution_id,'tests.create') AND public.institution_is_active(institution_id));
CREATE POLICY tests_institution_update ON public.tests FOR UPDATE TO authenticated
USING(institution_id IS NOT NULL AND (public.has_institution_permission(institution_id,'tests.edit') OR public.has_institution_permission(institution_id,'tests.publish')) AND public.institution_is_active(institution_id))
WITH CHECK(institution_id IS NOT NULL AND (public.has_institution_permission(institution_id,'tests.edit') OR public.has_institution_permission(institution_id,'tests.publish')) AND public.institution_is_active(institution_id));
CREATE POLICY tests_institution_delete ON public.tests FOR DELETE TO authenticated USING(institution_id IS NOT NULL AND public.has_institution_permission(institution_id,'tests.edit') AND public.institution_is_active(institution_id));
DROP POLICY IF EXISTS dpps_institution_write ON public.dpps;
DROP POLICY IF EXISTS dpps_platform_write ON public.dpps;
CREATE POLICY dpps_institution_write ON public.dpps FOR ALL TO authenticated
USING(institution_id IS NOT NULL AND public.has_institution_permission(institution_id,'dpps.manage') AND public.institution_is_active(institution_id))
WITH CHECK(institution_id IS NOT NULL AND public.has_institution_permission(institution_id,'dpps.manage') AND public.institution_is_active(institution_id));
CREATE POLICY dpps_platform_write ON public.dpps FOR ALL TO authenticated USING(institution_id IS NULL AND has_role(auth.uid(),'admin'::app_role)) WITH CHECK(institution_id IS NULL AND has_role(auth.uid(),'admin'::app_role));
DROP POLICY IF EXISTS "Admins manage section questions" ON public.test_section_questions;
CREATE POLICY institute_manage_section_questions ON public.test_section_questions FOR ALL TO authenticated
USING(has_role(auth.uid(),'admin'::app_role) OR EXISTS(SELECT 1 FROM public.tests t WHERE t.id=test_section_questions.test_id AND t.institution_id IS NOT NULL AND (public.has_institution_permission(t.institution_id,'questions.manage') OR public.has_institution_permission(t.institution_id,'tests.edit')) AND public.institution_is_active(t.institution_id)))
WITH CHECK(has_role(auth.uid(),'admin'::app_role) OR EXISTS(SELECT 1 FROM public.tests t WHERE t.id=test_section_questions.test_id AND t.institution_id IS NOT NULL AND (public.has_institution_permission(t.institution_id,'questions.manage') OR public.has_institution_permission(t.institution_id,'tests.edit')) AND public.institution_is_active(t.institution_id)));
DROP POLICY IF EXISTS "Secure access to section questions" ON public.test_section_questions;
CREATE POLICY secure_tenant_section_question_read ON public.test_section_questions FOR SELECT TO authenticated
USING(has_role(auth.uid(),'admin'::app_role)
 OR EXISTS(SELECT 1 FROM public.test_attempts ta WHERE ta.test_id=test_section_questions.test_id AND ta.user_id=auth.uid())
 OR EXISTS(SELECT 1 FROM public.tests t WHERE t.id=test_section_questions.test_id AND t.is_published=true AND (t.institution_id IS NULL OR EXISTS(SELECT 1 FROM public.batch_tests bt JOIN public.batch_enrollments be ON be.batch_id=bt.batch_id WHERE bt.test_id=t.id AND be.user_id=auth.uid() AND be.status='active')))
 OR EXISTS(SELECT 1 FROM public.tests t WHERE t.id=test_section_questions.test_id AND public.is_institution_staff(t.institution_id)));
DROP POLICY IF EXISTS institute_view_test_attempts ON public.test_attempts;
CREATE POLICY institute_view_test_attempts ON public.test_attempts FOR SELECT TO authenticated
USING(EXISTS(SELECT 1 FROM public.tests t WHERE t.id=test_attempts.test_id AND t.institution_id IS NOT NULL AND (public.has_institution_permission(t.institution_id,'results.view') OR public.has_institution_permission(t.institution_id,'analytics.view'))));
DROP POLICY IF EXISTS dppq_read ON public.dpp_questions;
CREATE POLICY dppq_read ON public.dpp_questions FOR SELECT TO authenticated
USING(EXISTS(SELECT 1 FROM public.dpps d WHERE d.id=dpp_questions.dpp_id AND (has_role(auth.uid(),'admin'::app_role) OR public.is_institution_staff(d.institution_id) OR (d.institution_id IS NULL AND d.is_published=true) OR (d.institution_id IS NOT NULL AND d.is_published=true AND public.is_institution_student(d.institution_id)) OR EXISTS(SELECT 1 FROM public.batch_enrollments be WHERE be.batch_id=d.batch_id AND be.user_id=auth.uid() AND be.status='active'))));
DROP POLICY IF EXISTS dppq_staff_write ON public.dpp_questions;
CREATE POLICY dppq_staff_write ON public.dpp_questions FOR ALL TO authenticated
USING(has_role(auth.uid(),'admin'::app_role) OR EXISTS(SELECT 1 FROM public.dpps d WHERE d.id=dpp_questions.dpp_id AND d.institution_id IS NOT NULL AND public.has_institution_permission(d.institution_id,'dpps.manage') AND public.institution_is_active(d.institution_id)))
WITH CHECK(has_role(auth.uid(),'admin'::app_role) OR EXISTS(SELECT 1 FROM public.dpps d WHERE d.id=dpp_questions.dpp_id AND d.institution_id IS NOT NULL AND public.has_institution_permission(d.institution_id,'dpps.manage') AND public.institution_is_active(d.institution_id)));
DROP POLICY IF EXISTS "Staff insert audit logs" ON public.audit_logs;
CREATE POLICY institute_insert_audit_logs ON public.audit_logs FOR INSERT TO authenticated
WITH CHECK((institution_id IS NOT NULL AND public.is_institution_staff(institution_id) AND user_id=auth.uid()) OR (institution_id IS NULL AND has_role(auth.uid(),'admin'::app_role) AND user_id=auth.uid()));
DROP POLICY IF EXISTS "Users can update own attempts" ON public.test_attempts;
CREATE POLICY "Users can update own attempts" ON public.test_attempts FOR UPDATE TO authenticated USING(auth.uid()=user_id) WITH CHECK(auth.uid()=user_id);
REVOKE EXECUTE ON FUNCTION public.is_institution_staff(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.has_institution_permission(uuid,text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.institution_dashboard_stats() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.institution_students(text,uuid,integer,integer) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_institution_staff(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.has_institution_permission(uuid,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.institution_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.institution_students(text,uuid,integer,integer) TO authenticated;
