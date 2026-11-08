import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Tables } from '@/integrations/supabase/types';

export type BatchEnrollment = Tables<'batch_enrollments'>;

export function useUserEnrollments() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrollments', user?.id],
    queryFn: async () => {
      if (!user) return [];

      // Do not trust is_active alone: older successful checkouts may have
      // completed payments while the enrollment flag is stale or missing.
      const [{ data: enrollmentRows, error: enrollmentError }, { data: paidRows, error: paymentsError }] = await Promise.all([
        supabase
          .from('batch_enrollments')
          .select('*')
          .eq('user_id', user.id)
          .order('enrolled_at', { ascending: false }),
        supabase
          .from('payments')
          .select('id, batch_id, status, amount, currency, created_at, updated_at, provider, transaction_id, provider_order_id, metadata')
          .eq('user_id', user.id)
          .eq('status', 'completed')
          .not('batch_id', 'is', null)
          .order('created_at', { ascending: false }),
      ]);

      if (enrollmentError) throw enrollmentError;
      if (paymentsError) throw paymentsError;

      const byBatch = new Map<string, any>();
      for (const row of enrollmentRows ?? []) {
        if (row.batch_id && (row.is_active === true || row.status === 'active' || row.payment_status === 'completed')) {
          if (!byBatch.has(row.batch_id)) byBatch.set(row.batch_id, row);
        }
      }

      for (const payment of paidRows ?? []) {
        if (!payment.batch_id || byBatch.has(payment.batch_id)) continue;
        byBatch.set(payment.batch_id, {
          id: `paid-${payment.id}`,
          user_id: user.id,
          batch_id: payment.batch_id,
          status: 'active',
          is_active: true,
          payment_status: 'completed',
          enrollment_type: 'paid',
          enrolled_at: payment.created_at,
          expires_at: null,
          payment_id: payment.id,
          recovered_from_payment: true,
        });
      }

      const batchIds = Array.from(byBatch.keys());
      if (batchIds.length === 0) return [];

      const { data: batchRows, error: batchesError } = await supabase
        .from('batches')
        .select('*')
        .in('id', batchIds);
      if (batchesError) throw batchesError;

      const batchesById = new Map((batchRows ?? []).map((batch: any) => [batch.id, batch]));
      return Array.from(byBatch.values())
        .map((enrollment: any) => ({ ...enrollment, batches: batchesById.get(enrollment.batch_id) ?? null }))
        .filter((enrollment: any) => !!enrollment.batches);
    },
    enabled: !!user,
  });
}

export function useEnrollmentForBatch(batchId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrollment', batchId, user?.id],
    queryFn: async () => {
      if (!user || !batchId) return null;

      // Look up any enrollment row for this (user, batch). We treat rows with
      // status='active' OR is_active=true OR a completed payment as enrolled,
      // so a stale is_active flag never re-shows "Enroll Now" after purchase.
      const { data: enrollment, error } = await supabase
        .from('batch_enrollments')
        .select('*')
        .eq('user_id', user.id)
        .eq('batch_id', batchId)
        .order('enrolled_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      if (enrollment) return enrollment;

      // Fallback: if the auto-enroll trigger hasn't landed yet, check payments.
      const { data: payment } = await supabase
        .from('payments')
        .select('id, status, batch_id, user_id')
        .eq('user_id', user.id)
        .eq('batch_id', batchId)
        .eq('status', 'completed')
        .limit(1)
        .maybeSingle();
      if (payment) {
        return {
          id: payment.id,
          user_id: user.id,
          batch_id: batchId,
          status: 'active',
          is_active: true,
          payment_status: 'completed',
        } as any;
      }
      return null;
    },
    enabled: !!user && !!batchId,
    refetchOnWindowFocus: true,
    staleTime: 0,
  });
}

export function useIsEnrolled(batchId: string | undefined) {
  const { data: enrollment, isLoading } = useEnrollmentForBatch(batchId);
  
  return {
    isEnrolled: !!enrollment,
    enrollment,
    isLoading,
  };
}

export function useAllEnrollments() {
  return useQuery({
    queryKey: ['enrollments', 'all'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_enrollments')
        .select(`
          *,
          batches (name, category)
        `)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });
}

export function useEnrollmentsByBatch(batchId: string | undefined) {
  return useQuery({
    queryKey: ['enrollments', 'batch', batchId],
    queryFn: async () => {
      if (!batchId) return [];

      const { data, error } = await supabase
        .from('batch_enrollments')
        .select('*')
        .eq('batch_id', batchId)
        .order('enrolled_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!batchId,
  });
}

export function useCreateEnrollment() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      batchId, 
      userId,
      enrollmentType = 'paid',
      notes,
    }: { 
      batchId: string; 
      userId?: string;
      enrollmentType?: string;
      notes?: string;
    }) => {
      const { data, error } = await supabase
        .from('batch_enrollments')
        .insert({
          batch_id: batchId,
          user_id: userId || user?.id,
          enrollment_type: enrollmentType,
          enrolled_by: user?.id,
          notes,
          is_active: true,
          payment_status: enrollmentType === 'manual' ? 'completed' : 'pending',
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function useUpdateEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      id, 
      ...updates 
    }: Partial<BatchEnrollment> & { id: string }) => {
      const { data, error } = await supabase
        .from('batch_enrollments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

export function useCancelEnrollment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from('batch_enrollments')
        .update({ is_active: false })
        .eq('id', enrollmentId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['enrollments'] });
    },
  });
}

// Hook to get enrolled batch IDs for the current user
export function useEnrolledBatchIds() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['enrolled-batch-ids', user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from('batch_enrollments')
        .select('batch_id')
        .eq('user_id', user.id)
        .eq('is_active', true);

      if (error) throw error;
      return data.map(e => e.batch_id);
    },
    enabled: !!user,
  });
}

// Hook to get accessible test IDs based on enrollment
export function useAccessibleTestIds() {
  const { data: batchIds = [] } = useEnrolledBatchIds();

  return useQuery({
    queryKey: ['accessible-test-ids', batchIds],
    queryFn: async () => {
      if (batchIds.length === 0) return [];

      const { data, error } = await supabase
        .from('batch_tests')
        .select('test_id')
        .in('batch_id', batchIds);

      if (error) throw error;
      return [...new Set(data.map(bt => bt.test_id))];
    },
    enabled: batchIds.length > 0,
  });
}
