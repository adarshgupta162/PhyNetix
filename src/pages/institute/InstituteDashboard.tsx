import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstitute } from "@/hooks/useInstitute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, Layers, ClipboardList, Activity, Target, History } from "lucide-react";
import { format } from "date-fns";

export default function InstituteDashboard() {
  const { institution, institutionId } = useInstitute();

  const { data: stats, isLoading } = useQuery({
    queryKey: ["institute-stats", institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("institution_dashboard_stats");
      if (error) throw error;
      return data as any;
    },
  });

  const { data: activity } = useQuery({
    queryKey: ["institute-activity", institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("audit_logs")
        .select("id, action, entity_type, created_at")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data;
    },
  });

  const cards = [
    { label: "Total Students", value: stats?.students, icon: Users },
    { label: "Active Batches", value: stats?.batches, icon: Layers },
    { label: "Total Tests", value: stats?.tests, icon: ClipboardList },
    { label: "Test Attempts", value: stats?.attempts, icon: Activity },
    { label: "Average Score", value: stats?.avg_score, icon: Target },
  ];

  return (
    <div className="p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">{institution?.name}</h1>
        <p className="text-sm text-muted-foreground">
          {institution?.welcome_message || "Your institute workspace overview."}
        </p>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{c.label}</span>
                <c.icon className="w-4 h-4 text-muted-foreground" />
              </div>
              {isLoading ? (
                <Skeleton className="h-8 w-16 mt-2" />
              ) : (
                <div className="text-2xl font-bold mt-1">{c.value ?? 0}</div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" /> Recent activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!activity ? (
            <Skeleton className="h-24 w-full" />
          ) : activity.length === 0 ? (
            <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
          ) : (
            <ul className="space-y-2">
              {activity.map((a: any) => (
                <li key={a.id} className="flex items-center justify-between text-sm border-b last:border-0 pb-2">
                  <span className="capitalize">{String(a.action).replace(/_/g, " ")}</span>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(a.created_at), "dd MMM yyyy, HH:mm")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
