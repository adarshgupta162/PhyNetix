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
import { ClipboardList, Loader2, Plus, Layers, Trash2, ListPlus } from "lucide-react";

export default function InstituteTests() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { institutionId, isActive, can } = useInstitute();
  const [open, setOpen] = useState(false);
  const [assignFor, setAssignFor] = useState<string | null>(null);
  const [questionsFor, setQuestionsFor] = useState<any>(null);
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
        <Button onClick={() => setOpen(true)} disabled={!isActive || !can("tests.create")}><Plus className="w-4 h-4 mr-2" />New test</Button>
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
                <Button variant="outline" size="sm" onClick={() => setQuestionsFor(t)} disabled={!isActive || !(can("questions.manage") || can("tests.edit"))}><ListPlus className="w-4 h-4 mr-2" />Manage questions</Button>
                <Button variant="outline" size="sm" onClick={() => setAssignFor(t.id)} disabled={!isActive || !can("tests.edit")}>
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
            <Button onClick={() => createTest.mutate()} disabled={createTest.isPending || !isActive || !can("tests.create")}>
              {createTest.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {assignFor && <AssignDialog testId={assignFor} institutionId={institutionId!} onClose={() => setAssignFor(null)} />}
      {questionsFor && <TestQuestionDialog test={questionsFor} institutionId={institutionId!} onClose={() => setQuestionsFor(null)} />}
    </div>
  );
}


function TestQuestionDialog({ test, institutionId, onClose }: { test:any; institutionId:string; onClose:()=>void }) {
  const qc=useQueryClient();
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState<string[]>([]);
  const {data:library,isLoading}=useQuery({
    queryKey:["institute-test-question-library",institutionId,search],
    queryFn:async()=>{
      const {data,error}=await supabase.from("phynetix_library")
        .select("id,question_text,question_image_url,question_type,options,correct_answer,marks,negative_marks,solution_text,solution_image_url,difficulty,time_seconds,subject,chapter,topic")
        .not("question_text","is",null).not("correct_answer","is",null)
        .or(`institution_id.eq.${institutionId},and(institution_id.is.null,is_published.eq.true)`)
        .ilike("question_text",`%${search}%`).order("created_at",{ascending:false}).limit(100);
      if(error)throw error; return data??[];
    }
  });
  const {data:count}=useQuery({
    queryKey:["institute-test-question-count",test.id],
    queryFn:async()=>{const {count,error}=await supabase.from("test_section_questions").select("id",{count:"exact",head:true}).eq("test_id",test.id);if(error)throw error;return count??0;}
  });
  const add=useMutation({
    mutationFn:async()=>{
      if(!selected.length)throw new Error("Select at least one question");
      const chosen=(library??[]).filter((q:any)=>selected.includes(q.id));
      let {data:subject,error:subjectError}=await supabase.from("test_subjects").select("id").eq("test_id",test.id).order("order_index").limit(1).maybeSingle();
      if(subjectError)throw subjectError;
      if(!subject){const created=await supabase.from("test_subjects").insert({test_id:test.id,name:"Questions",order_index:0}).select("id").single();if(created.error)throw created.error;subject=created.data;}
      let {data:section,error:sectionError}=await supabase.from("test_sections").select("id").eq("subject_id",subject.id).order("order_index").limit(1).maybeSingle();
      if(sectionError)throw sectionError;
      if(!section){const created=await supabase.from("test_sections").insert({subject_id:subject.id,name:"Section A",section_type:"single_choice",order_index:0}).select("id").single();if(created.error)throw created.error;section=created.data;}
      const start=count??0;
      const rows=chosen.map((q:any,i:number)=>({
        test_id:test.id,section_id:section!.id,question_number:start+i+1,order_index:start+i,
        question_text:q.question_text,options:q.options,correct_answer:q.correct_answer,
        marks:q.marks??4,negative_marks:q.negative_marks??1,difficulty:q.difficulty??"medium",
        chapter:q.chapter??null,topic:q.topic??null,question_type:q.question_type??"mcq",
        image_urls:q.question_image_url?[q.question_image_url]:[],solution_text:q.solution_text??null,
        solution_image_urls:q.solution_image_url?[q.solution_image_url]:[],time_seconds:q.time_seconds??null,library_question_id:q.id,
      }));
      const {error}=await supabase.from("test_section_questions").insert(rows as any);if(error)throw error;
    },
    onSuccess:()=>{toast.success("Questions added to test");qc.invalidateQueries({queryKey:["institute-test-question-count",test.id]});setSelected([]);},
    onError:(e:any)=>toast.error(e.message),
  });
  return <Dialog open onOpenChange={onClose}><DialogContent className="max-w-3xl max-h-[85vh]">
    <DialogHeader><DialogTitle>Manage questions — {test.name}</DialogTitle><DialogDescription>Add questions from your institute library or the published PhyNetix library.</DialogDescription></DialogHeader>
    <Input placeholder="Search question text" value={search} onChange={e=>setSearch(e.target.value)} />
    <div className="text-xs text-muted-foreground">{count??0} questions in this test · {selected.length} selected</div>
    <div className="max-h-[48vh] overflow-y-auto space-y-2">{isLoading?<Loader2 className="mx-auto my-8 animate-spin"/>:library?.map((q:any)=><label key={q.id} className="flex gap-3 border rounded-md p-3 cursor-pointer">
      <input type="checkbox" checked={selected.includes(q.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,q.id]:old.filter(id=>id!==q.id))}/>
      <span className="min-w-0 text-sm line-clamp-3">{q.question_text}<span className="block text-xs text-muted-foreground mt-1">{[q.subject,q.chapter,q.topic,q.difficulty].filter(Boolean).join(" · ")}</span></span>
    </label>)}</div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={()=>add.mutate()} disabled={add.isPending||!selected.length}>{add.isPending&&<Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Add selected</Button></DialogFooter>
  </DialogContent></Dialog>;
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
