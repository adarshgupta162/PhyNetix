import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  TrendingUp, 
  Target, 
  Clock, 
  BookOpen,
  Calendar,
  Award
} from "lucide-react";
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
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from "recharts";

interface AttemptData {
  id: string;
  score: number | null;
  total_marks: number | null;
  time_taken_seconds: number | null;
  completed_at: string | null;
  test: {
    name: string;
    exam_type: string | null;
  } | null;
}

export default function Analytics() {
  const { user } = useAuth();
  const [attempts, setAttempts] = useState<AttemptData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const { data } = await supabase
      .from("test_attempts")
      .select(`
        id,
        score,
        total_marks,
        time_taken_seconds,
        completed_at,
        test:tests(name, exam_type)
      `)
      .eq("user_id", user!.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: true });

    if (data) {
      setAttempts(data as AttemptData[]);
    }
    setLoading(false);
  };

  // Calculate stats
  const totalTests = attempts.length;
  const avgAccuracy = totalTests > 0
    ? attempts.reduce((acc, a) => acc + ((a.score || 0) / (a.total_marks || 1)) * 100, 0) / totalTests
    : 0;
  const totalTime = attempts.reduce((acc, a) => acc + (a.time_taken_seconds || 0), 0);
  const avgTime = totalTests > 0 ? totalTime / totalTests / 60 : 0;

  // Performance over time
  const performanceData = attempts.slice(-10).map((a, i) => ({
    name: `Test ${i + 1}`,
    accuracy: a.total_marks ? Math.round((a.score || 0) / a.total_marks * 100) : 0,
  }));

  // Time distribution
  const timeData = attempts.slice(-10).map((a, i) => ({
    name: `Test ${i + 1}`,
    time: Math.round((a.time_taken_seconds || 0) / 60),
  }));

  // Score distribution
  const scoreRanges = [
    { range: "0-25%", count: 0, color: "#ef4444" },
    { range: "26-50%", count: 0, color: "#f59e0b" },
    { range: "51-75%", count: 0, color: "#3b82f6" },
    { range: "76-100%", count: 0, color: "#22c55e" },
  ];

  attempts.forEach(a => {
    const pct = a.total_marks ? ((a.score || 0) / a.total_marks) * 100 : 0;
    if (pct <= 25) scoreRanges[0].count++;
    else if (pct <= 50) scoreRanges[1].count++;
    else if (pct <= 75) scoreRanges[2].count++;
    else scoreRanges[3].count++;
  });

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
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold font-display mb-2">
            Performance <span className="gradient-text">Analytics</span>
          </h1>
          <p className="text-muted-foreground">
            Detailed insights into your test performance
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="stat-card"
          >
            <div className="flex items-center gap-3 mb-2">
              <BookOpen className="w-6 h-6 text-primary" />
              <span className="text-sm text-muted-foreground">Tests Completed</span>
            </div>
            <div className="text-3xl font-bold">{totalTests}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="stat-card"
          >
            <div className="flex items-center gap-3 mb-2">
              <Target className="w-6 h-6 text-success" />
              <span className="text-sm text-muted-foreground">Avg Accuracy</span>
            </div>
            <div className="text-3xl font-bold">{Math.round(avgAccuracy)}%</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="stat-card"
          >
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-6 h-6 text-warning" />
              <span className="text-sm text-muted-foreground">Avg Time</span>
            </div>
            <div className="text-3xl font-bold">{Math.round(avgTime)} min</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="stat-card"
          >
            <div className="flex items-center gap-3 mb-2">
              <Calendar className="w-6 h-6 text-accent" />
              <span className="text-sm text-muted-foreground">Total Time</span>
            </div>
            <div className="text-3xl font-bold">{Math.round(totalTime / 3600)}h</div>
          </motion.div>
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-6 mb-8">
          {/* Performance Trend */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold font-display mb-6">Accuracy Trend</h2>
            {performanceData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={performanceData}>
                    <defs>
                      <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
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
                      fill="url(#colorAcc)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Complete some tests to see trends</p>
            )}
          </motion.div>

          {/* Time Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="glass-card p-6"
          >
            <h2 className="text-lg font-semibold font-display mb-6">Time per Test (min)</h2>
            {timeData.length > 0 ? (
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={timeData}>
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
                    <Bar dataKey="time" fill="hsl(var(--accent))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-8">Complete some tests to see data</p>
            )}
          </motion.div>
        </div>

        {/* Score Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="glass-card p-6"
        >
          <h2 className="text-lg font-semibold font-display mb-6">Score Distribution</h2>
          <div className="grid lg:grid-cols-2 gap-8">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={scoreRanges.filter(r => r.count > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={90}
                    paddingAngle={5}
                    dataKey="count"
                    label={({ range, count }) => `${range}: ${count}`}
                  >
                    {scoreRanges.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-col justify-center space-y-4">
              {scoreRanges.map((range, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: range.color }} />
                    <span>{range.range}</span>
                  </div>
                  <span className="font-semibold">{range.count} tests</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </DashboardLayout>
  );
}
