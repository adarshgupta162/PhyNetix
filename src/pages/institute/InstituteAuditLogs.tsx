import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useInstitute } from "@/hooks/useInstitute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, History, ShieldCheck } from "lucide-react";

export default function InstituteAuditLogs() {
  const { institutionId } = useInstitute();
  const { data, isLoading, error } = useQuery({
    queryKey: ["institute-audit-log", institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase.from("audit_logs")
        .select("id,action,entity_type,entity_id,user_id,old_value,new_value,created_at")
        .eq("institution_id", institutionId!).order("created_at", { ascending: false }).limit(250);
      if (error) throw error;
      const ids = [...new Set((data ?? []).map((row:any) => row.user_id).filter(Boolean))];
      const { data: profiles, error: profileError } = ids.length
        ? await supabase.from("profiles").select("id,full_name").in("id", ids)
        : { data: [], error: null };
      if (profileError) throw profileError;
      const names = new Map((profiles ?? []).map((p:any) => [p.id,p.full_name]));
      return (data ?? []).map((row:any) => ({...row, actor: names.get(row.user_id) || "System"}));
    },
  });
  return <div className="p-6 space-y-6">
    <div><h1 className="text-2xl font-bold flex items-center gap-2"><History className="w-6 h-6" /> Audit log</h1><p className="text-sm text-muted-foreground">A record of administrative changes made inside this institute.</p></div>
    {isLoading ? <div className="py-16 flex justify-center"><Loader2 className="animate-spin" /></div> : error ? <Card><CardContent className="py-10 text-sm text-destructive">Could not load audit history: {(error as Error).message}</CardContent></Card> : !data?.length ? <Card><CardContent className="py-14 text-center text-sm text-muted-foreground">No institute activity recorded yet.</CardContent></Card> :
      <Card><CardHeader><CardTitle className="text-base flex items-center gap-2"><ShieldCheck className="w-4 h-4" /> Recent actions <Badge variant="secondary">{data.length}</Badge></CardTitle></CardHeader><CardContent className="space-y-0">
        {data.map((row:any)=><div key={row.id} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b last:border-0 py-3">
          <div className="min-w-0"><div className="font-medium text-sm capitalize">{String(row.action).replace(/_/g," ")}</div><div className="text-xs text-muted-foreground">{row.actor} · {row.entity_type || "record"}{row.entity_id ? ` · ${String(row.entity_id).slice(0,8)}` : ""}</div></div>
          <time className="text-xs text-muted-foreground shrink-0">{format(new Date(row.created_at),"dd MMM yyyy, HH:mm")}</time>
        </div>)}
      </CardContent></Card>}
  </div>;
}
