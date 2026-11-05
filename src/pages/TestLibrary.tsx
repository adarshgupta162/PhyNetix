import { useEffect, useMemo, useState } from "react";
import { Menu, Search, BookOpen } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import TestCategorySidebar, { CategoryItem, classifyGroup } from "@/components/test/TestCategorySidebar";
import TestListCard, { TestCardData } from "@/components/test/TestListCard";

interface BatchTestRow {
  test_id: string;
  section_id: string | null;
  section: { id: string; name: string; display_order: number | null } | null;
  tests: any;
  batch_id: string;
  unlock_date: string | null;
  display_order: number | null;
  order_index: number | null;
}

interface AttemptRow {
  id: string;
  test_id: string;
  completed_at: string | null;
  started_at: string | null;
}

const FILTERS = ["all", "not-attempted", "attempted", "upcoming", "resume"] as const;
type Filter = typeof FILTERS[number];

export default function TestLibrary() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BatchTestRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("__all__");
  const [categoryInitialized, setCategoryInitialized] = useState(false);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  useEffect(() => { if (user) load(); }, [user]);

  const load = async () => {
    setLoading(true);
    const { data: enrollments } = await supabase
      .from("batch_enrollments")
      .select("batch_id")
      .eq("user_id", user!.id)
      .eq("status", "active");
    const batchIds = (enrollments || []).map((e: any) => e.batch_id);

    if (batchIds.length) {
      const { data: bt } = await supabase
        .from("batch_tests")
        .select(`test_id, section_id, batch_id, unlock_date, display_order, order_index, section:course_sections(id, name, display_order), tests(*)`)
        .in("batch_id", batchIds)
        .order("display_order", { ascending: true });
      setRows((bt as any) || []);
    } else {
      setRows([]);
    }

    const { data: att } = await supabase
      .from("test_attempts")
      .select("id, test_id, completed_at, started_at")
      .eq("user_id", user!.id);
    setAttempts((att as any) || []);

    setLoading(false);
  };

  const categories: CategoryItem[] = useMemo(() => {
    const seen = new Map<string, CategoryItem & { order: number }>();
    for (const r of rows) {
      if (r.section?.id && r.section.name) {
        if (!seen.has(r.section.id)) {
          seen.set(r.section.id, {
            id: r.section.id,
            name: r.section.name,
            group: classifyGroup(r.section.name),
            order: r.section.display_order ?? 9999,
          });
        }
      }
    }
    return Array.from(seen.values()).sort((a, b) => a.order - b.order);
  }, [rows]);

  // Default to the top section (lowest display_order) once data loads
  useEffect(() => {
    if (categoryInitialized || loading) return;
    if (categories.length > 0) setSelectedCategory(categories[0].id);
    setCategoryInitialized(true);
  }, [loading, categories, categoryInitialized]);

  const selectedName = useMemo(() => {
    if (selectedCategory === "__all__") return "All Tests";
    return categories.find(c => c.id === selectedCategory)?.name || "All Tests";
  }, [selectedCategory, categories]);

  const visibleTests = useMemo(() => {
    const seen = new Set<string>();
    const list: TestCardData[] = [];
    const now = Date.now();
    const ordered = [...rows].sort((a, b) => (a.display_order ?? a.order_index ?? 9999) - (b.display_order ?? b.order_index ?? 9999));
    for (const r of ordered) {
      if (selectedCategory !== "__all__" && r.section_id !== selectedCategory) continue;
      if (!r.tests || seen.has(r.test_id)) continue;
      seen.add(r.test_id);
      const att = attempts.find(a => a.test_id === r.test_id);
      const duration = r.tests.duration_minutes || 0;
      let expired = false;
      if (att && !att.completed_at && att.started_at && duration > 0) {
        const endMs = new Date(att.started_at).getTime() + duration * 60 * 1000;
        if (endMs <= now) expired = true;
      }
      list.push({
        id: r.test_id,
        name: r.tests.name,
        syllabus: r.tests.syllabus,
        syllabus_subtitle: r.tests.syllabus_subtitle,
        duration_minutes: duration,
        total_questions: r.tests.total_questions ?? undefined,
        total_marks: r.tests.total_marks ?? undefined,
        scheduled_at: r.tests.scheduled_at || r.unlock_date,
        isCompleted: !!att?.completed_at || expired,
        isInProgress: !!att && !att.completed_at && !expired,
        attemptId: att?.id,
      });
    }
    const q = search.trim().toLowerCase();
    return list.filter(t => {
      if (q && !t.name.toLowerCase().includes(q)) return false;
      const upcoming = !!(t.scheduled_at && new Date(t.scheduled_at) > new Date());
      switch (filter) {
        case "not-attempted": return !t.isCompleted && !t.isInProgress && !upcoming;
        case "attempted": return t.isCompleted;
        case "upcoming": return upcoming;
        case "resume": return t.isInProgress;
        default: return true;
      }
    });
  }, [rows, attempts, selectedCategory, search, filter]);

  return (
    <DashboardLayout>
      <TestCategorySidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        items={categories}
        selectedId={selectedCategory}
        onSelect={setSelectedCategory}
      />
      <div className="mx-auto max-w-6xl space-y-5 px-1 py-2 sm:px-2">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">Your preparation</p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Test Library</h1>
            <p className="mt-1 text-xs text-slate-500">Pick up where you left off, or start your next practice test.</p>
          </div>
          <div className="rounded-xl border border-white/[0.08] bg-[#0B1725] px-4 py-2.5">
            <p className="text-[9px] uppercase tracking-wider text-slate-500">Showing</p>
            <p className="mt-0.5 text-sm font-semibold tabular-nums text-white">{visibleTests.length} <span className="text-[10px] font-normal text-slate-500">tests</span></p>
          </div>
        </div>

        <button
          onClick={() => setSidebarOpen(true)}
          className="group flex w-full items-center justify-between rounded-xl border border-white/[0.08] bg-[#0B1725] px-4 py-3.5 text-left transition hover:border-sky-400/25 hover:bg-[#0E1C2B]"
        >
          <span className="flex items-center gap-3 text-xs font-medium text-slate-200"><span className="grid h-8 w-8 place-items-center rounded-lg bg-sky-400/10 text-sky-300"><Menu className="h-4 w-4" /></span><span><span className="block">Test category</span><span className="mt-0.5 block text-[10px] font-normal text-slate-500">Choose a subject or section</span></span></span>
          <span className="flex items-center gap-2 text-xs text-slate-400">{selectedName}<span className="text-sky-300 transition group-hover:translate-x-0.5">→</span></span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-slate-200">{selectedName}</h2>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search Tests"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-10 rounded-xl border-white/10 bg-[#0B1725] pl-9 text-xs text-slate-200 placeholder:text-slate-600"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full border px-3.5 py-2 text-[11px] font-medium transition",
                filter === f
                  ? "border-sky-400/30 bg-sky-400/10 text-sky-200"
                  : "border-white/[0.08] bg-[#0B1725] text-slate-500 hover:border-white/15 hover:text-slate-200"
              )}
            >
              {f === "all" ? "All" : f === "not-attempted" ? "Not Attempted" : f === "attempted" ? "Attempted" : f === "upcoming" ? "Upcoming" : "Resume"}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div></div>
        ) : visibleTests.length === 0 ? (
          <div className="text-center py-12 rounded-xl border border-border bg-secondary/20">
            <BookOpen className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <h3 className="font-semibold mb-1">No tests found</h3>
            <p className="text-sm text-muted-foreground mb-4">Try another category or enroll in a course.</p>
            <Button onClick={() => (window.location.href = "/batches")}>Browse Courses</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {visibleTests.map((t, index) => <div key={t.id} className="animate-in fade-in slide-in-from-bottom-1 duration-300" style={{ animationDelay: `${Math.min(index * 35, 210)}ms` }}><TestListCard test={t} /></div>)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
