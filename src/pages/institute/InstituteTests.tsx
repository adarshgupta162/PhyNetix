import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitute } from "@/hooks/useInstitute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { ClipboardList, Loader2, Plus, Layers, Trash2 } from "lucide-react";

export default function InstituteTests() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { institutionId, isActive } = useInstitute();
  const [open, setOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [form, setForm] = useState({ name: "", exam_type: "jee-main", duration_minutes: 180 });

  const { data: tests, isLoading } = useQuery({
    queryKey: ["inst-tests", institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests")
        .select("id, name, exam_type, duration_minutes, is_published, created_at")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const createTest = useMutation({
    mutationFn: async () => {
      if (!form.name.trim()) throw new Error("Test name is required");
      const { error } = await supabase.from("tests").insert({
        name: form.name.trim(),
        exam_type: form.exam_type,
        duration_minutes: Number(form.duration_minutes) || 180,
        test_type: "normal",
        is_published: false,
        institution_id: institutionId,
        created_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Test created");
      setOpen(false);
      setForm({ name: "", exam_type: "jee-main", duration_minutes: 180 });
      qc.invalidateQueries({ queryKey: ["inst-tests", institutionId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const togglePublish = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await supabase.from("tests").update({ is_published }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["inst-tests", institutionId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const removeTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tests").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Test deleted");
      qc.invalidateQueries({ queryKey: ["inst-tests", institutionId] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6" /> Tests</h1>
          <p className="text-sm text-muted-foreground">Create tests and assign them to your batches. Only assigned batch members can attempt them.</p>
        </div>
        <Button onClick={() => setOpen(true)} disabled={!isActive}><Plus className="w-4 h-4 mr-2" />New test</Button>
      </div>

      {isLoading ? (
        <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : (tests?.length ?? 0) === 0 ? (
        <Card><CardContent className="py-14 text-center text-muted-foreground text-sm">No tests yet.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {tests!.map((t: any) => (
            <Card key={t.id}>
              <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
                <div className="min-w-0">
                  <CardTitle className="text-base flex items-center gap-2 flex-wrap">
                    {t.name}
                    <Badge variant={t.is_published ? "default" : "secondary"}>{t.is_published ? "Published" : "Draft"}</Badge>
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {t.exam_type} · {t.duration_minutes} min · created {new Date(t.created_at).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-muted-foreground">Publish</span>
                  <Switch
                    checked={!!t.is_published}
                    disabled={!isActive}
                    onCheckedChange={(v) => togglePublish.mutate({ id: t.id, is_published: v })}
                  />
                </div>
              </CardHeader>
              <CardContent className="flex gap-2 flex-wrap">
                <Button variant="outline" size="sm" onClick={() => setAssignFor(t.id)} disabled={!isActive}>
                  <Layers className="w-4 h-4 mr-2" />Assign to batches
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive"
                  disabled={!isActive}
                  onClick={() => { if (confirm("Delete this test?")) removeTest.mutate(t.id); }}
                >
                  <Trash2 className="w-4 h-4 mr-2" />Delete
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>New test</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Test name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
            <div>
              <Label>Exam type</Label>
              <Select value={form.exam_type} onValueChange={(v) => setForm({ ...form, exam_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="jee-main">JEE Main</SelectItem>
                  <SelectItem value="jee-advanced">JEE Advanced</SelectItem>
                  <SelectItem value="neet">NEET</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input type="number" value={form.duration_minutes} onChange={(e) => setForm({ ...form, duration_minutes: Number(e.target.value) })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => createTest.mutate()} disabled={createTest.isPending}>
              {createTest.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {assignFor && <AssignDialog testId={assignFor} institutionId={institutionId!} onClose={() => setAssignFor(null)} />}
    </div>
  );
}

function AssignDialog({ testId, institutionId, onClose }: { testId: string; institutionId: string; onClose: () => void }) {
  const qc = useQueryClient();

  const { data: batches } = useQuery({
    queryKey: ["inst-batch-options", institutionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batches").select("id, name").eq("institution_id", institutionId).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: assigned } = useQuery({
    queryKey: ["test-batch-links", testId],
    queryFn: async () => {
      const { data, error } = await supabase.from("batch_tests").select("id, batch_id").eq("test_id", testId);
      if (error) throw error;
      return data ?? [];
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ batchId, on }: { batchId: string; on: boolean }) => {
      if (on) {
        const { error } = await supabase.from("batch_tests").insert({ batch_id: batchId, test_id: testId } as any);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("batch_tests").delete().eq("test_id", testId).eq("batch_id", batchId);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["test-batch-links", testId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const assignedIds = new Set((assigned ?? []).map((a: any) => a.batch_id));

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Assign test to batches</DialogTitle></DialogHeader>
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {(batches ?? []).length === 0 && <p className="text-sm text-muted-foreground">Create a batch first.</p>}
          {batches?.map((b: any) => (
            <label key={b.id} className="flex items-center gap-3 border rounded-md p-3 cursor-pointer">
              <Checkbox
                checked={assignedIds.has(b.id)}
                onCheckedChange={(v) => toggle.mutate({ batchId: b.id, on: !!v })}
              />
              <span className="text-sm">{b.name}</span>
            </label>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
