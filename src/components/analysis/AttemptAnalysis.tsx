import { motion } from "framer-motion";
import { CheckCircle2, XCircle, MinusCircle, Target, Zap, BarChart3 } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
} from "recharts";

interface SubjectAttemptData {
  name: string;
  correct: number;
  incorrect: number;
  unattempted: number;
  totalQuestions: number;
  accuracy: number;
  color: string;
}

interface QuestionAttemptData {
  questionNumber: number;
  status: "correct" | "incorrect" | "skipped";
  subject: string;
  marks: number;
  negativeMarks: number;
  userMarks: number;
  difficulty?: string;
}

interface AttemptAnalysisProps {
  subjects: SubjectAttemptData[];
  questions: QuestionAttemptData[];
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  totalQuestions: number;
  accuracy: number;
  attemptRate: number;
}

const STATUS_COLORS = {
  correct: "hsl(142, 76%, 45%)",
  incorrect: "hsl(0, 84%, 60%)",
  skipped: "hsl(215, 20%, 65%)",
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.[0]) {
    const d = payload[0].payload;
    return (
      <div className="glass-card p-3 border border-border/50 text-sm">
        <p className="font-medium">{d.name}</p>
        <p className="text-muted-foreground">{d.value} questions ({((d.value / d.total) * 100).toFixed(0)}%)</p>
      </div>
    );
  }
  return null;
};

export function AttemptAnalysis({
  subjects,
  questions,
  totalCorrect,
  totalIncorrect,
  totalSkipped,
  totalQuestions,
  accuracy,
  attemptRate,
}: AttemptAnalysisProps) {
  const pieData = [
    { name: "Correct", value: totalCorrect, total: totalQuestions, color: STATUS_COLORS.correct },
    { name: "Incorrect", value: totalIncorrect, total: totalQuestions, color: STATUS_COLORS.incorrect },
    { name: "Skipped", value: totalSkipped, total: totalQuestions, color: STATUS_COLORS.skipped },
  ].filter(d => d.value > 0);

  const barData = subjects.map(s => ({
    name: s.name.substring(0, 4),
    fullName: s.name,
    Correct: s.correct,
    Incorrect: s.incorrect,
    Skipped: s.unattempted,
  }));

  // Question grid for visual overview
  const getStatusColor = (status: string) => {
    if (status === "correct") return "bg-success/80";
    if (status === "incorrect") return "bg-destructive/80";
    return "bg-muted";
  };

  return (
    <div className="space-y-6">
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 text-center">
          <Target className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold font-display text-primary">{accuracy}%</p>
          <p className="text-xs text-muted-foreground">Accuracy</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 text-center">
          <Zap className="w-6 h-6 text-warning mx-auto mb-2" />
          <p className="text-2xl font-bold font-display text-warning">{attemptRate}%</p>
          <p className="text-xs text-muted-foreground">Attempt Rate</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 text-center">
          <CheckCircle2 className="w-6 h-6 text-success mx-auto mb-2" />
          <p className="text-2xl font-bold font-display text-success">{totalCorrect}</p>
          <p className="text-xs text-muted-foreground">Correct</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 text-center">
          <XCircle className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-2xl font-bold font-display text-destructive">{totalIncorrect}</p>
          <p className="text-xs text-muted-foreground">Incorrect</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
          <h3 className="font-semibold font-display text-lg mb-4">Attempt Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-6 mt-2">
            {pieData.map(d => (
              <div key={d.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }} />
                <span className="text-xs text-muted-foreground">{d.name} ({d.value})</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Subject-wise Stacked Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6">
          <h3 className="font-semibold font-display text-lg mb-4">Subject-wise Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="Correct" stackId="a" fill={STATUS_COLORS.correct} radius={[0, 0, 0, 0]} />
                <Bar dataKey="Incorrect" stackId="a" fill={STATUS_COLORS.incorrect} />
                <Bar dataKey="Skipped" stackId="a" fill={STATUS_COLORS.skipped} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Subject Accuracy Cards */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <h3 className="font-semibold font-display text-lg mb-4">Subject Accuracy</h3>
        <div className="space-y-4">
          {subjects.map((s, i) => (
            <div key={s.name} className="space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="text-sm font-medium">{s.name}</span>
                </div>
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-success">{s.correct}✓</span>
                  <span className="text-destructive">{s.incorrect}✗</span>
                  <span className="text-muted-foreground">{s.unattempted} skip</span>
                  <span className="font-semibold text-primary">{s.accuracy}%</span>
                </div>
              </div>
              <div className="flex h-2 rounded-full overflow-hidden bg-secondary">
                <div className="bg-success transition-all" style={{ width: `${(s.correct / s.totalQuestions) * 100}%` }} />
                <div className="bg-destructive transition-all" style={{ width: `${(s.incorrect / s.totalQuestions) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Question Grid */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6">
        <h3 className="font-semibold font-display text-lg mb-4">Question Map</h3>
        <div className="grid grid-cols-10 sm:grid-cols-15 md:grid-cols-20 gap-1.5">
          {questions.map((q) => (
            <div
              key={q.questionNumber}
              className={cn(
                "w-8 h-8 rounded flex items-center justify-center text-xs font-medium transition-all",
                getStatusColor(q.status),
                q.status === "correct" && "text-success-foreground",
                q.status === "incorrect" && "text-destructive-foreground",
                q.status === "skipped" && "text-muted-foreground"
              )}
              title={`Q${q.questionNumber}: ${q.status} (${q.subject})`}
            >
              {q.questionNumber}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-4 mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-success/80" /><span className="text-xs text-muted-foreground">Correct</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-destructive/80" /><span className="text-xs text-muted-foreground">Incorrect</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded bg-muted" /><span className="text-xs text-muted-foreground">Skipped</span></div>
        </div>
      </motion.div>
    </div>
  );
}
