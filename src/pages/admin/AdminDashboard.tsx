import { useCallback,useEffect,useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen,ClipboardList,FileQuestion,RefreshCw,ArrowUpRight,Clock3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type RecentAttempt={id:string;started_at:string|null;completed_at:string|null;score:number|null;test:{name:string}|null};
type Counts={courses:number;questions:number;tests:number};
export default function AdminDashboard(){
 const {toast}=useToast();const [counts,setCounts]=useState<Counts|null>(null);const [attempts,setAttempts]=useState<RecentAttempt[]>([]);const [loading,setLoading]=useState(true);const [refreshing,setRefreshing]=useState(false);const [error,setError]=useState<string|null>(null);
 const load=useCallback(async(refresh=false)=>{
  if(refresh)setRefreshing(true);setError(null);
  try{
   const [courses,questions,tests,recent]=await Promise.all([
    supabase.from("courses").select("id",{count:"exact",head:true}),
    supabase.from("questions").select("id",{count:"exact",head:true}),
    supabase.from("tests").select("id",{count:"exact",head:true}),
    supabase.from("test_attempts").select("id,started_at,completed_at,score,test:tests(name)").order("started_at",{ascending:false}).limit(8),
   ]);
   const failure=[courses.error,questions.error,tests.error,recent.error].find(Boolean);if(failure)throw failure;
   setCounts({courses:courses.count||0,questions:questions.count||0,tests:tests.count||0});setAttempts((recent.data||[]) as unknown as RecentAttempt[]);
   if(refresh)toast({title:"Workspace refreshed"});
  }catch(e:any){setError(e?.message||"Could not load the admin overview");if(refresh)toast({title:"Refresh failed",description:e?.message,variant:"destructive"});}
  finally{setLoading(false);setRefreshing(false);}
 },[toast]);
 useEffect(()=>{void load();},[load]);
 const items=[{label:"Courses",value:counts?.courses??"—",icon:BookOpen,href:"/admin/academic"},{label:"Questions",value:counts?.questions??"—",icon:FileQuestion,href:"/admin/question-bank"},{label:"Tests",value:counts?.tests??"—",icon:ClipboardList,href:"/admin/tests"}];
 return <AdminLayout><div className="mx-auto max-w-7xl space-y-8 px-5 py-7 sm:px-7 lg:px-9">
  <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-[11px] font-medium uppercase tracking-[.16em] text-muted-foreground">Workspace</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">Overview</h1><p className="mt-1 text-sm text-muted-foreground">A current view of your academic content and test activity.</p></div><div className="flex gap-2"><Button variant="outline" size="sm" onClick={()=>void load(true)} disabled={refreshing}><RefreshCw className={"mr-2 h-3.5 w-3.5 "+(refreshing?"animate-spin":"")}/>Refresh</Button><Button size="sm" asChild><Link to="/admin/test-creator">Create test</Link></Button></div></header>
  {error&&!counts?<div className="rounded-lg border border-border bg-card p-5 text-sm text-muted-foreground">{error}<Button variant="outline" size="sm" className="ml-3" onClick={()=>void load(true)}>Try again</Button></div>:<div className="grid gap-3 sm:grid-cols-3">{items.map(({label,value,icon:Icon,href})=><Link key={label} to={href} className="group rounded-lg border border-border bg-card p-5 transition-colors hover:border-foreground/25"><div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">{label}</span><Icon size={17} className="text-muted-foreground"/></div><div className="mt-4 flex items-end justify-between"><span className="text-3xl font-semibold tracking-tight tabular-nums text-foreground">{loading?"—":value}</span><ArrowUpRight size={16} className="mb-1 text-muted-foreground transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5"/></div></Link>)}</div>}
  <section className="overflow-hidden rounded-lg border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-5 py-4"><div><h2 className="text-sm font-semibold text-foreground">Recent test activity</h2><p className="mt-1 text-xs text-muted-foreground">Latest attempts recorded on the platform.</p></div><Link to="/admin/tests" className="text-xs font-medium text-foreground hover:underline">Manage tests</Link></div>
   {loading?<div className="space-y-3 p-5">{[1,2,3].map(n=><div key={n} className="h-10 animate-pulse rounded bg-muted"/>)}</div>:attempts.length===0?<div className="px-5 py-12 text-center"><Clock3 className="mx-auto h-5 w-5 text-muted-foreground"/><p className="mt-3 text-sm font-medium text-foreground">No test attempts yet</p><p className="mt-1 text-xs text-muted-foreground">New attempts will appear here.</p></div>:<div className="divide-y divide-border">{attempts.map(a=><div key={a.id} className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5"><div className="min-w-0"><p className="truncate text-sm font-medium text-foreground">{a.test?.name||"Untitled test"}</p><p className="mt-1 text-xs text-muted-foreground">{a.started_at?new Date(a.started_at).toLocaleString("en-IN",{dateStyle:"medium",timeStyle:"short"}):"Date unavailable"}</p></div><div className="text-right"><p className="text-sm font-medium tabular-nums text-foreground">{a.score===null?"In progress":a.score}</p><p className="text-[10px] text-muted-foreground">{a.completed_at?"Score":"Status"}</p></div></div>)}</div>}
  </section>
 </div></AdminLayout>;
}
