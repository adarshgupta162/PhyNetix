import { motion } from "framer-motion";
import { Brain, Flame, Gauge, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell,
} from "recharts";

interface DifficultyData {
  level: string;
  total: number;
  attempted: number;
  correct: number;
  incorrect: number;
  skipped: number;
  accuracy: number;
  avgTime: number;
  marksGained: number;
  marksLost: number;
}

interface SubjectDifficultyData {
  subject: string;
  color: string;
  easy: { total: number; correct: number; accuracy: number };
  medium: { total: number; correct: number; accuracy: number };
  hard: { total: number; correct: number; accuracy: number };
}

interface DifficultyAnalysisProps {
  difficulties: DifficultyData[];
  subjectDifficulties: SubjectDifficultyData[];
}

const DIFF_COLORS: Record<string, string> = {
  easy: "hsl(142, 76%, 45%)",
  medium: "hsl(45, 93%, 50%)",
  hard: "hsl(0, 84%, 60%)",
};

const DIFF_ICONS: Record<string, React.ReactNode> = {
  easy: <Gauge className="w-5 h-5" />,
  medium: <Brain className="w-5 h-5" />,
  hard: <Flame className="w-5 h-5" />,
};

export function DifficultyAnalysis({ difficulties, subjectDifficulties }: DifficultyAnalysisProps) {
  const radarData = difficulties.map(d => ({
    difficulty: d.level.charAt(0).toUpperCase() + d.level.slice(1),
    accuracy: d.accuracy,
    attemptRate: d.total > 0 ? Math.round((d.attempted / d.total) * 100) : 0,
  }));

  const barData = difficulties.map(d => ({
    name: d.level.charAt(0).toUpperCase() + d.level.slice(1),
    Correct: d.correct,
    Incorrect: d.incorrect,
    Skipped: d.skipped,
  }));

  // Identify weakest difficulty
  const weakest = difficulties.reduce((a, b) => (a.accuracy < b.accuracy && a.total > 0) ? a : b, difficulties[0]);
  const strongest = difficulties.reduce((a, b) => (a.accuracy > b.accuracy && a.total > 0) ? a : b, difficulties[0]);

  return (
    <div className="space-y-6">
      {/* Difficulty Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {difficulties.map((d, i) => (
          <motion.div
            key={d.level}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg" style={{ backgroundColor: `${DIFF_COLORS[d.level]}20` }}>
                  <span style={{ color: DIFF_COLORS[d.level] }}>{DIFF_ICONS[d.level]}</span>
                </div>
                <div>
                  <h4 className="font-semibold capitalize">{d.level}</h4>
                  <p className="text-xs text-muted-foreground">{d.total} questions</p>
                </div>
              </div>
              <span className="text-2xl font-bold font-display" style={{ color: DIFF_COLORS[d.level] }}>
                {d.accuracy}%
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 rounded-lg bg-success/10">
                <p className="font-semibold text-success">{d.correct}</p>
                <p className="text-muted-foreground">Correct</p>
              </div>
              <div className="p-2 rounded-lg bg-destructive/10">
                <p className="font-semibold text-destructive">{d.incorrect}</p>
                <p className="text-muted-foreground">Wrong</p>
              </div>
              <div className="p-2 rounded-lg bg-muted">
                <p className="font-semibold text-muted-foreground">{d.skipped}</p>
                <p className="text-muted-foreground">Skip</p>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground pt-2 border-t border-border/50">
              <span>+{d.marksGained} gained</span>
              <span className="text-destructive">-{d.marksLost} lost</span>
              {d.avgTime > 0 && <span>{d.avgTime}s avg</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Insight */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
        <h3 className="font-semibold font-display text-lg mb-3 flex items-center gap-2">
          <Target className="w-5 h-5 text-primary" /> Key Insights
        </h3>
        <div className="space-y-2">
          {strongest && strongest.accuracy > 0 && (
            <p className="text-sm p-3 rounded-lg bg-success/5 border border-success/20">
              ✅ <strong>Strongest:</strong> {strongest.level.charAt(0).toUpperCase() + strongest.level.slice(1)} questions at {strongest.accuracy}% accuracy. Keep it up!
            </p>
          )}
          {weakest && weakest.total > 0 && weakest !== strongest && (
            <p className="text-sm p-3 rounded-lg bg-destructive/5 border border-destructive/20">
              ⚠️ <strong>Needs Work:</strong> {weakest.level.charAt(0).toUpperCase() + weakest.level.slice(1)} questions at {weakest.accuracy}% accuracy. Focus practice here.
            </p>
          )}
          {difficulties.find(d => d.level === 'easy' && d.skipped > 0) && (
            <p className="text-sm p-3 rounded-lg bg-warning/5 border border-warning/20">
              💡 You skipped {difficulties.find(d => d.level === 'easy')?.skipped} easy questions — these are free marks!
            </p>
          )}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card p-6">
          <h3 className="font-semibold font-display text-lg mb-4">Performance Radar</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="hsl(var(--border))" />
                <PolarAngleAxis dataKey="difficulty" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} />
                <Radar name="Accuracy" dataKey="accuracy" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                <Radar name="Attempt Rate" dataKey="attemptRate" stroke="hsl(45, 93%, 50%)" fill="hsl(45, 93%, 50%)" fillOpacity={0.1} strokeWidth={2} strokeDasharray="5 5" />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Stacked Bar */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card p-6">
          <h3 className="font-semibold font-display text-lg mb-4">Difficulty Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <YAxis tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
                <Bar dataKey="Correct" stackId="a" fill="hsl(142, 76%, 45%)" />
                <Bar dataKey="Incorrect" stackId="a" fill="hsl(0, 84%, 60%)" />
                <Bar dataKey="Skipped" stackId="a" fill="hsl(215, 20%, 65%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      {/* Subject × Difficulty Matrix */}
      {subjectDifficulties.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="glass-card p-6">
          <h3 className="font-semibold font-display text-lg mb-4">Subject × Difficulty Matrix</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border/50">
                  <th className="text-left py-3 px-2 text-muted-foreground font-medium">Subject</th>
                  <th className="text-center py-3 px-2 font-medium" style={{ color: DIFF_COLORS.easy }}>Easy</th>
                  <th className="text-center py-3 px-2 font-medium" style={{ color: DIFF_COLORS.medium }}>Medium</th>
                  <th className="text-center py-3 px-2 font-medium" style={{ color: DIFF_COLORS.hard }}>Hard</th>
                </tr>
              </thead>
              <tbody>
                {subjectDifficulties.map(s => (
                  <tr key={s.subject} className="border-b border-border/30">
                    <td className="py-3 px-2 font-medium flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />
                      {s.subject}
                    </td>
                    {['easy', 'medium', 'hard'].map(level => {
                      const d = s[level as keyof typeof s] as { total: number; correct: number; accuracy: number };
                      return (
                        <td key={level} className="text-center py-3 px-2">
                          {d.total > 0 ? (
                            <span className={cn(
                              "inline-block px-2 py-1 rounded-md text-xs font-semibold",
                              d.accuracy >= 70 ? "bg-success/20 text-success" :
                              d.accuracy >= 40 ? "bg-warning/20 text-warning" :
                              "bg-destructive/20 text-destructive"
                            )}>
                              {d.correct}/{d.total} ({d.accuracy}%)
                            </span>
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}
    </div>
  );
}
