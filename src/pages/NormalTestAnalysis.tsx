import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import { 
  Trophy, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ChevronLeft,
  ChevronRight,
  ArrowLeft,
  Target,
  TrendingUp,
  AlertCircle,
  Bookmark,
  Download,
  Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { evaluateQuestionScore, formatAnswerDisplay } from "@/lib/testScoring";

interface SubjectScore {
  correct: number;
  incorrect: number;
  skipped: number;
  total: number;
  marks?: number;
  totalMarks?: number;
}

interface QuestionResult {
  question_number?: number;
  question_text?: string | null;
  options?: any;
  image_url?: string | null;
  correct_answer: string | number | string[];
  user_answer: string | number | string[] | null;
  is_correct: boolean;
  marks_obtained: number;
  marks: number;
  negative_marks: number;
  subject: string;
  section_type?: string;
  chapter?: string;
  is_bonus?: boolean;
}

interface Results {
  score: number;
  total_marks: number;
  correct: number;
  incorrect: number;
  skipped: number;
  percentile: number;
  subject_scores: Record<string, SubjectScore>;
  time_taken_seconds: number;
  question_results?: Record<string, QuestionResult>;
  answers?: Record<string, string>;
  rank?: number;
}

interface Question {
  id: string;
  question_text: string;
  options: string[];
  correct_answer: any;
  marks: number;
  negative_marks: number;
  subject: string;
  user_answer?: any;
  is_correct?: boolean;
  marks_obtained?: number;
  section_type?: string;
  question_number?: number;
  image_url?: string | null;
  is_bonus?: boolean;
  question_status?: "correct" | "incorrect" | "skipped";
}

export default function NormalTestAnalysis() {
  const { testId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();

  const [results, setResults] = useState<Results | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState("overview");
  const [activeSubject, setActiveSubject] = useState<string>("all");
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questionFilter, setQuestionFilter] = useState<"all" | "correct" | "incorrect" | "unattempted">("all");
  const [loading, setLoading] = useState(true);
  const [testType, setTestType] = useState<string>("normal");
  const testName = location.state?.testName || "Test Analysis";

  useEffect(() => {
    if (authLoading) return;

    const passedResults = location.state?.results as Results | undefined;
    if (passedResults) {
      const qr = passedResults.question_results;
      if (qr && Object.keys(qr).length > 0) {
        // Recompute every question with the shared evaluator so totals match
        // the SolutionsPage exactly (single source of truth for scoring).
        let totalScore = 0, totalMaxMarks = 0, totalCorrect = 0, totalIncorrect = 0, totalSkipped = 0;
        const subjectScores: Record<string, SubjectScore> = {};

        const questionList: Question[] = Object.entries(qr).map(([id, r]) => {
          const rawOptions = r.options;
          const options = Array.isArray(rawOptions)
            ? rawOptions.map(String)
            : rawOptions
              ? Object.values(rawOptions as any).map(String)
              : [];

          const subject = r.subject || "General";
          const marks = r.marks ?? 4;
          const negativeMarks = r.negative_marks ?? 1;

          const evaluation = evaluateQuestionScore({
            sectionType: r.section_type,
            correctAnswer: r.correct_answer,
            userAnswer: r.user_answer,
            marks,
            negativeMarks,
            isBonus: r.is_bonus,
          });

          totalMaxMarks += marks;
          totalScore += evaluation.marksObtained;
          if (evaluation.status === "skipped") totalSkipped++;
          else if (evaluation.status === "correct") totalCorrect++;
          else totalIncorrect++;

          if (!subjectScores[subject]) {
            subjectScores[subject] = { correct: 0, incorrect: 0, skipped: 0, total: 0, marks: 0, totalMarks: 0 };
          }
          subjectScores[subject].total++;
          subjectScores[subject].totalMarks = (subjectScores[subject].totalMarks || 0) + marks;
          subjectScores[subject].marks = (subjectScores[subject].marks || 0) + evaluation.marksObtained;
          if (evaluation.status === "skipped") subjectScores[subject].skipped++;
          else if (evaluation.status === "correct") subjectScores[subject].correct++;
          else subjectScores[subject].incorrect++;

          return {
            id,
            question_text: String(r.question_text ?? ""),
            options,
            correct_answer: r.correct_answer,
            marks,
            negative_marks: negativeMarks,
            subject,
            user_answer: r.user_answer,
            is_correct: evaluation.status === "correct",
            marks_obtained: evaluation.marksObtained,
            section_type: r.section_type,
            question_number: r.question_number,
            image_url: r.image_url ?? null,
            is_bonus: r.is_bonus,
            question_status: evaluation.status,
          };
        });

        questionList.sort((a, b) => (a.question_number || 0) - (b.question_number || 0));
        setQuestions(questionList);

        setResults({
          ...passedResults,
          score: totalScore,
          total_marks: totalMaxMarks,
          correct: totalCorrect,
          incorrect: totalIncorrect,
          skipped: totalSkipped,
          subject_scores: subjectScores,
        });
      } else {
        setResults(passedResults);
      }

      fetchTestType();
      setLoading(false);
      return;
    }

    if (testId && user) {
      fetchAttemptData();
      return;
    }

    navigate("/tests");
  }, [location.state, testId, user, navigate, authLoading]);

  const fetchTestType = async () => {
    if (!testId) return;
    const { data: test } = await supabase
      .from("tests")
      .select("test_type")
      .eq("id", testId)
      .single();
    
    if (test) {
      setTestType(test.test_type);
    }
  };

  const fetchAttemptData = async () => {
    try {
      // Get test type
      const { data: test } = await supabase
        .from("tests")
        .select("test_type, name")
        .eq("id", testId)
        .single();
      
      if (test) {
        setTestType(test.test_type);
      }

      const { data: attempt, error } = await supabase
        .from("test_attempts")
        .select("*")
        .eq("test_id", testId)
        .eq("user_id", user!.id)
        .order("completed_at", { ascending: false })
        .limit(1)
        .single();

      if (error) throw error;

      if (attempt && attempt.completed_at) {
        const userAnswers = (attempt.answers as Record<string, string>) || {};
        
        // Determine which table to query based on test type
        if (test?.test_type === 'pdf') {
          await fetchPDFTestQuestions(userAnswers, attempt);
        } else {
          await fetchNormalTestQuestions(userAnswers, attempt);
        }
      }
    } catch (error) {
      console.error("Error fetching attempt:", error);
      navigate("/tests");
    }
  };

  const fetchPDFTestQuestions = async (userAnswers: Record<string, string>, attempt: any) => {
    const { data: sectionQuestions } = await supabase
      .from("test_section_questions")
      .select(`
        id,
        question_number,
        is_bonus,
        correct_answer,
        marks,
        negative_marks,
        question_text,
        options,
        image_url,
        test_sections!inner (
          section_type,
          name,
          test_subjects!inner (
            name
          )
        )
      `)
      .eq("test_id", testId)
      .order("question_number");

    if (!sectionQuestions || sectionQuestions.length === 0) {
      setLoading(false);
      return;
    }

    const processedQuestions: Question[] = [];
    const subjectScores: Record<string, SubjectScore> = {};
    let totalCorrect = 0, totalIncorrect = 0, totalSkipped = 0;
    let totalScore = 0, totalMaxMarks = 0;

    for (const sq of sectionQuestions) {
      const section = sq.test_sections as any;
      const subject = section?.test_subjects?.name || "General";
      const sectionType = section?.section_type || "single_choice";
      const userAnswer = userAnswers[sq.id];
      const correctAnswer = sq.correct_answer;
      const marks = sq.marks || 4;
      const negativeMarks = sq.negative_marks ?? 1;
      const isBonus = sq.is_bonus ?? false;

      totalMaxMarks += marks;

      if (!subjectScores[subject]) {
        subjectScores[subject] = { correct: 0, incorrect: 0, skipped: 0, total: 0, marks: 0, totalMarks: 0 };
      }
      subjectScores[subject].total++;
      subjectScores[subject].totalMarks = (subjectScores[subject].totalMarks || 0) + marks;

        const evaluation = evaluateQuestionScore({
          sectionType,
          correctAnswer,
          userAnswer,
          marks,
          negativeMarks,
          isBonus,
        });

        if (evaluation.status === "skipped") {
        totalSkipped++;
        subjectScores[subject].skipped++;
        } else if (evaluation.status === "correct") {
          totalCorrect++;
          subjectScores[subject].correct++;
        } else {
          totalIncorrect++;
          subjectScores[subject].incorrect++;
      }

        totalScore += evaluation.marksObtained;
        const marksObtained = evaluation.marksObtained;
        const isCorrect = evaluation.status === "correct";
        subjectScores[subject].marks = (subjectScores[subject].marks || 0) + marksObtained;

      processedQuestions.push({
        id: sq.id,
        question_text: sq.question_text || "",
        options: Array.isArray(sq.options) ? sq.options.map(String) : [],
        correct_answer: String(correctAnswer),
        marks,
        negative_marks: negativeMarks,
        subject,
        user_answer: userAnswer,
        is_correct: isCorrect,
        marks_obtained: marksObtained,
        section_type: sectionType,
        question_number: sq.question_number,
        is_bonus: isBonus,
        question_status: evaluation.status,
      });
    }

    setQuestions(processedQuestions);
    setResults({
      score: totalScore,
      total_marks: totalMaxMarks,
      correct: totalCorrect,
      incorrect: totalIncorrect,
      skipped: totalSkipped,
      percentile: attempt.percentile ?? 0,
      rank: attempt.rank,
      subject_scores: subjectScores,
      time_taken_seconds: attempt.time_taken_seconds ?? 0,
    });
    setLoading(false);
  };

  const fetchNormalTestQuestions = async (userAnswers: Record<string, string>, attempt: any) => {
    // First, try regular test_questions -> questions
    const { data: testQuestions } = await supabase
      .from("test_questions")
      .select(`
        question_id,
        order_index,
        questions(
          id,
          question_text,
          options,
          correct_answer,
          marks,
          negative_marks,
          question_type,
          image_url,
          chapters(
            name,
            courses(name)
          )
        )
      `)
      .eq("test_id", testId)
      .order("order_index");

    if (testQuestions && testQuestions.length > 0) {
      const processedQuestions: Question[] = [];
      const subjectScores: Record<string, SubjectScore> = {};
      let totalCorrect = 0, totalIncorrect = 0, totalSkipped = 0;
      let totalScore = 0, totalMaxMarks = 0;

      for (const tq of testQuestions) {
        const q = tq.questions as any;
        if (!q) continue;

        const subject = q.chapters?.courses?.name || "General";
        const userAnswer = userAnswers[q.id];
        const correctAnswer = q.correct_answer;
        const marks = q.marks || 4;
        const negativeMarks = q.negative_marks ?? 1;

        totalMaxMarks += marks;

        if (!subjectScores[subject]) {
          subjectScores[subject] = { correct: 0, incorrect: 0, skipped: 0, total: 0, marks: 0, totalMarks: 0 };
        }
        subjectScores[subject].total++;
        subjectScores[subject].totalMarks = (subjectScores[subject].totalMarks || 0) + marks;

        const evaluation = evaluateQuestionScore({
          sectionType: q.question_type,
          correctAnswer,
          userAnswer,
          marks,
          negativeMarks,
        });

        if (evaluation.status === "skipped") {
          totalSkipped++;
          subjectScores[subject].skipped++;
        } else if (evaluation.status === "correct") {
          totalCorrect++;
          subjectScores[subject].correct++;
        } else {
          totalIncorrect++;
          subjectScores[subject].incorrect++;
        }

        totalScore += evaluation.marksObtained;
        const marksObtained = evaluation.marksObtained;
        const isCorrect = evaluation.status === "correct";
        subjectScores[subject].marks = (subjectScores[subject].marks || 0) + marksObtained;

        processedQuestions.push({
          id: q.id,
          question_text: q.question_text || "",
          options: Array.isArray(q.options) ? q.options.map(String) : (q.options ? Object.values(q.options).map(String) : []),
          correct_answer: correctAnswer,
          marks,
          negative_marks: negativeMarks,
          subject,
          user_answer: userAnswer,
          is_correct: isCorrect,
          marks_obtained: marksObtained,
          section_type: q.question_type,
          question_number: tq.order_index ?? undefined,
          image_url: q.image_url ?? null,
          question_status: evaluation.status,
        });
      }

      setQuestions(processedQuestions);
      setResults({
        score: totalScore,
        total_marks: totalMaxMarks,
        correct: totalCorrect,
        incorrect: totalIncorrect,
        skipped: totalSkipped,
        percentile: attempt.percentile ?? 0,
        rank: attempt.rank,
        subject_scores: subjectScores,
        time_taken_seconds: attempt.time_taken_seconds ?? 0,
      });
      setLoading(false);
      return;
    }

    // Fallback: section-based (test_section_questions)
    const { data: sectionQuestions } = await supabase
      .from("test_section_questions")
      .select(`
        id,
        question_number,
        is_bonus,
        correct_answer,
        marks,
        negative_marks,
        question_text,
        options,
        image_url,
        test_sections!inner (
          section_type,
          name,
          test_subjects!inner (name)
        )
      `)
      .eq("test_id", testId)
      .order("question_number");

    if (!sectionQuestions || sectionQuestions.length === 0) {
      setLoading(false);
      return;
    }

    const processedQuestions: Question[] = [];
    const subjectScores: Record<string, SubjectScore> = {};
    let totalCorrect = 0, totalIncorrect = 0, totalSkipped = 0;
    let totalScore = 0, totalMaxMarks = 0;

    for (const sq of sectionQuestions) {
      const section = sq.test_sections as any;
      const subject = section?.test_subjects?.name || "General";
      const sectionType = section?.section_type || "single_choice";
      const userAnswer = userAnswers[sq.id];
      const correctAnswer = sq.correct_answer;
      const marks = sq.marks || 4;
      const negativeMarks = sq.negative_marks ?? 1;
      const isBonus = sq.is_bonus ?? false;

      totalMaxMarks += marks;

      if (!subjectScores[subject]) {
        subjectScores[subject] = { correct: 0, incorrect: 0, skipped: 0, total: 0, marks: 0, totalMarks: 0 };
      }
      subjectScores[subject].total++;
      subjectScores[subject].totalMarks = (subjectScores[subject].totalMarks || 0) + marks;

      const evaluation = evaluateQuestionScore({
        sectionType,
        correctAnswer,
        userAnswer,
        marks,
        negativeMarks,
        isBonus,
      });

      if (evaluation.status === "skipped") {
        totalSkipped++;
        subjectScores[subject].skipped++;
      } else if (evaluation.status === "correct") {
        totalCorrect++;
        subjectScores[subject].correct++;
      } else {
        totalIncorrect++;
        subjectScores[subject].incorrect++;
      }

      totalScore += evaluation.marksObtained;
      const marksObtained = evaluation.marksObtained;
      const isCorrect = evaluation.status === "correct";
      subjectScores[subject].marks = (subjectScores[subject].marks || 0) + marksObtained;

      processedQuestions.push({
        id: sq.id,
        question_text: sq.question_text || "",
        options: Array.isArray(sq.options) ? sq.options.map(String) : [],
        correct_answer: correctAnswer as any,
        marks,
        negative_marks: negativeMarks,
        subject,
        user_answer: userAnswer,
        is_correct: isCorrect,
        marks_obtained: marksObtained,
        section_type: sectionType,
        question_number: sq.question_number,
        image_url: (sq as any).image_url ?? null,
        is_bonus: isBonus,
        question_status: evaluation.status,
      });
    }

    setQuestions(processedQuestions);
    setResults({
      score: totalScore,
      total_marks: totalMaxMarks,
      correct: totalCorrect,
      incorrect: totalIncorrect,
      skipped: totalSkipped,
      percentile: attempt.percentile ?? 0,
      rank: attempt.rank,
      subject_scores: subjectScores,
      time_taken_seconds: attempt.time_taken_seconds ?? 0,
    });
    setLoading(false);
  };

  const filteredQuestions = useMemo(() => {
    let filtered = questions;
    
    if (activeSubject !== "all") {
      filtered = filtered.filter(q => q.subject === activeSubject);
    }
    
    if (questionFilter !== "all") {
      filtered = filtered.filter(q => {
        if (questionFilter === "correct") return q.question_status === "correct";
        if (questionFilter === "incorrect") return q.question_status === "incorrect";
        if (questionFilter === "unattempted") return q.question_status === "skipped";
        return true;
      });
    }
    
    return filtered;
  }, [questions, activeSubject, questionFilter]);

  const subjects = useMemo(() => {
    const subjs = new Set(questions.map(q => q.subject));
    return ["all", ...Array.from(subjs)];
  }, [questions]);

  const currentQuestion = filteredQuestions[currentQuestionIndex];

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">No results found</p>
          <Button onClick={() => navigate("/tests")}>Back to Tests</Button>
        </div>
      </div>
    );
  }

  const accuracy = (results.correct + results.incorrect) > 0 
    ? Math.round((results.correct / (results.correct + results.incorrect)) * 100) 
    : 0;
  const timeTaken = Math.round(results.time_taken_seconds / 60);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/tests")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">Test Analysis</h1>
              <p className="text-sm text-muted-foreground">{testName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={`/test/${testId}/question-analysis`}>
              <Button variant="outline" className="border-white/20 text-foreground hover:bg-secondary">
                <Eye className="w-4 h-4 mr-2" />
                Question Analysis
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-6">
        {/* Tabs */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => setActiveTab("overview")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === "overview" 
                ? "bg-secondary text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("questions")}
            className={cn(
              "px-4 py-2 rounded-lg font-medium transition-colors",
              activeTab === "questions" 
                ? "bg-secondary text-foreground" 
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            Qs by Qs Analysis
          </button>
        </div>

        {activeTab === "overview" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left Column - Overall Score */}
            <div className="lg:col-span-2 space-y-6">
              {/* Score Cards Row */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Overall Score Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-6"
                >
                  <h3 className="text-muted-foreground text-sm mb-4">Overall Score</h3>
                  <div className="text-5xl font-bold text-foreground mb-2">
                    {results.score}<span className="text-2xl text-muted-foreground">/{results.total_marks}</span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    {Object.entries(results.subject_scores).slice(0, 3).map(([subject, scores]) => (
                      <div key={subject}>
                        <div className="text-muted-foreground">{subject.slice(0, 4)} Score</div>
                        <div className="text-foreground font-semibold">
                          {scores.marks ?? 0}<span className="text-muted-foreground">/{scores.totalMarks ?? 0}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>

                {/* Percentile Card */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="bg-card rounded-xl p-6"
                >
                  <h3 className="text-muted-foreground text-sm mb-4">Predicted Percentile</h3>
                  <div className="text-5xl font-bold text-primary mb-2">
                    {results.percentile?.toFixed(2) ?? "0.00"}
                  </div>
                  <div className="grid grid-cols-3 gap-4 mt-4 text-sm">
                    {Object.entries(results.subject_scores).slice(0, 3).map(([subject, scores]) => {
                      const subjectAcc = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
                      return (
                        <div key={subject}>
                          <div className="text-muted-foreground">{subject.slice(0, 4)}</div>
                          <div className="text-foreground font-semibold">{subjectAcc}%</div>
                        </div>
                      );
                    })}
                  </div>
                </motion.div>
              </div>

              {/* Stats Row */}
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Trophy className="w-4 h-4" />
                    RANK
                  </div>
                  <div className="text-2xl font-bold text-foreground">{results.rank ?? "-"}</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="bg-card rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <Target className="w-4 h-4" />
                    QS ATTEMPTED
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {results.correct + results.incorrect}<span className="text-lg text-muted-foreground">/{questions.length}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="bg-card rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-2">
                    <CheckCircle2 className="w-4 h-4" />
                    ACCURACY
                  </div>
                  <div className="text-2xl font-bold text-foreground">{accuracy}%</div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  className="bg-card rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-green-400 text-sm mb-2">
                    <TrendingUp className="w-4 h-4" />
                    CORRECT
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {results.correct}<span className="text-lg text-muted-foreground">/{questions.length}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                    <XCircle className="w-4 h-4" />
                    INCORRECT
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {results.incorrect}<span className="text-lg text-muted-foreground">/{questions.length}</span>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="bg-card rounded-xl p-4"
                >
                  <div className="flex items-center gap-2 text-blue-400 text-sm mb-2">
                    <Clock className="w-4 h-4" />
                    TIME TAKEN
                  </div>
                  <div className="text-2xl font-bold text-foreground">{timeTaken}<span className="text-lg text-muted-foreground">min</span></div>
                </motion.div>
              </div>

              {/* Subject-wise Performance */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-card rounded-xl p-6"
              >
                <h3 className="text-foreground font-semibold mb-4">Subject-wise Performance</h3>
                <div className="space-y-4">
                  {Object.entries(results.subject_scores).map(([subject, scores]) => {
                    const subjectAccuracy = scores.total > 0 ? Math.round((scores.correct / scores.total) * 100) : 0;
                    return (
                      <div key={subject} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-foreground/80">{subject}</span>
                          <span className="text-muted-foreground">
                            {scores.correct}/{scores.total} correct ({subjectAccuracy}%)
                          </span>
                        </div>
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full transition-all"
                            style={{ width: `${subjectAccuracy}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </motion.div>
            </div>

            {/* Right Column - Analysis Navigation */}
            <div className="space-y-4">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-card rounded-xl p-4"
              >
                <h3 className="text-foreground font-semibold mb-4">Quick Analysis</h3>
                <div className="space-y-2">
                  {["Performance Analysis", "Score Potential", "Attempt Analysis", "Time Analysis", "Difficulty Analysis", "Subject Movement"].map((item) => (
                    <button
                      key={item}
                      className="w-full flex items-center justify-between p-3 rounded-lg text-foreground/80 hover:bg-secondary/50 transition-colors"
                    >
                      <span>{item}</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Note Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-yellow-500/20 to-orange-500/20 rounded-xl p-4 border border-yellow-500/30"
              >
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-yellow-400 mt-0.5" />
                  <div>
                    <h4 className="text-foreground font-medium mb-1">Note Down Your Learnings</h4>
                    <p className="text-sm text-foreground/80">Add up to 3 things you learned in this test</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === "questions" && (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Questions List */}
            <div className="lg:col-span-2">
              {/* Subject Tabs */}
              <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
                {subjects.map((subject) => (
                  <button
                    key={subject}
                    onClick={() => {
                      setActiveSubject(subject);
                      setCurrentQuestionIndex(0);
                    }}
                    className={cn(
                      "px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors",
                      activeSubject === subject 
                        ? "bg-[#1a73e8] text-foreground" 
                        : "bg-card text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {subject === "all" ? "All" : subject}
                  </button>
                ))}
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-2 mb-6">
                {[
                  { key: "all", label: "All", count: questions.filter(q => activeSubject === "all" || q.subject === activeSubject).length },
                  { key: "correct", label: "Correct", count: questions.filter(q => (activeSubject === "all" || q.subject === activeSubject) && q.question_status === "correct").length },
                  { key: "incorrect", label: "Incorrect", count: questions.filter(q => (activeSubject === "all" || q.subject === activeSubject) && q.question_status === "incorrect").length },
                  { key: "unattempted", label: "Unattempted", count: questions.filter(q => (activeSubject === "all" || q.subject === activeSubject) && q.question_status === "skipped").length },
                ].map((filter) => (
                  <button
                    key={filter.key}
                    onClick={() => {
                      setQuestionFilter(filter.key as any);
                      setCurrentQuestionIndex(0);
                    }}
                    className={cn(
                      "px-3 py-1.5 rounded text-xs font-medium transition-colors",
                      questionFilter === filter.key 
                        ? "bg-secondary text-foreground" 
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {filter.label} <span className="ml-1 opacity-60">{filter.count}</span>
                  </button>
                ))}
              </div>

              {/* Current Question */}
              {currentQuestion ? (
                <motion.div
                  key={currentQuestion.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl p-6"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-1 rounded bg-secondary text-foreground text-sm">
                        Q{currentQuestion.question_number || currentQuestionIndex + 1}
                      </span>
                      <span className={cn(
                        "px-2 py-1 rounded text-xs",
                        currentQuestion.question_status === "correct"
                          ? "bg-green-500/20 text-green-400" 
                          : currentQuestion.question_status === "skipped"
                            ? "bg-gray-500/20 text-muted-foreground"
                            : "bg-red-500/20 text-red-400"
                      )}>
                        {Number(currentQuestion.marks_obtained || 0) > 0 ? `+${currentQuestion.marks_obtained}` : String(currentQuestion.marks_obtained ?? 0)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground">{currentQuestion.subject}</div>
                  </div>

                  {/* Question Image */}
                  {currentQuestion.image_url && (
                    <div className="mb-4">
                      <img 
                        src={currentQuestion.image_url} 
                        alt="Question" 
                        className="max-w-full h-auto rounded-lg border border-border"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  {currentQuestion.question_text && (
                    <div className="text-foreground mb-6">
                      <LatexRenderer content={currentQuestion.question_text} />
                    </div>
                  )}

                  {/* For integer type, show answers differently */}
                  {currentQuestion.section_type === 'integer' ? (
                    <div className="space-y-4">
                      <div className="p-4 rounded-lg bg-secondary/50">
                        <div className="text-sm text-muted-foreground mb-1">Your Answer</div>
                        <div className="font-semibold text-foreground">
                          {formatAnswerDisplay(currentQuestion.user_answer, currentQuestion.section_type)}
                        </div>
                      </div>
                      <div className={cn(
                        "p-4 rounded-lg border",
                        currentQuestion.is_correct 
                          ? "bg-green-500/10 border-green-500/20" 
                          : "bg-green-500/10 border-green-500/20"
                      )}>
                        <div className="text-sm text-green-400 mb-1">Correct Answer</div>
                        <div className="font-semibold text-green-400">
                          {formatAnswerDisplay(currentQuestion.correct_answer, currentQuestion.section_type)}
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Options */
                    <div className="space-y-3">
                      {currentQuestion.options?.map((option, index) => {
                        const optionLetter = String.fromCharCode(65 + index); // A, B, C, D
                        const correctRaw = currentQuestion.correct_answer;
                        // Normalize: correct_answer could be "A" or "0" or ["A","B"] or [0,1]
                        const normalizeToLetter = (v: any) => {
                          const s = String(v).trim();
                          const n = parseInt(s);
                          if (!isNaN(n) && n >= 0 && n <= 25) return String.fromCharCode(65 + n);
                          return s.toUpperCase();
                        };
                        const correctLetters = Array.isArray(correctRaw) 
                          ? correctRaw.map(normalizeToLetter) 
                          : [normalizeToLetter(correctRaw)];
                        const isCorrect = correctLetters.includes(optionLetter);

                        const userRaw = currentQuestion.user_answer;
                        const userLetters = userRaw == null || userRaw === '' ? [] 
                          : Array.isArray(userRaw) ? userRaw.map(normalizeToLetter) 
                          : [normalizeToLetter(userRaw)];
                        const isUserAnswer = userLetters.includes(optionLetter);
                        
                        return (
                          <div
                            key={index}
                            className={cn(
                              "flex items-center gap-4 p-4 rounded-lg border transition-all",
                              isCorrect && "border-green-500 bg-green-500/10",
                              isUserAnswer && !isCorrect && "border-red-500 bg-red-500/10",
                              !isCorrect && !isUserAnswer && "border-border"
                            )}
                          >
                            <span className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm",
                              isCorrect && "bg-green-500 text-foreground",
                              isUserAnswer && !isCorrect && "bg-red-500 text-foreground",
                              !isCorrect && !isUserAnswer && "bg-secondary text-foreground/80"
                            )}>
                              {optionLetter}
                            </span>
                            <span className="text-foreground/80 flex-1">
                              <LatexRenderer content={typeof option === 'string' ? option : String(option)} />
                            </span>
                            {isCorrect && <CheckCircle2 className="w-5 h-5 text-green-400" />}
                            {isUserAnswer && !isCorrect && <XCircle className="w-5 h-5 text-red-400" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Navigation */}
                  <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1))}
                      disabled={currentQuestionIndex === 0}
                      className="text-muted-foreground"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentQuestionIndex + 1} / {filteredQuestions.length}
                    </span>
                    <Button
                      variant="ghost"
                      onClick={() => setCurrentQuestionIndex(Math.min(filteredQuestions.length - 1, currentQuestionIndex + 1))}
                      disabled={currentQuestionIndex === filteredQuestions.length - 1}
                      className="text-muted-foreground"
                    >
                      Next
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </motion.div>
              ) : (
                <div className="bg-card rounded-xl p-12 text-center">
                  <p className="text-muted-foreground">No questions match the current filter</p>
                </div>
              )}
            </div>

            {/* Question Palette */}
            <div className="bg-card rounded-xl p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-foreground font-medium">All Questions</h3>
                <span className="text-muted-foreground text-sm">{filteredQuestions.length} Qs</span>
              </div>

              {/* Palette Grid */}
              <div className="grid grid-cols-6 gap-2">
                {filteredQuestions.map((q, index) => (
                  <button
                    key={q.id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={cn(
                      "w-9 h-9 rounded flex items-center justify-center text-sm font-medium transition-all",
                      currentQuestionIndex === index && "ring-2 ring-white",
                      q.question_status === "correct" && "bg-green-500 text-foreground",
                      q.question_status === "incorrect" && "bg-red-500 text-foreground",
                      q.question_status === "skipped" && "bg-gray-600 text-foreground/80"
                    )}
                  >
                    {q.question_number || index + 1}
                  </button>
                ))}
              </div>

              {/* Legend */}
              <div className="mt-6 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500"></div>
                  <span className="text-muted-foreground">Correct ({results.correct})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500"></div>
                  <span className="text-muted-foreground">Incorrect ({results.incorrect})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-gray-600"></div>
                  <span className="text-muted-foreground">Unattempted ({results.skipped})</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
