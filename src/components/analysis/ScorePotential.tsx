import { motion } from "framer-motion";
import { TrendingUp, Target, Lightbulb, ArrowUp, Shield, Zap } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine,
} from "recharts";

interface ScorePotentialProps {
  currentScore: number;
  totalMarks: number;
  positiveScore: number;
  negativeScore: number;
  totalCorrect: number;
  totalIncorrect: number;
  totalSkipped: number;
  subjectPotentials: {
    name: string;
    color: string;
    currentScore: number;
    maxPossible: number;
    marksLostToNeg: number;
    marksLostToSkip: number;
    easySkipped: number;
    easySkippedMarks: number;
  }[];
}

export function ScorePotential({
  currentScore,
  totalMarks,
  positiveScore,
  negativeScore,
  totalCorrect,
  totalIncorrect,
  totalSkipped,
  subjectPotentials,
}: ScorePotentialProps) {
  // Scenario calculations
  const noNegativeScore = positiveScore; // If zero negative marks
  const perfectEasyScore = currentScore + subjectPotentials.reduce((s, p) => s + p.easySkippedMarks, 0);
  const noMistakeScore = currentScore + negativeScore; // Eliminate negatives from wrong answers
  const idealScore = totalMarks; // Max possible

  const scenarios = [
    {
      label: "Current Score",
      score: currentScore,
      color: "hsl(var(--primary))",
      icon: <Target className="w-5 h-5" />,
      description: "Your actual score",
    },
    {
      label: "No Wrong Answers",
      score: noMistakeScore,
      color: "hsl(142, 76%, 45%)",
      icon: <Shield className="w-5 h-5" />,
      description: `+${negativeScore} if you avoided ${totalIncorrect} wrong answers`,
    },
    {
      label: "Easy Q's Attempted",
      score: Math.min(perfectEasyScore, totalMarks),
      color: "hsl(45, 93%, 50%)",
      icon: <Lightbulb className="w-5 h-5" />,
      description: `+${subjectPotentials.reduce((s, p) => s + p.easySkippedMarks, 0)} from skipped easy questions`,
    },
    {
      label: "Maximum Possible",
      score: totalMarks,
      color: "hsl(0, 84%, 60%)",
      icon: <Zap className="w-5 h-5" />,
      description: `Full marks: ${totalMarks}`,
    },
  ];

  const chartData = scenarios.map(s => ({
    name: s.label,
    score: s.score,
    color: s.color,
  }));

  const improvementPotential = noMistakeScore - currentScore;
  const percentageRealized = totalMarks > 0 ? Math.round((currentScore / totalMarks) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Score Realized */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold font-display text-lg flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-primary" /> Score Realization
          </h3>
          <span className="text-3xl font-bold font-display text-primary">{percentageRealized}%</span>
        </div>
        <Progress value={percentageRealized} className="h-3 mb-4" />
        <div className="grid grid-cols-3 gap-4 text-center">
          <div className="p-3 rounded-lg bg-success/10 border border-success/20">
            <p className="text-xl font-bold text-success">+{positiveScore}</p>
            <p className="text-xs text-muted-foreground">Marks Gained</p>
          </div>
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-xl font-bold text-destructive">-{negativeScore}</p>
            <p className="text-xs text-muted-foreground">Marks Lost</p>
          </div>
          <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
            <p className="text-xl font-bold text-primary">{currentScore}</p>
            <p className="text-xs text-muted-foreground">Net Score</p>
          </div>
        </div>
      </motion.div>

      {/* What-If Scenarios */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-6">
        <h3 className="font-semibold font-display text-lg mb-4">"What If" Scenarios</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
              <XAxis type="number" domain={[0, totalMarks]} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} width={120} />
              <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8 }} />
              <ReferenceLine x={currentScore} stroke="hsl(var(--primary))" strokeDasharray="3 3" label={{ value: "You", fill: "hsl(var(--primary))", fontSize: 11 }} />
              <Bar dataKey="score" radius={[0, 4, 4, 0]}>
                {chartData.map((entry, i) => (
                  <Cell key={i} fill={entry.color} opacity={i === 0 ? 1 : 0.6} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </motion.div>

      {/* Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {scenarios.slice(1).map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 + i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-lg" style={{ backgroundColor: `${s.color}20` }}>
                <span style={{ color: s.color }}>{s.icon}</span>
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm">{s.label}</h4>
                <p className="text-xs text-muted-foreground mt-1">{s.description}</p>
                <div className="flex items-center gap-2 mt-3">
                  <span className="text-2xl font-bold font-display" style={{ color: s.color }}>{s.score}</span>
                  <ArrowUp className="w-4 h-4" style={{ color: s.color }} />
                  <span className="text-sm font-medium" style={{ color: s.color }}>
                    +{s.score - currentScore}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Subject-wise Potential */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card p-6">
        <h3 className="font-semibold font-display text-lg mb-4">Subject-wise Score Potential</h3>
        <div className="space-y-5">
          {subjectPotentials.map(s => {
            const potential = s.currentScore + s.marksLostToNeg + s.marksLostToSkip;
            const realized = s.maxPossible > 0 ? Math.round((s.currentScore / s.maxPossible) * 100) : 0;
            return (
              <div key={s.name} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="text-sm font-medium">{s.name}</span>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    <span>Score: <strong>{s.currentScore}</strong>/{s.maxPossible}</span>
                    <span className="text-destructive">-{s.marksLostToNeg} neg</span>
                    {s.easySkipped > 0 && (
                      <span className="text-warning">{s.easySkipped} easy skipped</span>
                    )}
                  </div>
                </div>
                <div className="relative h-3 rounded-full bg-secondary overflow-hidden">
                  <div className="absolute h-full rounded-full bg-primary/80 transition-all" style={{ width: `${realized}%` }} />
                  <div
                    className="absolute h-full bg-warning/40 transition-all"
                    style={{ left: `${realized}%`, width: `${Math.min(100 - realized, (s.marksLostToNeg / s.maxPossible) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-primary/80" /> Realized</div>
                  <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning/40" /> Lost to negatives</div>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Actionable Tips */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="glass-card p-6">
        <h3 className="font-semibold font-display text-lg mb-3 flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-warning" /> Improvement Plan
        </h3>
        <div className="space-y-3">
          {negativeScore > 0 && (
            <div className="p-3 rounded-lg bg-destructive/5 border border-destructive/20 text-sm">
              🎯 <strong>Reduce guessing:</strong> You lost {negativeScore} marks to wrong answers. If unsure, leave questions unattempted to save marks.
            </div>
          )}
          {subjectPotentials.some(s => s.easySkipped > 0) && (
            <div className="p-3 rounded-lg bg-warning/5 border border-warning/20 text-sm">
              ⏱️ <strong>Don't skip easy questions:</strong> You left {subjectPotentials.reduce((s, p) => s + p.easySkippedMarks, 0)} marks from easy questions unattempted.
            </div>
          )}
          {improvementPotential > 20 && (
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 text-sm">
              📈 <strong>Quick win:</strong> Eliminating wrong answers alone could boost your score by +{improvementPotential} marks!
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
