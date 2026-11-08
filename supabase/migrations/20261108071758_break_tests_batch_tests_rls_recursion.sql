-- Break the circular RLS dependency:
-- tests SELECT -> batch_tests SELECT -> broad batch_tests ALL -> tests.
-- Keep batch assignment writes permission-checked through a SECURITY DEFINER
-- helper that reads the underlying tables without recursively invoking RLS.

CREATE OR REPLACE FUNCTION public.can_manage_batch_test(_batch_id uuid, _test_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1
      FROM public.batches b
      JOIN public.tests t ON t.id = _test_id
      WHERE b.id = _batch_id
        AND b.institution_id IS NOT NULL
        AND b.institution_id = t.institution_id
        AND has_institution_permission(b.institution_id, 'tests.edit')
        AND institution_is_active(b.institution_id)
    );
$function$;

REVOKE ALL ON FUNCTION public.can_manage_batch_test(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.can_manage_batch_test(uuid, uuid) TO authenticated;

DROP POLICY IF EXISTS bt_admin_write ON public.batch_tests;

CREATE POLICY bt_admin_insert ON public.batch_tests
FOR INSERT TO authenticated
WITH CHECK (public.can_manage_batch_test(batch_id, test_id));

CREATE POLICY bt_admin_update ON public.batch_tests
FOR UPDATE TO authenticated
USING (public.can_manage_batch_test(batch_id, test_id))
WITH CHECK (public.can_manage_batch_test(batch_id, test_id));

CREATE POLICY bt_admin_delete ON public.batch_tests
FOR DELETE TO authenticated
USING (public.can_manage_batch_test(batch_id, test_id));
