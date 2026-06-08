import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen, Calendar, Clock, Filter, Search,
  ChevronRight, Zap, Target, CheckCircle2, Lock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";

interface DPP {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  chapter: string | null;
  topic: string | null;
  difficulty: string | null;
  duration_minutes: number | null;
  is_timed: boolean | null;
  access_type: string | null;
  batch_id: string | null;
  publish_date: string | null;
  question_count?: number;
  attempted?: boolean;
  score?: number;
  total?: number;
}

export default function DPPPage() {
  const [dpps, setDpps] = useState<DPP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) fetchDPPs();
  }, [user]);

  const fetchDPPs = async () => {
    setLoading(true);

    // Fetch published DPPs
    const { data: dppsData, error } = await supabase
      .from('dpps')
      .select('*')
      .eq('is_published', true)
      .order('publish_date', { ascending: false });

    if (error || !dppsData) {
      setLoading(false);
      return;
    }

    // Fetch question counts
    const dppIds = dppsData.map(d => d.id);
    const [qRes, aRes] = await Promise.all([
      supabase.from('dpp_questions').select('dpp_id').in('dpp_id', dppIds),
      supabase.from('dpp_attempts').select('dpp_id, score, total_marks, completed_at').eq('user_id', user!.id).in('dpp_id', dppIds),
    ]);

    const qCount: Record<string, number> = {};
    qRes.data?.forEach(q => { qCount[q.dpp_id] = (qCount[q.dpp_id] || 0) + 1; });

    const attemptMap: Record<string, { attempted: boolean; score?: number; total?: number }> = {};
    aRes.data?.forEach(a => {
      if (a.completed_at) {
        attemptMap[a.dpp_id] = { attempted: true, score: a.score ?? undefined, total: a.total_marks ?? undefined };
      }
    });

    // Check batch access for batch_only DPPs
    const batchDpps = dppsData.filter(d => d.access_type === 'batch_only' && d.batch_id);
    let enrolledBatchIds: string[] = [];
    if (batchDpps.length > 0) {
      const { data: enrollments } = await supabase
        .from('batch_enrollments')
        .select('batch_id')
        .eq('user_id', user!.id)
        .eq('is_active', true);
      enrolledBatchIds = (enrollments || []).map(e => e.batch_id);
    }

    const result = dppsData
      .filter(d => d.access_type === 'public' || (d.batch_id && enrolledBatchIds.includes(d.batch_id)))
      .map(d => ({
        ...d,
        question_count: qCount[d.id] || 0,
        attempted: attemptMap[d.id]?.attempted || false,
        score: attemptMap[d.id]?.score,
        total: attemptMap[d.id]?.total,
      }));

    setDpps(result);
    setLoading(false);
  };

  const startDPP = (dppId: string) => {
    navigate(`/dpp/${dppId}`);
  };

  const filtered = dpps.filter(d => {
    const matchSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.subject.toLowerCase().includes(search.toLowerCase()) ||
      (d.chapter || '').toLowerCase().includes(search.toLowerCase());
    const matchSubject = filterSubject === 'all' || d.subject.toLowerCase() === filterSubject;
    return matchSearch && matchSubject;
  });

  const subjectColor = (s: string) => {
    switch (s.toLowerCase()) {
      case 'physics': return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
      case 'chemistry': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'mathematics': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
      default: return 'bg-primary/10 text-primary border-primary/20';
    }
  };

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
            Daily Practice <span className="gradient-text">Problems</span>
          </h1>
          <p className="text-muted-foreground">Sharpen your skills with focused practice sets</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Available", value: dpps.length, icon: BookOpen, color: "text-primary" },
            { label: "Attempted", value: dpps.filter(d => d.attempted).length, icon: CheckCircle2, color: "text-emerald-500" },
            { label: "Pending", value: dpps.filter(d => !d.attempted).length, icon: Target, color: "text-amber-500" },
            { label: "Avg Score", value: (() => {
              const scored = dpps.filter(d => d.score != null && d.total);
              if (scored.length === 0) return "—";
              const avg = scored.reduce((s, d) => s + ((d.score! / d.total!) * 100), 0) / scored.length;
              return `${Math.round(avg)}%`;
            })(), icon: Zap, color: "text-purple-500" },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search DPPs..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* DPP Cards */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold">No DPPs available</h3>
            <p className="text-muted-foreground">Check back later for new practice sets</p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <AnimatePresence>
              {filtered.map((dpp, i) => (
                <motion.div
                  key={dpp.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 hover:border-primary/30 transition-all group cursor-pointer"
                  onClick={() => startDPP(dpp.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="outline" className={subjectColor(dpp.subject)}>
                      {dpp.subject}
                    </Badge>
                    {dpp.attempted && (
                      <Badge variant="default" className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                        <CheckCircle2 className="w-3 h-3 mr-1" />
                        Done
                      </Badge>
                    )}
                  </div>

                  <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">{dpp.title}</h3>
                  {dpp.chapter && <p className="text-sm text-muted-foreground mb-3">{dpp.chapter}{dpp.topic ? ` • ${dpp.topic}` : ''}</p>}

                  <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" />{dpp.question_count} Qs</span>
                    {dpp.is_timed && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{dpp.duration_minutes}min</span>}
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />
                      {dpp.publish_date ? new Date(dpp.publish_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : 'Today'}
                    </span>
                  </div>

                  {dpp.attempted && dpp.score != null && dpp.total ? (
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-2 rounded-full bg-secondary overflow-hidden">
                        <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(dpp.score / dpp.total) * 100}%` }} />
                      </div>
                      <span className="text-xs font-medium">{dpp.score}/{dpp.total}</span>
                    </div>
                  ) : (
                    <Button size="sm" className="w-full gap-2">
                      Start Practice <ChevronRight className="w-4 h-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
