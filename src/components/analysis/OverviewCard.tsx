import { motion } from "framer-motion";
import { CheckCircle2, Clock, Trophy, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface SubjectScore {
  name: string;
  score: number;
  total: number;
  color: string;
}

interface OverviewCardProps {
  score: number;
  totalMarks: number;
  timeUsed: string;
  totalTime: string;
  timeProgress: number;
  accuracy: number;
  rank?: number;
  totalStudents?: number;
  subjects: SubjectScore[];
  onViewSolutions?: () => void;
}

export function OverviewCard({
  score,
  totalMarks,
  timeUsed,
  totalTime,
  timeProgress,
  accuracy,
  rank,
  totalStudents,
  subjects,
  onViewSolutions,
}: OverviewCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Score */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wide">Total Score</p>
          <div className="flex items-baseline gap-1">
            <span className="text-4xl font-bold font-display text-primary">{score}</span>
            <span className="text-xl text-muted-foreground">/{totalMarks}</span>
          </div>
        </div>

        {/* Time Used */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Time Used
          </p>
          <p className="text-lg font-medium">{timeUsed} / {totalTime}</p>
          <Progress value={timeProgress} className="h-2 bg-secondary" />
        </div>

        {/* Accuracy */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            Accuracy
          </p>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-bold font-display text-success">{accuracy}</span>
            <span className="text-xl text-muted-foreground">%</span>
          </div>
        </div>

        {/* Rank */}
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            Your Rank
          </p>
          {rank ? (
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-bold font-display text-warning">{rank}</span>
              {totalStudents && (
                <span className="text-sm text-muted-foreground">/ {totalStudents.toLocaleString()}</span>
              )}
            </div>
          ) : (
            <span className="text-muted-foreground">-</span>
          )}
        </div>
      </div>

      {/* Subject Scores */}
      <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-border/50">
        {subjects.map((subject) => (
          <div key={subject.name} className="flex items-center gap-2">
            <div
              className={cn("w-3 h-3 rounded-full")}
              style={{ backgroundColor: subject.color }}
            />
            <span className="text-sm text-muted-foreground">{subject.name}:</span>
            <span className="text-sm font-semibold">
              {subject.score}/{subject.total}
            </span>
          </div>
        ))}

        <div className="flex-1" />

        <Button
          onClick={onViewSolutions}
          className="bg-primary/10 text-primary hover:bg-primary/20 border border-primary/30 rounded-full px-6"
        >
          View Solutions
        </Button>
      </div>
    </motion.div>
  );
}
