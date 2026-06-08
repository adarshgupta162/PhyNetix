import { motion } from "framer-motion";
import { Trophy, TrendingUp, Users, Medal, Target, Award } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface RankCompareProps {
  rank: number;
  totalStudents: number;
  percentile: number;
  score: number;
  topperScore: number;
  averageScore: number;
  totalMarks: number;
  subjectRanks: { name: string; rank: number; total: number; percentile: number }[];
  scoreDistribution: { range: string; count: number; isUser: boolean }[];
}

export function RankCompare({
  rank,
  totalStudents,
  percentile,
  score,
  topperScore,
  averageScore,
  totalMarks,
  subjectRanks,
  scoreDistribution,
}: RankCompareProps) {
  const scoreGap = topperScore - score;
  const aboveAverage = score - averageScore;

  return (
    <div className="space-y-6">
      {/* Main Rank Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Rank */}
          <div className="text-center space-y-2">
            <Trophy className="w-12 h-12 text-warning mx-auto" />
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Your Rank</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold font-display text-warning">{rank}</span>
              <span className="text-xl text-muted-foreground">/ {totalStudents.toLocaleString()}</span>
            </div>
          </div>

          {/* Percentile */}
          <div className="text-center space-y-2">
            <TrendingUp className="w-12 h-12 text-primary mx-auto" />
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Percentile</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold font-display text-primary">{percentile.toFixed(1)}</span>
              <span className="text-xl text-muted-foreground">%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              Better than {percentile.toFixed(1)}% of students
            </p>
          </div>

          {/* Score Comparison */}
          <div className="text-center space-y-2">
            <Target className="w-12 h-12 text-success mx-auto" />
            <p className="text-sm text-muted-foreground uppercase tracking-wide">Your Score</p>
            <div className="flex items-baseline justify-center gap-1">
              <span className="text-5xl font-bold font-display text-success">{score}</span>
              <span className="text-xl text-muted-foreground">/ {totalMarks}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Score Comparison Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <Medal className="w-6 h-6 text-warning" />
            <h3 className="font-semibold">Topper Comparison</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Topper's Score</span>
              <span className="font-semibold text-warning">{topperScore}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Score</span>
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Gap to Topper</span>
              <span className="font-semibold text-destructive">-{scoreGap}</span>
            </div>
            <Progress value={(score / topperScore) * 100} className="h-2 mt-2" />
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-5"
        >
          <div className="flex items-center gap-3 mb-4">
            <Users className="w-6 h-6 text-primary" />
            <h3 className="font-semibold">Average Comparison</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Average Score</span>
              <span className="font-semibold">{averageScore}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Your Score</span>
              <span className="font-semibold">{score}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Above/Below Average</span>
              <span className={`font-semibold ${aboveAverage >= 0 ? "text-success" : "text-destructive"}`}>
                {aboveAverage >= 0 ? "+" : ""}{aboveAverage}
              </span>
            </div>
            <Progress value={Math.min((score / (averageScore * 2)) * 100, 100)} className="h-2 mt-2" />
          </div>
        </motion.div>
      </div>

      {/* Score Distribution */}
      {scoreDistribution.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card p-6"
        >
          <h3 className="font-semibold font-display text-lg mb-4">Score Distribution</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={scoreDistribution} margin={{ top: 10, right: 10, left: 10, bottom: 40 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(224, 50%, 18%)" opacity={0.5} />
                <XAxis 
                  dataKey="range" 
                  tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 10 }}
                  angle={-45}
                  textAnchor="end"
                />
                <YAxis tick={{ fill: "hsl(215, 20%, 65%)", fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(224, 50%, 12%)", 
                    border: "1px solid hsl(224, 50%, 20%)",
                    borderRadius: "8px"
                  }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {scoreDistribution.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={entry.isUser ? "hsl(172, 66%, 50%)" : "hsl(217, 91%, 60%)"} 
                      opacity={entry.isUser ? 1 : 0.6}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-center text-muted-foreground mt-2">
            <span className="inline-block w-3 h-3 rounded bg-primary mr-1" /> Your score range is highlighted
          </p>
        </motion.div>
      )}
    </div>
  );
}
