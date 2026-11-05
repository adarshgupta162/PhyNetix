import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useInstitute } from "@/hooks/useInstitute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { FileText, Plus, Loader2, Search, ListPlus } from "lucide-react";

const blank = { title: "", description: "", subject: "Physics", chapter: "", topic: "", difficulty: "medium", duration_minutes: 30, is_timed: true, batch_id: "none" };

export default function InstituteDPPs() {
  const qc = useQueryClient();
  const { user } = useAuth();
  const { institutionId, isActive, can } = useInstitute();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ ...blank });
  const [questionsFor, setQuestionsFor] = useState<any>(null);
  const [search, setSearch] = useState("");

  const { data: dpps, isLoading } = useQuery({
    queryKey: ["institute-dpps", institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase.from("dpps").select("id,title,description,subject,chapter,topic,difficulty,duration_minutes,is_timed,is_published,scheduled_for,created_at,batch_id,batches:batch_id(name)")
        .eq("institution_id", institutionId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: batches } = useQuery({
    queryKey: ["institute-dpp-batches", institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase.from("batches").select("id,name").eq("institution_id", institutionId!).eq("is_active", true);
      if (error) throw error;
      return data ?? [];
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      if (!form.title.trim()) throw new Error("DPP title is required");
      const { error } = await supabase.from("dpps").insert({
        title: form.title.trim(), description: form.description.trim() || null,
        subject: form.subject, chapter: form.chapter.trim() || null, topic: form.topic.trim() || null,
        difficulty: form.difficulty, duration_minutes: Math.max(1, Number(form.duration_minutes) || 30),
        is_timed: form.is_timed, batch_id: form.batch_id === "none" ? null : form.batch_id,
        access_type: form.batch_id === "none" ? "institute" : "batch",
        is_published: false, institution_id: institutionId, created_by: user?.id,
      } as any);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("DPP created"); setCreateOpen(false); setForm({ ...blank }); qc.invalidateQueries({ queryKey: ["institute-dpps", institutionId] }); },
    onError: (e: any) => toast.error(e.message),
  });

  const publish = useMutation({
    mutationFn: async ({ id, value }: { id: string; value: boolean }) => {
      const { error } = await supabase.from("dpps").update({ is_published: value, publish_date: value ? new Date().toISOString().slice(0, 10) : null }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["institute-dpps", institutionId] }),
    onError: (e: any) => toast.error(e.message),
  });

  const visible = (dpps ?? []).filter((d: any) => !search || [d.title,d.subject,d.chapter,d.topic].some((v: string) => v?.toLowerCase().includes(search.toLowerCase())));

  return <div className="p-6 space-y-6">
    <div className="flex items-start justify-between gap-4 flex-wrap">
      <div><h1 className="text-2xl font-bold flex items-center gap-2"><FileText className="w-6 h-6" /> Daily Practice Problems</h1><p className="text-sm text-muted-foreground">Create practice sets, add questions from your institute library, and publish them to students or batches.</p></div>
      <Button onClick={() => setCreateOpen(true)} disabled={!isActive || !can("dpps.manage")}><Plus className="w-4 h-4 mr-2" />Create DPP</Button>
    </div>
    <div className="relative max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search DPPs" value={search} onChange={e => setSearch(e.target.value)} /></div>
    {isLoading ? <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin" /></div> : !visible.length ? <Card><CardContent className="py-16 text-center text-sm text-muted-foreground">No DPPs yet. Create your first practice set.</CardContent></Card> :
      <div className="grid gap-3 md:grid-cols-2">{visible.map((d: any) => <Card key={d.id}>
        <CardHeader className="pb-3"><div className="flex justify-between gap-3"><div className="min-w-0"><CardTitle className="text-base">{d.title}</CardTitle><p className="text-xs text-muted-foreground mt-1">{[d.subject,d.chapter,d.topic].filter(Boolean).join(" · ") || "No topic selected"}</p></div><Badge variant={d.is_published ? "default" : "secondary"}>{d.is_published ? "Published" : "Draft"}</Badge></div></CardHeader>
        <CardContent className="space-y-3"><p className="text-sm text-muted-foreground line-clamp-2">{d.description || "No description"}</p>
          <div className="flex gap-2 flex-wrap text-xs text-muted-foreground"><span>{d.difficulty || "medium"}</span><span>· {d.duration_minutes || 30} min</span><span>· {d.batches?.name || "Institute-wide"}</span></div>
          <div className="flex items-center justify-between border-t pt-3"><Button size="sm" variant="outline" onClick={() => setQuestionsFor(d)} disabled={!isActive || !can("dpps.manage")}><ListPlus className="w-4 h-4 mr-2" />Manage questions</Button><div className="flex items-center gap-2 text-xs"><span>Publish</span><Switch checked={!!d.is_published} disabled={!isActive || !can("dpps.manage")} onCheckedChange={value => publish.mutate({id:d.id,value})} /></div></div>
        </CardContent></Card>)}</div>}

    <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogContent className="max-w-lg"><DialogHeader><DialogTitle>Create DPP</DialogTitle><DialogDescription>New DPPs start as drafts. Add questions before publishing.</DialogDescription></DialogHeader>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="sm:col-span-2"><Label>Title</Label><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} placeholder="Kinematics — Practice 01" /></div>
        <div><Label>Subject</Label><Select value={form.subject} onValueChange={v=>setForm({...form,subject:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["Physics","Chemistry","Mathematics","Biology"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Difficulty</Label><Select value={form.difficulty} onValueChange={v=>setForm({...form,difficulty:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{["easy","medium","hard"].map(v=><SelectItem key={v} value={v}>{v}</SelectItem>)}</SelectContent></Select></div>
        <div><Label>Chapter</Label><Input value={form.chapter} onChange={e=>setForm({...form,chapter:e.target.value})} /></div>
        <div><Label>Topic</Label><Input value={form.topic} onChange={e=>setForm({...form,topic:e.target.value})} /></div>
        <div><Label>Duration (minutes)</Label><Input type="number" min="1" value={form.duration_minutes} onChange={e=>setForm({...form,duration_minutes:Number(e.target.value)})} /></div>
        <div><Label>Assign to batch</Label><Select value={form.batch_id} onValueChange={v=>setForm({...form,batch_id:v})}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Institute-wide</SelectItem>{batches?.map((b:any)=><SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}</SelectContent></Select></div>
        <div className="sm:col-span-2"><Label>Description</Label><Textarea rows={3} value={form.description} onChange={e=>setForm({...form,description:e.target.value})} /></div>
        <label className="sm:col-span-2 flex items-center justify-between rounded-md border p-3 text-sm">Timed practice<Switch checked={form.is_timed} onCheckedChange={v=>setForm({...form,is_timed:v})} /></label>
      </div>
      <DialogFooter><Button variant="outline" onClick={()=>setCreateOpen(false)}>Cancel</Button><Button onClick={()=>create.mutate()} disabled={create.isPending || !isActive || !can("dpps.manage")}>{create.isPending&&<Loader2 className="w-4 h-4 mr-2 animate-spin" />}Create DPP</Button></DialogFooter>
    </DialogContent></Dialog>
    {questionsFor && <QuestionDialog dpp={questionsFor} institutionId={institutionId!} onClose={()=>setQuestionsFor(null)} />}
  </div>;
}

function QuestionDialog({ dpp, institutionId, onClose }: { dpp:any; institutionId:string; onClose:()=>void }) {
  const qc=useQueryClient();
  const [search,setSearch]=useState("");
  const [selected,setSelected]=useState<string[]>([]);
  const {data:questions,isLoading}=useQuery({
    queryKey:["institute-question-library",institutionId,search],
    queryFn:async()=>{
      const {data,error}=await supabase.from("phynetix_library")
        .select("id,question_text,question_image_url,question_type,options,correct_answer,marks,negative_marks,solution_text,solution_image_url,difficulty,time_seconds,subject,chapter")
        .not("question_text","is",null).not("correct_answer","is",null).or(`institution_id.eq.${institutionId},and(institution_id.is.null,is_published.eq.true)`)
        .ilike("question_text",`%${search}%`).order("created_at",{ascending:false}).limit(100);
      if(error) throw error;
      return data??[];
    }
  });
  const {data:added}=useQuery({
    queryKey:["dpp-question-count",dpp.id],
    queryFn:async()=>{const {data,error}=await supabase.from("dpp_questions").select("id").eq("dpp_id",dpp.id);if(error)throw error;return data??[];}
  });
  const add=useMutation({
    mutationFn:async()=>{
      if(!selected.length) throw new Error("Select at least one question");
      const picked=(questions??[]).filter((q:any)=>selected.includes(q.id));
      const start=added?.length??0;
      const rows=picked.map((q:any,i:number)=>({
        dpp_id:dpp.id, question_number:start+i+1, order_index:start+i,
        question_text:q.question_text, question_image_url:q.question_image_url,
        question_type:q.question_type||"mcq", options:q.options,
        correct_answer:q.correct_answer, marks:q.marks??4, negative_marks:q.negative_marks??1,
        solution_text:q.solution_text, solution_image_url:q.solution_image_url,
        difficulty:q.difficulty||"medium",
      }));
      const {error}=await supabase.from("dpp_questions").insert(rows as any);
      if(error)throw error;
    },
    onSuccess:()=>{toast.success("Questions added to DPP");qc.invalidateQueries({queryKey:["dpp-question-count",dpp.id]});qc.invalidateQueries({queryKey:["institute-dpps",institutionId]});setSelected([]);},
    onError:(e:any)=>toast.error(e.message),
  });
  return <Dialog open onOpenChange={onClose}><DialogContent className="max-w-3xl max-h-[85vh]"><DialogHeader><DialogTitle>Add questions — {dpp.title}</DialogTitle><DialogDescription>Select questions from the institute or published PhyNetix library.</DialogDescription></DialogHeader>
    <Input placeholder="Search question text" value={search} onChange={e=>setSearch(e.target.value)} />
    <div className="text-xs text-muted-foreground">{added?.length??0} questions already added · {selected.length} selected</div>
    <div className="max-h-[48vh] overflow-y-auto space-y-2">{isLoading?<Loader2 className="mx-auto my-8 animate-spin"/>:questions?.map((q:any)=><label key={q.id} className="flex gap-3 border rounded-md p-3 cursor-pointer"><input type="checkbox" checked={selected.includes(q.id)} onChange={e=>setSelected(old=>e.target.checked?[...old,q.id]:old.filter(id=>id!==q.id))}/><span className="min-w-0 text-sm line-clamp-3">{q.question_text}<span className="block text-xs text-muted-foreground mt-1">{[q.subject,q.chapter,q.difficulty].filter(Boolean).join(" · ")}</span></span></label>)}</div>
    <DialogFooter><Button variant="outline" onClick={onClose}>Close</Button><Button onClick={()=>add.mutate()} disabled={add.isPending||!selected.length}>{add.isPending&&<Loader2 className="w-4 h-4 mr-2 animate-spin"/>}Add selected</Button></DialogFooter>
  </DialogContent></Dialog>;
}
