import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Clock, CheckCircle2, BarChart3, BookOpen, Calendar, Trophy, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface Attempt {
  id: string;
  test_id: string;
  score: number | null;
  total_marks: number | null;
  time_taken_seconds: number | null;
  started_at: string;
  completed_at: string | null;
  rank: number | null;
  percentile: number | null;
  test: { name: string; test_type: string; duration_minutes: number } | null;
}

interface RatingAgg { avg: number; count: number; }

export default function MyAttempts() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [ratings, setRatings] = useState<Record<string, RatingAgg>>({});
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'incomplete'>('all');

  useEffect(() => { if (user) fetchAttempts(); }, [user]);

  const fetchAttempts = async () => {
    const { data } = await supabase
      .from("test_attempts")
      .select(`id, test_id, score, total_marks, time_taken_seconds, started_at, completed_at, rank, percentile, test:tests(name, test_type, duration_minutes)`)
      .eq("user_id", user!.id)
      .order("started_at", { ascending: false });

    if (data) {
      setAttempts(data as Attempt[]);
      const testIds = [...new Set(data.map((a: any) => a.test_id))];
      if (testIds.length) {
        const { data: reviews } = await supabase
          .from("test_reviews")
          .select("test_id, rating")
          .in("test_id", testIds);
        const map: Record<string, RatingAgg> = {};
        (reviews || []).forEach((r: any) => {
          const m = map[r.test_id] || { avg: 0, count: 0 };
          m.avg = (m.avg * m.count + r.rating) / (m.count + 1);
          m.count += 1;
          map[r.test_id] = m;
        });
        setRatings(map);
      }
    }
    setLoading(false);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}m ${s % 60}s`;
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });

  const filteredAttempts = attempts.filter(a => filter === 'completed' ? !!a.completed_at : filter === 'incomplete' ? !a.completed_at : true);

  const stats = {
    completed: attempts.filter(a => a.completed_at).length,
    avgScore: attempts.filter(a => a.completed_at && a.total_marks).reduce((acc, a) => acc + ((a.score || 0) / (a.total_marks || 1)) * 100, 0) / (attempts.filter(a => a.completed_at).length || 1),
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold font-display mb-2">
            My <span className="gradient-text">Attempts</span>
          </h1>
          <p className="text-muted-foreground">Track your test history and performance</p>
        </div>

        {/* Stats — Total Attempts removed per request */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
              <div>
                <div className="text-2xl font-bold">{stats.completed}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </div>
            </div>
          </div>
          <div className="stat-card">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/10 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-warning" />
              </div>
              <div>
                <div className="text-2xl font-bold">{Math.round(stats.avgScore)}%</div>
                <div className="text-sm text-muted-foreground">Avg Accuracy</div>
              </div>
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {(['all', 'completed', 'incomplete'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all",
                filter === f ? "bg-primary text-primary-foreground" : "bg-secondary/50 text-muted-foreground hover:text-foreground")}
            >{f.charAt(0).toUpperCase() + f.slice(1)}</button>
          ))}
        </div>

        {filteredAttempts.length === 0 ? (
          <div className="text-center py-12 glass-card">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Attempts Found</h3>
            <p className="text-muted-foreground mb-4">{filter === 'all' ? "You haven't attempted any tests yet." : `No ${filter} attempts.`}</p>
            <Link to="/tests"><Button variant="gradient">Browse Tests</Button></Link>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAttempts.map((attempt, index) => {
              const rating = ratings[attempt.test_id];
              return (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.04 }}
                  className="glass-card hover:border-primary/30 transition-all cursor-pointer flex flex-col md:flex-row md:items-center gap-4 p-4"
                  onClick={() => navigate(attempt.completed_at ? `/test/${attempt.test_id}/analysis` : `/test/${attempt.test_id}`)}
                >
                  {/* Left: icon */}
                  <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0",
                    attempt.completed_at ? "bg-success/20" : "bg-warning/20")}>
                    {attempt.completed_at ? <CheckCircle2 className="w-7 h-7 text-success" /> : <Clock className="w-7 h-7 text-warning" />}
                  </div>

                  {/* Middle: title + meta */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate">{attempt.test?.name || "Unknown Test"}</h3>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1"><Calendar className="w-4 h-4" />{formatDate(attempt.started_at)}</span>
                      {attempt.time_taken_seconds && (
                        <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{formatTime(attempt.time_taken_seconds)}</span>
                      )}
                      {rating && rating.count > 0 && (
                        <span className="flex items-center gap-1"><Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />{rating.avg.toFixed(1)} <span className="opacity-70">({rating.count})</span></span>
                      )}
                    </div>
                  </div>

                  {/* Right: score + actions */}
                  <div className="flex items-center gap-4 md:gap-6 md:justify-end">
                    {attempt.completed_at && attempt.score !== null ? (
                      <>
                        <div className="text-right">
                          <div className="text-xl md:text-2xl font-bold">{attempt.score}/{attempt.total_marks}</div>
                          <div className="text-xs text-muted-foreground">{attempt.total_marks ? Math.round((attempt.score / attempt.total_marks) * 100) : 0}% accuracy</div>
                        </div>
                        {attempt.rank && (
                          <div className="text-right hidden sm:block">
                            <div className="text-lg font-semibold">#{attempt.rank}</div>
                            <div className="text-xs text-muted-foreground">Rank</div>
                          </div>
                        )}
                        <Button variant="glass" size="sm"><BarChart3 className="w-4 h-4" />Analysis</Button>
                      </>
                    ) : (
                      <Button variant="glass" size="sm">Resume</Button>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
