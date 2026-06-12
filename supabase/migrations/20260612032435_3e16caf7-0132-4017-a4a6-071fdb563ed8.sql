
ALTER TABLE public.test_section_questions
  ADD COLUMN IF NOT EXISTS solution_image_urls jsonb DEFAULT '[]'::jsonb;

-- Convert library_id from uuid to text so we can auto-generate friendly IDs
ALTER TABLE public.phynetix_library
  ALTER COLUMN library_id DROP DEFAULT,
  ALTER COLUMN library_id TYPE text USING library_id::text;

CREATE OR REPLACE FUNCTION public.generate_library_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_id text;
  attempts int := 0;
BEGIN
  IF NEW.library_id IS NOT NULL AND NEW.library_id <> '' THEN
    RETURN NEW;
  END IF;
  LOOP
    new_id := 'LIB-' || upper(substr(md5(random()::text || clock_timestamp()::text), 1, 6));
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.phynetix_library WHERE library_id = new_id);
    attempts := attempts + 1;
    EXIT WHEN attempts > 10;
  END LOOP;
  NEW.library_id := new_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_generate_library_id ON public.phynetix_library;
CREATE TRIGGER trg_generate_library_id
  BEFORE INSERT ON public.phynetix_library
  FOR EACH ROW EXECUTE FUNCTION public.generate_library_id();

-- Backfill existing rows to friendly IDs
UPDATE public.phynetix_library
SET library_id = 'LIB-' || upper(substr(md5(id::text), 1, 6))
WHERE library_id IS NULL OR library_id = '' OR library_id ~ '^[0-9a-f]{8}-';
