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
  section: { id: string; name: string } | null;
  tests: any;
  batch_id: string;
}

interface AttemptRow {
  id: string;
  test_id: string;
  completed_at: string | null;
}

const FILTERS = ["all", "not-attempted", "attempted", "upcoming", "resume"] as const;
type Filter = typeof FILTERS[number];

export default function MyAttempts() {
  const { user } = useAuth();
  const [rows, setRows] = useState<BatchTestRow[]>([]);
  const [attempts, setAttempts] = useState<AttemptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("__all__");
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
        .select(`test_id, section_id, batch_id, section:course_sections(id, name), tests(*)`)
        .in("batch_id", batchIds);
      setRows((bt as any) || []);
    } else {
      setRows([]);
    }

    const { data: att } = await supabase
      .from("test_attempts")
      .select("id, test_id, completed_at")
      .eq("user_id", user!.id);
    setAttempts((att as any) || []);
    setLoading(false);
  };

  const categories: CategoryItem[] = useMemo(() => {
    const seen = new Map<string, CategoryItem>();
    for (const r of rows) {
      if (r.section?.id && r.section.name) {
        seen.set(r.section.id, { id: r.section.id, name: r.section.name, group: classifyGroup(r.section.name) });
      }
    }
    return Array.from(seen.values());
  }, [rows]);

  const selectedName = useMemo(() => {
    if (selectedCategory === "__all__") return "All Tests";
    return categories.find(c => c.id === selectedCategory)?.name || "All Tests";
  }, [selectedCategory, categories]);

  const visibleTests = useMemo(() => {
    const seen = new Set<string>();
    const list: TestCardData[] = [];
    for (const r of rows) {
      if (selectedCategory !== "__all__" && r.section_id !== selectedCategory) continue;
      if (!r.tests || seen.has(r.test_id)) continue;
      seen.add(r.test_id);
      const att = attempts.find(a => a.test_id === r.test_id);
      list.push({
        id: r.test_id,
        name: r.tests.name,
        syllabus: r.tests.syllabus,
        syllabus_subtitle: r.tests.syllabus_subtitle,
        duration_minutes: r.tests.duration_minutes || 0,
        total_questions: r.tests.total_questions ?? undefined,
        total_marks: r.tests.total_marks ?? undefined,
        scheduled_at: r.tests.scheduled_at,
        isCompleted: !!att?.completed_at,
        isInProgress: !!att && !att.completed_at,
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
      <div className="p-4 lg:p-6 max-w-5xl mx-auto">
        <button
          onClick={() => setSidebarOpen(true)}
          className="w-full flex items-center justify-between p-3 rounded-lg border border-border bg-secondary/30 mb-4 hover:bg-secondary/50 transition"
        >
          <span className="flex items-center gap-2 text-sm font-medium"><Menu className="w-4 h-4" /> Select Test Category</span>
          <span className="text-xs text-muted-foreground truncate max-w-[40%]">{selectedName}</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <h1 className="text-xl lg:text-2xl font-bold">{selectedName}</h1>
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search Tests"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 rounded-full bg-secondary/30 border-border"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-5">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1.5 text-xs rounded-full border transition",
                filter === f
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-secondary/30 border-border text-muted-foreground hover:text-foreground"
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
            {visibleTests.map(t => <TestListCard key={t.id} test={t} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
