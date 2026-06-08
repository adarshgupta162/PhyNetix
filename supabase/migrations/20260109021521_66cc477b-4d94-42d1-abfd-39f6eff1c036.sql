-- Drop and recreate the app_role enum with new roles
-- First check if we need to add values to the enum
DO $$
BEGIN
  -- Add new role values to the existing enum
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'head' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'head';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'manager' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'teacher' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'teacher';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'data_manager' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'data_manager';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'test_manager' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'app_role')) THEN
    ALTER TYPE public.app_role ADD VALUE 'test_manager';
  END IF;
END$$;

-- Create departments table
CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert default departments
INSERT INTO public.departments (name, description) VALUES
  ('academic', 'Academic department - tests, questions, teaching'),
  ('finance', 'Finance department - payments, subscriptions'),
  ('operations', 'Operations department - day to day management'),
  ('support', 'Support department - student queries, help')
ON CONFLICT (name) DO NOTHING;

-- Add department_id to user_roles
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

-- Create audit_logs table for tracking changes
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_value JSONB,
  new_value JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create staff_requests table for inter-staff requests
CREATE TABLE IF NOT EXISTS public.staff_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  request_type TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pending',
  entity_type TEXT,
  entity_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create community_messages table for staff chat
CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID,
  deleted_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to check if user is staff (any role except student)
CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role != 'student'
  )
$$;

-- Enable RLS on new tables
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

-- Departments policies - everyone can view, only admin can manage
CREATE POLICY "Anyone can view departments"
ON public.departments FOR SELECT
USING (true);

CREATE POLICY "Admins can manage departments"
ON public.departments FOR ALL
USING (has_role(auth.uid(), 'admin'));

-- Audit logs policies - staff can view, system inserts
CREATE POLICY "Staff can view audit logs"
ON public.audit_logs FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can insert audit logs"
ON public.audit_logs FOR INSERT
WITH CHECK (is_staff(auth.uid()));

-- Staff requests policies
CREATE POLICY "Staff can view their requests"
ON public.staff_requests FOR SELECT
USING (
  is_staff(auth.uid()) AND 
  (from_user_id = auth.uid() OR to_user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
);

CREATE POLICY "Staff can create requests"
ON public.staff_requests FOR INSERT
WITH CHECK (is_staff(auth.uid()) AND from_user_id = auth.uid());

CREATE POLICY "Staff can update their received requests"
ON public.staff_requests FOR UPDATE
USING (
  is_staff(auth.uid()) AND 
  (to_user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
);

-- Community messages policies
CREATE POLICY "Staff can view community messages"
ON public.community_messages FOR SELECT
USING (is_staff(auth.uid()));

CREATE POLICY "Staff can post messages"
ON public.community_messages FOR INSERT
WITH CHECK (is_staff(auth.uid()) AND user_id = auth.uid());

CREATE POLICY "Staff can update own messages or admin can update any"
ON public.community_messages FOR UPDATE
USING (
  is_staff(auth.uid()) AND 
  (user_id = auth.uid() OR has_role(auth.uid(), 'admin'))
);

-- Add unread_count to notifications for red dot feature
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS requires_action BOOLEAN DEFAULT false;

-- Enable realtime for community messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_requests;