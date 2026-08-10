import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstitute } from "@/hooks/useInstitute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Plus, Copy, RefreshCw, Users, Layers, Loader2, ClipboardList } from "lucide-react";
import { format } from "date-fns";

const emptyBatch = {
  name: "", description: "", category: "jee_main",
  start_date: "", end_date: "", is_active: true,
};

export default function InstituteBatches() {
  const qc = useQueryClient();
  const { institutionId, isSuspended } = useInstitute();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...emptyBatch });
  const [regenFor, setRegenFor] = useState<any>(null);
  const [membersFor, setMembersFor] = useState<any>(null);
  const [testsFor, setTestsFor] = useState<any>(null);

  const { data: batches, isLoading } = useQuery({
    queryKey: ["institute-batches", institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batches")
        .select("*")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createBatch = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Batch name is required");
      const { error } = await supabase.from("batches").insert({
        name: form.name.trim(),
        description: form.description || null,
        category: form.category,
        start_date: form.start_date || null,
        end_date: form.end_date || null,
        is_active: form.is_active,
        is_published: false,
        is_free: true,
        price: 0,
        institution_id: institutionId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Batch created");
      qc.invalidateQueries({ queryKey: ["institute-batches", institutionId] });
      setOpen(false);
      setForm({ ...emptyBatch });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("batches").update({ is_active }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institute-batches", institutionId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const regenerate = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.rpc("regenerate_batch_code", { _batch_id: id });
      if (error) throw error;
      const res = data as any;
      if (!res?.success) throw new Error(res?.error || "Could not regenerate code");
      return res.join_code as string;
    },
    onSuccess: (code) => {
      toast.success(`New joining code: ${code}. The old code no longer works.`);
      qc.invalidateQueries({ queryKey: ["institute-batches", institutionId] });
      setRegenFor(null);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Joining code copied");
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Layers className="w-5 h-5" /> Batches</h1>
          <p className="text-sm text-muted-foreground">Create batches and share joining codes with your students.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={isSuspended}>
          <Plus className="w-4 h-4 mr-2" /> New Batch
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4">{[0, 1].map((i) => <Skeleton key={i} className="h-40 w-full" />)}</div>
      ) : !batches || batches.length === 0 ? (
        <Card><CardContent className="py-16 text-center text-muted-foreground">
          No batches yet. Create your first batch to generate a joining code.
        </CardContent></Card>
      ) : (
        <div className="grid gap-4">
          {batches.map((b: any) => (
            <Card key={b.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {b.name}
                    <Badge variant={b.is_active ? "default" : "secondary"}>{b.is_active ? "Active" : "Inactive"}</Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {b.description || "No description"} · created {format(new Date(b.created_at), "dd MMM yyyy")}
                  </p>
                </div>
                <Switch
                  checked={!!b.is_active}
                  disabled={isSuspended}
                  onCheckedChange={(v) => toggleActive.mutate({ id: b.id, is_active: v })}
                />
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/30">
                    <span className="text-xs text-muted-foreground">Joining code</span>
                    <code className="font-mono font-semibold tracking-wider">{b.join_code}</code>
                    <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => copy(b.join_code)} aria-label="Copy code">
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setRegenFor(b)} disabled={isSuspended}>
                    <RefreshCw className="w-4 h-4 mr-2" /> Regenerate
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setMembersFor(b)}>
                    <Users className="w-4 h-4 mr-2" /> Members ({b.current_students ?? 0})
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => setTestsFor(b)}>
                    <ClipboardList className="w-4 h-4 mr-2" /> Assigned Tests
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create batch</DialogTitle>
            <DialogDescription>A unique joining code is generated automatically.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="JEE Main 2027 — Batch A" /></div>
            <div><Label>Description</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div><Label>Course / exam category</Label>
              <select className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
                <option value="jee_main">JEE Main</option>
                <option value="jee_advanced">JEE Advanced</option>
                <option value="neet">NEET</option>
                <option value="foundation">Foundation</option>
                <option value="dropper">Dropper</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Start date</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>End date</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createBatch.mutate()} disabled={createBatch.isPending}>
              {createBatch.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Create batch
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!regenFor} onOpenChange={(v) => !v && setRegenFor(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Regenerate joining code?</AlertDialogTitle>
            <AlertDialogDescription>
              The current code <strong>{regenFor?.join_code}</strong> will stop working immediately.
              Existing members stay enrolled.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => regenerate.mutate(regenFor.id)}>Regenerate</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {membersFor && <MembersDialog batch={membersFor} onClose={() => setMembersFor(null)} />}
      {testsFor && <AssignTestsDialog batch={testsFor} institutionId={institutionId!} onClose={() => setTestsFor(null)} />}
    </div>
  );
}

function MembersDialog({ batch, onClose }: { batch: any; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["batch-members", batch.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batch_enrollments")
        .select("id, user_id, enrolled_at, status, enrollment_type, profiles:user_id(full_name, roll_number)")
        .eq("batch_id", batch.id)
        .eq("status", "active")
        .order("enrolled_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("batch_enrollments").update({ status: "removed", is_active: false }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Student removed from batch");
      qc.invalidateQueries({ queryKey: ["batch-members", batch.id] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle>{batch.name} — members</DialogTitle></DialogHeader>
        {isLoading ? <Skeleton className="h-32 w-full" /> : !data?.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">
            No students yet. Share the code <code className="font-mono">{batch.join_code}</code>.
          </p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {data.map((m) => (
              <div key={m.id} className="flex items-center justify-between border rounded-md p-2">
                <div>
                  <div className="text-sm font-medium">{m.profiles?.full_name || "Unnamed student"}</div>
                  <div className="text-xs text-muted-foreground">
                    {m.profiles?.roll_number} · joined {format(new Date(m.enrolled_at), "dd MMM yyyy")} · {m.enrollment_type || "manual"}
                  </div>
                </div>
                <Button size="sm" variant="ghost" onClick={() => remove.mutate(m.id)}>Remove</Button>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function AssignTestsDialog({ batch, institutionId, onClose }: { batch: any; institutionId: string; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: tests } = useQuery({
    queryKey: ["institute-tests-simple", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests").select("id, name, is_published")
        .eq("institution_id", institutionId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: assigned } = useQuery({
    queryKey: ["batch-tests", batch.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("batch_tests").select("id, test_id").eq("batch_id", batch.id);
      if (error) throw error;
      return data;
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ testId, on }: { testId: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase.from("batch_tests").insert({ batch_id: batch.id, test_id: testId });
        if (error) throw error;
      } else {
        const { error } = await supabase.from("batch_tests").delete().eq("batch_id", batch.id).eq("test_id", testId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["batch-tests", batch.id] }),
    onError: (e: any) => toast.error(e.message),
  });

  const assignedIds = new Set((assigned ?? []).map((a: any) => a.test_id));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{batch.name} — assigned tests</DialogTitle>
          <DialogDescription>Only students in this batch can access the tests you assign.</DialogDescription>
        </DialogHeader>
        {!tests?.length ? (
          <p className="text-sm text-muted-foreground py-6 text-center">Create a test first from the Tests page.</p>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-2">
            {tests.map((t: any) => (
              <label key={t.id} className="flex items-center justify-between border rounded-md p-2 cursor-pointer">
                <div>
                  <div className="text-sm font-medium">{t.name}</div>
                  <div className="text-xs text-muted-foreground">{t.is_published ? "Published" : "Draft"}</div>
                </div>
                <Switch
                  checked={assignedIds.has(t.id)}
                  onCheckedChange={(v) => toggle.mutate({ testId: t.id, on: v })}
                />
              </label>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
