-- Align schema with frontend type expectations

ALTER TABLE public.batches
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS category text DEFAULT 'jee_main',
  ADD COLUMN IF NOT EXISTS original_price numeric(10,2),
  ADD COLUMN IF NOT EXISTS start_date timestamptz,
  ADD COLUMN IF NOT EXISTS end_date timestamptz,
  ADD COLUMN IF NOT EXISTS enrollment_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS max_students integer,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS is_featured boolean NOT NULL DEFAULT false;

ALTER TABLE public.batch_enrollments
  ADD COLUMN IF NOT EXISTS enrollment_type text DEFAULT 'paid',
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'completed',
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

ALTER TABLE public.batch_tests
  ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS is_bonus boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS unlock_date timestamptz;

ALTER TABLE public.coupons
  ADD COLUMN IF NOT EXISTS current_uses integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS min_purchase_amount numeric(10,2),
  ADD COLUMN IF NOT EXISTS applicable_batches uuid[] DEFAULT '{}';
