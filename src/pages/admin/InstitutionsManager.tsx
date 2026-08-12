import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Building2, Copy, Loader2, Search, CheckCircle2, XCircle, PauseCircle, PlayCircle, Users, Plus } from "lucide-react";
import { INDIAN_STATES } from "@/lib/indiaGeo";

const STATUS_TABS = ["all", "pending", "active", "suspended", "rejected"] as const;
type Tab = (typeof STATUS_TABS)[number];

export default function InstitutionsManager() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<Tab>("pending");
  const [search, setSearch] = useState("");
  const [rejectFor, setRejectFor] = useState<any | null>(null);
  const [reason, setReason] = useState("");
  const [membersFor, setMembersFor] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const { data: stats } = useQuery({
    queryKey: ["platform-institute-stats"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("platform_institute_stats" as any);
      if (error) throw error;
      return data as any;
    },
  });

  const { data: institutions, isLoading } = useQuery({
    queryKey: ["institution-summaries"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("institution_summaries" as any);
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  const setStatus = useMutation({
    mutationFn: async ({ id, status, rejection_reason }: { id: string; status: string; rejection_reason?: string | null }) => {
      const patch: any = { status, rejection_reason: rejection_reason ?? null };
      if (status === "active") patch.approved_at = new Date().toISOString();
      const { error } = await supabase.from("institutions").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Institute updated");
      qc.invalidateQueries({ queryKey: ["institution-summaries"] });
      qc.invalidateQueries({ queryKey: ["platform-institute-stats"] });
      setRejectFor(null);
      setReason("");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (institutions ?? []).filter((i: any) => {
      const okTab = tab === "all" || i.status === tab;
      const okSearch = !q || [i.name, i.code, i.city, i.contact_email, i.owner_name].some((v: string) => v?.toLowerCase().includes(q));
      return okTab && okSearch;
    });
  }, [institutions, tab, search]);

  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success("Copied"); };

  return (
    <AdminLayout>
      <div className="p-6 space-y-6 max-w-6xl mx-auto">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2"><Building2 className="w-6 h-6" /> Institutes</h1>
            <p className="text-sm text-muted-foreground">Approve registrations and oversee every institute workspace on PhyNetix.</p>
          </div>
          <Button onClick={() => setAddOpen(true)}><Plus className="w-4 h-4 mr-2" />Add institute</Button>
        </div>

        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          {[
            { label: "Institutes", value: stats?.total },
            { label: "Pending approval", value: stats?.pending },
            { label: "Students", value: stats?.students },
            { label: "Attempts", value: stats?.attempts },
          ].map((s) => (
            <Card key={s.label}>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{s.value ?? 0}</div>
                <div className="text-xs text-muted-foreground">{s.label}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex gap-2 flex-wrap items-center">
          {STATUS_TABS.map((t) => (
            <Button key={t} size="sm" variant={tab === t ? "default" : "outline"} className="capitalize" onClick={() => setTab(t)}>
              {t}
              {t !== "all" && stats?.[t] != null && <span className="ml-2 opacity-70">{stats[t]}</span>}
            </Button>
          ))}
          <div className="relative ml-auto min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input className="pl-9" placeholder="Search institutes" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>

        {isLoading ? (
          <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : rows.length === 0 ? (
          <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No institutes here.</CardContent></Card>
        ) : (
          <div className="grid gap-4">
            {rows.map((i: any) => (
              <Card key={i.id}>
                <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                  <div className="flex gap-3 min-w-0">
                    {i.logo_url ? (
                      <img src={i.logo_url} alt={`${i.name} logo`} className="w-11 h-11 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-11 h-11 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>
                    )}
                    <div className="min-w-0">
                      <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                        {i.name}
                        <Badge
                          variant={i.status === "active" ? "default" : i.status === "pending" ? "secondary" : "destructive"}
                          className="capitalize"
                        >
                          {i.status}
                        </Badge>
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-1">
                        {[i.city, i.state].filter(Boolean).join(", ") || "—"} · {i.contact_email || "no email"} · owner {i.owner_name || "—"}
                      </p>
                      {i.status === "rejected" && i.rejection_reason && (
                        <p className="text-xs text-destructive mt-1">Reason: {i.rejection_reason}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1 rounded-md border bg-muted/30 shrink-0">
                    <code className="font-mono text-xs">{i.code}</code>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copy(i.code)}><Copy className="w-3 h-3" /></Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex gap-4 text-xs text-muted-foreground flex-wrap">
                    <span>{Number(i.students ?? 0)} students</span>
                    <span>{Number(i.batches ?? 0)} batches</span>
                    <span>{Number(i.tests ?? 0)} tests</span>
                    <span>{Number(i.attempts ?? 0)} attempts</span>
                    <span>registered {new Date(i.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    {i.status === "pending" && (
                      <>
                        <Button size="sm" onClick={() => setStatus.mutate({ id: i.id, status: "active" })}>
                          <CheckCircle2 className="w-4 h-4 mr-2" />Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-destructive" onClick={() => setRejectFor(i)}>
                          <XCircle className="w-4 h-4 mr-2" />Reject
                        </Button>
                      </>
                    )}
                    {i.status === "active" && (
                      <Button size="sm" variant="outline" onClick={() => setStatus.mutate({ id: i.id, status: "suspended" })}>
                        <PauseCircle className="w-4 h-4 mr-2" />Suspend
                      </Button>
                    )}
                    {(i.status === "suspended" || i.status === "rejected") && (
                      <Button size="sm" onClick={() => setStatus.mutate({ id: i.id, status: "active" })}>
                        <PlayCircle className="w-4 h-4 mr-2" />Reactivate
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => setMembersFor(i.id)}>
                      <Users className="w-4 h-4 mr-2" />Staff
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Dialog open={!!rejectFor} onOpenChange={(o) => !o && setRejectFor(null)}>
          <DialogContent>
            <DialogHeader><DialogTitle>Reject {rejectFor?.name}</DialogTitle></DialogHeader>
            <div>
              <Label>Reason (shown to the institute)</Label>
              <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} />
            </div>
            <DialogFooter>
              <Button
                variant="destructive"
                disabled={setStatus.isPending}
                onClick={() => setStatus.mutate({ id: rejectFor.id, status: "rejected", rejection_reason: reason || null })}
              >
                {setStatus.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Reject
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {membersFor && <MembersDialog institutionId={membersFor} onClose={() => setMembersFor(null)} />}
      </div>
    </AdminLayout>
  );
}

function MembersDialog({ institutionId, onClose }: { institutionId: string; onClose: () => void }) {
  const qc = useQueryClient();
  const [userId, setUserId] = useState("");
  const [role, setRole] = useState("admin");

  const { data: members } = useQuery({
    queryKey: ["inst-members", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("institution_members")
        .select("id, user_id, role, status, full_name, email")
        .eq("institution_id", institutionId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const addMember = useMutation({
    mutationFn: async () => {
      if (!userId.trim()) throw new Error("Paste a user ID");
      const { error } = await supabase.from("institution_members").insert({
        institution_id: institutionId, user_id: userId.trim(), role, status: "active",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Member added");
      setUserId("");
      qc.invalidateQueries({ queryKey: ["inst-members", institutionId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const removeMember = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("institution_members").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inst-members", institutionId] }),
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>Institute staff</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="User ID (UUID)" value={userId} onChange={(e) => setUserId(e.target.value)} />
            <select className="border rounded px-2 bg-background" value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="owner">Owner</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="staff">Staff</option>
            </select>
            <Button onClick={() => addMember.mutate()} disabled={addMember.isPending}>Add</Button>
          </div>
          <div className="space-y-2">
            {members?.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between border rounded p-2">
                <div className="min-w-0">
                  <div className="font-medium text-sm truncate">{m.full_name || m.email || m.user_id}</div>
                  <div className="text-xs text-muted-foreground capitalize">{m.role} · {m.status}</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => removeMember.mutate(m.id)}>Remove</Button>
              </div>
            ))}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
