import { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { AnalysisSidebar } from "@/components/analysis/AnalysisSidebar";
import { OverviewCard } from "@/components/analysis/OverviewCard";
import { SubjectCard } from "@/components/analysis/SubjectCard";
import { TimeOutcomeChart } from "@/components/analysis/TimeOutcomeChart";
import { RankCompare } from "@/components/analysis/RankCompare";
import { AttemptAnalysis } from "@/components/analysis/AttemptAnalysis";
import { TimeAnalysis } from "@/components/analysis/TimeAnalysis";
import { DifficultyAnalysis } from "@/components/analysis/DifficultyAnalysis";
import { ScorePotential } from "@/components/analysis/ScorePotential";
import { MistakeBook } from "@/components/analysis/MistakeBook";
import { supabase } from "@/integrations/supabase/client";
import { evaluateQuestionScore } from "@/lib/testScoring";
import { toast } from "sonner";

// --- Types ---

interface SubjectData {
  name: string;
  score: number;
  total: number;
  color: string;
  marksObtained: number;
  negativeMarks: number;
  unattempted: number;
  totalQuestions: number;
  timeSpent: string;
  correct: number;
  incorrect: number;
  timeSeconds: number;
}

interface QuestionData {
  questionNumber: number;
  questionId: string;
  timeSpent: number;
  subject: string;
  status: "correct" | "incorrect" | "skipped";
  marks: number;
  negativeMarks: number;
  userMarks: number;
  difficulty: string;
  userAnswer: string;
  correctAnswer: string;
  questionText?: string;
  imageUrl?: string;
  sectionType?: string;
  solutionText?: string;
  solutionImageUrl?: string;
}

interface RankData {
  rank: number;
  totalStudents: number;
  percentile: number;
  score: number;
  topperScore: number;
  averageScore: number;
  subjectRanks: { name: string; rank: number; total: number; percentile: number }[];
  scoreDistribution: { range: string; count: number; isUser: boolean }[];
}

// --- Constants ---

const subjectColors: Record<string, string> = {
  Mathematics: "hsl(45, 93%, 50%)",
  Maths: "hsl(45, 93%, 50%)",
  Math: "hsl(45, 93%, 50%)",
  Physics: "hsl(217, 91%, 60%)",
  Chemistry: "hsl(142, 76%, 45%)",
};

const formatTime = (seconds: number) => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
};

const formatTimeShort = (seconds: number) => {
  const minutes = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${minutes}m ${secs}s`;
};

const indexToLetter = (index: number | string | null | undefined): string => {
  if (index === null || index === undefined || index === "") return "";
  if (typeof index === 'string') {
    if (/^[A-D]$/i.test(index)) return index.toUpperCase();
    const num = parseInt(index, 10);
    if (!isNaN(num) && num >= 0 && num <= 3) return String.fromCharCode(65 + num);
    return index;
  }
  if (typeof index === 'number' && index >= 0 && index <= 3) return String.fromCharCode(65 + index);
  return String(index);
};

// --- Component ---

export default function AnalysisPage() {
  const navigate = useNavigate();
  const { testId } = useParams();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [testName, setTestName] = useState("");
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [questions, setQuestions] = useState<QuestionData[]>([]);
  const [rankData, setRankData] = useState<RankData | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [stats, setStats] = useState({
    score: 0, totalMarks: 0, timeUsedSeconds: 0, totalTimeSeconds: 0,
    accuracy: 0, rank: 0, totalStudents: 0, percentile: 0,
    attempted: 0, totalQuestions: 0, positiveScore: 0, marksLost: 0, hasTimeData: false,
  });

  useEffect(() => {
    if (testId) fetchTestAnalysis();
  }, [testId]);

  // Fetch bookmarks
  useEffect(() => {
    if (!testId) return;
    const fetchBookmarks = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("question_bookmarks")
        .select("question_id")
        .eq("test_id", testId)
        .eq("user_id", user.id);
      if (data) setBookmarkedIds(new Set(data.map(b => b.question_id)));
    };
    fetchBookmarks();
  }, [testId]);

  const toggleBookmark = useCallback(async (questionId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !testId) return;

    const isBookmarked = bookmarkedIds.has(questionId);
    if (isBookmarked) {
      await supabase.from("question_bookmarks").delete()
        .eq("user_id", user.id).eq("question_id", questionId);
      setBookmarkedIds(prev => { const n = new Set(prev); n.delete(questionId); return n; });
      toast.success("Bookmark removed");
    } else {
      await supabase.from("question_bookmarks").insert({
        user_id: user.id, test_id: testId, question_id: questionId,
      });
      setBookmarkedIds(prev => new Set(prev).add(questionId));
      toast.success("Question bookmarked");
    }
  }, [testId, bookmarkedIds]);

  const fetchTestAnalysis = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: test } = await supabase.from("tests").select("name, duration_minutes").eq("id", testId).single();
      if (!test) { navigate("/tests"); return; }

      const { data: attempt } = await supabase.from("test_attempts").select("*")
        .eq("test_id", testId).eq("user_id", user.id).single();
      if (!attempt) { navigate("/tests"); return; }

      const timePerQuestion: Record<string, number> = (attempt as any).time_per_question || {};
      const hasTimeData = Object.keys(timePerQuestion).length > 0;

      const { data: allAttempts } = await supabase.from("test_attempts")
        .select("score, rank, percentile, user_id").eq("test_id", testId)
        .not("completed_at", "is", null).order("score", { ascending: false });

      const totalStudents = allAttempts?.length || 1;

      const { data: sectionQuestions } = await supabase
        .from("test_section_questions")
        .select(`id, question_number, correct_answer, marks, negative_marks, is_bonus, section_id, question_text, image_url, image_urls, difficulty, solution_text, solution_image_url, solution_image_urls, test_sections!inner(name, section_type, test_subjects!inner(name))`)
        .eq("test_id", testId).order("question_number");

      const questionsData = (sectionQuestions || []).map((q: any) => {
        // Merge legacy single + multi images
        const imageUrls: string[] = [];
        if (q.image_url) imageUrls.push(q.image_url);
        if (Array.isArray(q.image_urls)) {
          for (const u of q.image_urls) { if (u && !imageUrls.includes(u)) imageUrls.push(u); }
        }
        const solutionImageUrls: string[] = [];
        if (q.solution_image_url) solutionImageUrls.push(q.solution_image_url);
        if (Array.isArray(q.solution_image_urls)) {
          for (const u of q.solution_image_urls) { if (u && !solutionImageUrls.includes(u)) solutionImageUrls.push(u); }
        }
        return {
          id: q.id, question_number: q.question_number,
          correct_answer: q.correct_answer,
          marks: q.marks ?? 4, negative_marks: q.negative_marks ?? 1,
          isBonus: q.is_bonus ?? false,
          subject: q.test_sections?.test_subjects?.name || "General",
          sectionType: q.test_sections?.section_type || "single_choice",
          difficulty: q.difficulty || "medium",
          questionText: q.question_text, imageUrl: q.image_url,
          imageUrls, solutionImageUrls,
          solutionText: q.solution_text, solutionImageUrl: q.solution_image_url,
        };
      });

      const userAnswers = (attempt.answers as Record<string, any>) || {};

      // Build subject stats & question results
      const subjectStats = new Map<string, {
        correct: number; incorrect: number; unattempted: number; totalQuestions: number;
        totalMarks: number; marksObtained: number; negativeMarks: number; timeSeconds: number;
      }>();

      const questionResults: QuestionData[] = [];
      let totalCorrect = 0, totalIncorrect = 0, totalPositiveScore = 0, totalNegativeScore = 0;

      questionsData.forEach((q) => {
        const subject = q.subject;
        if (!subjectStats.has(subject)) {
          subjectStats.set(subject, { correct: 0, incorrect: 0, unattempted: 0, totalQuestions: 0, totalMarks: 0, marksObtained: 0, negativeMarks: 0, timeSeconds: 0 });
        }
        const s = subjectStats.get(subject)!;
        s.totalQuestions++;
        s.totalMarks += q.marks;

        const rawUserAnswer = userAnswers[q.id];
        const evaluation = evaluateQuestionScore({
          sectionType: q.sectionType,
          correctAnswer: q.correct_answer,
          userAnswer: rawUserAnswer,
          marks: q.marks,
          negativeMarks: q.negative_marks,
          isBonus: q.isBonus,
        });

        if (evaluation.status === "skipped") {
          s.unattempted++;
        } else if (evaluation.status === "correct") {
          s.correct++;
          totalCorrect++;
        } else {
          s.incorrect++;
          totalIncorrect++;
        }

        if (evaluation.marksObtained > 0) {
          s.marksObtained += evaluation.marksObtained;
          totalPositiveScore += evaluation.marksObtained;
        } else if (evaluation.marksObtained < 0) {
          const lostMarks = Math.abs(evaluation.marksObtained);
          s.negativeMarks += lostMarks;
          totalNegativeScore += lostMarks;
        }

        const actualTimeSpent = timePerQuestion[q.id] || 0;
        s.timeSeconds += actualTimeSpent;

        questionResults.push({
          questionNumber: q.question_number, questionId: q.id,
          timeSpent: actualTimeSpent, subject, status: evaluation.status, marks: q.marks,
          negativeMarks: q.negative_marks, userMarks: evaluation.marksObtained, difficulty: q.difficulty,
          userAnswer: evaluation.userAnswerLabel,
          correctAnswer: evaluation.correctAnswerLabel, questionText: q.questionText,
          imageUrl: q.imageUrl, sectionType: q.sectionType,
          solutionText: q.solutionText, solutionImageUrl: q.solutionImageUrl,
        });
      });

      const subjectsArr: SubjectData[] = Array.from(subjectStats.entries()).map(([name, s]) => ({
        name, score: s.marksObtained - s.negativeMarks, total: s.totalMarks,
        color: subjectColors[name] || "hsl(270, 60%, 50%)",
        marksObtained: s.marksObtained, negativeMarks: s.negativeMarks,
        unattempted: s.unattempted, totalQuestions: s.totalQuestions,
        timeSpent: formatTimeShort(s.timeSeconds), correct: s.correct, incorrect: s.incorrect,
        timeSeconds: s.timeSeconds,
      }));

      const totalQ = questionsData.length;
      const attempted = totalCorrect + totalIncorrect;
      const accuracy = attempted > 0 ? Math.round((totalCorrect / attempted) * 100) : 0;
      const calculatedScore = totalPositiveScore - totalNegativeScore;
      const totalMarks = questionsData.reduce((sum, q) => sum + q.marks, 0);

      const topperScore = allAttempts?.[0]?.score || calculatedScore;
      const averageScore = allAttempts?.length ? Math.round(allAttempts.reduce((sum, a) => sum + (a.score || 0), 0) / allAttempts.length) : calculatedScore;

      const scoreDistribution = calculateScoreDistribution(allAttempts || [], calculatedScore);
      const subjectRanks = subjectsArr.map(s => ({ name: s.name, rank: attempt.rank || 1, total: totalStudents, percentile: attempt.percentile || 100 }));

      setTestName(test.name);
      setSubjects(subjectsArr);
      setQuestions(questionResults);
      setRankData({
        rank: attempt.rank || 1, totalStudents, percentile: attempt.percentile || 100,
        score: calculatedScore, topperScore, averageScore, subjectRanks, scoreDistribution,
      });
      setStats({
        score: calculatedScore, totalMarks, timeUsedSeconds: attempt.time_taken_seconds || 0,
        totalTimeSeconds: test.duration_minutes * 60, accuracy,
        rank: attempt.rank || 1, totalStudents, percentile: attempt.percentile || 100,
        attempted, totalQuestions: totalQ, positiveScore: totalPositiveScore,
        marksLost: totalNegativeScore, hasTimeData,
      });
    } catch (error) {
      console.error("Error fetching analysis:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab: string) => {
    if (tab === "solutions") {
      navigate(`/solutions/${testId}`);
    } else {
      setActiveTab(tab);
    }
  };

  const handleViewSolutions = () => navigate(`/solutions/${testId}`);
  const handleReviewMistakes = (subject: string) => navigate(`/solutions/${testId}?subject=${subject}&filter=incorrect`);

  // Derived data for tabs
  const attemptData = useMemo(() => ({
    subjects: subjects.map(s => ({
      name: s.name, correct: s.correct, incorrect: s.incorrect,
      unattempted: s.unattempted, totalQuestions: s.totalQuestions,
      accuracy: s.correct + s.incorrect > 0 ? Math.round((s.correct / (s.correct + s.incorrect)) * 100) : 0,
      color: s.color,
    })),
    questions: questions.map(q => ({
      questionNumber: q.questionNumber, status: q.status, subject: q.subject,
      marks: q.marks, negativeMarks: q.negativeMarks, userMarks: q.userMarks, difficulty: q.difficulty,
    })),
    totalCorrect: questions.filter(q => q.status === "correct").length,
    totalIncorrect: questions.filter(q => q.status === "incorrect").length,
    totalSkipped: questions.filter(q => q.status === "skipped").length,
    totalQuestions: questions.length,
    accuracy: stats.accuracy,
    attemptRate: questions.length > 0 ? Math.round(((questions.filter(q => q.status !== "skipped").length) / questions.length) * 100) : 0,
  }), [subjects, questions, stats.accuracy]);

  const timeData = useMemo(() => ({
    questions: questions.map(q => ({
      questionNumber: q.questionNumber, timeSpent: q.timeSpent,
      status: q.status, subject: q.subject, marks: q.marks,
    })),
    subjects: subjects.map(s => ({
      name: s.name, totalTime: s.timeSeconds, color: s.color,
      avgTime: s.correct + s.incorrect > 0 ? Math.round(s.timeSeconds / (s.correct + s.incorrect)) : 0,
      questionsAttempted: s.correct + s.incorrect, totalQuestions: s.totalQuestions,
    })),
    totalTimeUsed: stats.timeUsedSeconds,
    totalTimeAllowed: stats.totalTimeSeconds,
    hasTimeData: stats.hasTimeData,
  }), [questions, subjects, stats]);

  const difficultyData = useMemo(() => {
    const levels = ["easy", "medium", "hard"];
    const difficulties = levels.map(level => {
      const qs = questions.filter(q => q.difficulty === level);
      const attempted = qs.filter(q => q.status !== "skipped");
      const correct = qs.filter(q => q.status === "correct");
      const incorrect = qs.filter(q => q.status === "incorrect");
      return {
        level, total: qs.length, attempted: attempted.length,
        correct: correct.length, incorrect: incorrect.length,
        skipped: qs.filter(q => q.status === "skipped").length,
        accuracy: attempted.length > 0 ? Math.round((correct.length / attempted.length) * 100) : 0,
        avgTime: attempted.length > 0 ? Math.round(attempted.reduce((s, q) => s + q.timeSpent, 0) / attempted.length) : 0,
        marksGained: correct.reduce((s, q) => s + q.marks, 0),
        marksLost: incorrect.reduce((s, q) => s + q.negativeMarks, 0),
      };
    });

    const subjectDifficulties = subjects.map(s => {
      const subjectQs = questions.filter(q => q.subject === s.name);
      const makeDiff = (level: string) => {
        const qs = subjectQs.filter(q => q.difficulty === level);
        const correct = qs.filter(q => q.status === "correct").length;
        const attempted = qs.filter(q => q.status !== "skipped").length;
        return { total: qs.length, correct, accuracy: attempted > 0 ? Math.round((correct / attempted) * 100) : 0 };
      };
      return { subject: s.name, color: s.color, easy: makeDiff("easy"), medium: makeDiff("medium"), hard: makeDiff("hard") };
    });

    return { difficulties, subjectDifficulties };
  }, [questions, subjects]);

  const potentialData = useMemo(() => ({
    currentScore: stats.score, totalMarks: stats.totalMarks,
    positiveScore: stats.positiveScore, negativeScore: stats.marksLost,
    totalCorrect: questions.filter(q => q.status === "correct").length,
    totalIncorrect: questions.filter(q => q.status === "incorrect").length,
    totalSkipped: questions.filter(q => q.status === "skipped").length,
    subjectPotentials: subjects.map(s => {
      const subjectQs = questions.filter(q => q.subject === s.name);
      const easySkipped = subjectQs.filter(q => q.status === "skipped" && q.difficulty === "easy");
      return {
        name: s.name, color: s.color, currentScore: s.score,
        maxPossible: s.total, marksLostToNeg: s.negativeMarks,
        marksLostToSkip: subjectQs.filter(q => q.status === "skipped").reduce((sum, q) => sum + q.marks, 0),
        easySkipped: easySkipped.length,
        easySkippedMarks: easySkipped.reduce((sum, q) => sum + q.marks, 0),
      };
    }),
  }), [stats, subjects, questions]);

  const mistakeData = useMemo(() =>
    questions.filter(q => q.status === "incorrect" || q.status === "skipped").map(q => ({
      questionNumber: q.questionNumber, questionId: q.questionId,
      questionText: q.questionText, imageUrl: q.imageUrl,
      subject: q.subject, difficulty: q.difficulty,
      marks: q.marks, negativeMarks: q.negativeMarks,
      userAnswer: q.userAnswer, correctAnswer: q.correctAnswer,
      status: q.status as "incorrect" | "skipped",
      timeSpent: q.timeSpent, sectionType: q.sectionType,
      solutionText: q.solutionText, solutionImageUrl: q.solutionImageUrl,
      isBookmarked: bookmarkedIds.has(q.questionId),
    })),
  [questions, bookmarkedIds]);

  const timeProgress = stats.totalTimeSeconds > 0 ? (stats.timeUsedSeconds / stats.totalTimeSeconds) * 100 : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading analysis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <AnalysisSidebar activeTab={activeTab} onTabChange={handleTabChange} testName={testName} onBack={() => navigate("/tests")} />

      <main className="lg:ml-[72px] min-h-screen transition-all duration-200">
        <div className="p-4 lg:p-8 pt-16 lg:pt-8 max-w-7xl mx-auto space-y-6">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
            <h1 className="text-2xl lg:text-3xl font-bold font-display">{testName}</h1>
            <p className="text-muted-foreground mt-1">Detailed Performance Analysis</p>
          </motion.div>

          {activeTab === "overview" && (
            <>
              <OverviewCard
                score={stats.score} totalMarks={stats.totalMarks}
                timeUsed={formatTime(stats.timeUsedSeconds)} totalTime={formatTime(stats.totalTimeSeconds)}
                timeProgress={timeProgress} accuracy={stats.accuracy}
                rank={stats.rank} totalStudents={stats.totalStudents}
                subjects={subjects.map(s => ({ name: s.name, score: s.score, total: s.total, color: s.color }))}
                onViewSolutions={handleViewSolutions}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {subjects.map((subject, index) => (
                  <SubjectCard key={subject.name} {...subject} onReviewMistakes={() => handleReviewMistakes(subject.name)} delay={index} />
                ))}
              </div>
              <TimeOutcomeChart data={questions.map(q => ({ questionNumber: q.questionNumber, timeSpent: q.timeSpent, subject: q.subject, status: q.status }))} hasTimeData={stats.hasTimeData} />
            </>
          )}

          {activeTab === "attempt" && <AttemptAnalysis {...attemptData} />}

          {activeTab === "time" && <TimeAnalysis {...timeData} />}

          {activeTab === "difficulty" && <DifficultyAnalysis {...difficultyData} />}

          {activeTab === "potential" && <ScorePotential {...potentialData} />}

          {activeTab === "mistakes" && (
            <MistakeBook
              mistakes={mistakeData}
              onBookmark={toggleBookmark}
              onViewSolution={(qNum) => navigate(`/solutions/${testId}?question=${qNum}`)}
            />
          )}

          {activeTab === "rank" && rankData && (
            <RankCompare
              rank={rankData.rank} totalStudents={rankData.totalStudents}
              percentile={rankData.percentile} score={rankData.score}
              topperScore={rankData.topperScore} averageScore={rankData.averageScore}
              totalMarks={stats.totalMarks} subjectRanks={rankData.subjectRanks}
              scoreDistribution={rankData.scoreDistribution}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function calculateScoreDistribution(attempts: { score: number | null; user_id: string }[], userScore: number) {
  if (!attempts.length) return [];
  const scores = attempts.map(a => a.score || 0);
  const maxScore = Math.max(...scores);
  const minScore = Math.min(...scores);
  const bucketSize = Math.max(Math.ceil((maxScore - minScore) / 10), 10);
  const buckets: { range: string; count: number; isUser: boolean }[] = [];
  for (let i = 0; i < 10; i++) {
    const rangeStart = minScore + (i * bucketSize);
    const rangeEnd = rangeStart + bucketSize - 1;
    const count = scores.filter(s => s >= rangeStart && s <= rangeEnd).length;
    const isUser = userScore >= rangeStart && userScore <= rangeEnd;
    buckets.push({ range: `${rangeStart}-${rangeEnd}`, count, isUser });
  }
  return buckets.filter(b => b.count > 0);
}
