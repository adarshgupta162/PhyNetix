import { useEffect, useMemo, useState } from "react";
import { BookOpen, CalendarDays, CheckCircle2, ChevronRight, Clock3, Filter, Search, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentWorkspaceLayout from "@/components/layout/StudentWorkspaceLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface DPP {
  id: string; title: string; description: string | null; subject: string; chapter: string | null;
  topic: string | null; difficulty: string | null; duration_minutes: number | null; is_timed: boolean | null;
  access_type: string | null; batch_id: string | null; publish_date: string | null;
  question_count: number; attempted: boolean; score?: number; total?: number;
}

const subjectTone: Record<string, string> = {
  physics: "border-sky-400/20 bg-sky-400/[0.07] text-sky-200",
  chemistry: "border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-200",
  mathematics: "border-amber-400/20 bg-amber-400/[0.07] text-amber-200",
  maths: "border-amber-400/20 bg-amber-400/[0.07] text-amber-200",
};

export default function DPPPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [dpps, setDpps] = useState<DPP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");
  const [status, setStatus] = useState("all");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    const fetchDPPs = async () => {
      setLoading(true);
      try {
        const { data: rows, error } = await supabase.from("dpps").select("*")
          .eq("is_published", true).order("publish_date", { ascending: false });
        if (error) throw error;
        const published = rows || [];
        if (!published.length) { if (!cancelled) setDpps([]); return; }

        const ids = published.map((d) => d.id);
        const [questionResult, attemptResult] = await Promise.all([
          supabase.from("dpp_questions").select("dpp_id").in("dpp_id", ids),
          supabase.from("dpp_attempts").select("dpp_id, score, total_marks, completed_at")
            .eq("user_id", user.id).in("dpp_id", ids).order("completed_at", { ascending: false }),
        ]);
        if (questionResult.error) throw questionResult.error;
        if (attemptResult.error) throw attemptResult.error;

        const questionCounts: Record<string, number> = {};
        (questionResult.data || []).forEach((q) => { questionCounts[q.dpp_id] = (questionCounts[q.dpp_id] || 0) + 1; });
        const attemptByDpp: Record<string, { score?: number; total?: number }> = {};
        (attemptResult.data || []).forEach((attempt) => {
          if (attempt.completed_at && !(attempt.dpp_id in attemptByDpp)) {
            attemptByDpp[attempt.dpp_id] = { score: attempt.score ?? undefined, total: attempt.total_marks ?? undefined };
          }
        });

        const restricted = published.filter((d) => d.access_type === "batch_only" && d.batch_id);
        let enrolledIds = new Set<string>();
        if (restricted.length) {
          const { data: enrollments, error: enrollmentError } = await supabase.from("batch_enrollments")
            .select("batch_id").eq("user_id", user.id).eq("is_active", true);
          if (enrollmentError) throw enrollmentError;
          enrolledIds = new Set((enrollments || []).map((e) => e.batch_id));
        }

        const visible = published.filter((d) =>
          d.access_type === "public" || (d.access_type === "batch_only" && d.batch_id && enrolledIds.has(d.batch_id))
        ).map((d) => ({
          ...d, question_count: questionCounts[d.id] || 0,
          attempted: Boolean(attemptByDpp[d.id]),
          score: attemptByDpp[d.id]?.score, total: attemptByDpp[d.id]?.total,
        })) as DPP[];
        if (!cancelled) setDpps(visible);
      } catch (error) {
        console.error("Failed to load DPPs:", error);
        if (!cancelled) toast.error("Couldn't load practice sets. Please refresh and try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    void fetchDPPs();
    return () => { cancelled = true; };
  }, [user]);

  const subjects = useMemo(() => Array.from(new Set(dpps.map((d) => d.subject).filter(Boolean)).values()).sort(), [dpps]);
  const filtered = useMemo(() => dpps.filter((d) => {
    const query = search.trim().toLowerCase();
    const matchesQuery = !query || [d.title, d.subject, d.chapter, d.topic].some((value) => value?.toLowerCase().includes(query));
    const matchesSubject = subject === "all" || d.subject.toLowerCase() === subject;
    const matchesStatus = status === "all" || (status === "completed" ? d.attempted : !d.attempted);
    return matchesQuery && matchesSubject && matchesStatus;
  }), [dpps, search, subject, status]);

  const attemptedCount = dpps.filter((d) => d.attempted).length;
  const scored = dpps.filter((d) => d.score != null && d.total != null && d.total > 0);
  const average = scored.length ? Math.round(scored.reduce((sum, d) => sum + ((d.score! / d.total!) * 100), 0) / scored.length) : null;

  return (
    <StudentWorkspaceLayout>
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8BBAAF]">Daily practice</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Practice problems</h1><p className="mt-2 text-sm text-slate-400">Focused question sets to build consistency, one topic at a time.</p></div>
          <div className="rounded-xl border border-white/[0.08] bg-[#111819] px-4 py-3"><p className="text-[11px] text-slate-500">Your completion</p><p className="mt-1 text-lg font-semibold text-white">{attemptedCount}<span className="ml-1 text-sm font-normal text-slate-500">/ {dpps.length} completed</span></p></div>
        </header>

        <section className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-white/[0.08] bg-[#111819] p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><BookOpen size={15} />Available sets</div><p className="mt-3 text-2xl font-semibold text-white">{loading ? "—" : dpps.length}</p></div>
          <div className="rounded-xl border border-white/[0.08] bg-[#111819] p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><CheckCircle2 size={15} />Completed</div><p className="mt-3 text-2xl font-semibold text-white">{loading ? "—" : attemptedCount}</p></div>
          <div className="rounded-xl border border-white/[0.08] bg-[#111819] p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><Target size={15} />Average score</div><p className="mt-3 text-2xl font-semibold text-white">{loading ? "—" : average == null ? "—" : `${average}%`}</p></div>
        </section>

        <section className="flex flex-col gap-3 rounded-2xl border border-white/[0.08] bg-[#111819] p-3 sm:flex-row">
          <div className="relative flex-1"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" /><Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by title, chapter or topic" className="h-10 border-white/10 bg-[#0D1213] pl-9 text-sm text-slate-100 placeholder:text-slate-600" /></div>
          <Select value={subject} onValueChange={setSubject}><SelectTrigger className="h-10 w-full border-white/10 bg-[#0D1213] text-slate-200 sm:w-44"><Filter size={14} className="mr-2 text-slate-500" /><SelectValue placeholder="Subject" /></SelectTrigger><SelectContent><SelectItem value="all">All subjects</SelectItem>{subjects.map((s) => <SelectItem key={s} value={s.toLowerCase()}>{s}</SelectItem>)}</SelectContent></Select>
          <Select value={status} onValueChange={setStatus}><SelectTrigger className="h-10 w-full border-white/10 bg-[#0D1213] text-slate-200 sm:w-40"><SelectValue placeholder="Status" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="pending">Not attempted</SelectItem><SelectItem value="completed">Completed</SelectItem></SelectContent></Select>
        </section>

        {loading ? <div className="grid gap-3 md:grid-cols-2"><div className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" /><div className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" /></div>
          : filtered.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center"><BookOpen className="mx-auto mb-3 text-slate-600" size={28} /><h2 className="text-sm font-semibold text-slate-200">{dpps.length ? "No matching practice sets" : "No practice sets available"}</h2><p className="mt-1 text-xs text-slate-500">{dpps.length ? "Try changing your search or filters." : "Published DPPs will appear here when they're available to your account."}</p>{(search || subject !== "all" || status !== "all") && <Button variant="outline" className="mt-4 border-white/10 text-slate-300" onClick={() => { setSearch(""); setSubject("all"); setStatus("all"); }}>Clear filters</Button>}</div>
          : <div className="grid gap-3 lg:grid-cols-2">{filtered.map((dpp) => {
            const percentage = dpp.score != null && dpp.total ? Math.max(0, Math.min(100, (dpp.score / dpp.total) * 100)) : null;
            return <article key={dpp.id} className="rounded-2xl border border-white/[0.08] bg-[#111819] p-5 transition-colors hover:border-[#8BBAAF]/30">
              <div className="flex flex-wrap items-center justify-between gap-2"><Badge variant="outline" className={subjectTone[dpp.subject.toLowerCase()] || "border-white/10 bg-white/[0.04] text-slate-300"}>{dpp.subject}</Badge>{dpp.attempted ? <span className="inline-flex items-center gap-1 text-[11px] text-emerald-300"><CheckCircle2 size={13} />Completed</span> : <span className="text-[11px] text-slate-500">Not attempted</span>}</div>
              <h2 className="mt-4 text-base font-semibold text-slate-100">{dpp.title}</h2>
              {(dpp.chapter || dpp.topic) && <p className="mt-1 text-xs text-slate-400">{[dpp.chapter, dpp.topic].filter(Boolean).join(" · ")}</p>}
              {dpp.description && <p className="mt-3 line-clamp-2 text-xs leading-5 text-slate-500">{dpp.description}</p>}
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-slate-500"><span>{dpp.question_count} questions</span>{dpp.is_timed && dpp.duration_minutes && <span className="inline-flex items-center gap-1"><Clock3 size={12} />{dpp.duration_minutes} min</span>}{dpp.difficulty && <span className="capitalize">{dpp.difficulty}</span>}{dpp.publish_date && <span className="inline-flex items-center gap-1"><CalendarDays size={12} />{new Date(dpp.publish_date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>}</div>
              {percentage != null && <div className="mt-4"><div className="mb-1.5 flex justify-between text-[11px]"><span className="text-slate-500">Latest score</span><span className="text-slate-300">{dpp.score}/{dpp.total} · {Math.round(percentage)}%</span></div><div className="h-1.5 overflow-hidden rounded-full bg-white/[0.07]"><div className="h-full rounded-full bg-[#8BBAAF]" style={{ width: `${percentage}%` }} /></div></div>}
              <Button onClick={() => navigate(`/dpp/${dpp.id}`)} className="mt-5 h-10 w-full justify-between bg-[#D5E5DE] text-[#17211E] hover:bg-white">{dpp.attempted ? "Practice again" : "Start practice"}<ChevronRight size={15} /></Button>
            </article>;
          })}</div>}
      </div>
    </StudentWorkspaceLayout>
  );
}
