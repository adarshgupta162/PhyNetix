import { useEffect, useMemo, useState } from "react";
import { Activity, BarChart3, BookOpen, CalendarDays, Clock3, Target, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import StudentWorkspaceLayout from "@/components/layout/StudentWorkspaceLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface AttemptData {
  id: string; score: number | null; total_marks: number | null; time_taken_seconds: number | null;
  completed_at: string | null; test: { name: string; exam_type: string | null } | null;
}
type Period = "all" | "30" | "90";
const rangeColors = ["#C87970", "#D5A65D", "#79A6C2", "#83B6A2"];

export default function Analytics() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<Period>("all");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    let cancelled = false;
    const fetchData = async () => {
      setLoading(true);
      const { data, error } = await supabase.from("test_attempts").select(`
        id, score, total_marks, time_taken_seconds, completed_at, test:tests(name, exam_type)
      `).eq("user_id", user.id).not("completed_at", "is", null).order("completed_at", { ascending: true });
      if (error) {
        console.error("Analytics query failed:", error);
        if (!cancelled) toast.error("Couldn't load your analytics. Please refresh.");
      } else if (!cancelled) setAttempts((data || []) as AttemptData[]);
      if (!cancelled) setLoading(false);
    };
    void fetchData();
    return () => { cancelled = true; };
  }, [user]);

  const filteredAttempts = useMemo(() => {
    if (period === "all") return attempts;
    const cutoff = Date.now() - Number(period) * 24 * 60 * 60 * 1000;
    return attempts.filter((a) => a.completed_at && new Date(a.completed_at).getTime() >= cutoff);
  }, [attempts, period]);

  const totalTests = filteredAttempts.length;
  const totalScore = filteredAttempts.reduce((sum, a) => sum + (a.score || 0), 0);
  const totalMarks = filteredAttempts.reduce((sum, a) => sum + (a.total_marks || 0), 0);
  const avgAccuracy = totalMarks > 0 ? (totalScore / totalMarks) * 100 : 0;
  const totalTime = filteredAttempts.reduce((sum, a) => sum + (a.time_taken_seconds || 0), 0);
  const avgTime = totalTests ? totalTime / totalTests / 60 : 0;

  const performanceData = filteredAttempts.slice(-12).map((a, i) => ({
    label: a.test?.name ? (a.test.name.length > 18 ? a.test.name.slice(0, 18) + "…" : a.test.name) : `Test ${i + 1}`,
    accuracy: a.total_marks && a.total_marks > 0 ? Math.round(((a.score || 0) / a.total_marks) * 100) : 0,
    date: a.completed_at ? new Date(a.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "",
  }));
  const timeData = filteredAttempts.slice(-10).map((a, i) => ({
    label: a.test?.name ? (a.test.name.length > 14 ? a.test.name.slice(0, 14) + "…" : a.test.name) : `Test ${i + 1}`,
    minutes: Math.round((a.time_taken_seconds || 0) / 60),
  }));
  const scoreRanges = [
    { range: "0–25%", count: 0, color: rangeColors[0] },
    { range: "26–50%", count: 0, color: rangeColors[1] },
    { range: "51–75%", count: 0, color: rangeColors[2] },
    { range: "76–100%", count: 0, color: rangeColors[3] },
  ];
  filteredAttempts.forEach((a) => {
    const pct = a.total_marks && a.total_marks > 0 ? ((a.score || 0) / a.total_marks) * 100 : 0;
    const index = pct <= 25 ? 0 : pct <= 50 ? 1 : pct <= 75 ? 2 : 3;
    scoreRanges[index].count += 1;
  });
  const chartTooltip = { background: "#151D1D", border: "1px solid rgba(255,255,255,.1)", borderRadius: 10, color: "#E7ECE9", fontSize: 12 };

  return (
    <StudentWorkspaceLayout>
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8BBAAF]">Your progress</p><h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Performance analytics</h1><p className="mt-2 text-sm text-slate-400">A clear view of your completed tests and score trends.</p></div>
          <Select value={period} onValueChange={(value) => setPeriod(value as Period)}><SelectTrigger className="h-10 w-44 border-white/10 bg-[#111819] text-slate-200"><CalendarDays size={14} className="mr-2 text-slate-500" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All time</SelectItem><SelectItem value="90">Last 90 days</SelectItem><SelectItem value="30">Last 30 days</SelectItem></SelectContent></Select>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Tests completed", value: loading ? "—" : totalTests.toString(), icon: BookOpen, detail: "Completed attempts" },
            { label: "Overall score", value: loading || !totalMarks ? "—" : `${Math.round(avgAccuracy)}%`, icon: Target, detail: "Weighted by total marks" },
            { label: "Average duration", value: loading || !totalTests ? "—" : `${Math.round(avgTime)} min`, icon: Clock3, detail: "Per completed test" },
            { label: "Study time", value: loading ? "—" : `${Math.floor(totalTime / 3600)}h ${Math.floor((totalTime % 3600) / 60)}m`, icon: Activity, detail: "Time recorded in tests" },
          ].map((stat) => <div key={stat.label} className="rounded-xl border border-white/[0.08] bg-[#111819] p-4"><div className="flex items-center gap-2 text-xs text-slate-400"><stat.icon size={15} className="text-[#A4C9C0]" />{stat.label}</div><p className="mt-3 text-2xl font-semibold tracking-tight text-white">{stat.value}</p><p className="mt-1 text-[11px] text-slate-600">{stat.detail}</p></div>)}
        </section>

        {loading ? <div className="grid gap-4 lg:grid-cols-2"><div className="h-80 animate-pulse rounded-2xl bg-white/[0.04]" /><div className="h-80 animate-pulse rounded-2xl bg-white/[0.04]" /></div>
          : totalTests === 0 ? <div className="rounded-2xl border border-dashed border-white/10 px-6 py-16 text-center"><BarChart3 className="mx-auto mb-3 text-slate-600" size={30} /><h2 className="text-sm font-semibold text-slate-200">No completed tests in this period</h2><p className="mt-1 text-xs text-slate-500">Complete a test to start building your performance history.</p><Button onClick={() => window.location.assign("/tests")} className="mt-4 bg-[#D5E5DE] text-[#17211E] hover:bg-white">Browse tests</Button></div>
          : <>
            <section className="grid gap-4 xl:grid-cols-2">
              <article className="rounded-2xl border border-white/[0.08] bg-[#111819] p-5"><div className="mb-5"><h2 className="text-sm font-semibold text-slate-100">Score trend</h2><p className="mt-1 text-xs text-slate-500">Percentage scored in your recent tests</p></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><AreaChart data={performanceData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}><defs><linearGradient id="studentScoreFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#8BBAAF" stopOpacity={0.24} /><stop offset="100%" stopColor="#8BBAAF" stopOpacity={0} /></linearGradient></defs><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="date" tick={{ fill: "#74817D", fontSize: 10 }} axisLine={false} tickLine={false} /><YAxis domain={[0, 100]} tick={{ fill: "#74817D", fontSize: 10 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} /><Tooltip contentStyle={chartTooltip} formatter={(value: number) => [`${value}%`, "Score"]} labelFormatter={(label) => `Completed: ${label}`} /><Area type="monotone" dataKey="accuracy" stroke="#A4C9C0" strokeWidth={2} fill="url(#studentScoreFill)" /></AreaChart></ResponsiveContainer></div></article>

              <article className="rounded-2xl border border-white/[0.08] bg-[#111819] p-5"><div className="mb-5"><h2 className="text-sm font-semibold text-slate-100">Time per test</h2><p className="mt-1 text-xs text-slate-500">Minutes recorded for your latest attempts</p></div><div className="h-64"><ResponsiveContainer width="100%" height="100%"><BarChart data={timeData} margin={{ top: 8, right: 8, left: -18, bottom: 4 }}><CartesianGrid stroke="rgba(255,255,255,.06)" vertical={false} /><XAxis dataKey="label" tick={{ fill: "#74817D", fontSize: 9 }} axisLine={false} tickLine={false} interval={0} /><YAxis tick={{ fill: "#74817D", fontSize: 10 }} axisLine={false} tickLine={false} /><Tooltip contentStyle={chartTooltip} formatter={(value: number) => [`${value} min`, "Duration"]} /><Bar dataKey="minutes" fill="#789C91" radius={[5, 5, 0, 0]} maxBarSize={32} /></BarChart></ResponsiveContainer></div></article>
            </section>

            <section className="grid gap-4 lg:grid-cols-[1.1fr_.9fr]">
              <article className="rounded-2xl border border-white/[0.08] bg-[#111819] p-5"><div className="mb-5"><h2 className="text-sm font-semibold text-slate-100">Score distribution</h2><p className="mt-1 text-xs text-slate-500">How your completed tests are distributed by score range</p></div><div className="grid items-center gap-4 sm:grid-cols-2"><div className="h-56"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={scoreRanges.filter((r) => r.count > 0)} dataKey="count" nameKey="range" cx="50%" cy="50%" innerRadius={58} outerRadius={86} paddingAngle={3}><Cell fill={rangeColors[0]} /><Cell fill={rangeColors[1]} /><Cell fill={rangeColors[2]} /><Cell fill={rangeColors[3]} /></Pie><Tooltip contentStyle={chartTooltip} /></PieChart></ResponsiveContainer></div><div className="space-y-3">{scoreRanges.map((range) => <div key={range.range} className="flex items-center justify-between gap-3 text-xs"><span className="flex items-center gap-2 text-slate-400"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: range.color }} />{range.range}</span><span className="font-medium tabular-nums text-slate-200">{range.count} tests</span></div>)}</div></div></article>
              <article className="rounded-2xl border border-white/[0.08] bg-[#111819] p-5"><div className="mb-4 flex items-center gap-2"><TrendingUp size={16} className="text-[#A4C9C0]" /><h2 className="text-sm font-semibold text-slate-100">Recent attempts</h2></div><div className="divide-y divide-white/[0.06]">{filteredAttempts.slice(-5).reverse().map((attempt) => { const pct = attempt.total_marks && attempt.total_marks > 0 ? Math.round(((attempt.score || 0) / attempt.total_marks) * 100) : null; return <div key={attempt.id} className="flex items-center justify-between gap-3 py-3 first:pt-0"><div className="min-w-0"><p className="truncate text-xs font-medium text-slate-200">{attempt.test?.name || "Test"}</p><p className="mt-1 text-[10px] text-slate-500">{attempt.completed_at ? new Date(attempt.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) : "Date unavailable"}</p></div><div className="shrink-0 text-right"><p className="text-xs font-semibold text-slate-200">{attempt.score ?? "—"}<span className="text-slate-600">/{attempt.total_marks ?? "—"}</span></p><p className="mt-1 text-[10px] text-slate-500">{pct == null ? "Score unavailable" : `${pct}%`}</p></div></div>; })}</div></article>
            </section>
          </>}
      </div>
    </StudentWorkspaceLayout>
  );
}
