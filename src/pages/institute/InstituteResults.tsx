import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstitute } from "@/hooks/useInstitute";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { BarChart3, Loader2 } from "lucide-react";

export default function InstituteResults() {
  const { institutionId } = useInstitute();
  const [testId, setTestId] = useState("all");
  const [search, setSearch] = useState("");

  const { data: tests } = useQuery({
    queryKey: ["inst-tests-min", institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tests").select("id, name").eq("institution_id", institutionId!).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data: attempts, isLoading } = useQuery({
    queryKey: ["inst-results", institutionId, testId],
    enabled: !!institutionId,
    queryFn: async () => {
      const testIds = testId === "all" ? (tests ?? []).map((t: any) => t.id) : [testId];
      if (testIds.length === 0) return [];
      const { data, error } = await supabase
        .from("test_attempts")
        .select("id, user_id, test_id, score, total_marks, completed_at, started_at, roll_number, tests:test_id(name)")
        .in("test_id", testIds)
        .order("started_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      const userIds = [...new Set((data ?? []).map((a: any) => a.user_id))];
      const { data: profiles } = await supabase.from("profiles").select("id, full_name").in("id", userIds);
      const byId = new Map((profiles ?? []).map((p: any) => [p.id, p.full_name]));
      return (data ?? []).map((a: any) => ({ ...a, full_name: byId.get(a.user_id) ?? "Student" }));
    },
  });

  const rows = (attempts ?? []).filter((a: any) =>
    !search || a.full_name?.toLowerCase().includes(search.toLowerCase()) || a.roll_number?.includes(search)
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><BarChart3 className="w-6 h-6" /> Results</h1>
        <p className="text-sm text-muted-foreground">Attempts and scores across your institute's tests.</p>
      </div>

      <div className="flex gap-2 flex-wrap">
        <Input className="flex-1 min-w-[220px]" placeholder="Search student" value={search} onChange={(e) => setSearch(e.target.value)} />
        <Select value={testId} onValueChange={setTestId}>
          <SelectTrigger className="w-[240px]"><SelectValue placeholder="All tests" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All tests</SelectItem>
            {tests?.map((t: any) => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : rows.length === 0 ? (
            <div className="py-16 text-center text-sm text-muted-foreground">No attempts yet.</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Test</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Score</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((a: any) => (
                  <TableRow key={a.id}>
                    <TableCell>
                      <div className="font-medium">{a.full_name}</div>
                      <div className="text-xs text-muted-foreground font-mono">{a.roll_number || "—"}</div>
                    </TableCell>
                    <TableCell className="text-sm">{a.tests?.name ?? "—"}</TableCell>
                    <TableCell>
                      <Badge variant={a.completed_at ? "default" : "secondary"}>
                        {a.completed_at ? "Completed" : "In progress"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      {a.completed_at ? `${a.score ?? 0} / ${a.total_marks ?? 0}` : "—"}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {new Date(a.completed_at ?? a.started_at).toLocaleString()}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
