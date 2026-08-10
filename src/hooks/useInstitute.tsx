import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export type InstituteStatus = "pending" | "active" | "rejected" | "suspended";

export interface InstituteContext {
  membership: {
    id: string;
    role: string;
    permissions: string[];
    is_primary: boolean;
    status: string;
  };
  institution: {
    id: string;
    name: string;
    slug: string;
    code: string;
    logo_url: string | null;
    status: InstituteStatus;
    description: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    city: string | null;
    state: string | null;
    country: string | null;
    website: string | null;
    primary_color: string | null;
    secondary_color: string | null;
    welcome_message: string | null;
    rejection_reason: string | null;
  };
}

/**
 * Tenant context is always derived from the authenticated user's membership row
 * in the database — never from anything the browser can set.
 */
export function useInstitute() {
  const { user, isLoading: authLoading } = useAuth();

  const query = useQuery({
    queryKey: ["institute-context", user?.id],
    enabled: !!user?.id,
    staleTime: 30_000,
    queryFn: async (): Promise<InstituteContext | null> => {
      const { data, error } = await supabase
        .from("institution_members")
        .select("id, role, permissions, is_primary, status, institution_id, institutions:institution_id(*)")
        .eq("user_id", user!.id)
        .eq("status", "active")
        .order("created_at", { ascending: true });

      if (error) throw error;
      if (!data || data.length === 0) return null;

      const row =
        data.find((r: any) => r.role === "owner") ??
        data.find((r: any) => r.is_primary) ??
        data[0];
      if (!row || !(row as any).institutions) return null;

      return {
        membership: {
          id: (row as any).id,
          role: (row as any).role,
          permissions: Array.isArray((row as any).permissions) ? (row as any).permissions : [],
          is_primary: !!(row as any).is_primary,
          status: (row as any).status,
        },
        institution: (row as any).institutions,
      };
    },
  });

  const ctx = query.data ?? null;
  const role = ctx?.membership.role ?? null;
  const isInstituteAdmin = role === "owner" || role === "admin";

  const can = (permission: string) =>
    isInstituteAdmin || (ctx?.membership.permissions ?? []).includes(permission);

  return {
    ...query,
    isLoading: authLoading || query.isLoading,
    context: ctx,
    institution: ctx?.institution ?? null,
    institutionId: ctx?.institution.id ?? null,
    role,
    isInstituteAdmin,
    isActive: ctx?.institution.status === "active",
    isSuspended: ctx?.institution.status === "suspended",
    can,
  };
}

export const INSTITUTE_PERMISSIONS = [
  "students.view",
  "students.manage",
  "batches.view",
  "batches.manage",
  "tests.view",
  "tests.create",
  "tests.edit",
  "tests.publish",
  "questions.view",
  "questions.manage",
  "results.view",
  "analytics.view",
  "proctoring.view",
] as const;
