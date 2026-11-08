import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useInstitute } from "@/hooks/useInstitute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Video, AlertTriangle, Activity, Clock } from "lucide-react";

export default function InstituteProctoring() {
  const { institutionId } = useInstitute();
  const { data, isLoading, error } = useQuery({
    queryKey: ["institute-proctoring", institutionId],
    enabled: !!institutionId,
    refetchInterval: 15000,
    queryFn: async () => {
      const { data: tests, error: testError } = await supabase.from("tests").select("id,name").eq("institution_id", institutionId!);
      if (testError) throw testError;
      const ids = (tests ?? []).map((t:any) => t.id);
      if (!ids.length) return { sessions: [], alerts: [], profiles: new Map(), testNames: new Map() };
      const { data: sessions, error: sessionError } = await supabase.from("proctoring_sessions")
        .select("id,user_id,test_id,status,started_at,ended_at,last_heartbeat_at,provider_room_name")
        .in("test_id", ids).order("started_at", { ascending: false }).limit(100);
      if (sessionError) throw sessionError;
      const sessionIds = (sessions ?? []).map((s:any) => s.id);
      const userIds = [...new Set((sessions ?? []).map((s:any) => s.user_id))];
      const [alertResult, profileResult] = await Promise.all([
        sessionIds.length ? supabase.from("proctoring_alerts").select("id,session_id,alert_type,severity,status,created_at").in("session_id", sessionIds).order("created_at",{ascending:false}) : Promise.resolve({data:[],error:null}),
        userIds.length ? supabase.from("profiles").select("id,full_name,roll_number").in("id",userIds) : Promise.resolve({data:[],error:null}),
      ]);
      if (alertResult.error) throw alertResult.error;
      if (profileResult.error) throw profileResult.error;
      return {
        sessions: sessions ?? [], alerts: alertResult.data ?? [],
        profiles: new Map((profileResult.data ?? []).map((p:any)=>[p.id,p])),
        testNames: new Map((tests ?? []).map((t:any)=>[t.id,t.name])),
      };
    },
  });
  const active = (data?.sessions ?? []).filter((s:any)=>s.status==="active");
  return <div className="p-6 space-y-6">
    <div><h1 className="text-2xl font-bold flex items-center gap-2"><Video className="w-6 h-6" /> Proctoring</h1><p className="text-sm text-muted-foreground">Monitor live test sessions, recent alerts and connection heartbeats for your institute.</p></div>
    <div className="grid gap-3 sm:grid-cols-3">
      {[{label:"Active sessions",value:active.length,icon:Activity},{label:"Recorded sessions",value:data?.sessions.length??0,icon:Video},{label:"Open alerts",value:(data?.alerts??[]).filter((a:any)=>a.status==="open").length,icon:AlertTriangle}].map((s)=><Card key={s.label}><CardContent className="p-4 flex items-center justify-between"><div><div className="text-2xl font-bold">{s.value}</div><div className="text-xs text-muted-foreground">{s.label}</div></div><s.icon className="w-5 h-5 text-muted-foreground"/></CardContent></Card>)}
    </div>
    {isLoading?<div className="py-16 flex justify-center"><Loader2 className="animate-spin"/></div>:error?<Card><CardContent className="py-10 text-sm text-destructive">Could not load proctoring sessions: {(error as Error).message}</CardContent></Card>:
      <Card><CardHeader><CardTitle className="text-base">Recent sessions <span className="text-xs font-normal text-muted-foreground">· refreshes every 15 seconds</span></CardTitle></CardHeader><CardContent className="space-y-0">
        {!data?.sessions.length?<p className="text-sm text-muted-foreground py-8 text-center">No proctoring sessions recorded for this institute yet.</p>:data.sessions.map((s:any)=>{
          const p=data.profiles.get(s.user_id); const alerts=data.alerts.filter((a:any)=>a.session_id===s.id);
          return <div key={s.id} className="py-3 border-b last:border-0 flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-2"><div><div className="font-medium text-sm">{p?.full_name||"Student"} {p?.roll_number? <span className="text-muted-foreground font-normal">· {p.roll_number}</span>:null}</div><div className="text-xs text-muted-foreground">{data.testNames.get(s.test_id)||"Test"} · started {formatDistanceToNow(new Date(s.started_at),{addSuffix:true})}</div></div>
              <Badge variant={s.status==="active"?"default":"secondary"} className="capitalize">{s.status}</Badge></div>
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span className="flex items-center gap-1"><Clock className="w-3 h-3"/>Heartbeat {s.last_heartbeat_at?formatDistanceToNow(new Date(s.last_heartbeat_at),{addSuffix:true}):"not received"}</span><span className="flex items-center gap-1"><AlertTriangle className="w-3 h-3"/> {alerts.length} alerts</span></div>
            {alerts.length>0&&<div className="flex flex-wrap gap-1">{alerts.slice(0,4).map((a:any)=><Badge key={a.id} variant={a.severity==="high"||a.severity==="critical"?"destructive":"outline"}>{a.alert_type.replace(/_/g," ")} · {a.severity}</Badge>)}</div>}
          </div>;
        })}
      </CardContent></Card>}
  </div>;
}
