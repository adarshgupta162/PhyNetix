-- Add policy for admins to delete test attempts
CREATE POLICY "Admins can delete test attempts" 
ON public.test_attempts 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));