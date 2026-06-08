import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useParams, useNavigate, useSearchParams, Link } from "react-router-dom";
import { 
  ChevronLeft, 
  ChevronRight, 
  CheckCircle2, 
  XCircle, 
  MinusCircle,
  BookOpen,
  ArrowLeft,
  Trophy,
  Info
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { evaluateQuestionScore, formatAnswerDisplay } from "@/lib/testScoring";
import { cn } from "@/lib/utils";
import Leaderboard from "@/components/Leaderboard";
import ScrollPDFViewer from "@/components/test/ScrollPDFViewer";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Question {
  id: string;
  question_number: number;
  correct_answer: any;
  marks: number;
  negative_marks: number;
  is_bonus?: boolean;
  section_type: string;
  subject_name: string;
  section_id: string;
  pdf_page: number | null;
}

interface Section {
  id: string;
  name: string;
  type: string;
  subjectName: string;
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

export default function DetailedAnalysis() {
  const { testId } = useParams();
  const [searchParams] = useSearchParams();
  const attemptId = searchParams.get('attemptId');
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [testName, setTestName] = useState("");
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [activeSection, setActiveSection] = useState<string>("");

  useEffect(() => {
    if (user && testId) {
      fetchData();
    }
  }, [user, testId]);

  const fetchData = async () => {
    // Fetch test details
    const { data: test } = await supabase
      .from("tests")
      .select("name, pdf_url")
      .eq("id", testId)
      .single();
    
    if (test) {
      setTestName(test.name);
      
      // Get PDF URL
      if (test.pdf_url) {
        const { data: urlData, error: urlError } = await supabase.storage
          .from("test-pdfs")
          .createSignedUrl(test.pdf_url, 3600 * 3);
        
        if (urlError) {
          console.error("Failed to get PDF URL:", urlError);
        }
        if (urlData?.signedUrl) {
          setPdfUrl(urlData.signedUrl);
        }
      }
    }

    // Fetch user's attempt
    const { data: attemptData } = await supabase
      .from("test_attempts")
      .select("id, answers, score, total_marks, time_taken_seconds, percentile, rank")
      .eq("test_id", testId)
      .eq("user_id", user!.id)
      .not("completed_at", "is", null)
      .maybeSingle();

    if (!attemptData) {
      navigate("/tests");
      return;
    }

    setAttempt({
      ...attemptData,
      answers: (attemptData.answers as Record<string, any>) || {},
    });

    // Fetch questions with subject/section info
    const { data: questionsData } = await supabase
      .from("test_section_questions")
      .select(`
        id,
        question_number,
        correct_answer,
        marks,
        negative_marks,
        is_bonus,
        pdf_page,
        section_id,
        section:test_sections(
          id,
          name,
          section_type,
          subject:test_subjects(name)
        )
      `)
      .eq("test_id", testId)
      .order("question_number");

    if (questionsData) {
      const sectionMap = new Map<string, Section>();
      
      const formattedQuestions = questionsData.map((q: any) => {
        const sectionId = q.section?.id || q.section_id;
        const sectionType = q.section?.section_type || "single_choice";
        const subjectName = q.section?.subject?.name || "Unknown";
        
        if (!sectionMap.has(sectionId)) {
          sectionMap.set(sectionId, {
            id: sectionId,
            name: q.section?.name || sectionType.replace("_", " "),
            type: sectionType,
            subjectName
          });
        }

        return {
          id: q.id,
          question_number: q.question_number,
          correct_answer: q.correct_answer,
          marks: q.marks ?? 4,
          negative_marks: q.negative_marks ?? 1,
          is_bonus: q.is_bonus ?? false,
          section_type: sectionType,
          subject_name: subjectName,
          section_id: sectionId,
          pdf_page: q.pdf_page
        };
      });
      
      setQuestions(formattedQuestions);
      setSections(Array.from(sectionMap.values()));
      
      if (sectionMap.size > 0) {
        setActiveSection(Array.from(sectionMap.keys())[0]);
      }
    }

    setLoading(false);
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

  const filteredQuestions = useMemo(() => {
    if (!activeSection) return questions;
    return questions.filter(q => q.section_id === activeSection);
  }, [questions, activeSection]);

  const getSectionStats = (sectionId: string) => {
    const sectionQuestions = questions.filter(q => q.section_id === sectionId);
    return {
      correct: sectionQuestions.filter(q => getQuestionStatus(q.id) === "correct").length,
      incorrect: sectionQuestions.filter(q => getQuestionStatus(q.id) === "incorrect").length,
      skipped: sectionQuestions.filter(q => getQuestionStatus(q.id) === "skipped").length,
      total: sectionQuestions.length
    };
  };

  const currentQ = questions[currentQuestion];
  const targetPdfPage = currentQ?.pdf_page || undefined;
  const displayedScore = questions.reduce((total, question) => total + getMarksObtained(question.id), 0);
  const displayedTotalMarks = questions.reduce((total, question) => total + question.marks, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!attempt) return null;

  const accuracy = displayedTotalMarks > 0 
    ? Math.round((displayedScore / displayedTotalMarks) * 100) 
    : 0;

  const stats = {
    correct: questions.filter(q => getQuestionStatus(q.id) === "correct").length,
    incorrect: questions.filter(q => getQuestionStatus(q.id) === "incorrect").length,
    skipped: questions.filter(q => getQuestionStatus(q.id) === "skipped").length,
  };

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/tests")}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold font-display">Question Analysis</h1>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Info className="w-3 h-3 text-primary" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <div>Score: {displayedScore}/{displayedTotalMarks}</div>
                      <div>Rank: #{attempt.rank}</div>
                      <div>Percentile: {attempt.percentile?.toFixed(1)}%</div>
                      <div>Time: {Math.floor((attempt.time_taken_seconds || 0) / 60)}m</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
            <span className="text-sm text-muted-foreground hidden md:block">{testName}</span>
          </div>
          <div className="flex items-center gap-2">
            <Button 
              variant={showLeaderboard ? "gradient" : "glass"}
              size="sm"
              onClick={() => setShowLeaderboard(!showLeaderboard)}
            >
              <Trophy className="w-4 h-4 mr-1" />
              Leaderboard
            </Button>
          </div>
        </div>
      </header>

      {/* Overview Stats Bar */}
      <div className="border-b border-border bg-card/50 px-4 py-2">
        <div className="container mx-auto flex items-center gap-4 overflow-x-auto">
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10">
            <span className="text-sm font-medium">{displayedScore}/{displayedTotalMarks}</span>
            <span className="text-xs text-muted-foreground">Score</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-success/10">
            <span className="text-sm font-medium text-success">{stats.correct}</span>
            <span className="text-xs text-muted-foreground">Correct</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10">
            <span className="text-sm font-medium text-destructive">{stats.incorrect}</span>
            <span className="text-xs text-muted-foreground">Incorrect</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary">
            <span className="text-sm font-medium">{stats.skipped}</span>
            <span className="text-xs text-muted-foreground">Skipped</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary">
            <span className="text-sm font-medium">{accuracy}%</span>
            <span className="text-xs text-muted-foreground">Accuracy</span>
          </div>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="border-b border-border bg-secondary/30 px-4 py-2 overflow-x-auto">
        <div className="container mx-auto flex items-center gap-2">
          {sections.map((section) => {
            const sStats = getSectionStats(section.id);
            return (
              <TooltipProvider key={section.id}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setActiveSection(section.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-all",
                        activeSection === section.id
                          ? "bg-primary text-primary-foreground"
                          : "bg-secondary/50 hover:bg-secondary"
                      )}
                    >
                      {section.subjectName} ({section.type.replace("_", " ")})
                      <Info className="w-3 h-3 opacity-60" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className="text-xs space-y-1">
                      <div className="text-success">Correct: {sStats.correct}</div>
                      <div className="text-destructive">Incorrect: {sStats.incorrect}</div>
                      <div>Skipped: {sStats.skipped}</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            );
          })}
        </div>
      </div>

      {showLeaderboard ? (
        <div className="container mx-auto px-4 py-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-6"
          >
            <Leaderboard testId={testId!} currentUserId={user?.id} />
          </motion.div>
        </div>
      ) : (
        <div className="flex-1 flex min-h-0 overflow-hidden">
          {/* PDF Viewer (Left) - scrolls independently */}
          <div className="w-[65%] h-full overflow-auto border-r border-border">
            {pdfUrl ? (
              <ScrollPDFViewer
                pdfUrl={pdfUrl}
                targetPage={targetPdfPage}
              />
            ) : (
              <div className="h-full flex items-center justify-center text-muted-foreground">
                <p>No PDF available for this test</p>
              </div>
            )}
          </div>

          {/* Analysis Panel (Right) - fixed, does NOT scroll with PDF */}
          <div className="w-[35%] h-full flex flex-col bg-card/30">
            {/* Question Palette */}
            <div className="p-4 border-b border-border">
              <h3 className="text-sm font-medium mb-3">Question Palette</h3>
              <div className="grid grid-cols-5 gap-2 max-h-[150px] overflow-y-auto">
                {filteredQuestions.map((q) => {
                  const globalIndex = questions.findIndex(gq => gq.id === q.id);
                  const status = getQuestionStatus(q.id);
                  return (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestion(globalIndex)}
                      className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center font-semibold text-sm transition-all",
                        currentQuestion === globalIndex && "ring-2 ring-primary",
                        status === "correct" && "bg-success/20 text-success border border-success/30",
                        status === "incorrect" && "bg-destructive/20 text-destructive border border-destructive/30",
                        status === "skipped" && "bg-secondary text-muted-foreground"
                      )}
                    >
                      {q.question_number}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Current Question Details */}
            <div className="flex-1 overflow-auto p-4">
              {currentQ && (
                <motion.div
                  key={currentQ.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground uppercase">
                        {currentQ.subject_name}
                      </span>
                      <h3 className="text-lg font-semibold">Q{currentQ.question_number}</h3>
                    </div>
                    <div className={cn(
                      "px-3 py-1 rounded-full text-sm font-medium flex items-center gap-2",
                      getQuestionStatus(currentQ.id) === "correct" && "bg-success/20 text-success",
                      getQuestionStatus(currentQ.id) === "incorrect" && "bg-destructive/20 text-destructive",
                      getQuestionStatus(currentQ.id) === "skipped" && "bg-secondary text-muted-foreground"
                    )}>
                      {getQuestionStatus(currentQ.id) === "correct" && <CheckCircle2 className="w-4 h-4" />}
                      {getQuestionStatus(currentQ.id) === "incorrect" && <XCircle className="w-4 h-4" />}
                      {getQuestionStatus(currentQ.id) === "skipped" && <MinusCircle className="w-4 h-4" />}
                      {getQuestionStatus(currentQ.id).charAt(0).toUpperCase() + getQuestionStatus(currentQ.id).slice(1)}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-secondary/50">
                    <div className="text-sm text-muted-foreground mb-1">Your Answer</div>
                    <div className="font-semibold">
                       {formatAnswerDisplay(attempt.answers[currentQ.id], currentQ.section_type)}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-success/10 border border-success/20">
                    <div className="text-sm text-success mb-1">Correct Answer</div>
                    <div className="font-semibold text-success">
                       {formatAnswerDisplay(currentQ.correct_answer, currentQ.section_type)}
                    </div>
                  </div>

                  <div className="p-3 rounded-lg bg-card border">
                    <div className="text-sm text-muted-foreground mb-1">Marks</div>
                    <div className={cn(
                      "font-semibold text-lg",
                      getMarksObtained(currentQ.id) > 0 && "text-success",
                      getMarksObtained(currentQ.id) < 0 && "text-destructive"
                    )}>
                      {getMarksObtained(currentQ.id) > 0 && "+"}
                      {getMarksObtained(currentQ.id)} / {currentQ.marks}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>

            {/* Navigation */}
            <div className="p-4 border-t border-border flex items-center justify-between">
              <Button
                variant="glass"
                size="sm"
                onClick={() => setCurrentQuestion(Math.max(0, currentQuestion - 1))}
                disabled={currentQuestion === 0}
              >
                <ChevronLeft className="w-4 h-4" />
                Prev
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentQuestion + 1} of {questions.length}
              </span>
              <Button
                variant="glass"
                size="sm"
                onClick={() => setCurrentQuestion(Math.min(questions.length - 1, currentQuestion + 1))}
                disabled={currentQuestion === questions.length - 1}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
