
-- Function to recompute current_students for a batch
CREATE OR REPLACE FUNCTION public.recompute_batch_current_students(_batch_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.batches
  SET current_students = (
    SELECT COUNT(*)::int FROM public.batch_enrollments
    WHERE batch_id = _batch_id
      AND COALESCE(is_active, true) = true
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  ),
  updated_at = now()
  WHERE id = _batch_id;
$$;

-- Trigger function to sync on enrollment changes
CREATE OR REPLACE FUNCTION public.sync_batch_current_students()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'DELETE') THEN
    PERFORM public.recompute_batch_current_students(OLD.batch_id);
    RETURN OLD;
  ELSIF (TG_OP = 'UPDATE') THEN
    PERFORM public.recompute_batch_current_students(NEW.batch_id);
    IF NEW.batch_id <> OLD.batch_id THEN
      PERFORM public.recompute_batch_current_students(OLD.batch_id);
    END IF;
    RETURN NEW;
  ELSE
    PERFORM public.recompute_batch_current_students(NEW.batch_id);
    RETURN NEW;
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_batch_current_students ON public.batch_enrollments;
CREATE TRIGGER trg_sync_batch_current_students
AFTER INSERT OR UPDATE OR DELETE ON public.batch_enrollments
FOR EACH ROW EXECUTE FUNCTION public.sync_batch_current_students();

-- Backfill existing batches
UPDATE public.batches b
SET current_students = COALESCE(sub.cnt, 0)
FROM (
  SELECT batch_id, COUNT(*)::int AS cnt
  FROM public.batch_enrollments
  WHERE COALESCE(is_active, true) = true
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > now())
  GROUP BY batch_id
) sub
WHERE b.id = sub.batch_id;

-- Also reset batches with no enrollments to 0
UPDATE public.batches
SET current_students = 0
WHERE id NOT IN (SELECT DISTINCT batch_id FROM public.batch_enrollments WHERE batch_id IS NOT NULL)
  AND current_students IS DISTINCT FROM 0;
