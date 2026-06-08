import { useMemo } from "react";
import { motion } from "framer-motion";
import { Clock, Zap, AlertTriangle, TrendingUp, Timer } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
  ScatterChart, Scatter, ZAxis,
  AreaChart, Area,
} from "recharts";

interface QuestionTimeData {
  questionNumber: number;
  timeSpent: number;
  status: "correct" | "incorrect" | "skipped";
  subject: string;
  marks: number;
}

interface SubjectTimeData {
  name: string;
  totalTime: number;
  avgTime: number;
  questionsAttempted: number;
  totalQuestions: number;
  color: string;
}

interface TimeAnalysisProps {
  questions: QuestionTimeData[];
  subjects: SubjectTimeData[];
  totalTimeUsed: number;
  totalTimeAllowed: number;
  hasTimeData: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  correct: "hsl(142, 76%, 45%)",
  incorrect: "hsl(0, 84%, 60%)",
  skipped: "hsl(215, 20%, 65%)",
};

export function TimeAnalysis({ questions, subjects, totalTimeUsed, totalTimeAllowed, hasTimeData }: TimeAnalysisProps) {
  // Cumulative time trend - must be before early return
  const cumulativeData = useMemo(() => {
    let cum = 0;
    return questions.map(q => {
      cum += q.timeSpent;
      return { q: q.questionNumber, cumTime: Math.round(cum / 60), timeSpent: q.timeSpent };
    });
  }, [questions]);

  if (!hasTimeData) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 text-center">
        <Clock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-semibold font-display mb-2">Time Data Unavailable</h3>
        <p className="text-muted-foreground">Time tracking wasn't available for this attempt. Future tests will have detailed time analytics.</p>
      </motion.div>
    );
  }

  const timeEfficiency = Math.round((totalTimeUsed / totalTimeAllowed) * 100);
  const avgTimePerQ = questions.filter(q => q.timeSpent > 0).length > 0
    ? Math.round(questions.filter(q => q.timeSpent > 0).reduce((s, q) => s + q.timeSpent, 0) / questions.filter(q => q.timeSpent > 0).length)
    : 0;

  // Quick vs slow analysis
  const attemptedQs = questions.filter(q => q.timeSpent > 0);
  const quickQuestions = attemptedQs.filter(q => q.timeSpent < avgTimePerQ * 0.6);
  const slowQuestions = attemptedQs.filter(q => q.timeSpent > avgTimePerQ * 1.5);
  const quickAccuracy = quickQuestions.length > 0
    ? Math.round((quickQuestions.filter(q => q.status === "correct").length / quickQuestions.length) * 100) : 0;
  const slowAccuracy = slowQuestions.length > 0
    ? Math.round((slowQuestions.filter(q => q.status === "correct").length / slowQuestions.length) * 100) : 0;

  // Per-question time bar chart
  const qTimeData = questions.filter(q => q.timeSpent > 0).map(q => ({
    q: `Q${q.questionNumber}`,
    time: q.timeSpent,
    status: q.status,
    subject: q.subject,
  }));

  // Subject time distribution
  const subjectPieData = subjects.filter(s => s.totalTime > 0).map(s => ({
    name: s.name,
    time: Math.round(s.totalTime / 60),
    avg: s.avgTime,
    color: s.color,
  }));

  // (cumulativeData already computed above early return)

  return (
    <div className="space-y-6">
      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 text-center">
          <Timer className="w-6 h-6 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold font-display">{Math.round(totalTimeUsed / 60)}m</p>
          <p className="text-xs text-muted-foreground">of {Math.round(totalTimeAllowed / 60)}m used</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 text-center">
          <Zap className="w-6 h-6 text-warning mx-auto mb-2" />
          <p className="text-2xl font-bold font-display text-warning">{timeEfficiency}%</p>
          <p className="text-xs text-muted-foreground">Time Used</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 text-center">
          <Clock className="w-6 h-6 text-accent mx-auto mb-2" />
          <p className="text-2xl font-bold font-display">{avgTimePerQ}s</p>
          <p className="text-xs text-muted-foreground">Avg / Question</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 text-center">
          <AlertTriangle className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-2xl font-bold font-display text-destructive">{slowQuestions.length}</p>
          <p className="text-xs text-muted-foreground">Slow Questions</p>
        </motion.div>
      </div>

      {/* Speed vs Accuracy Insight */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-6">
        <h3 className="font-semibold font-display text-lg mb-4 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-primary" /> Speed vs Accuracy
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-4 rounded-xl border border-success/30 bg-success/5">
            <p className="text-sm text-muted-foreground mb-1">Quick Answers (&lt;{Math.round(avgTimePerQ * 0.6)}s)</p>
            <p className="text-3xl font-bold font-display text-success">{quickAccuracy}%</p>
            <p className="text-xs text-muted-foreground mt-1">{quickQuestions.length} questions</p>
          </div>
          <div className="p-4 rounded-xl border border-destructive/30 bg-destructive/5">
            <p className="text-sm text-muted-foreground mb-1">Slow Answers (&gt;{Math.round(avgTimePerQ * 1.5)}s)</p>
            <p className="text-3xl font-bold font-display text-destructive">{slowAccuracy}%</p>
            <p className="text-xs text-muted-foreground mt-1">{slowQuestions.length} questions</p>
          </div>
        </div>
        {quickAccuracy > slowAccuracy + 10 && (
          <p className="text-sm text-muted-foreground mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            💡 <strong>Insight:</strong> You perform better on quick answers. Spending too long may indicate overthinking — trust your first instinct more!
          </p>
        )}
        {slowAccuracy > quickAccuracy + 10 && (
          <p className="text-sm text-muted-foreground mt-4 p-3 rounded-lg bg-primary/5 border border-primary/20">
            💡 <strong>Insight:</strong> Your accuracy improves with more time. Avoid rushing — take the time you need for each question.
          </p>
        )}
      </motion.div>

      {/* Per-Question Time Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="glass-card p-6">
        <h3 className="font-semibold font-display text-lg mb-4">Time Per Question</h3>
        <div className="h-64 overflow-x-auto">
          <div style={{ minWidth: Math.max(600, qTimeData.length * 25) }}>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={qTimeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="q" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} interval={Math.floor(qTimeData.length / 15)} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} label={{ value: "seconds", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="time" radius={[2, 2, 0, 0]}>
                  {qTimeData.map((entry, i) => (
                    <Cell key={i} fill={STATUS_COLORS[entry.status]} opacity={0.8} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/50">
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.correct }} /><span className="text-xs text-muted-foreground">Correct</span></div>
          <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ backgroundColor: STATUS_COLORS.incorrect }} /><span className="text-xs text-muted-foreground">Incorrect</span></div>
          <div className="h-px flex-1 bg-border/50" />
          <span className="text-xs text-muted-foreground">Avg: {avgTimePerQ}s</span>
        </div>
      </motion.div>

      {/* Cumulative Time Trend */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-6">
        <h3 className="font-semibold font-display text-lg mb-4">Time Consumption Trend</h3>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis dataKey="q" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} label={{ value: "Question", position: "bottom", fill: "hsl(var(--muted-foreground))" }} />
              <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} label={{ value: "Minutes", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <Area type="monotone" dataKey="cumTime" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.1} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Subject Time Allocation */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6">
        <h3 className="font-semibold font-display text-lg mb-4">Time Allocation by Subject</h3>
        <div className="space-y-4">
          {subjects.filter(s => s.totalTime > 0).map(s => {
            const pct = Math.round((s.totalTime / totalTimeUsed) * 100) || 0;
            return (
              <div key={s.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span>{Math.round(s.totalTime / 60)}m total</span>
                    <span>{s.avgTime}s avg</span>
                    <span className="font-semibold text-foreground">{pct}%</span>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, backgroundColor: s.color }} />
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
