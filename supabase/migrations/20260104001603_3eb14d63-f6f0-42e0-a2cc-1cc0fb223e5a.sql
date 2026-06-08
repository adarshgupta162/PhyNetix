-- Add additional profile fields for student data collection
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS gender text,
ADD COLUMN IF NOT EXISTS academic_status text,
ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'english',
ADD COLUMN IF NOT EXISTS coaching_type text,
ADD COLUMN IF NOT EXISTS coaching_name text,
ADD COLUMN IF NOT EXISTS telegram_id text,
ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;

-- Add test settings for solution visibility
ALTER TABLE public.tests
ADD COLUMN IF NOT EXISTS show_solutions boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS solution_reopen_mode boolean DEFAULT true;

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  created_by uuid
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON public.notifications
FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update own notifications" ON public.notifications
FOR UPDATE USING (auth.uid() = user_id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);