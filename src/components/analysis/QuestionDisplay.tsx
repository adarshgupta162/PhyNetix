import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { CheckCircle2, XCircle, Bookmark, Flag, StickyNote, MinusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LatexRenderer } from "@/components/ui/latex-renderer";

interface OptionData {
  label: string;
  value: string;
  percentage: number;
  studentCount: number;
  isUserAnswer: boolean;
  isCorrect: boolean;
}

interface QuestionDisplayProps {
  questionNumber: number;
  questionText?: string;
  imageUrl?: string;
  imageUrls?: string[];
  marks: number;
  userMarks: number;
  difficulty: "easy" | "medium" | "tough";
  options: OptionData[];
  correctAnswer: string;
  userAnswer: string;
  totalAttempts: number;
  subject: string;
  sectionType?: string;
  status?: "correct" | "incorrect" | "skipped";
  onBookmark?: () => void;
  onReport?: () => void;
  onAddNote?: () => void;
  isBookmarked?: boolean;
}

const difficultyColors: Record<string, string> = {
  easy: "bg-success/20 text-success border-success/30",
  medium: "bg-warning/20 text-warning border-warning/30",
  tough: "bg-destructive/20 text-destructive border-destructive/30",
};

export function QuestionDisplay({
  questionNumber,
  questionText,
  imageUrl,
  imageUrls,
  marks,
  userMarks,
  difficulty,
  options,
  correctAnswer,
  userAnswer,
  totalAttempts,
  subject,
  sectionType = "single_choice",
  status = "skipped",
  onBookmark,
  onReport,
  onAddNote,
  isBookmarked = false,
}: QuestionDisplayProps) {
  const isIntegerType = sectionType === 'integer' || sectionType === 'numerical';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-lg font-semibold font-display">Q{questionNumber}</span>
            <Badge
              variant="outline"
              className={cn(
                "text-xs font-semibold",
                status === "correct" ? "bg-success/20 text-success border-success/30" :
                status === "incorrect" ? "bg-destructive/20 text-destructive border-destructive/30" :
                "bg-secondary text-muted-foreground border-border"
              )}
            >
              {userMarks > 0 ? `+${userMarks}` : userMarks}
            </Badge>
          </div>
          <Badge
            variant="outline"
            className={cn("text-xs uppercase", difficultyColors[difficulty])}
          >
            {difficulty}
          </Badge>
          {/* Status badges inline */}
          <Badge
            variant="outline"
            className={cn(
              "text-xs",
              status === "correct" ? "bg-success/20 text-success border-success/30" :
              status === "incorrect" ? "bg-destructive/20 text-destructive border-destructive/30" :
              "bg-muted text-muted-foreground border-border"
            )}
          >
            {status === "correct" && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {status === "incorrect" && <XCircle className="w-3 h-3 mr-1" />}
            {status === "skipped" && <MinusCircle className="w-3 h-3 mr-1" />}
            {status === "correct" ? "Correct" : status === "incorrect" ? "Wrong" : "Skipped"}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={onAddNote}
            className="text-muted-foreground hover:text-foreground"
          >
            <StickyNote className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onBookmark}
            className={cn(
              "text-muted-foreground hover:text-foreground",
              isBookmarked && "text-warning"
            )}
          >
            <Bookmark className={cn("w-4 h-4", isBookmarked && "fill-current")} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={onReport}
            className="text-muted-foreground hover:text-foreground"
          >
            <Flag className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Question Content */}
      {questionText && (
        <div className="text-foreground leading-relaxed">
          <LatexRenderer content={questionText} />
        </div>
      )}

      {(() => {
        const allImages = imageUrls?.length ? imageUrls : imageUrl ? [imageUrl] : [];
        return allImages.length > 0 && (
          <div className="space-y-2">
            {allImages.map((url, idx) => (
              <img
                key={idx}
                src={url}
                alt={`Question ${questionNumber} image ${idx + 1}`}
                className="max-w-full max-h-64 object-contain rounded-lg bg-secondary/20"
              />
            ))}
          </div>
        );
      })()}

      {/* Options with Stats - Only for MCQ types */}
      {!isIntegerType && options.length > 0 && (
        <div className="space-y-3">
          {options.map((option) => (
            <div
              key={option.label}
              className={cn(
                "relative p-4 rounded-lg border transition-all overflow-hidden",
                option.isCorrect && "border-success/50 bg-success/5",
                option.isUserAnswer && !option.isCorrect && "border-destructive/50 bg-destructive/5",
                !option.isCorrect && !option.isUserAnswer && "border-border bg-secondary/20"
              )}
            >
              {/* Percentage Background */}
              <div
                className={cn(
                  "absolute inset-y-0 left-0 opacity-20",
                  option.isCorrect ? "bg-success" : "bg-muted"
                )}
                style={{ width: `${option.percentage}%` }}
              />

              <div className="relative flex items-center gap-3">
                {/* Option Label */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0",
                    option.isCorrect ? "bg-success text-success-foreground" :
                    option.isUserAnswer ? "bg-destructive text-destructive-foreground" :
                    "bg-secondary text-muted-foreground"
                  )}
                >
                  {option.label}
                </div>

                {/* Option Value */}
                <span className="flex-1 text-sm">
                  <LatexRenderer content={option.value} />
                </span>

                {/* Stats & Badges */}
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap justify-end">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {option.percentage}% ({option.studentCount.toLocaleString()})
                  </span>
                  
                  {option.isUserAnswer && (
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-xs whitespace-nowrap",
                        option.isCorrect ? "bg-success/20 text-success border-success/30" :
                        "bg-destructive/20 text-destructive border-destructive/30"
                      )}
                    >
                      Your Answer
                    </Badge>
                  )}
                  
                  {option.isCorrect && !option.isUserAnswer && (
                    <Badge
                      variant="outline"
                      className="text-xs bg-success/20 text-success border-success/30 whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3 h-3 mr-1" />
                      Correct
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Integer Type Display */}
      {isIntegerType && (
        <div className="p-4 rounded-lg border border-border bg-secondary/20">
          <p className="text-sm text-muted-foreground mb-2">Integer Type Question</p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Your Answer:</span>
              <span className={cn(
                "text-lg font-semibold px-3 py-1 rounded",
                status === "correct" ? "bg-success/20 text-success" : 
                status === "incorrect" ? "bg-destructive/20 text-destructive" :
                "bg-muted text-muted-foreground"
              )}>
                {userAnswer || "Not Attempted"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Correct Answer:</span>
              <span className="text-lg font-semibold px-3 py-1 rounded bg-success/20 text-success">
                {correctAnswer}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Correct Answer:</span>
          <span className="font-semibold text-success">{correctAnswer}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Your Answer:</span>
          <span className={cn(
            "font-semibold",
            status === "correct" ? "text-success" : 
            status === "incorrect" ? "text-destructive" : 
            "text-muted-foreground"
          )}>
            {userAnswer || "Not Attempted"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Total Attempts:</span>
          <span className="font-semibold">{totalAttempts.toLocaleString()}</span>
        </div>
      </div>
    </motion.div>
  );
}
