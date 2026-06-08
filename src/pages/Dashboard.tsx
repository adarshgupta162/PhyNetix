import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Target, 
  Clock, 
  Award,
  BookOpen,
  ArrowRight,
  Zap,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface TestAttempt {
  id: string;
  score: number | null;
  total_marks: number | null;
  completed_at: string | null;
  time_taken_seconds: number | null;
  test: { name: string } | null;
}

interface Stats {
  accuracy: number;
  avgTime: number;
  testsCompleted: number;
  percentile: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ full_name: string | null } | null>(null);
  const [recentTests, setRecentTests] = useState<TestAttempt[]>([]);
  const [stats, setStats] = useState<Stats>({ accuracy: 0, avgTime: 0, testsCompleted: 0, percentile: 0 });
  const [performanceData, setPerformanceData] = useState<{ name: string; accuracy: number }[]>([]);
  const [subjectData, setSubjectData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Check if user has any active enrollments
    const { count: enrollmentCount } = await supabase
      .from("batch_enrollments")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user!.id)
      .eq("is_active", true);
    
    // Redirect to batch catalog if no enrollments
    if (enrollmentCount === 0) {
      navigate("/batches");
      return;
    }

    // Fetch profile
    const { data: profileData } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user!.id)
      .maybeSingle();
    setProfile(profileData);

    // Fetch test attempts
    const { data: attempts } = await supabase
      .from("test_attempts")
      .select("id, score, total_marks, completed_at, time_taken_seconds, test:tests(name)")
      .eq("user_id", user!.id)
      .order("started_at", { ascending: false })
      .limit(10);

    if (attempts) {
      setRecentTests(attempts as TestAttempt[]);

      // Calculate stats
      const completedAttempts = attempts.filter(a => a.completed_at);
      const totalScore = completedAttempts.reduce((acc, a) => acc + (a.score || 0), 0);
      const totalMarks = completedAttempts.reduce((acc, a) => acc + (a.total_marks || 0), 0);
      const accuracy = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100 * 10) / 10 : 0;
      const avgTime = completedAttempts.length > 0 
        ? Math.round(completedAttempts.reduce((acc, a) => acc + (a.time_taken_seconds || 0), 0) / completedAttempts.length / 60 * 10) / 10
        : 0;

      setStats({
        accuracy,
        avgTime,
        testsCompleted: completedAttempts.length,
        percentile: Math.min(95, 50 + completedAttempts.length * 2), // Simulated percentile
      });

      // Generate performance trend (last 6 weeks simulation based on real data)
      const weeklyData = [];
      for (let i = 5; i >= 0; i--) {
        const weekAccuracy = accuracy + (Math.random() - 0.5) * 20;
        weeklyData.push({
          name: `Week ${6 - i}`,
          accuracy: Math.max(0, Math.min(100, Math.round(weekAccuracy))),
        });
      }
      setPerformanceData(weeklyData);
    }

    // Fetch subject data from courses
    const { data: courses } = await supabase.from("courses").select("name, color");
    if (courses) {
      const colors = ["#3b82f6", "#8b5cf6", "#06b6d4", "#22c55e", "#f59e0b", "#ef4444"];
      setSubjectData(courses.map((c, i) => ({
        name: c.name,
        value: 60 + Math.random() * 30, // Simulated performance per subject
        color: c.color || colors[i % colors.length],
      })));
    }

    setLoading(false);
  };

  const displayName = profile?.full_name || user?.email?.split("@")[0] || "Student";

  const statsDisplay = [
    { icon: Target, label: "Overall Accuracy", value: `${stats.accuracy}%`, change: "+5%", positive: true },
    { icon: Clock, label: "Avg. Time/Test", value: `${stats.avgTime} min`, change: "-2min", positive: true },
    { icon: BookOpen, label: "Tests Completed", value: stats.testsCompleted.toString(), change: `+${Math.min(stats.testsCompleted, 5)}`, positive: true },
    { icon: Award, label: "Percentile", value: stats.percentile.toString(), change: "+3", positive: true },
  ];

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
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              Welcome back, <span className="gradient-text">{displayName}</span>
            </h1>
            <p className="text-muted-foreground">
              Here's an overview of your performance
            </p>
          </div>
          <Link to="/tests">
            <Button variant="gradient">
              <Zap className="w-5 h-5" />
              Start New Test
            </Button>
          </Link>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statsDisplay.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="stat-card"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <span className={`text-sm font-medium flex items-center gap-1 ${stat.positive ? "text-success" : "text-destructive"}`}>
                  <TrendingUp className="w-4 h-4" />
                  {stat.change}
                </span>
              </div>
              <div className="text-2xl font-bold font-display mb-1">{stat.value}</div>
              <div className="text-sm text-muted-foreground">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Performance Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold font-display">Performance Trend</h2>
                <p className="text-sm text-muted-foreground">Your accuracy over the past weeks</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={performanceData}>
                  <defs>
                    <linearGradient id="colorAccuracy" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="accuracy" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAccuracy)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Subject Breakdown */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold font-display mb-6">Subject Performance</h2>
            <div className="h-48 mb-4">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={subjectData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {subjectData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {subjectData.map((subject, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: subject.color }}
                    />
                    <span>{subject.name}</span>
                  </div>
                  <span className="font-medium">{Math.round(subject.value)}%</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Recent Tests */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold font-display">Recent Tests</h2>
            <Link to="/attempts" className="text-sm text-primary hover:underline flex items-center gap-1">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          {recentTests.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tests taken yet. Start your first test!</p>
              <Link to="/tests">
                <Button variant="gradient" className="mt-4">
                  Browse Tests
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recentTests.slice(0, 5).map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      test.completed_at ? "bg-success/20" : "bg-primary/20"
                    }`}>
                      {test.completed_at ? (
                        <CheckCircle2 className="w-5 h-5 text-success" />
                      ) : (
                        <Clock className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{test.test?.name || "Unknown Test"}</div>
                      <div className="text-sm text-muted-foreground">
                        {test.completed_at 
                          ? new Date(test.completed_at).toLocaleDateString()
                          : "In Progress"
                        }
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {test.completed_at && test.score !== null ? (
                      <>
                        <div className="font-bold text-lg">
                          {test.score}/{test.total_marks}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {test.total_marks ? Math.round((test.score / test.total_marks) * 100) : 0}% accuracy
                        </div>
                      </>
                    ) : (
                      <span className="text-sm text-muted-foreground">Not completed</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
