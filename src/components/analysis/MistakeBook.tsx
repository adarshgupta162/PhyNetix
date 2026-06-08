import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BookX, Filter, CheckCircle2, XCircle, Bookmark, BookmarkCheck, ChevronDown, ChevronUp, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { LatexRenderer } from "@/components/ui/latex-renderer";

interface MistakeQuestion {
  questionNumber: number;
  questionId: string;
  questionText?: string;
  imageUrl?: string;
  imageUrls?: string[];
  subject: string;
  difficulty?: string;
  marks: number;
  negativeMarks: number;
  userAnswer: string;
  correctAnswer: string;
  status: "incorrect" | "skipped";
  timeSpent: number;
  sectionType?: string;
  solutionText?: string;
  solutionImageUrl?: string;
  solutionImageUrls?: string[];
  isBookmarked: boolean;
}

interface MistakeBookProps {
  mistakes: MistakeQuestion[];
  onBookmark: (questionId: string) => void;
  onViewSolution: (questionNumber: number) => void;
}

type FilterType = "all" | "incorrect" | "skipped";
type SubjectFilter = "all" | string;
type DifficultyFilter = "all" | "easy" | "medium" | "hard";

export function MistakeBook({ mistakes, onBookmark, onViewSolution }: MistakeBookProps) {
  const [filterType, setFilterType] = useState<FilterType>("all");
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>("all");
  const [difficultyFilter, setDifficultyFilter] = useState<DifficultyFilter>("all");
  const [expandedQ, setExpandedQ] = useState<number | null>(null);
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false);

  const subjects = useMemo(() => [...new Set(mistakes.map(m => m.subject))], [mistakes]);

  const filtered = useMemo(() => {
    return mistakes.filter(m => {
      if (filterType !== "all" && m.status !== filterType) return false;
      if (subjectFilter !== "all" && m.subject !== subjectFilter) return false;
      if (difficultyFilter !== "all" && m.difficulty !== difficultyFilter) return false;
      if (showBookmarkedOnly && !m.isBookmarked) return false;
      return true;
    });
  }, [mistakes, filterType, subjectFilter, difficultyFilter, showBookmarkedOnly]);

  const incorrectCount = mistakes.filter(m => m.status === "incorrect").length;
  const skippedCount = mistakes.filter(m => m.status === "skipped").length;
  const totalMarksLost = mistakes.filter(m => m.status === "incorrect").reduce((s, m) => s + m.negativeMarks + m.marks, 0);
  const totalMarksSkipped = mistakes.filter(m => m.status === "skipped").reduce((s, m) => s + m.marks, 0);

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-4 text-center">
          <BookX className="w-6 h-6 text-destructive mx-auto mb-2" />
          <p className="text-2xl font-bold font-display text-destructive">{incorrectCount}</p>
          <p className="text-xs text-muted-foreground">Wrong Answers</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="glass-card p-4 text-center">
          <XCircle className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
          <p className="text-2xl font-bold font-display text-muted-foreground">{skippedCount}</p>
          <p className="text-xs text-muted-foreground">Skipped</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-4 text-center">
          <p className="text-2xl font-bold font-display text-destructive">{totalMarksLost}</p>
          <p className="text-xs text-muted-foreground">Marks Lost (Wrong)</p>
        </motion.div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="glass-card p-4 text-center">
          <p className="text-2xl font-bold font-display text-warning">{totalMarksSkipped}</p>
          <p className="text-xs text-muted-foreground">Marks Missed (Skip)</p>
        </motion.div>
      </div>

      {/* Filters */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-4">
        <div className="flex flex-wrap items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          {/* Status filter */}
          {(["all", "incorrect", "skipped"] as FilterType[]).map(f => (
            <Button key={f} size="sm" variant={filterType === f ? "default" : "outline"} onClick={() => setFilterType(f)} className="text-xs h-7 capitalize">
              {f === "all" ? "All" : f}
            </Button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          {/* Subject filter */}
          <Button size="sm" variant={subjectFilter === "all" ? "default" : "outline"} onClick={() => setSubjectFilter("all")} className="text-xs h-7">
            All Subjects
          </Button>
          {subjects.map(s => (
            <Button key={s} size="sm" variant={subjectFilter === s ? "default" : "outline"} onClick={() => setSubjectFilter(s)} className="text-xs h-7">
              {s}
            </Button>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          {/* Difficulty */}
          {(["all", "easy", "medium", "hard"] as DifficultyFilter[]).map(d => (
            <Button key={d} size="sm" variant={difficultyFilter === d ? "default" : "outline"} onClick={() => setDifficultyFilter(d)} className="text-xs h-7 capitalize">
              {d === "all" ? "All Diff." : d}
            </Button>
          ))}
          <div className="flex-1" />
          <Button size="sm" variant={showBookmarkedOnly ? "default" : "outline"} onClick={() => setShowBookmarkedOnly(!showBookmarkedOnly)} className="text-xs h-7">
            <Bookmark className="w-3 h-3 mr-1" /> Bookmarked
          </Button>
        </div>
      </motion.div>

      {/* Question List */}
      <div className="space-y-3">
        <AnimatePresence mode="popLayout">
          {filtered.length === 0 ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-success mx-auto mb-3" />
              <p className="text-muted-foreground">
                {showBookmarkedOnly ? "No bookmarked mistakes." : "No mistakes match your filters. Great job! 🎉"}
              </p>
            </motion.div>
          ) : (
            filtered.map((q, i) => (
              <motion.div
                key={q.questionNumber}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="glass-card overflow-hidden"
              >
                {/* Collapsed Header */}
                <div
                  className="flex items-center gap-3 p-4 cursor-pointer hover:bg-secondary/30 transition-colors"
                  onClick={() => setExpandedQ(expandedQ === q.questionNumber ? null : q.questionNumber)}
                >
                  <div className={cn(
                    "w-9 h-9 rounded-lg flex items-center justify-center text-sm font-semibold flex-shrink-0",
                    q.status === "incorrect" ? "bg-destructive/20 text-destructive" : "bg-muted text-muted-foreground"
                  )}>
                    {q.questionNumber}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">{q.subject}</span>
                      {q.difficulty && (
                        <Badge variant="outline" className={cn("text-xs capitalize",
                          q.difficulty === "easy" ? "text-success border-success/30" :
                          q.difficulty === "medium" ? "text-warning border-warning/30" :
                          "text-destructive border-destructive/30"
                        )}>
                          {q.difficulty}
                        </Badge>
                      )}
                      <Badge variant="outline" className={cn("text-xs",
                        q.status === "incorrect" ? "text-destructive border-destructive/30" : "text-muted-foreground border-border"
                      )}>
                        {q.status === "incorrect" ? `Wrong (-${q.negativeMarks})` : `Skipped (+${q.marks})`}
                      </Badge>
                    </div>
                    {q.questionText && (
                      <p className="text-xs text-muted-foreground mt-1 truncate">{q.questionText.substring(0, 80)}...</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={e => { e.stopPropagation(); onBookmark(q.questionId); }}>
                      {q.isBookmarked ? <BookmarkCheck className="w-4 h-4 text-warning fill-current" /> : <Bookmark className="w-4 h-4 text-muted-foreground" />}
                    </Button>
                    {expandedQ === q.questionNumber ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                  </div>
                </div>

                {/* Expanded Content */}
                <AnimatePresence>
                  {expandedQ === q.questionNumber && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-4 pb-4 space-y-3 border-t border-border/30 pt-3">
                        {(() => {
                          const imgs = q.imageUrls?.length ? q.imageUrls : q.imageUrl ? [q.imageUrl] : [];
                          return imgs.map((url, idx) => (
                            <img key={idx} src={url} alt={`Q${q.questionNumber} img ${idx+1}`} className="max-h-48 object-contain rounded-lg bg-secondary/20" />
                          ));
                        })()}
                        {q.questionText && (
                          <div className="text-sm"><LatexRenderer content={q.questionText} /></div>
                        )}
                        <div className="flex flex-wrap gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Your Answer: </span>
                            <span className={cn("font-semibold", q.status === "incorrect" ? "text-destructive" : "text-muted-foreground")}>
                              {q.userAnswer || "—"}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Correct: </span>
                            <span className="font-semibold text-success">{q.correctAnswer}</span>
                          </div>
                          {q.timeSpent > 0 && (
                            <div>
                              <span className="text-muted-foreground">Time: </span>
                              <span className="font-semibold">{q.timeSpent}s</span>
                            </div>
                          )}
                        </div>
                        {(q.solutionText || q.solutionImageUrl || q.solutionImageUrls?.length) && (
                          <div className="p-3 rounded-lg bg-secondary/30 border border-border/50">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Solution:</p>
                            {(() => {
                              const imgs = q.solutionImageUrls?.length ? q.solutionImageUrls : q.solutionImageUrl ? [q.solutionImageUrl] : [];
                              return imgs.map((url, idx) => (
                                <img key={idx} src={url} alt={`Solution ${idx+1}`} className="max-h-40 object-contain rounded mb-2" />
                              ));
                            })()}
                            {q.solutionText && <div className="text-sm"><LatexRenderer content={q.solutionText} /></div>}
                          </div>
                        )}
                        <Button size="sm" variant="outline" onClick={() => onViewSolution(q.questionNumber)} className="text-xs">
                          <Eye className="w-3 h-3 mr-1" /> View Full Solution
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>

      {/* Stats Footer */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-center text-xs text-muted-foreground">
        Showing {filtered.length} of {mistakes.length} mistakes
      </motion.div>
    </div>
  );
}
