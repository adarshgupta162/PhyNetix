import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, Link } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  BookOpen,
  ArrowLeft,
  Trophy
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { evaluateQuestionScore, formatAnswerDisplay, normalizeAnswerCollection } from "@/lib/testScoring";
import { cn } from "@/lib/utils";
import Leaderboard from "@/components/Leaderboard";

interface Question {
  id: string;
  question_number: number;
  correct_answer: any;
  marks: number;
  negative_marks: number;
  is_bonus?: boolean;
  section_type: string;
  subject_name: string;
  question_text?: string;
  options?: any[];
  image_url?: string;
}

interface Attempt {
  id: string;
  answers: Record<string, any>;
  score: number;
  total_marks: number;
  time_taken_seconds: number;
  percentile: number;
  rank: number;
}

export default function QuestionWiseAnalysis() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [testName, setTestName] = useState("");
  const [testType, setTestType] = useState<string>("pdf");
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  useEffect(() => {
    if (user && testId) {
      fetchData();
    }
  }, [user, testId]);

  const fetchData = async () => {
    // Fetch test details
    const { data: test } = await supabase
      .from("tests")
      .select("name, test_type")
      .eq("id", testId)
      .single();
    
    if (test) {
      setTestName(test.name);
      setTestType(test.test_type);
    }

    // Fetch user's attempt
    const { data: attemptData } = await supabase
      .from("test_attempts")
      .select("id, answers, score, total_marks, time_taken_seconds, percentile, rank")
      .eq("test_id", testId)
      .eq("user_id", user!.id)
      .not("completed_at", "is", null)
      .order("completed_at", { ascending: false })
      .limit(1)
      .single();

    if (!attemptData) {
      navigate("/tests");
      return;
    }

    setAttempt({
      ...attemptData,
      answers: (attemptData.answers as Record<string, any>) || {},
    });

    // Fetch questions based on test type
    if (test?.test_type === 'pdf') {
      const { data: questionsData } = await supabase
        .from("test_section_questions")
        .select(`
          id,
          question_number,
          correct_answer,
          marks,
          negative_marks,
          is_bonus,
          question_text,
          options,
          image_url,
          section:test_sections(
            section_type,
            subject:test_subjects(name)
          )
        `)
        .eq("test_id", testId)
        .order("question_number");

      if (questionsData) {
        const formattedQuestions = questionsData.map((q: any) => ({
          id: q.id,
          question_number: q.question_number,
          correct_answer: q.correct_answer,
          marks: q.marks ?? 4,
          negative_marks: q.negative_marks ?? 1,
          is_bonus: q.is_bonus ?? false,
          section_type: q.section?.section_type || "single_choice",
          subject_name: q.section?.subject?.name || "Unknown",
          question_text: q.question_text,
          options: q.options,
          image_url: q.image_url,
        }));
        setQuestions(formattedQuestions);
      }
    } else {
      // Normal test questions
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
            chapters(name, courses(name))
          )
        `)
        .eq("test_id", testId)
        .order("order_index");

      if (testQuestions && testQuestions.length > 0) {
        const formattedQuestions = testQuestions
          .filter((tq: any) => !!tq.questions)
          .map((tq: any, idx: number) => ({
            id: tq.questions.id,
            question_number: idx + 1,
            correct_answer: tq.questions.correct_answer,
            marks: tq.questions.marks ?? 4,
            negative_marks: tq.questions.negative_marks ?? 1,
            section_type: tq.questions.question_type || "single_choice",
            subject_name: tq.questions.chapters?.courses?.name || "General",
            question_text: tq.questions.question_text,
            options: tq.questions.options,
            image_url: tq.questions.image_url,
          }));
        setQuestions(formattedQuestions);
      } else {
        // Fallback: section-based structure (test_section_questions)
        const { data: sectionQuestions } = await supabase
          .from("test_section_questions")
          .select(`
            id,
            question_number,
            correct_answer,
            marks,
            negative_marks,
            is_bonus,
            question_text,
            options,
            image_url,
            test_sections!inner (
              section_type,
              test_subjects!inner (name)
            )
          `)
          .eq("test_id", testId)
          .order("question_number");

        if (sectionQuestions) {
          const formatted = sectionQuestions.map((q: any) => ({
            id: q.id,
            question_number: q.question_number,
            correct_answer: q.correct_answer,
            marks: q.marks ?? 4,
            negative_marks: q.negative_marks ?? 1,
            is_bonus: q.is_bonus ?? false,
            section_type: q.test_sections?.section_type || "single_choice",
            subject_name: q.test_sections?.test_subjects?.name || "General",
            question_text: q.question_text,
            options: q.options,
            image_url: q.image_url,
          }));
          setQuestions(formatted);
        }
      }
    }

    setLoading(false);
  };

  // Helper to convert user answer (index) to letter for comparison
  const userAnswerToLetter = (answer: any): string => {
    if (answer === undefined || answer === null || answer === '') return '';
    const num = parseInt(String(answer));
    if (!isNaN(num) && num >= 0 && num <= 25) {
      return String.fromCharCode(65 + num); // 0 -> A, 1 -> B, etc.
    }
    return String(answer).toUpperCase();
  };

  const getQuestionStatus = (questionId: string) => {
    if (!attempt) return "skipped";
    const question = questions.find(q => q.id === questionId);
    if (!question) return "skipped";
    return evaluateQuestionScore({
      sectionType: question.section_type,
      correctAnswer: question.correct_answer,
      userAnswer: attempt.answers[questionId],
      marks: question.marks,
      negativeMarks: question.negative_marks,
      isBonus: question.is_bonus,
    }).status;
  };

  const formatAnswer = (answer: any, sectionType: string) => {
    return formatAnswerDisplay(answer, sectionType);
  };

  const formatCorrectAnswer = (answer: any, sectionType: string) => {
    return formatAnswerDisplay(answer, sectionType);
  };

  const getMarksObtained = (questionId: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question || !attempt) return 0;

    return evaluateQuestionScore({
      sectionType: question.section_type,
      correctAnswer: question.correct_answer,
      userAnswer: attempt.answers[questionId],
      marks: question.marks,
      negativeMarks: question.negative_marks,
      isBonus: question.is_bonus,
    }).marksObtained;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!attempt) return null;

  const stats = {
    correct: questions.filter(q => getQuestionStatus(q.id) === "correct").length,
    incorrect: questions.filter(q => getQuestionStatus(q.id) === "incorrect").length,
    skipped: questions.filter(q => getQuestionStatus(q.id) === "skipped").length,
  };
  const currentQ = questions[currentQuestion];
  const displayedScore = questions.reduce((total, question) => total + getMarksObtained(question.id), 0);
  const displayedTotalMarks = questions.reduce((total, question) => total + question.marks, 0);
  const attemptedCount = stats.correct + stats.incorrect;
  const accuracy = attemptedCount > 0 ? Math.round((stats.correct / attemptedCount) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/tests")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold font-display">Question Analysis</h1>
              <p className="text-sm text-muted-foreground">{testName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button 
              variant={showLeaderboard ? "default" : "outline"}
              onClick={() => setShowLeaderboard(!showLeaderboard)}
            >
              <Trophy className="w-5 h-5 mr-2" />
              Leaderboard
            </Button>
            <Link to="/tests">
              <Button variant="outline">
                <BookOpen className="w-5 h-5 mr-2" />
                More Tests
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Overview Stats */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{displayedScore}/{displayedTotalMarks}</div>
            <div className="text-sm text-muted-foreground">Score</div>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-green-500">{stats.correct}</div>
            <div className="text-sm text-muted-foreground">Correct</div>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-red-500">{stats.incorrect}</div>
            <div className="text-sm text-muted-foreground">Incorrect</div>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-muted-foreground">{stats.skipped}</div>
            <div className="text-sm text-muted-foreground">Skipped</div>
          </div>
          <div className="bg-card border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{accuracy}%</div>
            <div className="text-sm text-muted-foreground">Accuracy</div>
          </div>
        </div>

        {showLeaderboard ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold font-display mb-4 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-500" />
              Leaderboard
            </h2>
            <Leaderboard testId={testId!} currentUserId={user?.id} />
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-6">
            {/* Question Palette */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card border rounded-xl p-6"
            >
              <h2 className="text-lg font-semibold font-display mb-4">Question Palette</h2>
              <div className="grid grid-cols-5 gap-2">
                {questions.map((q, index) => {
                  const status = getQuestionStatus(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(index)}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all",
                        currentQuestion === index && "ring-2 ring-primary",
                        status === "correct" && "bg-green-500/20 text-green-600 border border-green-500/30",
                        status === "incorrect" && "bg-red-500/20 text-red-600 border border-red-500/30",
                        status === "skipped" && "bg-secondary text-muted-foreground"
                      )}
                    >
                      {q.question_number}
                    </button>
                  );
                })}
              </div>

              <div className="mt-6 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30" />
                  <span>Correct ({stats.correct})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-red-500/20 border border-red-500/30" />
                  <span>Incorrect ({stats.incorrect})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded bg-secondary" />
                  <span>Skipped ({stats.skipped})</span>
                </div>
              </div>
            </motion.div>

            {/* Current Question Details */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="lg:col-span-2 bg-card border rounded-xl p-6"
            >
              {currentQ && (
                <>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {currentQ.subject_name}
                      </span>
                      <h3 className="text-lg font-semibold">Question {currentQ.question_number}</h3>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2",
                      getQuestionStatus(currentQ.id) === "correct" && "bg-green-500/20 text-green-600",
                      getQuestionStatus(currentQ.id) === "incorrect" && "bg-red-500/20 text-red-600",
                      getQuestionStatus(currentQ.id) === "skipped" && "bg-secondary text-muted-foreground"
                    )}>
                      {getQuestionStatus(currentQ.id) === "correct" && <CheckCircle2 className="w-4 h-4" />}
                      {getQuestionStatus(currentQ.id) === "incorrect" && <XCircle className="w-4 h-4" />}
                      {getQuestionStatus(currentQ.id) === "skipped" && <MinusCircle className="w-4 h-4" />}
                      {getQuestionStatus(currentQ.id).charAt(0).toUpperCase() + getQuestionStatus(currentQ.id).slice(1)}
                    </div>
                  </div>

                  {currentQ.question_text && (
                    <p className="text-foreground mb-4">{currentQ.question_text}</p>
                  )}

                  {currentQ.image_url && (
                    <img 
                      src={currentQ.image_url} 
                      alt="Question" 
                      className="max-w-full max-h-64 object-contain mb-4 rounded-lg"
                    />
                  )}

                  <div className="space-y-4 mb-6">
                    <div className="p-4 rounded-lg bg-secondary/50">
                      <div className="text-sm text-muted-foreground mb-1">Your Answer</div>
                      <div className="font-semibold">
                        {formatAnswer(attempt.answers[currentQ.id], currentQ.section_type)}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20">
                      <div className="text-sm text-green-600 mb-1">Correct Answer</div>
                      <div className="font-semibold text-green-600">
                        {formatCorrectAnswer(currentQ.correct_answer, currentQ.section_type)}
                      </div>
                    </div>

                    <div className="p-4 rounded-lg bg-card border">
                      <div className="text-sm text-muted-foreground mb-1">Marks</div>
                      <div className={cn(
                        "font-semibold text-lg",
                        getMarksObtained(currentQ.id) > 0 && "text-green-600",
                        getMarksObtained(currentQ.id) < 0 && "text-red-600"
                      )}>
                        {getMarksObtained(currentQ.id) > 0 && "+"}
                        {getMarksObtained(currentQ.id)}
                      </div>
                    </div>
                  </div>

                  {/* Options display for MCQ */}
                  {currentQ.options && Array.isArray(currentQ.options) && currentQ.options.length > 0 && (
                    <div className="space-y-2 mb-6">
                      <div className="text-sm text-muted-foreground mb-2">Options:</div>
                      {currentQ.options.map((opt, idx) => {
                        const optLetter = String.fromCharCode(65 + idx); // A, B, C, D
                        const correctAnswers = normalizeAnswerCollection(currentQ.correct_answer, currentQ.section_type);
                        
                        // Check if this option is the correct one (correct_answer is stored as letter like "A", "B")
                        const isCorrect = correctAnswers.includes(optLetter);
                        
                        // Check if user selected this option (user answer is stored as index like 0, 1, 2)
                        const userAnswers = normalizeAnswerCollection(attempt.answers[currentQ.id], currentQ.section_type);
                        const isUserAnswer = userAnswers.includes(optLetter);

                        // Get option text - handle both object format and string format
                        const optionText = typeof opt === 'object' && opt !== null 
                          ? (opt.text || opt.label || JSON.stringify(opt))
                          : String(opt);

                        return (
                          <div 
                            key={idx}
                            className={cn(
                              "p-3 rounded-lg border flex items-center gap-3",
                              isCorrect && "border-green-500 bg-green-500/10",
                              isUserAnswer && !isCorrect && "border-red-500 bg-red-500/10",
                              !isCorrect && !isUserAnswer && "border-border"
                            )}
                          >
                            <span className={cn(
                              "w-7 h-7 rounded-full flex items-center justify-center text-sm font-medium",
                              isCorrect && "bg-green-500 text-white",
                              isUserAnswer && !isCorrect && "bg-red-500 text-white",
                              !isCorrect && !isUserAnswer && "bg-secondary"
                            )}>
                              {optLetter}
                            </span>
                            <span className="flex-1">{optionText}</span>
                            {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                            {isUserAnswer && !isCorrect && <XCircle className="w-4 h-4 text-red-500" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                      disabled={currentQuestion === 0}
                    >
                      <ChevronLeft className="w-5 h-5 mr-2" />
                      Previous
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {currentQuestion + 1} of {questions.length}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                      disabled={currentQuestion === questions.length - 1}
                    >
                      Next
                      <ChevronRight className="w-5 h-5 ml-2" />
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
