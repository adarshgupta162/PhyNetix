import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstitute } from "@/hooks/useInstitute";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loader2, Search, Users, Download } from "lucide-react";

const PAGE = 25;

export default function InstituteStudents() {
  const { institutionId } = useInstitute();
  const [search, setSearch] = useState("");
  const [batchId, setBatchId] = useState<string>("all");
  const [page, setPage] = useState(0);

  const { data: batches } = useQuery({
    queryKey: ["inst-batch-options", institutionId],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batches")
        .select("id, name")
        .eq("institution_id", institutionId!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const { data, isFetching } = useQuery({
    queryKey: ["inst-students", institutionId, search, batchId, page],
    enabled: !!institutionId,
    queryFn: async () => {
      const { data, error } = await supabase.rpc("institution_students" as any, {
        _search: search || null,
        _batch_id: batchId === "all" ? null : batchId,
        _limit: PAGE,
        _offset: page * PAGE,
      });
      if (error) throw error;
      return (data as any[]) ?? [];
    },
  });

  const total = data?.[0]?.total_count ? Number(data[0].total_count) : 0;

  const exportCsv = () => {
    const rows = [
      ["Name", "Roll number", "Phone", "Batches", "Joined", "Attempts"],
      ...(data ?? []).map((s: any) => [
        s.full_name ?? "",
        s.roll_number ?? "",
        s.phone ?? "",
        (s.batches ?? []).join(" | "),
        s.joined_at ? new Date(s.joined_at).toLocaleDateString() : "",
        s.attempts ?? 0,
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "students.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Users className="w-6 h-6" /> Students</h1>
          <p className="text-sm text-muted-foreground">Everyone enrolled in your institute's batches.</p>
        </div>
        <Button variant="outline" size="sm" onClick={exportCsv}><Download className="w-4 h-4 mr-2" />Export CSV</Button>
      </div>

      <div className="flex gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by name or roll number"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
          />
        </div>
        <Select value={batchId} onValueChange={(v) => { setBatchId(v); setPage(0); }}>
          <SelectTrigger className="w-[220px]"><SelectValue placeholder="All batches" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All batches</SelectItem>
            {batches?.map((b: any) => <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          {isFetching ? (
            <div className="py-16 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
          ) : (data?.length ?? 0) === 0 ? (
            <div className="py-16 text-center text-muted-foreground text-sm">
              No students yet. Share a batch join code to get them onboard.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll no.</TableHead>
                  <TableHead>Batches</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Attempts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data!.map((s: any) => (
                  <TableRow key={s.user_id}>
                    <TableCell>
                      <div className="font-medium">{s.full_name || "Unnamed student"}</div>
                      <div className="text-xs text-muted-foreground">{s.phone || "—"}</div>
                    </TableCell>
                    <TableCell className="font-mono text-xs">{s.roll_number || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1 flex-wrap">
                        {(s.batches ?? []).map((b: string) => <Badge key={b} variant="secondary">{b}</Badge>)}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {s.joined_at ? new Date(s.joined_at).toLocaleDateString() : "—"}
                    </TableCell>
                    <TableCell className="text-right">{Number(s.attempts ?? 0)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {total > PAGE && (
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">
            {page * PAGE + 1}–{Math.min((page + 1) * PAGE, total)} of {total}
          </span>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <Button variant="outline" size="sm" disabled={(page + 1) * PAGE >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        </div>
      )}
    </div>
  );
}
