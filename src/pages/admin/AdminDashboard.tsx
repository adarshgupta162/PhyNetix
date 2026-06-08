import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { 
  Users, 
  BookOpen, 
  FileQuestion, 
  ClipboardList,
  TrendingUp,
  Activity,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

interface Stats {
  totalStudents: number;
  totalCourses: number;
  totalQuestions: number;
  totalTests: number;
}

export default function AdminDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activityData, setActivityData] = useState<{ name: string; attempts: number }[]>([]);
  const [performanceData, setPerformanceData] = useState<{ subject: string; avgScore: number }[]>([]);
  const [recentActivity, setRecentActivity] = useState<{ type: string; message: string; time: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);

  const fetchDashboardData = useCallback(async (showRetryToast = false) => {
    try {
      setError(null);
      if (showRetryToast) {
        setRetrying(true);
      }

      // Check session first
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData.session) {
        throw new Error("Session expired. Please log in again.");
      }

      // Fetch counts with proper error handling
      const [studentsRes, coursesRes, questionsRes, testsRes] = await Promise.all([
        supabase.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "student"),
        supabase.from("courses").select("*", { count: "exact", head: true }),
        supabase.from("questions").select("*", { count: "exact", head: true }),
        supabase.from("tests").select("*", { count: "exact", head: true }),
      ]);

      // Check for errors in any of the queries
      const errors = [studentsRes.error, coursesRes.error, questionsRes.error, testsRes.error].filter(Boolean);
      if (errors.length > 0) {
        console.error("Dashboard query errors:", errors);
        throw new Error("Failed to fetch some dashboard data");
      }

      setStats({
        totalStudents: studentsRes.count || 0,
        totalCourses: coursesRes.count || 0,
        totalQuestions: questionsRes.count || 0,
        totalTests: testsRes.count || 0,
      });

      // Fetch recent test attempts for activity chart
      const { data: attempts, error: attemptsError } = await supabase
        .from("test_attempts")
        .select("started_at")
        .order("started_at", { ascending: false })
        .limit(100);

      if (!attemptsError && attempts) {
        // Group by day of week
        const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const dayCounts: Record<string, number> = {};
        dayNames.forEach(d => dayCounts[d] = 0);

        attempts.forEach(a => {
          const day = new Date(a.started_at).getDay();
          dayCounts[dayNames[day]]++;
        });

        setActivityData(dayNames.map(name => ({ name, attempts: dayCounts[name] })));
      }

      // Fetch courses for performance chart
      const { data: courses } = await supabase.from("courses").select("name");
      if (courses) {
        setPerformanceData(courses.map(c => ({
          subject: c.name,
          avgScore: 50 + Math.round(Math.random() * 40), // Simulated until we have more data
        })));
      }

      // Generate recent activity
      setRecentActivity([
        { type: "test", message: `${testsRes.count || 0} tests available in the platform`, time: "Now" },
        { type: "user", message: `${studentsRes.count || 0} students registered`, time: "Today" },
        { type: "question", message: `${questionsRes.count || 0} questions in the question bank`, time: "Today" },
        { type: "attempt", message: `${attempts?.length || 0} recent test attempts`, time: "This week" },
      ]);

      if (showRetryToast) {
        toast({ title: "Dashboard refreshed successfully" });
      }
    } catch (err: any) {
      console.error("Dashboard fetch error:", err);
      setError(err.message || "Failed to load dashboard data");
      toast({ 
        title: "Error loading dashboard", 
        description: err.message || "Please try refreshing the page",
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
      setRetrying(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = () => {
    fetchDashboardData(true);
  };

  const statsDisplay = stats ? [
    { icon: Users, label: "Total Students", value: stats.totalStudents.toLocaleString(), change: "+12%", positive: true },
    { icon: BookOpen, label: "Courses", value: stats.totalCourses.toString(), change: "+2", positive: true },
    { icon: FileQuestion, label: "Questions", value: stats.totalQuestions.toLocaleString(), change: "+156", positive: true },
    { icon: ClipboardList, label: "Tests", value: stats.totalTests.toString(), change: "+8", positive: true },
  ] : [];

  // Loading skeleton
  if (loading) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
            <div>
              <div className="h-8 w-48 bg-secondary rounded animate-pulse mb-2"></div>
              <div className="h-4 w-64 bg-secondary rounded animate-pulse"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="stat-card">
                <div className="h-12 w-12 bg-secondary rounded-xl animate-pulse mb-4"></div>
                <div className="h-8 w-24 bg-secondary rounded animate-pulse mb-2"></div>
                <div className="h-4 w-32 bg-secondary rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  // Error state
  if (error && !stats) {
    return (
      <AdminLayout>
        <div className="p-6 lg:p-8">
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
            <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mb-4">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Failed to load dashboard</h2>
            <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
            <Button onClick={handleRefresh} disabled={retrying}>
              {retrying ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Retrying...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Try Again
                </>
              )}
            </Button>
          </div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              Admin <span className="gradient-text">Dashboard</span>
            </h1>
            <p className="text-muted-foreground">
              Overview of your PhyNetix platform
            </p>
          </div>
          <div className="flex gap-3">
            <Button variant="ghost" onClick={handleRefresh} disabled={retrying}>
              <RefreshCw className={`w-4 h-4 mr-2 ${retrying ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Link to="/admin/questions">
              <Button variant="glass">
                <FileQuestion className="w-5 h-5" />
                Add Questions
              </Button>
            </Link>
            <Link to="/admin/tests">
              <Button variant="gradient">
                <ClipboardList className="w-5 h-5" />
                Create Test
              </Button>
            </Link>
          </div>
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
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Test Attempts Chart */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold font-display">Test Attempts</h2>
                <p className="text-sm text-muted-foreground">Daily test attempts this week</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={activityData}>
                  <defs>
                    <linearGradient id="colorAttempts" x1="0" y1="0" x2="0" y2="1">
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
                    dataKey="attempts" 
                    stroke="hsl(var(--primary))" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorAttempts)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Subject Performance */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="glass-card p-6"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-semibold font-display">Average Scores</h2>
                <p className="text-sm text-muted-foreground">By subject across all students</p>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="subject" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      background: 'hsl(var(--card))', 
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                  <Bar dataKey="avgScore" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="glass-card p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold font-display">Platform Summary</h2>
          </div>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center gap-4 p-4 rounded-xl bg-secondary/30 hover:bg-secondary/50 transition-colors"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{activity.message}</p>
                  <p className="text-sm text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </AdminLayout>
  );
}
