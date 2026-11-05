import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Calendar, ChevronRight, CircleAlert, Layers3, SlidersHorizontal } from "lucide-react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { evaluateQuestionScore } from "@/lib/testScoring";

type FilterOption = "all" | "last5" | "last10" | "custom";
type SubjectName = "Physics" | "Chemistry" | "Mathematics";

type QuestionStats = {
  correct: number;
  incorrect: number;
  unattempted: number;
  total: number;
};

type AttemptAnalytics = {
  subjectStats: Record<SubjectName, QuestionStats>;
  overall: QuestionStats;
};

type AttemptSummary = {
  id: string;
  testId: string;
  testName: string;
  completedAt: string;
  testTypeLabel: string;
  scorePercentage: number;
  subjectAccuracy: Record<SubjectName, number>;
  analytics: AttemptAnalytics;
};

type AggregateStats = {
  totalAttempts: number;
  subjects: Record<SubjectName, QuestionStats>;
  overall: QuestionStats;
  subjectAccuracy: Record<SubjectName, number>;
};

type QuestionMeta = {
  id: string;
  subject: SubjectName;
  sectionType?: string | null;
  correctAnswer: unknown;
  marks?: number | null;
  negativeMarks?: number | null;
  isBonus?: boolean | null;
};

const COLORS = {
  bg: "#050B16",
  card: "#0B1A2E",
  cardAlt: "#10233B",
  text: "#F4F7FF",
  textMuted: "#9AADC5",
  border: "#203B5C",
  blue: "#168BFF",
  cyan: "#18D5F5",
  purple: "#805BFF",
  correct: "#22C982",
  incorrect: "#F05268",
  unattempted: "#8199B8",
};

const SUBJECTS: SubjectName[] = ["Physics", "Chemistry", "Mathematics"];

const emptyQuestionStats = (): QuestionStats => ({ correct: 0, incorrect: 0, unattempted: 0, total: 0 });

const normalizeSubject = (value?: string | null): SubjectName => {
  const text = (value || "").toLowerCase();
  if (text.includes("phy")) return "Physics";
  if (text.includes("chem")) return "Chemistry";
  return "Mathematics";
};

const toTestTypeLabel = (testType?: string | null, examType?: string | null, testName?: string) => {
  const t = (testType || "").toLowerCase();
  const e = (examType || "").toLowerCase();
  const name = (testName || "").toLowerCase();

  if (t.includes("single") || name.includes("single")) return "Single Subject";
  if (t.includes("part") || name.includes("part") || name.includes("chapter")) return "Part Test";
  if (t.includes("full") || e.includes("jee")) return "Full Syllabus";
  return "Part Test";
};

const getBadge = (score: number) => {
  if (score >= 70) return { label: "Strong", className: "bg-[#22C982]/20 text-[#22C982] border-[#22C982]/40" };
  if (score >= 45) return { label: "Moderate", className: "bg-[#F59E0B]/20 text-[#FCD34D] border-[#F59E0B]/40" };
  return { label: "Needs Improvement", className: "bg-[#F05268]/20 text-[#F05268] border-[#F05268]/40" };
};

function CircularScore({ score }: { score: number }) {
  const [progress, setProgress] = useState(0);
  const size = 116;
  const stroke = 10;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    const id = requestAnimationFrame(() => setProgress(score));
    return () => cancelAnimationFrame(id);
  }, [score]);

  const clamped = Math.max(0, Math.min(100, progress));
  const dashOffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="transparent" stroke="#1B3554" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="url(#scoreGradient)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: "stroke-dashoffset 700ms ease" }}
        />
        <defs>
          <linearGradient id="scoreGradient" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor={COLORS.blue} />
            <stop offset="100%" stopColor={COLORS.cyan} />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-semibold text-[#F4F7FF] leading-none">{Math.round(clamped)}%</p>
        <p className="text-xs text-[#9AADC5] mt-1">Score</p>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [attempts, setAttempts] = useState<AttemptSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [filter, setFilter] = useState<FilterOption>("all");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const loadDashboard = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const { data: rawAttempts, error: attemptsError } = await supabase
        .from("test_attempts")
        .select("id, test_id, score, total_marks, completed_at, answers, awaiting_result, test:tests(name, test_type, exam_type)")
        .eq("user_id", user.id)
        .not("completed_at", "is", null)
        .order("completed_at", { ascending: false });

      if (attemptsError) throw attemptsError;

      const validAttempts = (rawAttempts || []).filter((attempt: any) => {
        if (!attempt.completed_at) return false;
        if (attempt.awaiting_result === true) return false;
        if (attempt.score === null || attempt.total_marks === null) return false;
        return true;
      });

      if (!validAttempts.length) {
        setAttempts([]);
        setLoading(false);
        return;
      }

      const testIds = Array.from(new Set(validAttempts.map((attempt: any) => attempt.test_id)));

      const [{ data: sectionQuestions }, { data: regularQuestions }] = await Promise.all([
        supabase
          .from("test_section_questions")
          .select(`
            id,
            test_id,
            correct_answer,
            marks,
            negative_marks,
            is_bonus,
            test_sections!inner (
              section_type,
              test_subjects!inner (name)
            )
          `)
          .in("test_id", testIds),
        supabase
          .from("test_questions")
          .select(`
            test_id,
            question_id,
            questions!inner (
              id,
              correct_answer,
              marks,
              negative_marks,
              question_type,
              chapters (courses(name))
            )
          `)
          .in("test_id", testIds),
      ]);

      const sectionByTest = new Map<string, QuestionMeta[]>();
      for (const row of sectionQuestions || []) {
        const testId = (row as any).test_id as string;
        const section = (row as any).test_sections;
        const subjectName = section?.test_subjects?.name as string | undefined;
        const question: QuestionMeta = {
          id: (row as any).id,
          subject: normalizeSubject(subjectName),
          sectionType: section?.section_type,
          correctAnswer: (row as any).correct_answer,
          marks: (row as any).marks,
          negativeMarks: (row as any).negative_marks,
          isBonus: (row as any).is_bonus,
        };

        const list = sectionByTest.get(testId) || [];
        list.push(question);
        sectionByTest.set(testId, list);
      }

      const regularByTest = new Map<string, QuestionMeta[]>();
      for (const row of regularQuestions || []) {
        const question = (row as any).questions;
        if (!question?.id) continue;

        const testId = (row as any).test_id as string;
        const subjectName = question?.chapters?.courses?.name as string | undefined;

        const questionMeta: QuestionMeta = {
          id: question.id,
          subject: normalizeSubject(subjectName),
          sectionType: question.question_type,
          correctAnswer: question.correct_answer,
          marks: question.marks,
          negativeMarks: question.negative_marks,
          isBonus: false,
        };

        const list = regularByTest.get(testId) || [];
        list.push(questionMeta);
        regularByTest.set(testId, list);
      }

      const mappedAttempts: AttemptSummary[] = validAttempts
        .map((attempt: any) => {
          const answers = (attempt.answers as Record<string, unknown>) || {};
          const testId = attempt.test_id as string;
          const testType = attempt.test?.test_type as string | null | undefined;

          const sectionQuestionsForTest = sectionByTest.get(testId) || [];
          const regularQuestionsForTest = regularByTest.get(testId) || [];

          const questions =
            testType === "pdf"
              ? sectionQuestionsForTest
              : regularQuestionsForTest.length > 0
                ? regularQuestionsForTest
                : sectionQuestionsForTest;

          const analytics: AttemptAnalytics = {
            subjectStats: {
              Physics: emptyQuestionStats(),
              Chemistry: emptyQuestionStats(),
              Mathematics: emptyQuestionStats(),
            },
            overall: emptyQuestionStats(),
          };

          for (const question of questions) {
            const answer = answers[question.id];
            const evaluation = evaluateQuestionScore({
              sectionType: question.sectionType,
              correctAnswer: question.correctAnswer,
              userAnswer: answer,
              marks: question.marks,
              negativeMarks: question.negativeMarks,
              isBonus: question.isBonus,
            });

            analytics.subjectStats[question.subject].total += 1;
            analytics.overall.total += 1;

            if (evaluation.status === "correct") {
              analytics.subjectStats[question.subject].correct += 1;
              analytics.overall.correct += 1;
            } else if (evaluation.status === "incorrect") {
              analytics.subjectStats[question.subject].incorrect += 1;
              analytics.overall.incorrect += 1;
            } else {
              analytics.subjectStats[question.subject].unattempted += 1;
              analytics.overall.unattempted += 1;
            }
          }

          const subjectAccuracy = SUBJECTS.reduce(
            (acc, subject) => {
              const total = analytics.subjectStats[subject].total;
              acc[subject] = total > 0 ? (analytics.subjectStats[subject].correct / total) * 100 : 0;
              return acc;
            },
            { Physics: 0, Chemistry: 0, Mathematics: 0 } as Record<SubjectName, number>,
          );

          const marksPercentage =
            attempt.total_marks && attempt.total_marks > 0
              ? Math.max(0, Math.min(100, (attempt.score / attempt.total_marks) * 100))
              : analytics.overall.total > 0
                ? (analytics.overall.correct / analytics.overall.total) * 100
                : 0;

          return {
            id: attempt.id,
            testId,
            testName: attempt.test?.name || "Untitled Test",
            completedAt: attempt.completed_at,
            testTypeLabel: toTestTypeLabel(testType, attempt.test?.exam_type, attempt.test?.name),
            scorePercentage: marksPercentage,
            subjectAccuracy,
            analytics,
          };
        })
        .filter((attempt) => attempt.analytics.overall.total > 0)
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());

      setAttempts(mappedAttempts);
    } catch (err) {
      console.error(err);
      setError("Failed to load dashboard analytics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) loadDashboard();
  }, [user]);

  const filteredAttempts = useMemo(() => {
    if (filter === "all") return attempts;
    if (filter === "last5") return attempts.slice(0, 5);
    if (filter === "last10") return attempts.slice(0, 10);

    const fromTime = fromDate ? new Date(`${fromDate}T00:00:00`).getTime() : null;
    const toTime = toDate ? new Date(`${toDate}T23:59:59`).getTime() : null;

    return attempts.filter((attempt) => {
      const timestamp = new Date(attempt.completedAt).getTime();
      if (fromTime && timestamp < fromTime) return false;
      if (toTime && timestamp > toTime) return false;
      return true;
    });
  }, [attempts, filter, fromDate, toDate]);

  const aggregate = useMemo<AggregateStats>(() => {
    const summary: AggregateStats = {
      totalAttempts: filteredAttempts.length,
      subjects: {
        Physics: emptyQuestionStats(),
        Chemistry: emptyQuestionStats(),
        Mathematics: emptyQuestionStats(),
      },
      overall: emptyQuestionStats(),
      subjectAccuracy: {
        Physics: 0,
        Chemistry: 0,
        Mathematics: 0,
      },
    };

    for (const attempt of filteredAttempts) {
      for (const subject of SUBJECTS) {
        summary.subjects[subject].correct += attempt.analytics.subjectStats[subject].correct;
        summary.subjects[subject].incorrect += attempt.analytics.subjectStats[subject].incorrect;
        summary.subjects[subject].unattempted += attempt.analytics.subjectStats[subject].unattempted;
        summary.subjects[subject].total += attempt.analytics.subjectStats[subject].total;
      }

      summary.overall.correct += attempt.analytics.overall.correct;
      summary.overall.incorrect += attempt.analytics.overall.incorrect;
      summary.overall.unattempted += attempt.analytics.overall.unattempted;
      summary.overall.total += attempt.analytics.overall.total;
    }

    for (const subject of SUBJECTS) {
      summary.subjectAccuracy[subject] =
        summary.subjects[subject].total > 0
          ? (summary.subjects[subject].correct / summary.subjects[subject].total) * 100
          : 0;
    }

    return summary;
  }, [filteredAttempts]);

  const rightPanelTitle = useMemo(() => {
    if (filter === "last5") return "Last 5 Tests";
    if (filter === "last10") return "Last 10 Tests";
    if (filter === "custom") return "Custom Range";
    return "All Tests";
  }, [filter]);

  const breakdownRows = useMemo(
    () => [
      { key: "Physics" as SubjectName, label: "Physics", stats: aggregate.subjects.Physics },
      { key: "Chemistry" as SubjectName, label: "Chemistry", stats: aggregate.subjects.Chemistry },
      { key: "Mathematics" as SubjectName, label: "Mathematics", stats: aggregate.subjects.Mathematics },
    ],
    [aggregate],
  );

  if (loading) {
    return (
      <DashboardLayout>
        <div className="p-4 lg:p-6 space-y-6">
          <div className="grid xl:grid-cols-[1.05fr_1fr] gap-6">
            <div className="space-y-4">
              <Skeleton className="h-12 w-48 bg-[#10233B]" />
              <Skeleton className="h-64 w-full bg-[#0B1A2E]" />
              <Skeleton className="h-64 w-full bg-[#0B1A2E]" />
            </div>
            <div className="space-y-4">
              <Skeleton className="h-80 w-full bg-[#0B1A2E]" />
              <Skeleton className="h-80 w-full bg-[#0B1A2E]" />
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="rounded-2xl border border-[#203B5C] bg-[#0B1A2E] p-8 text-center max-w-2xl mx-auto">
            <CircleAlert className="w-10 h-10 text-[#F05268] mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-[#F4F7FF] mb-2">Unable to load dashboard</h2>
            <p className="text-[#9AADC5] mb-5">{error}</p>
            <Button onClick={loadDashboard}>Try again</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-4 lg:p-6 space-y-6">
        <div className="grid xl:grid-cols-[1.05fr_1fr] gap-6">
          <section className="space-y-4">
            <div
              className="rounded-2xl border p-4 lg:p-5"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, boxShadow: "0 12px 40px rgba(3, 11, 26, 0.45)" }}
            >
              <div className="flex items-center justify-between">
                <h2 className="text-3xl font-semibold" style={{ color: COLORS.text }}>
                  Previous Exams
                </h2>
                <Link to="/tests" className="inline-flex items-center gap-1 rounded-full border px-4 py-2 text-sm hover:bg-[#10233B] transition" style={{ borderColor: COLORS.border, color: COLORS.textMuted }}>
                  View all
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {attempts.length === 0 ? (
              <div className="rounded-2xl border border-[#203B5C] bg-[#0B1A2E] p-8 text-center">
                <p className="text-[#F4F7FF] text-lg font-medium">No completed tests yet</p>
                <p className="text-[#9AADC5] mt-2">Complete your first test to start seeing analytics here.</p>
                <Link to="/tests" className="inline-flex mt-5 rounded-lg bg-[#168BFF] text-white px-4 py-2 text-sm font-medium hover:bg-[#157de6] transition">
                  Go to Test Library
                </Link>
              </div>
            ) : (
              attempts.slice(0, 5).map((attempt) => {
                const badge = getBadge(attempt.scorePercentage);

                return (
                  <button
                    key={attempt.id}
                    type="button"
                    onClick={() => navigate(`/test/${attempt.testId}/analysis?attemptId=${attempt.id}`)}
                    className="w-full text-left rounded-2xl border p-4 lg:p-5 transition hover:-translate-y-0.5"
                    style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, boxShadow: "0 12px 32px rgba(4, 12, 30, 0.42)" }}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-2xl font-semibold leading-tight text-[#F4F7FF]">{attempt.testName}</h3>
                        <p className="text-sm text-[#9AADC5] mt-1">Performance summary of your completed attempt.</p>
                      </div>
                      <span className={cn("text-sm px-3 py-1 rounded-full border font-medium", badge.className)}>{badge.label}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-3 text-sm text-[#9AADC5]">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#203B5C] bg-[#10233B] px-3 py-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(attempt.completedAt).toLocaleString()}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-[#203B5C] bg-[#10233B] px-3 py-1">
                        <Layers3 className="w-3.5 h-3.5" />
                        {attempt.testTypeLabel}
                      </span>
                    </div>

                    <div className="mt-5 grid sm:grid-cols-[130px_1fr] gap-5 items-center">
                      <CircularScore score={attempt.scorePercentage} />

                      <div className="space-y-2">
                        {SUBJECTS.map((subject) => (
                          <div key={subject} className="flex items-center justify-between text-base">
                            <span className="inline-flex items-center gap-2 text-[#C9D7EA]">
                              <span className="w-3 h-3 rounded-full" style={{ background: subject === "Physics" ? COLORS.blue : subject === "Chemistry" ? COLORS.purple : COLORS.cyan }} />
                              {subject}
                            </span>
                            <span className="font-semibold text-[#F4F7FF]">{Math.round(attempt.subjectAccuracy[subject])}%</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </button>
                );
              })
            )}
          </section>

          <section className="space-y-5">
            <div
              className="rounded-2xl border p-5"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, boxShadow: "0 12px 38px rgba(4, 12, 30, 0.44)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-[2rem] font-semibold text-[#F4F7FF]">Subject Wise Analysis · {rightPanelTitle}</h2>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="relative">
                    <SlidersHorizontal className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9AADC5]" />
                    <select
                      value={filter}
                      onChange={(event) => setFilter(event.target.value as FilterOption)}
                      className="pl-9 pr-8 py-2 rounded-lg border bg-[#10233B] text-[#F4F7FF] text-sm"
                      style={{ borderColor: COLORS.border }}
                    >
                      <option value="all">All Tests</option>
                      <option value="last5">Last 5 Tests</option>
                      <option value="last10">Last 10 Tests</option>
                      <option value="custom">Custom Date Range</option>
                    </select>
                  </div>
                </div>
              </div>

              {filter === "custom" && (
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(event) => setFromDate(event.target.value)}
                    className="h-10 rounded-lg border bg-[#10233B] px-3 text-sm text-[#F4F7FF]"
                    style={{ borderColor: COLORS.border }}
                  />
                  <input
                    type="date"
                    value={toDate}
                    onChange={(event) => setToDate(event.target.value)}
                    className="h-10 rounded-lg border bg-[#10233B] px-3 text-sm text-[#F4F7FF]"
                    style={{ borderColor: COLORS.border }}
                  />
                </div>
              )}

              <div className="mt-5 grid md:grid-cols-[1fr_190px] gap-6 items-end">
                <div className="h-64 border border-[#203B5C] rounded-xl p-4 bg-[#10233B]/50">
                  <div className="h-full flex items-end justify-around gap-4">
                    {SUBJECTS.map((subject) => {
                      const value = aggregate.subjectAccuracy[subject];
                      const barHeight = `${Math.max(6, value)}%`;
                      const gradient =
                        subject === "Physics"
                          ? "linear-gradient(180deg,#168BFF,#0F5DB3)"
                          : subject === "Chemistry"
                            ? "linear-gradient(180deg,#805BFF,#4E3FB8)"
                            : "linear-gradient(180deg,#18D5F5,#1296B3)";

                      return (
                        <div key={subject} className="flex flex-col items-center flex-1 h-full justify-end gap-2">
                          <span className="text-3xl font-semibold text-[#F4F7FF]">{Math.round(value)}%</span>
                          <div className="w-full max-w-[90px] h-[78%] rounded-xl bg-[#0B1A2E] border border-[#203B5C] flex items-end p-1">
                            <div className="w-full rounded-lg" style={{ height: barHeight, background: gradient }} />
                          </div>
                          <span className="text-xl text-[#D3E0F2]">{subject}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-5xl font-semibold text-[#F4F7FF]">{aggregate.totalAttempts}</p>
                    <p className="text-xl text-[#9AADC5]">Total Tests</p>
                  </div>
                  <div className="h-px bg-[#203B5C]" />
                  <div className="space-y-2 text-base">
                    <p className="text-[#9AADC5]">Total Questions <span className="text-[#F4F7FF] font-semibold float-right">{aggregate.overall.total.toLocaleString()}</span></p>
                    <p className="text-[#9AADC5]">Correct <span className="text-[#22C982] font-semibold float-right">{aggregate.overall.correct.toLocaleString()}</span></p>
                    <p className="text-[#9AADC5]">Incorrect <span className="text-[#F05268] font-semibold float-right">{aggregate.overall.incorrect.toLocaleString()}</span></p>
                    <p className="text-[#9AADC5]">Unattempted <span className="text-[#8199B8] font-semibold float-right">{aggregate.overall.unattempted.toLocaleString()}</span></p>
                  </div>
                </div>
              </div>
            </div>

            <div
              className="rounded-2xl border p-5"
              style={{ backgroundColor: COLORS.card, borderColor: COLORS.border, boxShadow: "0 12px 38px rgba(4, 12, 30, 0.44)" }}
            >
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <h2 className="text-[2rem] font-semibold text-[#F4F7FF]">Questions Breakdown · {rightPanelTitle}</h2>
                <div className="flex flex-wrap items-center gap-4 text-sm text-[#C9D7EA]">
                  <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.correct }} />Correct</span>
                  <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.incorrect }} />Incorrect</span>
                  <span className="inline-flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS.unattempted }} />Unattempted</span>
                </div>
              </div>

              <div className="space-y-4">
                {breakdownRows.map((row) => {
                  const total = row.stats.total || 1;
                  const correctWidth = (row.stats.correct / total) * 100;
                  const incorrectWidth = (row.stats.incorrect / total) * 100;
                  const unattemptedWidth = (row.stats.unattempted / total) * 100;

                  return (
                    <div key={row.key} className="grid grid-cols-[110px_1fr_72px] sm:grid-cols-[140px_1fr_88px] gap-3 items-center">
                      <span className="text-xl text-[#F4F7FF] font-medium">{row.label}</span>
                      <div className="h-11 rounded-full overflow-hidden border border-[#203B5C] bg-[#10233B] flex text-lg font-semibold">
                        <div className="h-full flex items-center justify-center text-white" style={{ width: `${correctWidth}%`, backgroundColor: COLORS.correct }}>
                          {correctWidth > 12 ? row.stats.correct.toLocaleString() : ""}
                        </div>
                        <div className="h-full flex items-center justify-center text-white" style={{ width: `${incorrectWidth}%`, backgroundColor: COLORS.incorrect }}>
                          {incorrectWidth > 12 ? row.stats.incorrect.toLocaleString() : ""}
                        </div>
                        <div className="h-full flex items-center justify-center text-white" style={{ width: `${unattemptedWidth}%`, backgroundColor: COLORS.unattempted }}>
                          {unattemptedWidth > 12 ? row.stats.unattempted.toLocaleString() : ""}
                        </div>
                      </div>
                      <span className="text-right text-xl text-[#9AADC5]">({row.stats.total.toLocaleString()})</span>
                    </div>
                  );
                })}

                <div className="h-px bg-[#203B5C] my-2" />

                <div className="grid grid-cols-[110px_1fr_72px] sm:grid-cols-[140px_1fr_88px] gap-3 items-center">
                  <span className="text-2xl text-[#F4F7FF] font-semibold">Overall</span>
                  <div className="h-12 rounded-full overflow-hidden border border-[#203B5C] bg-[#10233B] flex text-xl font-semibold">
                    <div className="h-full flex items-center justify-center text-white" style={{ width: `${aggregate.overall.total ? (aggregate.overall.correct / aggregate.overall.total) * 100 : 0}%`, backgroundColor: COLORS.correct }}>
                      {aggregate.overall.correct.toLocaleString()}
                    </div>
                    <div className="h-full flex items-center justify-center text-white" style={{ width: `${aggregate.overall.total ? (aggregate.overall.incorrect / aggregate.overall.total) * 100 : 0}%`, backgroundColor: COLORS.incorrect }}>
                      {aggregate.overall.incorrect.toLocaleString()}
                    </div>
                    <div className="h-full flex items-center justify-center text-white" style={{ width: `${aggregate.overall.total ? (aggregate.overall.unattempted / aggregate.overall.total) * 100 : 0}%`, backgroundColor: COLORS.unattempted }}>
                      {aggregate.overall.unattempted.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-right text-xl text-[#9AADC5]">({aggregate.overall.total.toLocaleString()})</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </DashboardLayout>
  );
}
