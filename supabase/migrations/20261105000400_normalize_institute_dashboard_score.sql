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
  'avg_score',(SELECT COALESCE(round((sum(ta.score)::numeric/NULLIF(sum(ta.total_marks)::numeric,0))*100,1),0) FROM public.test_attempts ta JOIN public.tests t ON t.id=ta.test_id WHERE t.institution_id=inst AND ta.completed_at IS NOT NULL)
 );
END $$;