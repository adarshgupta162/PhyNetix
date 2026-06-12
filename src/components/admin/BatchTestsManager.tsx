import { useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, Plus, Trash2, Calendar, Gift, FileText, Clock, Loader2, ChevronUp, ChevronDown, Pencil, Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BatchTestsManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  batchId: string;
  batchName: string;
}

interface BatchTest {
  id: string;
  batch_id: string;
  test_id: string;
  unlock_date: string | null;
  is_bonus: boolean | null;
  order_index: number | null;
  section_id: string | null;
  display_order: number | null;
  tests: {
    id: string; name: string; duration_minutes: number;
    test_type: string; exam_type: string | null; is_published: boolean | null;
  } | null;
}

interface CourseSection { id: string; name: string; display_order: number; }
interface Test { id: string; name: string; duration_minutes: number; test_type: string; exam_type: string | null; is_published: boolean | null; created_at: string; }

export function BatchTestsManager({ open, onOpenChange, batchId, batchName }: BatchTestsManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set());
  const [newSectionName, setNewSectionName] = useState("");
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingSectionName, setEditingSectionName] = useState("");
  const queryClient = useQueryClient();

  const { data: batchTests, isLoading: loadingBatchTests } = useQuery({
    queryKey: ['batch-tests-admin', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('batch_tests')
        .select(`*, tests (id, name, duration_minutes, test_type, exam_type, is_published)`)
        .eq('batch_id', batchId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as BatchTest[];
    },
    enabled: open && !!batchId,
  });

  const { data: sections } = useQuery({
    queryKey: ['course-sections', batchId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('course_sections').select('*').eq('batch_id', batchId)
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data as CourseSection[];
    },
    enabled: open && !!batchId,
  });

  const { data: allTests, isLoading: loadingAllTests } = useQuery({
    queryKey: ['all-tests'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tests')
        .select('id, name, duration_minutes, test_type, exam_type, is_published, created_at')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Test[];
    },
    enabled: open,
  });

  const linkedTestIds = new Set(batchTests?.map(bt => bt.test_id) || []);
  const availableTests = allTests?.filter(t =>
    !linkedTestIds.has(t.id) && (searchQuery === "" || t.name.toLowerCase().includes(searchQuery.toLowerCase()))
  ) || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['batch-tests-admin', batchId] });
    queryClient.invalidateQueries({ queryKey: ['batch-tests', batchId] });
    queryClient.invalidateQueries({ queryKey: ['course-sections', batchId] });
  };

  // Sections mutations
  const addSection = useMutation({
    mutationFn: async (name: string) => {
      const maxOrder = sections?.reduce((m, s) => Math.max(m, s.display_order), 0) ?? 0;
      const { error } = await supabase.from('course_sections').insert({ batch_id: batchId, name, display_order: maxOrder + 1 });
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setNewSectionName(""); toast.success("Section added"); },
    onError: (e: any) => toast.error(e.message),
  });
  const renameSection = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { error } = await supabase.from('course_sections').update({ name }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setEditingSectionId(null); toast.success("Section renamed"); },
  });
  const deleteSection = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('course_sections').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Section removed"); },
  });
  const reorderSection = useMutation({
    mutationFn: async ({ id, newOrder }: { id: string; newOrder: number }) => {
      const { error } = await supabase.from('course_sections').update({ display_order: newOrder }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  // Tests mutations
  const addTests = useMutation({
    mutationFn: async (testIds: string[]) => {
      const currentMaxOrder = batchTests?.reduce((m, bt) => Math.max(m, bt.display_order || 0), 0) || 0;
      const rows = testIds.map((tid, i) => ({
        batch_id: batchId, test_id: tid,
        order_index: currentMaxOrder + i + 1,
        display_order: currentMaxOrder + i + 1,
        is_bonus: false,
      }));
      const { error } = await supabase.from('batch_tests').insert(rows);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); setSelectedTests(new Set()); toast.success("Tests added to batch"); },
    onError: (e: any) => toast.error(e.message),
  });
  const removeTest = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('batch_tests').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { invalidate(); toast.success("Test removed"); },
  });
  const updateTest = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<BatchTest> }) => {
      const { error } = await supabase.from('batch_tests').update(patch as any).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => invalidate(),
  });

  const swapTestOrder = async (a: BatchTest, b: BatchTest) => {
    await Promise.all([
      supabase.from('batch_tests').update({ display_order: b.display_order ?? 0, order_index: b.order_index ?? 0 }).eq('id', a.id),
      supabase.from('batch_tests').update({ display_order: a.display_order ?? 0, order_index: a.order_index ?? 0 }).eq('id', b.id),
    ]);
    invalidate();
  };

  // Group tests by section
  const grouped = useMemo(() => {
    const map = new Map<string | null, BatchTest[]>();
    (batchTests || []).forEach(bt => {
      const key = bt.section_id || null;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(bt);
    });
    return map;
  }, [batchTests]);

  const toggleTestSelection = (id: string) => {
    const s = new Set(selectedTests);
    s.has(id) ? s.delete(id) : s.add(id);
    setSelectedTests(s);
  };

  const toLocalValue = (iso: string | null) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (v: number) => String(v).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const renderTestRow = (bt: BatchTest, list: BatchTest[], idx: number) => (
    <div key={bt.id} className="group p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-1">
          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === 0}
            onClick={() => swapTestOrder(bt, list[idx - 1])}><ChevronUp className="w-4 h-4" /></Button>
          <Button size="icon" variant="ghost" className="h-6 w-6" disabled={idx === list.length - 1}
            onClick={() => swapTestOrder(bt, list[idx + 1])}><ChevronDown className="w-4 h-4" /></Button>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{bt.tests?.name || "Unknown Test"}</p>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs">{bt.tests?.test_type}</Badge>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="w-3 h-3" />{bt.tests?.duration_minutes} min</span>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTest.mutate(bt.id)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 gap-2 mt-3 text-xs">
            <label className="flex items-center gap-2">
              <Checkbox checked={bt.is_bonus || false}
                onCheckedChange={(c) => updateTest.mutate({ id: bt.id, patch: { is_bonus: !!c } })} />
              <Gift className="w-3 h-3 text-primary" />Bonus
            </label>
            <Select value={bt.section_id || "__none__"} onValueChange={(v) =>
              updateTest.mutate({ id: bt.id, patch: { section_id: v === "__none__" ? null : v } })
            }>
              <SelectTrigger className="h-7 text-xs"><SelectValue placeholder="Section" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="__none__">No section</SelectItem>
                {sections?.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Calendar className="w-3 h-3 text-muted-foreground" />
              <Input type="datetime-local" className="h-7 text-xs"
                value={toLocalValue(bt.unlock_date)}
                onChange={(e) => updateTest.mutate({ id: bt.id, patch: { unlock_date: e.target.value ? new Date(e.target.value).toISOString() as any : null } })}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Tests - {batchName}</DialogTitle>
          <DialogDescription>
            Organise this course into sections (Full Test, Part Test, Mains, Advance, Chapterwise, etc.) and assign tests to each.
          </DialogDescription>
        </DialogHeader>

        {/* Sections panel */}
        <div className="rounded-lg border p-4 mt-2 bg-background/50">
          <h3 className="font-semibold flex items-center gap-2 mb-3">
            <Layers className="w-4 h-4" /> Sections
          </h3>
          <div className="flex gap-2 mb-3">
            <Input placeholder="New section name (e.g. Full Test, Mains, Chapterwise)"
              value={newSectionName} onChange={(e) => setNewSectionName(e.target.value)} />
            <Button onClick={() => newSectionName.trim() && addSection.mutate(newSectionName.trim())}
              disabled={!newSectionName.trim() || addSection.isPending}>
              <Plus className="w-4 h-4 mr-1" />Add
            </Button>
          </div>
          <div className="space-y-1.5">
            {sections?.length ? sections.map((s, i) => (
              <div key={s.id} className="flex items-center gap-2 p-2 rounded bg-secondary/40">
                <div className="flex flex-col">
                  <Button size="icon" variant="ghost" className="h-5 w-5" disabled={i === 0}
                    onClick={() => {
                      const prev = sections[i - 1];
                      reorderSection.mutate({ id: s.id, newOrder: prev.display_order });
                      reorderSection.mutate({ id: prev.id, newOrder: s.display_order });
                    }}><ChevronUp className="w-3 h-3" /></Button>
                  <Button size="icon" variant="ghost" className="h-5 w-5" disabled={i === sections.length - 1}
                    onClick={() => {
                      const next = sections[i + 1];
                      reorderSection.mutate({ id: s.id, newOrder: next.display_order });
                      reorderSection.mutate({ id: next.id, newOrder: s.display_order });
                    }}><ChevronDown className="w-3 h-3" /></Button>
                </div>
                {editingSectionId === s.id ? (
                  <>
                    <Input className="h-8" value={editingSectionName} onChange={(e) => setEditingSectionName(e.target.value)} />
                    <Button size="sm" onClick={() => renameSection.mutate({ id: s.id, name: editingSectionName })}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingSectionId(null)}>Cancel</Button>
                  </>
                ) : (
                  <>
                    <span className="flex-1 text-sm font-medium">{s.name}</span>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingSectionId(s.id); setEditingSectionName(s.name); }}>
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive"
                      onClick={() => { if (confirm(`Delete section "${s.name}"? Tests in it will become unsectioned.`)) deleteSection.mutate(s.id); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </>
                )}
              </div>
            )) : <p className="text-xs text-muted-foreground">No sections yet. Tests will be unsectioned until you add one.</p>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-4">
          {/* Linked Tests, grouped by section */}
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />Linked Tests ({batchTests?.length || 0})
            </h3>
            <ScrollArea className="h-[450px] rounded-lg border p-3">
              {loadingBatchTests ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : batchTests && batchTests.length > 0 ? (
                <div className="space-y-4">
                  {(sections || []).map(sec => {
                    const list = (grouped.get(sec.id) || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                    return (
                      <div key={sec.id} className="space-y-2">
                        <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">{sec.name}</div>
                        {list.length === 0 ? <p className="text-xs text-muted-foreground italic px-1">No tests in this section</p>
                          : list.map((bt, i) => renderTestRow(bt, list, i))}
                      </div>
                    );
                  })}
                  {(() => {
                    const list = (grouped.get(null) || []).sort((a, b) => (a.display_order || 0) - (b.display_order || 0));
                    if (list.length === 0) return null;
                    return (
                      <div className="space-y-2">
                        <div className="text-xs uppercase font-semibold text-muted-foreground tracking-wider">Unsectioned</div>
                        {list.map((bt, i) => renderTestRow(bt, list, i))}
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <FileText className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No tests linked yet</p>
                  <p className="text-xs">Add tests from the right panel</p>
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Available Tests */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Available Tests</h3>
              {selectedTests.size > 0 && (
                <Button size="sm" onClick={() => addTests.mutate(Array.from(selectedTests))} disabled={addTests.isPending}>
                  {addTests.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                  Add {selectedTests.size}
                </Button>
              )}
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search tests..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <ScrollArea className="h-[400px] rounded-lg border p-3">
              {loadingAllTests ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
              ) : availableTests.length > 0 ? (
                <div className="space-y-2">
                  {availableTests.map(test => (
                    <label key={test.id} className={cn("flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors",
                      selectedTests.has(test.id) ? "bg-primary/10 border border-primary/30" : "bg-secondary/30 hover:bg-secondary/50")}>
                      <Checkbox checked={selectedTests.has(test.id)} onCheckedChange={() => toggleTestSelection(test.id)} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{test.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant={test.is_published ? "default" : "secondary"} className="text-xs">{test.is_published ? "Published" : "Draft"}</Badge>
                          <Badge variant="outline" className="text-xs">{test.test_type}</Badge>
                          <span className="text-xs text-muted-foreground">{test.duration_minutes} min</span>
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
                  <Search className="w-10 h-10 mb-3 opacity-30" />
                  <p className="text-sm">No tests available</p>
                </div>
              )}
            </ScrollArea>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
