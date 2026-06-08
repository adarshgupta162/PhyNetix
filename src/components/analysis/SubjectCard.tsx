import { motion } from "framer-motion";
import { Atom, FlaskConical, Calculator, LucideIcon, CheckCircle2, XCircle, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface SubjectCardProps {
  name: string;
  marksObtained: number;
  negativeMarks: number;
  unattempted: number;
  totalQuestions: number;
  timeSpent: string;
  color: string;
  correct?: number;
  incorrect?: number;
  onReviewMistakes?: () => void;
  delay?: number;
}

const iconMap: Record<string, LucideIcon> = {
  Physics: Atom,
  Chemistry: FlaskConical,
  Mathematics: Calculator,
  Maths: Calculator,
  Math: Calculator,
};

export function SubjectCard({
  name,
  marksObtained,
  negativeMarks,
  unattempted,
  totalQuestions,
  timeSpent,
  color,
  correct = 0,
  incorrect = 0,
  onReviewMistakes,
  delay = 0,
}: SubjectCardProps) {
  const Icon = iconMap[name] || Atom;
  const netScore = marksObtained - negativeMarks;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: delay * 0.1 }}
      className="glass-card p-5 space-y-4 hover:border-primary/30 transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center"
            style={{ backgroundColor: `${color}20` }}
          >
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
          <h3 className="font-semibold font-display text-lg">{name}</h3>
        </div>
        <div className={cn(
          "text-lg font-bold",
          netScore >= 0 ? "text-success" : "text-destructive"
        )}>
          {netScore >= 0 ? "+" : ""}{netScore}
        </div>
      </div>

      {/* Question Status Summary */}
      <div className="flex items-center gap-4 text-sm">
        <div className="flex items-center gap-1">
          <CheckCircle2 className="w-4 h-4 text-success" />
          <span className="text-success font-medium">{correct}</span>
        </div>
        <div className="flex items-center gap-1">
          <XCircle className="w-4 h-4 text-destructive" />
          <span className="text-destructive font-medium">{incorrect}</span>
        </div>
        <div className="flex items-center gap-1">
          <MinusCircle className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground font-medium">{unattempted}</span>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-2">
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Marks Obtained</span>
          <span className="text-sm font-semibold text-success">+{marksObtained}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Negative Marks</span>
          <span className="text-sm font-semibold text-destructive">-{negativeMarks}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Total Questions</span>
          <span className="text-sm font-semibold">{totalQuestions}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-muted-foreground">Time Spent</span>
          <span className="text-sm font-semibold">{timeSpent}</span>
        </div>
      </div>

      {/* Action */}
      {incorrect > 0 && (
        <Button
          variant="ghost"
          onClick={onReviewMistakes}
          className="w-full text-primary hover:bg-primary/10 border border-primary/20"
        >
          Review Mistakes ({incorrect})
        </Button>
      )}
    </motion.div>
  );
}
