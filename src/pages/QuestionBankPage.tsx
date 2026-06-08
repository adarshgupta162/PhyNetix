import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  Layers,
  FileQuestion,
  ChevronRight,
  Bookmark,
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  Filter,
} from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
}

interface Chapter {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
}

interface Question {
  id: string;
  course_id: string;
  chapter_id: string;
  qno: number;
  type: "mcq_single" | "mcq_multi" | "integer" | "numeric";
  options: string[] | null;
  correct: string | string[] | number;
  difficulty: "easy" | "medium" | "hard";
  marks: { positive: number; negative: number };
  pdf_page: number | null;
}

interface Bookmark {
  question_id: string;
}

interface Attempt {
  question_id: string;
  is_correct: boolean;
}

const difficultyColors = {
  easy: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  hard: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function QuestionBankPage() {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [attempts, setAttempts] = useState<Map<string, boolean>>(new Map());
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<string>("all");
  const [loading, setLoading] = useState(true);

  // Attempt dialog
  const [attemptDialog, setAttemptDialog] = useState<Question | null>(null);
  const [userAnswer, setUserAnswer] = useState<string | string[]>("");
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  useEffect(() => {
    fetchCourses();
    if (user) {
      fetchBookmarks();
      fetchAttempts();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters(selectedCourse.id);
    } else {
      setChapters([]);
      setSelectedChapter(null);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedChapter) {
      fetchQuestions(selectedChapter.id);
    } else {
      setQuestions([]);
    }
  }, [selectedChapter]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("qb_courses")
      .select("*")
      .order("title");
    if (!error) {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const fetchChapters = async (courseId: string) => {
    const { data, error } = await supabase
      .from("qb_chapters")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");
    if (!error) {
      setChapters(data || []);
    }
  };

  const fetchQuestions = async (chapterId: string) => {
    const { data, error } = await supabase
      .from("qb_questions")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("qno");
    if (!error && data) {
      setQuestions(data.map((q) => ({
        ...q,
        type: q.type as Question["type"],
        difficulty: q.difficulty as Question["difficulty"],
        options: q.options as string[] | null,
        correct: q.correct as string | string[] | number,
        marks: q.marks as { positive: number; negative: number },
      })));
    }
  };

  const fetchBookmarks = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("qb_bookmarks")
      .select("question_id")
      .eq("user_id", user.id);
    if (data) {
      setBookmarks(new Set(data.map((b) => b.question_id)));
    }
  };

  const fetchAttempts = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("qb_attempts")
      .select("question_id, is_correct")
      .eq("user_id", user.id);
    if (data) {
      const attemptsMap = new Map<string, boolean>();
      data.forEach((a) => attemptsMap.set(a.question_id, a.is_correct));
      setAttempts(attemptsMap);
    }
  };

  const toggleBookmark = async (questionId: string) => {
    if (!user) {
      toast.error("Please login to bookmark questions");
      return;
    }

    if (bookmarks.has(questionId)) {
      await supabase
        .from("qb_bookmarks")
        .delete()
        .eq("user_id", user.id)
        .eq("question_id", questionId);
      setBookmarks((prev) => {
        const newSet = new Set(prev);
        newSet.delete(questionId);
        return newSet;
      });
      toast.success("Bookmark removed");
    } else {
      await supabase.from("qb_bookmarks").insert({
        user_id: user.id,
        question_id: questionId,
      });
      setBookmarks((prev) => new Set(prev).add(questionId));
      toast.success("Question bookmarked");
    }
  };

  const openAttemptDialog = (question: Question) => {
    setAttemptDialog(question);
    setUserAnswer(question.type === "mcq_multi" ? [] : "");
    setShowResult(false);
  };

  const submitAnswer = async () => {
    if (!attemptDialog || !user) return;

    let correct = false;
    const questionCorrect = attemptDialog.correct;

    if (attemptDialog.type === "mcq_single") {
      correct = userAnswer === questionCorrect;
    } else if (attemptDialog.type === "mcq_multi") {
      const userArr = Array.isArray(userAnswer) ? userAnswer.sort() : [];
      const correctArr = Array.isArray(questionCorrect)
        ? [...questionCorrect].sort()
        : [];
      correct =
        userArr.length === correctArr.length &&
        userArr.every((v, i) => v === correctArr[i]);
    } else {
      correct =
        parseFloat(userAnswer as string) === parseFloat(String(questionCorrect));
    }

    setIsCorrect(correct);
    setShowResult(true);

    // Save attempt
    const marksObtained = correct
      ? attemptDialog.marks.positive
      : -attemptDialog.marks.negative;

    await supabase.from("qb_attempts").insert({
      user_id: user.id,
      question_id: attemptDialog.id,
      answer: userAnswer,
      is_correct: correct,
      marks_obtained: marksObtained,
    });

    setAttempts((prev) => new Map(prev).set(attemptDialog.id, correct));
  };

  const filteredQuestions =
    difficultyFilter === "all"
      ? questions
      : questions.filter((q) => q.difficulty === difficultyFilter);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display gradient-text">Question Bank</h1>
          <p className="text-muted-foreground mt-1">
            Practice questions by subject and difficulty
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Courses Column */}
          <div className="lg:col-span-3 bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Courses</h2>
            </div>

            <div className="space-y-2">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedCourse?.id === course.id
                      ? "bg-primary/10 border-primary/30"
                      : "bg-secondary/30 border-border hover:bg-secondary/50"
                  )}
                  onClick={() => setSelectedCourse(course)}
                >
                  <span className="font-medium">{course.title}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Chapters Column */}
          <div className="lg:col-span-3 bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Layers className="w-5 h-5 text-primary" />
              <h2 className="font-semibold">Chapters</h2>
            </div>

            {!selectedCourse ? (
              <div className="text-center py-8 text-muted-foreground">
                <ChevronRight className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Select a course</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                {chapters.map((chapter) => (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedChapter?.id === chapter.id
                        ? "bg-primary/10 border-primary/30"
                        : "bg-secondary/30 border-border hover:bg-secondary/50"
                    )}
                    onClick={() => setSelectedChapter(chapter)}
                  >
                    <span className="font-medium text-sm">{chapter.title}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Questions Column */}
          <div className="lg:col-span-6 bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Questions</h2>
              </div>
              {selectedChapter && (
                <Select value={difficultyFilter} onValueChange={setDifficultyFilter}>
                  <SelectTrigger className="w-32">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>

            {!selectedChapter ? (
              <div className="text-center py-12 text-muted-foreground">
                <ChevronRight className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Select a chapter to view questions</p>
              </div>
            ) : filteredQuestions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <FileQuestion className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>No questions available</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[calc(100vh-300px)] overflow-y-auto">
                {filteredQuestions.map((question) => {
                  const attempted = attempts.has(question.id);
                  const wasCorrect = attempts.get(question.id);
                  const isBookmarked = bookmarks.has(question.id);

                  return (
                    <motion.div
                      key={question.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg border bg-secondary/30 border-border"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-mono text-lg font-bold text-primary">
                            Q{question.qno}
                          </span>
                          <Badge
                            variant="outline"
                            className={difficultyColors[question.difficulty]}
                          >
                            {question.difficulty}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {question.type.replace("_", " ")}
                          </Badge>
                          {attempted && (
                            <Badge
                              variant="outline"
                              className={
                                wasCorrect
                                  ? "bg-green-500/10 text-green-500"
                                  : "bg-red-500/10 text-red-500"
                              }
                            >
                              {wasCorrect ? (
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                              ) : (
                                <XCircle className="w-3 h-3 mr-1" />
                              )}
                              {wasCorrect ? "Correct" : "Wrong"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => toggleBookmark(question.id)}
                          >
                            {isBookmarked ? (
                              <BookmarkCheck className="w-5 h-5 text-primary" />
                            ) : (
                              <Bookmark className="w-5 h-5" />
                            )}
                          </Button>
                          <Button size="sm" onClick={() => openAttemptDialog(question)}>
                            Attempt
                          </Button>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <span>+{question.marks.positive}/-{question.marks.negative} marks</span>
                        {question.pdf_page && <span>Page {question.pdf_page}</span>}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Attempt Dialog */}
      <Dialog open={!!attemptDialog} onOpenChange={() => setAttemptDialog(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              Question {attemptDialog?.qno} - {attemptDialog?.difficulty}
            </DialogTitle>
          </DialogHeader>

          {!showResult ? (
            <div className="space-y-4">
              <p className="text-muted-foreground">
                Select your answer for this{" "}
                {attemptDialog?.type.replace("_", " ")} question.
              </p>

              {attemptDialog?.type === "mcq_single" && (
                <div className="grid grid-cols-2 gap-3">
                  {["A", "B", "C", "D"].map((opt) => (
                    <Button
                      key={opt}
                      variant={userAnswer === opt ? "default" : "outline"}
                      className="h-12 text-lg"
                      onClick={() => setUserAnswer(opt)}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              )}

              {attemptDialog?.type === "mcq_multi" && (
                <div className="grid grid-cols-2 gap-3">
                  {["A", "B", "C", "D"].map((opt) => {
                    const selected = Array.isArray(userAnswer)
                      ? userAnswer.includes(opt)
                      : false;
                    return (
                      <Button
                        key={opt}
                        variant={selected ? "default" : "outline"}
                        className="h-12 text-lg"
                        onClick={() => {
                          const current = Array.isArray(userAnswer) ? userAnswer : [];
                          setUserAnswer(
                            selected
                              ? current.filter((c) => c !== opt)
                              : [...current, opt]
                          );
                        }}
                      >
                        {opt}
                      </Button>
                    );
                  })}
                </div>
              )}

              {(attemptDialog?.type === "integer" ||
                attemptDialog?.type === "numeric") && (
                <Input
                  type="number"
                  value={userAnswer as string}
                  onChange={(e) => setUserAnswer(e.target.value)}
                  placeholder="Enter your answer"
                  className="text-center text-lg h-12"
                />
              )}

              <DialogFooter>
                <Button variant="outline" onClick={() => setAttemptDialog(null)}>
                  Cancel
                </Button>
                <Button
                  onClick={submitAnswer}
                  disabled={
                    attemptDialog?.type === "mcq_multi"
                      ? (userAnswer as string[]).length === 0
                      : !userAnswer
                  }
                >
                  Submit
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <div className="text-center py-6">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
                  <h3 className="text-2xl font-bold text-green-500 mb-2">Correct!</h3>
                  <p className="text-muted-foreground">
                    +{attemptDialog?.marks.positive} marks
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-16 h-16 mx-auto text-red-500 mb-4" />
                  <h3 className="text-2xl font-bold text-red-500 mb-2">Incorrect</h3>
                  <p className="text-muted-foreground mb-4">
                    -{attemptDialog?.marks.negative} marks
                  </p>
                  <p className="text-sm">
                    Correct answer:{" "}
                    <span className="font-bold text-primary">
                      {Array.isArray(attemptDialog?.correct)
                        ? attemptDialog?.correct.join(", ")
                        : attemptDialog?.correct}
                    </span>
                  </p>
                </>
              )}
              <DialogFooter className="mt-6">
                <Button onClick={() => setAttemptDialog(null)}>Close</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
