CREATE TABLE IF NOT EXISTS public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.departments (name, description) VALUES
  ('academic', 'Academic department'),
  ('finance', 'Finance department'),
  ('operations', 'Operations department'),
  ('support', 'Support department')
ON CONFLICT (name) DO NOTHING;

ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES public.departments(id);

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

CREATE TABLE IF NOT EXISTS public.community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  message TEXT NOT NULL,
  is_deleted BOOLEAN DEFAULT false,
  deleted_by UUID,
  deleted_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

GRANT SELECT ON public.departments TO authenticated, anon;
GRANT ALL ON public.departments TO service_role;
GRANT SELECT, INSERT ON public.audit_logs TO authenticated;
GRANT ALL ON public.audit_logs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff_requests TO authenticated;
GRANT ALL ON public.staff_requests TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_messages TO authenticated;
GRANT ALL ON public.community_messages TO service_role;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role != 'student') $$;

ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view departments" ON public.departments FOR SELECT USING (true);
CREATE POLICY "Admins manage departments" ON public.departments FOR ALL USING (has_role(auth.uid(), 'admin'));
CREATE POLICY "Staff view audit logs" ON public.audit_logs FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff insert audit logs" ON public.audit_logs FOR INSERT WITH CHECK (is_staff(auth.uid()));
CREATE POLICY "Staff view their requests" ON public.staff_requests FOR SELECT
USING (is_staff(auth.uid()) AND (from_user_id = auth.uid() OR to_user_id = auth.uid() OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Staff create requests" ON public.staff_requests FOR INSERT
WITH CHECK (is_staff(auth.uid()) AND from_user_id = auth.uid());
CREATE POLICY "Staff update their received requests" ON public.staff_requests FOR UPDATE
USING (is_staff(auth.uid()) AND (to_user_id = auth.uid() OR has_role(auth.uid(), 'admin')));
CREATE POLICY "Staff view community messages" ON public.community_messages FOR SELECT USING (is_staff(auth.uid()));
CREATE POLICY "Staff post messages" ON public.community_messages FOR INSERT WITH CHECK (is_staff(auth.uid()) AND user_id = auth.uid());
CREATE POLICY "Staff update own messages or admin" ON public.community_messages FOR UPDATE
USING (is_staff(auth.uid()) AND (user_id = auth.uid() OR has_role(auth.uid(), 'admin')));

ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS requires_action BOOLEAN DEFAULT false;

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.staff_requests;