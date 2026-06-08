-- Phase 2: Database Schema Updates for PDF Test + OMR System

-- Add exam_type to tests table
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS pdf_url TEXT;
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS exam_type TEXT DEFAULT 'jee_mains' CHECK (exam_type IN ('jee_mains', 'jee_advanced'));
ALTER TABLE public.tests ADD COLUMN IF NOT EXISTS instructions_json JSONB;

-- Add question fields for PDF mapping and partial marking
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS pdf_page_number INTEGER DEFAULT 1;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS partial_marking BOOLEAN DEFAULT false;
ALTER TABLE public.questions ADD COLUMN IF NOT EXISTS question_number INTEGER;

-- Extend test_attempts with roll number, fullscreen tracking, rank, percentile
ALTER TABLE public.test_attempts ADD COLUMN IF NOT EXISTS roll_number TEXT;
ALTER TABLE public.test_attempts ADD COLUMN IF NOT EXISTS fullscreen_exit_count INTEGER DEFAULT 0;
ALTER TABLE public.test_attempts ADD COLUMN IF NOT EXISTS rank INTEGER;
ALTER TABLE public.test_attempts ADD COLUMN IF NOT EXISTS percentile NUMERIC(5,2);

-- Add role_updated_at to user_roles for session invalidation
ALTER TABLE public.user_roles ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT now();

-- Create trigger to update updated_at on user_roles changes
CREATE OR REPLACE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for test PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('test-pdfs', 'test-pdfs', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies for test-pdfs bucket
CREATE POLICY "Admins can upload PDFs"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'test-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update PDFs"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'test-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete PDFs"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'test-pdfs' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Authenticated users can view test PDFs"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'test-pdfs');