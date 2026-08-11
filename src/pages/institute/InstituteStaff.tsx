import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstitute, INSTITUTE_PERMISSIONS } from "@/hooks/useInstitute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { UserCog, Loader2, UserPlus } from "lucide-react";

export default function InstituteStaff() {
  const qc = useQueryClient();
  const { institutionId, isInstituteAdmin, isActive } = useInstitute();
  const [form, setForm] = useState({ user_id: "", full_name: "", email: "", role: "teacher" });

  const { data: members, isLoading } = useQuery({
    queryKey: ["inst-staff", institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_members")
        .select("id, user_id, role, permissions, status, full_name, email, created_at")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data ?? [];
    },
  });

  const addMember = useMutation({
    mutationFn: async () => {
      const uid = form.user_id.trim();
      if (!uid) throw new Error("Paste the staff member's user ID");
      const { error } = await supabase.from("institution_members").insert({
        institution_id: institutionId,
        user_id: uid,
        role: form.role,
        status: "active",
        full_name: form.full_name || null,
        email: form.email || null,
        permissions: [],
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Staff member added");
      setForm({ user_id: "", full_name: "", email: "", role: "teacher" });
      qc.invalidateQueries({ queryKey: ["inst-staff", institutionId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const updateMember = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: any }) => {
      const { error } = await supabase.from("institution_members").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inst-staff", institutionId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institution_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Removed");
      qc.invalidateQueries({ queryKey: ["inst-staff", institutionId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!isInstituteAdmin) {
    return <div className="p-6 text-sm text-muted-foreground">Only institute owners and admins can manage staff.</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><UserCog className="w-6 h-6" /> Staff</h1>
        <p className="text-sm text-muted-foreground">Invite teachers and operations staff, and control exactly what each of them can do.</p>
      </div>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><UserPlus className="w-4 h-4" />Add staff member</CardTitle></CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2"><Label>User ID (UUID)</Label><Input value={form.user_id} onChange={(e) => setForm({ ...form, user_id: e.target.value })} placeholder="Ask them to sign up first" /></div>
          <div><Label>Name</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>Email</Label><Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div>
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm({ ...form, role: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="teacher">Teacher</SelectItem>
                <SelectItem value="staff">Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="md:col-span-5">
            <Button onClick={() => addMember.mutate()} disabled={addMember.isPending || !isActive}>
              {addMember.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Add
            </Button>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="py-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (
        <div className="grid gap-3">
          {members?.map((m: any) => {
            const perms: string[] = Array.isArray(m.permissions) ? m.permissions : [];
            const isOwner = m.role === "owner";
            return (
              <Card key={m.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div>
                    <CardTitle className="text-base flex items-center gap-2">
                      {m.full_name || m.email || m.user_id}
                      <Badge variant={isOwner ? "default" : "secondary"} className="capitalize">{m.role}</Badge>
                      {m.status !== "active" && <Badge variant="outline" className="capitalize">{m.status}</Badge>}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 font-mono">{m.user_id}</p>
                  </div>
                  {!isOwner && (
                    <div className="flex items-center gap-2">
                      <Select value={m.role} onValueChange={(v) => updateMember.mutate({ id: m.id, patch: { role: v } })}>
                        <SelectTrigger className="w-[130px]"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">Admin</SelectItem>
                          <SelectItem value="teacher">Teacher</SelectItem>
                          <SelectItem value="staff">Staff</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="sm" className="text-destructive" onClick={() => removeMember.mutate(m.id)}>Remove</Button>
                    </div>
                  )}
                </CardHeader>
                {!isOwner && m.role !== "admin" && (
                  <CardContent>
                    <p className="text-xs text-muted-foreground mb-2">Permissions</p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {INSTITUTE_PERMISSIONS.map((p) => (
                        <label key={p} className="flex items-center gap-2 text-sm">
                          <Checkbox
                            checked={perms.includes(p)}
                            onCheckedChange={(v) => {
                              const next = v ? [...perms, p] : perms.filter((x) => x !== p);
                              updateMember.mutate({ id: m.id, patch: { permissions: next } });
                            }}
                          />
                          {p}
                        </label>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
