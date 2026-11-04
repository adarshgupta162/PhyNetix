import { Fragment, useState, useEffect, useCallback, useRef, type CSSProperties, type ReactNode, type MouseEvent as RME } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { WifiOff, Loader2 } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { useProctoring } from "@/hooks/useProctoring";
import FullscreenGuard from "@/components/test/FullscreenGuard";
import AccessibilityToolbar from "@/components/test/AccessibilityToolbar";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import "@/components/test/nta-test.css"; // exact NTA styles (scoped under .nta-root)

/* ─── TYPES ─── */
interface Question {
  id: string; order: number; question_text: string;
  options: string[] | null; difficulty: string; marks: number;
  negative_marks: number; question_type: string; subject: string;
  chapter: string; image_url?: string; image_urls?: string[];
  section_id?: string; section_order?: number;
  section_type?: string; paragraph_id?: string; paragraph_text?: string;
  paragraph_image_urls?: string[];
}
interface Section { id: string; name: string; questions: Question[]; section_type?: string; }
type AttemptProgressPayload = {
  answers?: Record<string, string | string[]>;
  time_per_question?: Record<string, number | string[]>;
};

const VISITED_QUESTIONS_META_KEY = "__visited_questions__";
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_PUBLISHABLE_KEY = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined;

/* ─── COLOURS ─── */
const C = {
  blueStripe:   "#4a90d9",
  headerGrey:   "#636363",
  yellow:       "#f5c518",
  instHdr:      "#add8e6",
  signInBlue:   "#29abe2",
  loginCard:    "#e8e8e8",
  loginHdr:     "#d0d0d0",
  topbarDark:   "#17365d",
  sectionTabBg: "#f4f7fb",
  secActive:    "#2463a6",
  secInactive:  "#e8f1fb",
  sidebarBg:    "#f0f5fb",
  sidebarTitle: "#2463a6",
  bottomBg:     "#f7f9fc",
  palGrey:      "#c8c8c8",
  palRed:       "#cc0000",
  palRed2:      "#cc0000",
  palGreen:     "#26a65b",
  palPurple:    "#7b2fbf",
};

/* ─── NTA STATUS SPRITE CLASSES (defined in nta-test.css, from the real NTA page) ─── */
const STATUS_CLASS: Record<string, string> = {
  "answered": "_answered_1fufs_21",
  "not-answered": "_notAnswered_1fufs_34",
  "not-visited": "_notVisited_1fufs_5",
  "marked": "_markedReview_1fufs_47",
  "answered-marked": "_answeredReview_1fufs_62",
};
type LegendCounts = { answered: number; notAnswered: number; notVisited: number; marked: number; answeredMarked: number };
type LegendPopupState = { key: string; left: number; top: number; arrowLeft: number; title?: string; wide?: boolean } | null;

/* ─── LEGEND POPUP (opens when an "i" icon is clicked) ─── */
function LegendPopup({ pos, counts }: { pos: NonNullable<LegendPopupState>; counts: LegendCounts }) {
  const rows: [string, number, string][] = [
    ["answered", counts.answered, "Answered"],
    ["not-answered", counts.notAnswered, "Not Answered"],
    ["not-visited", counts.notVisited, "Not Visited"],
    ["marked", counts.marked, "Marked for Review"],
    ["answered-marked", counts.answeredMarked, "Answered and Marked for Review (will also be evaluated)"],
  ];
  return (
    <div data-legend-popup style={{ position: "fixed", left: pos.left, top: pos.top, zIndex: 1000000, background: "rgb(229, 239, 249)", border: "1px solid rgb(204,204,204)", boxShadow: "0 4px 14px rgba(0,0,0,.2)", fontFamily: "Arial, sans-serif", color: "#000", fontSize: 12, width: pos.wide ? 500 : 238, maxWidth: "96vw" }}>
      <div style={{ position: "absolute", top: -6, left: pos.arrowLeft, width: 10, height: 10, background: "rgb(229, 239, 249)", borderLeft: "1px solid rgb(204,204,204)", borderTop: "1px solid rgb(204,204,204)", transform: "rotate(45deg)" }} />
      {pos.title && <div style={{ background: "rgb(240,246,252)", borderBottom: "1px solid rgb(204,204,204)", padding: "6px 8px", fontWeight: "bold", fontSize: 13, whiteSpace: "nowrap" }}>{pos.title}</div>}
      <div style={{ padding: "6px 8px 4px" }}>
        {rows.map(([st, v, label]) => (
          <div key={st} style={{ display: "flex", alignItems: "center", minHeight: 50, marginBottom: 2 }}>
            <span className={STATUS_CLASS[st]} style={{ paddingTop: 7, display: "inline-block", flexShrink: 0 }}>{v}</span>
            <span style={{ marginLeft: 6 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   MAIN COMPONENT
════════════════════════════════════════════════════════ */
export default function NormalTestInterface() {
  const { testId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const proctoring = useProctoring(testId, user?.id);

  /* ── STATE ── */
  const [attemptId, setAttemptId]               = useState<string | null>(null);
  const [testName, setTestName]                 = useState("Loading...");
  const [questions, setQuestions]               = useState<Question[]>([]);
  const [sections, setSections]                 = useState<Section[]>([]);
  const [activeSection, setActiveSection]       = useState<string | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers]                   = useState<Record<string, string | string[]>>({});
  const [draftQuestionId, setDraftQuestionId]   = useState<string | null>(null);
  const [draftAnswer, setDraftAnswer]           = useState<string | string[] | undefined>(undefined);
  const [markedForReview, setMarkedForReview]   = useState<Set<string>>(new Set());
  const [visitedQuestions, setVisitedQuestions] = useState<Set<string>>(new Set());
  const [timeLeft, setTimeLeft]                 = useState(0);
  const expiresAtRef                            = useRef<number | null>(null);
  const [showSubmitModal, setShowSubmitModal]   = useState(false);
  const [loading, setLoading]                   = useState(true);
  const [submitting, setSubmitting]             = useState(false);
  const [submitDisabled, setSubmitDisabled]     = useState(false);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(true);
  const [fullscreenExitCount, setFullscreenExitCount] = useState(0);
  const [currentScreen, setCurrentScreen]       = useState(1);
  const [agreedToTerms, setAgreedToTerms]       = useState(false);
  const [testDuration, setTestDuration]         = useState(0);
  const [hasExistingAttempt, setHasExistingAttempt] = useState(false);
  const [systemId, setSystemId]                 = useState("");
  const [studentName, setStudentName]           = useState("Student");
  const [studentAvatar, setStudentAvatar]       = useState<string | null>(null);
  const [examType, setExamType]                 = useState<string>("custom");
  const [testType, setTestType]                 = useState<string>("full");
  const [studentRollNumber, setStudentRollNumber] = useState("");
  const [timePerQuestion, setTimePerQuestion]   = useState<Record<string, number>>({});
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isSaving, setIsSaving]                 = useState(false);
  const [timeExpired, setTimeExpired]           = useState(false);
  const [showPalette, setShowPalette]           = useState(true);
  const [isOffline, setIsOffline]               = useState(!navigator.onLine);
  const [isMobileDevice, setIsMobileDevice]     = useState(false);
  const [integerCursorPosition, setIntegerCursorPosition] = useState(0);
  const persistQueueRef = useRef<Promise<void>>(Promise.resolve());
  const persistSequenceRef = useRef(0);
  const submittedRef = useRef(false);
  const sessionAccessTokenRef = useRef<string | null>(null);

  // tooltip hover state
  const [legendPopup, setLegendPopup] = useState<LegendPopupState>(null);
  // NTA UI-only state (popups / collapsible instruction box)
  const [showInstructions, setShowInstructions]   = useState(false);
  const [showQuestionPaper, setShowQuestionPaper] = useState(false);
  const [showSecInstr, setShowSecInstr]           = useState(true);
  const [unlockDate, setUnlockDate]             = useState<string | null>((location.state as { unlockDate?: string | null } | null)?.unlockDate || null);
  const [showUnlockPopup, setShowUnlockPopup]   = useState(false);

  // NTA layout: the page itself never scrolls — only the question area does
  useEffect(() => {
    if (currentScreen !== 4) return;
    const html = document.documentElement, body = document.body;
    const prev = [html.style.overflow, body.style.overflow];
    html.style.overflow = "hidden"; body.style.overflow = "hidden";
    return () => { html.style.overflow = prev[0]; body.style.overflow = prev[1]; };
  }, [currentScreen]);

  // close the legend popup when clicking anywhere else
  useEffect(() => {
    if (!legendPopup) return;
    const close = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest("[data-legend-trigger],[data-legend-popup]")) setLegendPopup(null); };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [legendPopup]);

  /* ════ API / BACKEND LOGIC — UNCHANGED ════ */

  // Online/offline detection
  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline = () => setIsOffline(false);
    window.addEventListener("offline", goOffline);
    window.addEventListener("online", goOnline);
    return () => { window.removeEventListener("offline", goOffline); window.removeEventListener("online", goOnline); };
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      sessionAccessTokenRef.current = data.session?.access_token ?? null;
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      sessionAccessTokenRef.current = session?.access_token ?? null;
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const ua = navigator.userAgent || "";
    const isMobileUA = /Android|iPhone|iPad|iPod|Mobile/i.test(ua);
    const isCoarsePointer = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
    setIsMobileDevice(isMobileUA || isCoarsePointer);
  }, []);

  useEffect(() => { if (testId) checkExistingAttemptFn(); }, [testId]);

  const checkExistingAttemptFn = async () => {
    try {
      const { data: testData } = await supabase.from("tests")
        .select("name, duration_minutes, fullscreen_enabled, exam_type, test_type")
        .eq("id", testId).single();
      if (testData) {
        setTestName(testData.name); setTestDuration(testData.duration_minutes);
        setFullscreenEnabled(testData.fullscreen_enabled ?? true);
        setExamType(testData.exam_type || "custom"); setTestType(testData.test_type || "full");
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase.from("profiles")
          .select("full_name, avatar_url, roll_number").eq("id", user.id).single();
        setStudentName(profile?.full_name || "Student");
        setStudentAvatar(profile?.avatar_url);
        setStudentRollNumber(profile?.roll_number || user.id.substring(0, 8));
        const storageKey = `systemId_${testId}`;
        let sid = localStorage.getItem(storageKey);
        if (!sid) { sid = `C${Math.floor(100 + Math.random() * 900)}`; localStorage.setItem(storageKey, sid); }
        setSystemId(sid);
        const { data: ea } = await supabase.from("test_attempts")
          .select("id, completed_at, fullscreen_exit_count, result_available_at")
          .eq("test_id", testId).eq("user_id", user.id).maybeSingle();
        if (ea) {
          if (ea.completed_at) { navigate(`/test/${testId}/analysis`); return; }
          // Don't auto-call prepare() here: getDisplayMedia requires a user gesture,
          // otherwise the browser blocks the screen-share prompt silently.
          // Show the start screen so the student clicks "Start" to grant camera + screen.
          setHasExistingAttempt(true);
          setFullscreenExitCount(ea.fullscreen_exit_count || 0);
          setAgreedToTerms(true);
          setCurrentScreen(1);
          setLoading(false);
          return;
        }
        const releaseDate = await getEffectiveUnlockDate(user.id);
        setUnlockDate(releaseDate);
      }
      setLoading(false);
    } catch (e) { console.error(e); setLoading(false); }
  };

  const getEffectiveUnlockDate = async (userId: string) => {
    if (!testId) return null;
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("batch_enrollments")
      .select("batch_id")
      .eq("user_id", userId)
      .eq("is_active", true);
    if (enrollmentError || !enrollments?.length) return null;

    const batchIds = enrollments.map((enrollment) => enrollment.batch_id);
    const { data: batchTests, error: batchTestsError } = await supabase
      .from("batch_tests")
      .select("unlock_date")
      .eq("test_id", testId)
      .in("batch_id", batchIds);
    if (batchTestsError || !batchTests?.length) return null;

    const unlockDates = batchTests
      .map((batchTest) => batchTest.unlock_date)
      .filter((date): date is string => !!date)
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
    return unlockDates[0] || null;
  };

  const getTimeUntilRelease = (releaseDate: string) => {
    const diff = new Date(releaseDate).getTime() - Date.now();
    if (diff <= 0) return "0m 0s";
    const totalSeconds = Math.floor(diff / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    if (days > 0) return `${days}d ${hours}h ${minutes}m ${seconds}s`;
    if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
    return `${minutes}m ${seconds}s`;
  };

  const startTest = async () => {
    if (!agreedToTerms) {
      toast({ title: "Please agree to the terms", description: "You must agree to the test rules before starting.", variant: "destructive" }); return;
    }
    if (unlockDate && new Date(unlockDate) > new Date()) {
      setShowUnlockPopup(true);
      return;
    }
    try {
      await proctoring.prepare();
    } catch (error: any) {
      toast({ title: "Live monitoring required", description: error.message || "Please allow required monitoring permissions.", variant: "destructive" });
      return;
    }
    if (fullscreenEnabled) {
      const el = document.documentElement;
      (el.requestFullscreen?.() || (el as any).webkitRequestFullscreen?.() || (el as any).mozRequestFullScreen?.() || (el as any).msRequestFullscreen?.())?.catch?.(() => {});
    }
    setCurrentScreen(4); setLoading(true); initializeTest();
  };

  const initializeTest = async () => {
    try {
      const { data: td } = await supabase.from("tests").select("fullscreen_enabled").eq("id", testId).single();
      if (td) setFullscreenEnabled(td.fullscreen_enabled ?? true);
      const { data: startData, error: startError } = await supabase.functions.invoke("start-test", { body: { test_id: testId } });
      if (startError || startData?.error) throw new Error(startData?.error || startError?.message || "Failed to start test");
      if (startData?.expired_submitted) {
        toast({ title: "Test auto-submitted", description: "Time was already over, so your attempt has been submitted." });
        navigate(`/test/${testId}/analysis`);
        return;
      }
      setAttemptId(startData.attempt_id); setTestName(startData.test_name);
      await proctoring.start(startData.attempt_id, { test_name: startData.test_name, interface: "normal" });
      const remaining = startData.remaining_seconds ?? startData.duration_minutes * 60;
      expiresAtRef.current = Date.now() + remaining * 1000;
      setTimeLeft(remaining);
      if (startData.fullscreen_exit_count) setFullscreenExitCount(startData.fullscreen_exit_count);
      if (startData.is_resume && startData.existing_answers) setAnswers(startData.existing_answers);
      setSubmitDisabled(Boolean(startData.submit_disabled));
      const existingTimeMapRaw = (startData.is_resume && startData.existing_time_per_question)
        ? startData.existing_time_per_question
        : {};
      const numericTimeMap = Object.entries(existingTimeMapRaw || {}).reduce<Record<string, number>>((acc, [qid, value]) => {
        if (qid === VISITED_QUESTIONS_META_KEY) return acc;
        const numericValue = Number(value);
        if (Number.isFinite(numericValue)) acc[qid] = numericValue;
        return acc;
      }, {});
      setTimePerQuestion(numericTimeMap);
      const { data: qData, error: qErr } = await supabase.functions.invoke("get-test-questions", { body: { test_id: testId } });
      if (qErr || qData?.error) throw new Error(qData?.error || qErr?.message || "Failed to load questions");
      if (!qData.questions?.length) throw new Error("No questions found for this test");
      const allQ: Question[] = qData.questions;
      setQuestions(allQ);
      const secMap = new Map<string, { section: Section; questions: Question[] }>();
      const verboseLabel = (qt: string) =>
        qt === "single_choice" ? "Single Choice Question"
        : qt === "multiple_choice" || qt === "multi" ? "Multiple Choice Question"
        : qt === "integer" || qt === "numerical" ? "Integer Question"
        : "Single Choice Question";
      allQ.forEach((q: Question) => {
        const subj = q.subject || "General";
        const qt = q.question_type || q.section_type || "single_choice";
        const label = verboseLabel(qt);
        // Group by subject + question type so duplicate question numbers across sections
        // get split into distinct sections instead of overlapping.
        const key = `${subj}__${qt}`;
        if (!secMap.has(key)) {
          secMap.set(key, {
            section: {
              id: key.toLowerCase().replace(/[^a-z0-9]/g, "-"),
              name: `${subj} (${label})`,
              questions: [],
              section_type: qt,
            },
            questions: [],
          });
        }
        secMap.get(key)!.questions.push(q);
      });
      const secList: Section[] = Array.from(secMap.values()).map(({ section, questions: qs }) => ({
        ...section,
        questions: qs.sort((a, b) => a.order - b.order),
        section_type: qs[0]?.section_type || qs[0]?.question_type || section.section_type || "single_choice",
      }));
      setSections(secList);
      if (secList.length) setActiveSection(secList[0].id);
      if (allQ.length) {
        const persistedVisited = Array.isArray(existingTimeMapRaw?.[VISITED_QUESTIONS_META_KEY])
          ? new Set((existingTimeMapRaw?.[VISITED_QUESTIONS_META_KEY] as string[]).filter(Boolean))
          : new Set<string>();
        let nextVisitedSet: Set<string>;

        if (startData.is_resume && persistedVisited.size > 0) {
          persistedVisited.add(allQ[0].id);
          nextVisitedSet = persistedVisited;
        } else if (startData.is_resume && startData.existing_answers) {
          // On resume: answered questions → visited (will show green via "answered" status)
          // Questions the user SAW but didn't answer → visited (will show red "not-answered")
          // Questions never seen → NOT visited (will show grey "not-visited" / white)
          // We only know which ones were answered, so mark only those as visited
          const answeredIds = new Set(
            Object.entries(startData.existing_answers)
              .filter(([_, v]) => v !== null && v !== undefined && v !== "" && !(Array.isArray(v) && (v as any[]).length === 0))
              .map(([id]) => id)
          );
          // Also mark the first question as visited (since user will see it)
          answeredIds.add(allQ[0].id);
          nextVisitedSet = answeredIds;
        } else {
          nextVisitedSet = new Set([allQ[0].id]);
        }
        setVisitedQuestions(nextVisitedSet);
        await supabase
          .from("test_attempts")
          .update({ time_per_question: buildPersistedTimePayload(numericTimeMap, nextVisitedSet) })
          .eq("id", startData.attempt_id);
      }
      setLoading(false);
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to start test.", variant: "destructive" });
      navigate("/tests");
    }
  };

  useEffect(() => {
    if (loading || currentScreen !== 4) return;
    const recompute = () => {
      const exp = expiresAtRef.current;
      if (!exp) return;
      const remaining = Math.max(0, Math.ceil((exp - Date.now()) / 1000));
      setTimeLeft(remaining);
      if (remaining <= 0) setTimeExpired(true);
    };
    recompute();
    const t = setInterval(recompute, 1000);
    const onVis = () => { if (document.visibilityState === "visible") recompute(); };
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("focus", recompute);
    return () => {
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("focus", recompute);
    };
  }, [loading, currentScreen]);

  const triggerExpiredSubmit = useCallback((reason: string, keepalive = false) => {
    if (!attemptId || !SUPABASE_URL || submittedRef.current) return;
    const payload = JSON.stringify({ attempt_id: attemptId, reason, ts: Date.now() });
    const functionUrl = `${SUPABASE_URL}/functions/v1/auto-submit-expired`;

    if (keepalive && navigator.sendBeacon && !sessionAccessTokenRef.current) {
      navigator.sendBeacon(functionUrl, new Blob([payload], { type: "application/json" }));
      return;
    }

    void fetch(functionUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(SUPABASE_PUBLISHABLE_KEY ? { apikey: SUPABASE_PUBLISHABLE_KEY } : {}),
        ...(sessionAccessTokenRef.current ? { Authorization: `Bearer ${sessionAccessTokenRef.current}` } : {}),
      },
      body: payload,
      keepalive,
    }).catch((error) => console.error("Failed to trigger expired auto-submit:", error));
  }, [attemptId]);

  // Safety net: when the user closes / hides the tab, fire a beacon to the auto-submit
  // edge function so the server submits this attempt immediately if time has expired.
  useEffect(() => {
    if (!attemptId || currentScreen !== 4) return;
    const onLeave = () => {
      try {
        if (expiresAtRef.current && Date.now() >= expiresAtRef.current) {
          triggerExpiredSubmit("page_leave_after_expiry", true);
        }
      } catch {}
    };
    window.addEventListener("pagehide", onLeave);
    window.addEventListener("beforeunload", onLeave);
    return () => {
      window.removeEventListener("pagehide", onLeave);
      window.removeEventListener("beforeunload", onLeave);
    };
  }, [attemptId, currentScreen, triggerExpiredSubmit]);

  const formatTime = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;

  const currentSection  = sections.find(s => s.id === activeSection);
  const currentQuestion = currentSection?.questions[currentQuestionIndex];
  const isMultipleChoice  = ["multiple_choice", "multi"].includes(currentQuestion?.question_type || "") || ["multiple_choice", "multi"].includes(currentQuestion?.section_type || "");
  const isIntegerQuestion = ["integer", "numerical"].includes(currentQuestion?.question_type || "");
  const currentQuestionId = currentQuestion?.id;

  useEffect(() => {
    if (!currentQuestionId || !proctoring.session?.id) return;
    proctoring.logEvent("question_change", {
      questionId: currentQuestionId,
      subjectName: currentQuestion?.subject || currentSection?.name,
      payload: { question_index: currentQuestionIndex + 1, section_id: activeSection },
    });
  }, [activeSection, currentQuestion?.subject, currentQuestionId, currentQuestionIndex, currentSection?.name, proctoring.session?.id]);

  useEffect(() => { setShowSecInstr(true); }, [currentQuestionId]); // instruction box is open on every question

  useEffect(() => {
    if (!proctoring.session?.id || !currentSection?.name) return;
    proctoring.logEvent("subject_change", { subjectName: currentSection.name, payload: { section_id: currentSection.id } });
  }, [currentSection?.id, currentSection?.name, proctoring.session?.id]);

  const buildPersistedTimePayload = useCallback((nextTimeMap: Record<string, number>, nextVisitedQuestions: Set<string>) => ({
    ...nextTimeMap,
    [VISITED_QUESTIONS_META_KEY]: Array.from(nextVisitedQuestions),
  }), []);

  const cloneAnswerValue = (answer?: string | string[]) => Array.isArray(answer) ? [...answer] : answer;
  const normalizeAnswerValue = (answer?: string | string[]) => {
    if (Array.isArray(answer)) return answer.length > 0 ? [...answer] : undefined;
    if (typeof answer === "string") return answer === "" ? undefined : answer;
    return answer;
  };
  const isAnswerPresent = (answer?: string | string[]) => Array.isArray(answer) ? answer.length > 0 : answer !== undefined && answer !== "";
  const displayedCurrentAnswer = currentQuestionId && draftQuestionId === currentQuestionId
    ? draftAnswer
    : cloneAnswerValue(currentQuestionId ? answers[currentQuestionId] : undefined);

  useEffect(() => {
    if (!currentQuestionId) {
      setDraftQuestionId(null);
      setDraftAnswer(undefined);
      return;
    }

    setDraftQuestionId(currentQuestionId);
    setDraftAnswer(cloneAnswerValue(answers[currentQuestionId]));
  }, [currentQuestionId, answers]);

  useEffect(() => {
    if (!isIntegerQuestion) {
      setIntegerCursorPosition(0);
      return;
    }
    const currentValue = typeof displayedCurrentAnswer === "string" ? displayedCurrentAnswer : "";
    setIntegerCursorPosition(currentValue.length);
  }, [currentQuestionId, isIntegerQuestion]);

  /* single choice — only one option selectable, cannot deselect */
  const handleAnswer = (idx: number) => {
    if (!currentQuestion) return;
    setDraftQuestionId(currentQuestion.id);

    if (isMultipleChoice) {
      const cur = Array.isArray(displayedCurrentAnswer)
        ? displayedCurrentAnswer
        : displayedCurrentAnswer
          ? [displayedCurrentAnswer as string]
          : [];
      const s = String(idx);
      setDraftAnswer(cur.includes(s) ? cur.filter(a => a !== s) : [...cur, s]);
    } else {
      // single choice — just set, never deselect
      setDraftAnswer(String(idx));
    }
  };

  const handleIntegerAnswer = (v: string) => {
    if (!currentQuestion) return;
    setDraftQuestionId(currentQuestion.id);
    const cursor = Math.min(integerCursorPosition, v.length);
    const cleaned = v.replace(/[^0-9.-]/g, "");
    setDraftAnswer(cleaned);
    setIntegerCursorPosition(Math.min(cursor, cleaned.length));
  };

  const setIntegerAnswerWithCursor = (nextValue: string, nextCursor: number) => {
    if (!currentQuestion) return;
    setDraftQuestionId(currentQuestion.id);
    setDraftAnswer(nextValue);
    setIntegerCursorPosition(Math.max(0, Math.min(nextCursor, nextValue.length)));
  };

  const handleIntegerKeypadInsert = (token: string) => {
    const currentValue = typeof displayedCurrentAnswer === "string" ? displayedCurrentAnswer : "";
    const cursor = Math.max(0, Math.min(integerCursorPosition, currentValue.length));
    const nextValue = `${currentValue.slice(0, cursor)}${token}${currentValue.slice(cursor)}`;
    setIntegerAnswerWithCursor(nextValue, cursor + token.length);
  };

  const handleIntegerKeypadBackspace = () => {
    const currentValue = typeof displayedCurrentAnswer === "string" ? displayedCurrentAnswer : "";
    if (!currentValue) return;
    const nextValue = currentValue.slice(0, -1);
    setIntegerAnswerWithCursor(nextValue, Math.min(integerCursorPosition, nextValue.length));
  };

  const moveIntegerCursor = (direction: "left" | "right") => {
    const currentValue = typeof displayedCurrentAnswer === "string" ? displayedCurrentAnswer : "";
    setIntegerCursorPosition((prev) => {
      if (direction === "left") return Math.max(0, prev - 1);
      return Math.min(currentValue.length, prev + 1);
    });
  };

  const clearIntegerAnswer = () => setIntegerAnswerWithCursor("", 0);

  const clearResponse = () => {
    if (!currentQuestion) return;
    setDraftQuestionId(currentQuestion.id);
    setDraftAnswer(undefined);
  };

  const buildCurrentTimeSnapshot = useCallback(() => {
    if (!currentQuestion) return timePerQuestion;

    const elapsedSeconds = Math.max(0, Math.floor((Date.now() - questionStartTime) / 1000));
    if (elapsedSeconds === 0) return timePerQuestion;

    return {
      ...timePerQuestion,
      [currentQuestion.id]: (timePerQuestion[currentQuestion.id] || 0) + elapsedSeconds,
    };
  }, [currentQuestion, questionStartTime, timePerQuestion]);

  const commitCurrentQuestionTime = useCallback(() => {
    const nextTimeMap = buildCurrentTimeSnapshot();
    setTimePerQuestion(nextTimeMap);
    setQuestionStartTime(Date.now());
    return nextTimeMap;
  }, [buildCurrentTimeSnapshot]);

  const enqueueAttemptUpdate = useCallback((payload: AttemptProgressPayload) => {
    if (!attemptId) return Promise.resolve();

    const requestId = ++persistSequenceRef.current;
    setIsSaving(true);

    const nextRequest = persistQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        const { error } = await supabase.from("test_attempts").update(payload).eq("id", attemptId);
        if (error) throw error;
      })
      .catch((error) => {
        console.error("Failed to save progress:", error);
      })
      .finally(() => {
        if (persistSequenceRef.current === requestId) {
          setIsSaving(false);
        }
      });

    persistQueueRef.current = nextRequest;
    return nextRequest;
  }, [attemptId]);

  useEffect(() => {
    if (currentScreen !== 4 || !attemptId || loading) return;
    const i = setInterval(() => {
      const nextTimeMap = buildCurrentTimeSnapshot();
      void enqueueAttemptUpdate({ time_per_question: buildPersistedTimePayload(nextTimeMap, visitedQuestions) });
    }, 10000);
    return () => clearInterval(i);
  }, [currentScreen, attemptId, loading, buildCurrentTimeSnapshot, enqueueAttemptUpdate, buildPersistedTimePayload, visitedQuestions]);

  const buildCommittedAnswers = useCallback(() => {
    if (!currentQuestion) return answers;

    const nextAnswers = { ...answers };
    const normalizedDraft = normalizeAnswerValue(displayedCurrentAnswer);

    if (normalizedDraft === undefined) delete nextAnswers[currentQuestion.id];
    else nextAnswers[currentQuestion.id] = normalizedDraft;

    return nextAnswers;
  }, [answers, currentQuestion, displayedCurrentAnswer]);

  const commitCurrentQuestionProgress = useCallback(async (options: { markForReview?: boolean; nextVisitedQuestions?: Set<string> } = {}) => {
    if (!currentQuestion) return;

    const nextAnswers = buildCommittedAnswers();
    const nextTimeMap = commitCurrentQuestionTime();

    if (options.markForReview) {
      setMarkedForReview(prev => {
        const next = new Set(prev);
        next.add(currentQuestion.id);
        return next;
      });
    }

    setAnswers(nextAnswers);
    await enqueueAttemptUpdate({ answers: nextAnswers, time_per_question: buildPersistedTimePayload(nextTimeMap, options.nextVisitedQuestions || visitedQuestions) });
  }, [buildCommittedAnswers, commitCurrentQuestionTime, currentQuestion, enqueueAttemptUpdate, buildPersistedTimePayload, visitedQuestions]);

  const navigateWithoutSavingAnswer = useCallback((navigateFn: () => void, nextVisitedQuestions?: Set<string>) => {
    const nextTimeMap = commitCurrentQuestionTime();
    void enqueueAttemptUpdate({ time_per_question: buildPersistedTimePayload(nextTimeMap, nextVisitedQuestions || visitedQuestions) });
    navigateFn();
  }, [commitCurrentQuestionTime, enqueueAttemptUpdate, buildPersistedTimePayload, visitedQuestions]);

  /* Commit answers only on explicit save actions */
  const getNextQuestionId = () => {
    if (!currentSection) return null;
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      return currentSection.questions[currentQuestionIndex + 1]?.id || null;
    }
    const currentSectionIndex = sections.findIndex(s => s.id === activeSection);
    if (currentSectionIndex >= 0 && currentSectionIndex < sections.length - 1) {
      return sections[currentSectionIndex + 1]?.questions?.[0]?.id || null;
    }
    return null;
  };

  const saveAndNext = async () => {
    const nextQuestionId = getNextQuestionId();
    const nextVisited = new Set(visitedQuestions);
    if (nextQuestionId) nextVisited.add(nextQuestionId);
    await commitCurrentQuestionProgress({ nextVisitedQuestions: nextVisited });
    goToNextQuestion();
  };

  const markForReviewAndNext = async () => {
    const nextQuestionId = getNextQuestionId();
    const nextVisited = new Set(visitedQuestions);
    if (nextQuestionId) nextVisited.add(nextQuestionId);
    await commitCurrentQuestionProgress({ markForReview: true, nextVisitedQuestions: nextVisited });
    goToNextQuestion();
  };

  const goToNextQuestion = () => {
    if (!currentSection) return;
    if (currentQuestionIndex < currentSection.questions.length - 1) {
      const ni = currentQuestionIndex + 1; setCurrentQuestionIndex(ni);
      const nq = currentSection.questions[ni];
      if (nq) setVisitedQuestions(p => new Set([...p, nq.id]));
    } else {
      const ci = sections.findIndex(s => s.id === activeSection);
      if (ci < sections.length - 1) {
        const ns = sections[ci + 1]; setActiveSection(ns.id); setCurrentQuestionIndex(0);
        if (ns.questions[0]) setVisitedQuestions(p => new Set([...p, ns.questions[0].id]));
      }
    }
  };

  const handleSubmit = useCallback(async (fromMax = false, forceSubmit = false) => {
    if (!attemptId || submitting) return;
    if (submitDisabled && !forceSubmit) {
      toast({ title: "Submission disabled", description: "Submission is disabled by your admin.", variant: "destructive" });
      return;
    }
    const { data: latestAttempt } = await supabase
      .from("test_attempts")
      .select("submit_disabled")
      .eq("id", attemptId)
      .maybeSingle();
    if (latestAttempt?.submit_disabled && !forceSubmit) {
      toast({ title: "Submission disabled", description: "Submission is disabled by your admin.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const submittedAnswers = buildCommittedAnswers();
      const nextTimeMap = buildCurrentTimeSnapshot();
      setTimePerQuestion(nextTimeMap);
      setAnswers(submittedAnswers);
      await enqueueAttemptUpdate({ answers: submittedAnswers, time_per_question: buildPersistedTimePayload(nextTimeMap, visitedQuestions) });

      const { data, error } = await supabase.functions.invoke("submit-test", {
        body: {
          attempt_id: attemptId,
          answers: submittedAnswers,
          time_taken_seconds: Math.max(1, (testDuration * 60) - timeLeft),
          fullscreen_exit_count: fullscreenExitCount,
          force_submit: forceSubmit,
        },
      });
      if (error || data?.error) throw new Error(data?.error || error?.message || "Failed to submit test");
      await proctoring.stop(fromMax ? "max_fullscreen_exits" : "submitted");
      submittedRef.current = true;
      navigate(`/test/${testId}/analysis`, { state: { results: data, testName } });
    } catch (e: any) {
      console.error(e);
      toast({ title: "Error", description: e.message || "Failed to submit test.", variant: "destructive" });
      setSubmitting(false);
    }
  }, [attemptId, timeLeft, testId, testName, navigate, submitting, fullscreenExitCount, buildCommittedAnswers, buildCurrentTimeSnapshot, enqueueAttemptUpdate, testDuration, buildPersistedTimePayload, visitedQuestions]);

  useEffect(() => { if (timeExpired && attemptId && !submitting) handleSubmit(false, true); }, [timeExpired, attemptId, submitting, handleSubmit]);

  const handleFullscreenExitCountChange = useCallback((count: number) => {
    setFullscreenExitCount(count);
    if (attemptId) supabase.from("test_attempts").update({ fullscreen_exit_count: count }).eq("id", attemptId).then(({ error }) => { if (error) console.error(error); });
    proctoring.logEvent("fullscreen_exit", { payload: { count } });
  }, [attemptId, proctoring]);

  const handleMaxFullscreenExits = useCallback(() => {
    toast({ title: "Test Auto-Submitted", description: "You exceeded the maximum allowed fullscreen exits.", variant: "destructive" });
    handleSubmit(true, true);
  }, [handleSubmit]);

  // NOTE: page-leave / tab-close auto-submit was removed by request.
  // The timer keeps running server-side. The `auto-submit-expired` edge function
  // submits the attempt when started_at + duration has elapsed, and the
  // FullscreenGuard force-submits after the 7th fullscreen exit. Closing the
  // tab or navigating away on its own will NOT submit the test.

  const resumeMonitoring = useCallback(async () => {
    try {
      await proctoring.recover();
      toast({ title: "Monitoring resumed", description: "Camera and screen sharing are live again." });
    } catch (error: any) {
      toast({ title: "Live monitoring required", description: error.message || "Please allow camera and screen sharing again.", variant: "destructive" });
    }
  }, [proctoring]);

  const getQuestionStatus = (qid: string) => {
    // "current" is not part of the status — answered/marked colours persist while viewing.
    // PaletteBtn receives `isCurrent` separately.
    if (markedForReview.has(qid) && isAnswerPresent(answers[qid])) return "answered-marked";
    if (markedForReview.has(qid)) return "marked";
    if (isAnswerPresent(answers[qid])) return "answered";
    if (visitedQuestions.has(qid)) return "not-answered";
    return "not-visited";
  };

  const getStatusCounts = (filterSection?: Section) => {
    const qs = filterSection ? filterSection.questions : questions;
    const answered       = qs.filter(q => isAnswerPresent(answers[q.id])).length;
    const notAnswered    = qs.filter(q => visitedQuestions.has(q.id) && !isAnswerPresent(answers[q.id])).length;
    const markedCount    = qs.filter(q => markedForReview.has(q.id)).length;
    const answeredMarked = qs.filter(q => markedForReview.has(q.id) && isAnswerPresent(answers[q.id])).length;
    const notVisited     = qs.filter(q => !visitedQuestions.has(q.id)).length;
    return { answered, notAnswered, markedCount, answeredMarked, notVisited };
  };

  const options = Array.isArray(currentQuestion?.options)
    ? currentQuestion.options.map((o: any) => typeof o === "object" && o !== null ? { text: o.text || o.label || "", image_url: o.image_url || null } : { text: o, image_url: null }).filter((o: any) => o.text?.trim())
    : typeof currentQuestion?.options === "object" && currentQuestion?.options !== null
      ? Object.values(currentQuestion.options as Record<string, any>).map((o: any) => typeof o === "object" && o !== null ? { text: o.text || o.label || "", image_url: o.image_url || null } : { text: o, image_url: null }).filter((o: any) => o.text?.trim())
      : [];

  /* ── LOADING ── */
  if (loading && currentScreen === 4) {
    return (
      <div style={{ minHeight: "100vh", background: "#eaf0f7", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 14, fontFamily: "Arial,sans-serif" }}>
        <Loader2 style={{ width: 48, height: 48, color: C.secActive }} className="animate-spin" />
        <p style={{ color: "#555" }}>Loading test, please wait…</p>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     SHARED HEADER — screens 1–3
  ════════════════════════════════════════════ */
  const renderHeader = () => (
    <>
      <div style={{ height: 40, background: C.blueStripe }} />
      <div style={{ background: C.headerGrey, display: "flex", alignItems: "stretch" }}>
        <div style={{ flex: 1, padding: "10px 16px", fontFamily: "Arial,sans-serif", color: "#fff" }}>
          <div style={{ fontSize: 13, color: "#ccc" }}>System Name :</div>
          <div style={{ fontSize: 30, fontWeight: "bold", color: C.yellow, lineHeight: 1.2, letterSpacing: 1 }}>{systemId || "C001"}</div>
          <div style={{ fontSize: 11, color: "#ccc", marginTop: 5 }}>Kindly contact the invigilator if there are any discrepancies in the Name and Photograph displayed on the screen or if the photograph is not yours</div>
        </div>
        <div style={{ display: "flex", alignItems: "center", padding: "10px 0" }}>
          <div style={{ textAlign: "right", paddingRight: 12, fontFamily: "Arial,sans-serif" }}>
            <div style={{ fontSize: 13, color: "#ccc" }}>Candidate Name :</div>
            <div style={{ fontSize: 26, fontWeight: "bold", color: C.yellow }}>{studentName}</div>
            <div style={{ fontSize: 13, color: "#ccc" }}>Subject : <span style={{ color: C.yellow }}>{testName}</span></div>
          </div>
          <div style={{ width: 76, height: 88, border: "3px solid #ccc", background: "#d8d8d8", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
            {studentAvatar ? <img data-a11y-preserve-img src={studentAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 46 }}>👤</span>}
          </div>
        </div>
      </div>
    </>
  );

  /* ════════════════════════════════════════════
     SCREEN 1 — Login
  ════════════════════════════════════════════ */
  if (currentScreen === 1) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", fontFamily: "Arial,sans-serif" }}>
        {renderHeader()}
        <div style={{ flex: 1, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{ width: 370, background: C.loginCard, border: "1px solid #bbb", boxShadow: "2px 2px 8px rgba(0,0,0,.18)", borderRadius: 2 }}>
            <div style={{ background: C.loginHdr, padding: "8px 14px", borderBottom: "1px solid #bbb", fontSize: 13, fontWeight: "bold", color: "#333" }}>Login</div>
            <div style={{ padding: "18px 16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 10 }}>
                <div style={{ width: 40, height: 36, background: "#d0d0d0", border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#555", flexShrink: 0 }}>👤</div>
                <input type="text" value={studentRollNumber} disabled readOnly style={{ flex: 1, height: 36, padding: "0 8px", border: "1px solid #bbb", background: "#f5f5f5", fontSize: 13, color: "#444", outline: "none" }} />
                <div style={{ width: 40, height: 36, background: "#d0d0d0", border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#555", cursor: "pointer", flexShrink: 0 }}>⌨</div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 3, marginBottom: 22 }}>
                <div style={{ width: 40, height: 36, background: "#d0d0d0", border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, color: "#555", flexShrink: 0 }}>🔒</div>
                <input type="password" value="•••••" disabled readOnly style={{ flex: 1, height: 36, padding: "0 8px", border: "1px solid #bbb", background: "#f5f5f5", fontSize: 13, color: "#666", outline: "none" }} />
                <div style={{ width: 40, height: 36, background: "#d0d0d0", border: "1px solid #aaa", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#555", cursor: "pointer", flexShrink: 0 }}>⌨</div>
              </div>
              <button onClick={() => setCurrentScreen(2)} style={{ width: "100%", height: 44, background: C.signInBlue, border: "none", color: "#fff", fontSize: 16, fontWeight: "bold", cursor: "pointer", borderRadius: 2 }}>
                Sign In
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     SCREEN 2 — General Instructions
  ════════════════════════════════════════════ */
  if (currentScreen === 2) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", fontFamily: "Arial,sans-serif" }}>
        <div style={{ height: 40, background: C.blueStripe }} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ background: C.instHdr, padding: "7px 16px", fontSize: 14, fontWeight: "bold", color: "#222", borderBottom: "1px solid #90c0d8" }}>Instructions</div>
            <div style={{ flex: 1, overflowY: "auto", padding: "22px 28px", fontSize: 13, color: "#1a1a1a", lineHeight: 1.85, background: "#fff" }}>
              <p style={{ fontWeight: "bold", fontSize: 14 }}>Please read the instructions carefully</p>
              <p style={{ color: "#cc2200", fontWeight: "bold", fontSize: 13, marginTop: 3 }}>This Mock Exam Only for Practice Purpose</p>
              <p style={{ fontWeight: "bold", textDecoration: "underline", marginTop: 24, marginBottom: 10, fontSize: 13 }}>General Instructions:</p>
              <ol style={{ marginLeft: 22, lineHeight: 2.1 }}>
                <li>Total duration of examination is <strong>{testDuration || 180} minutes</strong>.</li>
                <li>The clock will be set at the server. The countdown timer in the top right corner of screen will display the remaining time available for you to complete the examination. When the timer reaches zero, the examination will end by itself. You will not be required to end or submit your examination.</li>
                <li>The Question Palette displayed on the right side of screen will show the status of each question using one of the following symbols:</li>
              </ol>
              <div style={{ marginLeft: 30, marginTop: 18, display: "flex", flexDirection: "column", gap: 14 }}>
                {[
                  { bg: C.palGrey,   br: "4px", border: "1px solid #aaa", color: "#555", label: "You have not visited the question yet.", num: 1 },
                  { bg: C.palRed,    br: "50%", border: "none",           color: "#fff", label: "You have not answered the question.", num: 2 },
                  { bg: C.palGreen,  br: "50%", border: "none",           color: "#fff", label: "You have answered the question.", num: 3 },
                  { bg: C.palPurple, br: "50%", border: "none",           color: "#fff", label: "You have NOT answered the question, but have marked the question for review.", num: 4 },
                ].map(item => (
                  <div key={item.num} style={{ display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 28, height: 28, background: item.bg, borderRadius: item.br, border: item.border, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold", color: item.color, flexShrink: 0 }}>{item.num}</div>
                    <span>{item.label}</span>
                  </div>
                ))}
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div style={{ position: "relative", width: 28, height: 28, background: C.palPurple, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: "bold", color: "#fff", flexShrink: 0 }}>
                    5
                    <span style={{ position: "absolute", bottom: -2, right: -2, width: 10, height: 10, background: C.palGreen, borderRadius: "50%", border: "2px solid #fff" }} />
                  </div>
                  <span>The question(s) "Answered and Marked for Review" will be considered for evaluation.</span>
                </div>
              </div>
              <p style={{ marginTop: 16, fontSize: 12, color: "#555" }}>The Marked for Review status for a question simply indicates that you would like to look at that question again.</p>
            </div>
            <div style={{ padding: "10px 16px", borderTop: "1px solid #ddd", display: "flex", justifyContent: "flex-end", background: "#fff" }}>
              <button onClick={() => setCurrentScreen(3)} style={{ padding: "6px 22px", background: "#fff", border: "1px solid #999", fontSize: 13, cursor: "pointer", color: "#333" }}>
                Next &gt;
              </button>
            </div>
          </div>
          <div style={{ width: 190, borderLeft: "2px solid #000", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 26 }}>
            <div style={{ width: 100, height: 112, background: "#e0e0e0", border: "2px solid #aaa", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              {studentAvatar ? <img data-a11y-preserve-img src={studentAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 54 }}>👤</span>}
            </div>
            <p style={{ fontSize: 13, fontWeight: "bold", color: "#1a1a1a", textAlign: "center", padding: "0 8px" }}>{studentName}</p>
          </div>
        </div>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     SCREEN 3 — Other Important Instructions (JEE)
  ════════════════════════════════════════════ */
  if (currentScreen === 3) {
    return (
      <div style={{ minHeight: "100vh", background: "#fff", display: "flex", flexDirection: "column", fontFamily: "Arial,sans-serif" }}>
        <div style={{ height: 40, background: C.blueStripe }} />
        <div style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: 0 }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ background: C.instHdr, padding: "7px 16px", fontSize: 14, fontWeight: "bold", color: "#222", borderBottom: "1px solid #90c0d8" }}>Other Important Instructions</div>
            <div style={{ flex: 1, overflowY: "auto", padding: "20px 28px", fontSize: 13, color: "#1a1a1a", lineHeight: 1.9, background: "#fff" }}>
              <p style={{ textAlign: "center", fontWeight: "bold", marginBottom: 20 }}>General instructions:</p>
              <p style={{ fontWeight: "bold" }}>The motive for enabling this mock SAMPLE test is to familiarize the candidates with the Computer Based Test (CBT) environment of the JEE Main conducted by NTA.</p>
              <br />
              <p style={{ fontWeight: "bold" }}>The types of questions and marking scheme is only illustrative and is in no way indicative or representative of the actual JEE Main question paper.</p>
              <br />
              <p style={{ fontWeight: "bold" }}>Section wise Instructions</p>
              <br />
              <p style={{ fontWeight: "bold" }}>Note: There will be 25% negative marking for MCQ (Section A) only. No negative marking for Integer type (Section B).</p>
              <p style={{ fontWeight: "bold" }}>SECTION A: Multiple Choice Questions — Each question has 4 options, only 1 is correct.<br />+4 for correct answer, –1 for wrong answer, 0 for unattempted.</p>
              <br />
              <p style={{ fontWeight: "bold" }}>SECTION B: Integer / Numerical Value Questions — Enter a numerical answer.<br />+4 for correct answer, 0 for wrong or unattempted.</p>
              <br />
              <p style={{ fontWeight: "bold" }}>No clarification will be provided during the exam.</p>
              <br />
              <p style={{ fontWeight: "bold" }}>Calculators and other electronic devices are not allowed during the exam. Rough sheets and pens will be provided in the exam center. A virtual on-screen calculator is available for use.</p>
              <br />
              <p style={{ fontWeight: "bold" }}>Some questions may have more than one answer correct. Points will be given only when <span style={{ textDecoration: "underline" }}>ALL</span> the correct answers are marked and <span style={{ textDecoration: "underline" }}>NONE</span> of the incorrect are marked.</p>
            </div>
            <div style={{ borderTop: "1px solid #ddd", background: "#fff" }}>
              <div style={{ padding: "10px 20px 10px", display: "flex", alignItems: "flex-start", gap: 8, borderBottom: "1px solid #ddd" }}>
                <input type="checkbox" checked={agreedToTerms} onChange={e => setAgreedToTerms(e.target.checked)} style={{ marginTop: 3, width: 14, height: 14, flexShrink: 0, cursor: "pointer" }} />
                <span style={{ fontSize: 11.5, color: "#333", lineHeight: 1.65 }}>
                  I have read and understood the instructions. All computer hardware allotted to me are in proper working condition. I declare that I am not in possession of / not wearing / not carrying any prohibited gadget like mobile phone, bluetooth devices etc. /any prohibited material with me into the Examination Hall. I agree that in case of not adhering to the instructions, I shall be liable to be debarred from this Test and/or to disciplinary action, which may include ban from future Tests / Examinations
                </span>
              </div>
              <div style={{ padding: "10px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <button onClick={() => setCurrentScreen(2)} style={{ padding: "7px 18px", background: "#fff", border: "1px solid #888", fontSize: 13, cursor: "pointer", color: "#333" }}>
                  &lt; Previous
                </button>
                <button onClick={startTest} disabled={!agreedToTerms || loading}
                  style={{ padding: "9px 30px", background: agreedToTerms ? "#5ba3d9" : "#9ab8cc", border: "none", color: "#fff", fontSize: 14, fontWeight: "bold", cursor: agreedToTerms ? "pointer" : "not-allowed", borderRadius: 2 }}>
                  {loading ? "Loading…" : "I am ready to begin"}
                </button>
              </div>
            </div>
          </div>
          <div style={{ width: 190, borderLeft: "2px solid #000", background: "#fff", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 26 }}>
            <div style={{ width: 100, height: 112, background: "#e0e0e0", border: "2px solid #aaa", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
              {studentAvatar ? <img data-a11y-preserve-img src={studentAvatar} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <span style={{ fontSize: 54 }}>👤</span>}
            </div>
            <p style={{ fontSize: 13, fontWeight: "bold", color: "#1a1a1a", textAlign: "center", padding: "0 8px" }}>{studentName}</p>
          </div>
        </div>
        <AnimatePresence>
          {showUnlockPopup && unlockDate && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
              onClick={() => setShowUnlockPopup(false)}
            >
              <motion.div
                initial={{ scale: .95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: .95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                style={{ background: "#fff", border: "1px solid #bbb", borderRadius: 4, padding: 20, width: 420, maxWidth: "90vw", fontFamily: "Arial,sans-serif", boxShadow: "0 8px 32px rgba(0,0,0,.25)" }}
              >
                <div style={{ borderBottom: "2px solid #2979c5", paddingBottom: 8, marginBottom: 12, fontSize: 15, fontWeight: "bold", color: "#1a3a5c" }}>
                  Test not released yet
                </div>
                <p style={{ fontSize: 13, color: "#333", lineHeight: 1.6 }}>
                  This test will start in <strong>{getTimeUntilRelease(unlockDate)}</strong>.
                </p>
                <p style={{ fontSize: 12, color: "#666", marginTop: 6 }}>
                  Release time: {new Date(unlockDate).toLocaleString()}
                </p>
                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 16 }}>
                  <button
                    onClick={() => setShowUnlockPopup(false)}
                    style={{ padding: "8px 20px", background: "#fff", border: "1px solid #aaa", fontSize: 13, cursor: "pointer", borderRadius: 2, color: "#333" }}
                  >
                    Close
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  /* ════════════════════════════════════════════
     SCREEN 4 — MAIN TEST  (markup mirrors the real NTA page; styles come from nta-test.css)
  ════════════════════════════════════════════ */
  const sc = getStatusCounts(currentSection ?? undefined);
  const activeSectionIndex = sections.findIndex(s => s.id === activeSection);
  const sectionOffset = activeSectionIndex > 0
    ? sections.slice(0, activeSectionIndex).reduce((sum, s) => sum + s.questions.length, 0)
    : 0;

  /* display-only helpers (no logic / data is changed) */
  const typeLabelOf = (q?: Question) =>
    ["integer", "numerical"].includes(q?.question_type || "") ? "Numerical"
    : ["multiple_choice", "multi"].includes(q?.question_type || "") || ["multiple_choice", "multi"].includes(q?.section_type || "") ? "Multiple Correct"
    : "Single Correct";
  const secLabel = (sec?: Section) => (sec ? `${sec.questions[0]?.subject || "General"} ${typeLabelOf(sec.questions[0])}` : "Section");
  const fmtNeg = (n?: number) => `-${Math.abs(n || 0).toFixed(1)}`;
  const qTypeLabel = typeLabelOf(currentQuestion);
  const countsOf = (s?: Section): LegendCounts => { const c = getStatusCounts(s); return { answered: c.answered, notAnswered: c.notAnswered, notVisited: c.notVisited, marked: c.markedCount, answeredMarked: c.answeredMarked }; };
  const wq = showPalette ? "75%" : "56.25%"; // question blocks keep the same pixel width when the palette is collapsed
  const cellCur: CSSProperties = { boxShadow: "rgba(240, 255, 255, 0.4) 0px 0px 0px 100px inset", fontWeight: 800 };

  const openLegend = (e: RME, key: string, kind: "all" | "tab", title?: string) => {
    e.stopPropagation();
    if (legendPopup?.key === key) { setLegendPopup(null); return; }
    const el = e.currentTarget as HTMLElement, r = el.getBoundingClientRect();
    if (kind === "all") {
      setLegendPopup({ key, title, left: r.left + 9, top: r.bottom + 6, arrowLeft: -2 });
    } else {
      const tabBottom = ((el.closest(".nav-link") as HTMLElement | null) || el).getBoundingClientRect().bottom;
      const w = 500, cx = r.left + r.width / 2;
      const left = Math.max(5, Math.min(cx - w / 2, window.innerWidth - w - 5));
      setLegendPopup({ key, left, top: tabBottom + 22, arrowLeft: cx - left - 5, wide: true });
    }
  };

  const sectionInstructions = (sec?: Section) => {
    const q0 = sec?.questions[0];
    const isInt = ["integer", "numerical"].includes(q0?.question_type || "");
    const isMulti = typeLabelOf(q0) === "Multiple Correct";
    const word = (n: number) => ({ 5: "FIVE", 10: "TEN", 15: "FIFTEEN", 20: "TWENTY", 25: "TWENTY FIVE", 30: "THIRTY" } as Record<number, string>)[n];
    const n = sec?.questions.length || 0;
    return (
      <div style={{ padding: "12px 14px", fontSize: "clamp(13px, 2.8vw, 15px)", lineHeight: 1.55 }}>
        <ul style={{ marginBottom: 12, paddingLeft: 18, listStyleType: "disc" }}>
          <li style={{ marginBottom: 6 }}>This section contains <b>{word(n) ? `${word(n)} (${n})` : n}</b> questions.</li>
          {isInt
            ? <li style={{ marginBottom: 6 }}>Answer must be typed into the input box.</li>
            : <li style={{ marginBottom: 6 }}>Each question has <b>4</b> options A, B, C, D. <b>{isMulti ? "ONE OR MORE" : "ONLY ONE"}</b> of these 4 options {isMulti ? "may be" : "is"} the correct answer.</li>}
          <li style={{ marginBottom: 6 }}>For each question, choose the option corresponding to the correct answer.</li>
        </ul>
        <ul style={{ paddingLeft: 18, listStyleType: "disc" }}>
          <li style={{ marginBottom: 6, listStyle: "none" }}></li>
          <li>Answer to each question will be evaluated <u>according to the following marking scheme</u>:</li>
          <li style={{ marginBottom: 6 }}>
            <div style={{ marginLeft: 20 }}>
              <div><i>Full Marks</i> : +{q0?.marks ?? 4} If <b>ONLY</b> the correct option is chosen</div>
              <div><i>Zero Marks</i> : 0 If none of the options is chosen (i.e. the question is unanswered)</div>
              <div><i>Negative Marks</i> : {-Math.abs(q0?.negative_marks ?? 1)} In all other cases.</div>
            </div>
          </li>
        </ul>
      </div>
    );
  };
  const secMax = (sec?: Section) => (sec?.questions || []).reduce((a, q) => a + (q.marks || 0), 0);

  const modalShell = (title: string, note: string, onClose: () => void, body: ReactNode) => (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.5)", zIndex: 1000001, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div onClick={e => e.stopPropagation()} style={{ width: 500, maxWidth: "96vw", maxHeight: "82vh", background: "#fff", display: "flex", flexDirection: "column", fontFamily: "Arial, sans-serif", color: "#000" }}>
        <div style={{ background: "#4285f4", color: "#fff", padding: "4px 6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontWeight: "bold", fontSize: 16 }}>
          <span>{title}</span><span onClick={onClose} style={{ fontWeight: 400, fontSize: 14, cursor: "pointer" }}>Close ✕</span>
        </div>
        <div style={{ overflowY: "auto", padding: "0 3px 10px" }}>
          <p style={{ color: "#f00", fontSize: 19, lineHeight: 1.2, margin: "2px 2px 8px" }}>{note}</p>{body}
        </div>
      </div>
    </div>
  );

  const kb: CSSProperties = { border: "1px solid #333", borderRadius: 4, background: "#ececec", font: "bold 15px Arial", cursor: "pointer", color: "#000", height: 35, padding: 0 };

  const testContent = (
    <div className="nta-root" data-test-content style={{ height: "100dvh", overflow: "hidden" }}>

      {/* ── HEADER ── */}
      <div className="_top_header_cexgz_9" style={{ overflowX: "visible", whiteSpace: "normal" }}>
        <div style={{ fontFamily: "Arial, sans-serif", whiteSpace: "normal", textOverflow: "clip", display: "inline", width: "auto", paddingRight: 0 }}>{testName.toUpperCase()}</div>
        <div className="_header_right_controls_cexgz_21" style={{ display: "inline-flex" }}>
          <AccessibilityToolbar />
          <div className="_header_control_item_cexgz_27" style={{ fontFamily: "Arial, sans-serif" }} onClick={() => setShowInstructions(true)}>
            <div className="_instruction_icon_cexgz_121"></div>
            <span className="_instruction_text_cexgz_104" style={{ fontSize: 13, fontWeight: "normal" }}>Instructions</span>
          </div>
          <div className="_header_control_item_cexgz_27" style={{ fontFamily: "Arial, sans-serif" }} onClick={() => setShowQuestionPaper(true)}>
            <div className="_questions_icon_cexgz_139"></div>
            <span className="_questions_text_cexgz_89" style={{ fontSize: 13, fontWeight: "normal" }}>Question Paper</span>
          </div>
        </div>
      </div>

      {/* ── STICKY: test-name pill + Sections / Time Left ── */}
      <div className="sticky-top">
        <div className="_dropdown_section_cexgz_33 hide_on_mobile" style={{ width: showPalette ? "75%" : "100%" }}>
          <div className="_questions_status_cexgz_380">
            <div style={{ marginRight: 8, maxWidth: 150, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontWeight: "normal" }}>{testName}</div>
            <div className="instruction-icon-wrapper" data-legend-trigger style={{ display: "inline-block", position: "relative" }} onClick={e => openLegend(e, "__all", "all", testName)}>
              <div className="_instruction_icon_cexgz_121" style={{ cursor: "pointer" }}></div>
            </div>
          </div>
          <div className="_dropdown_arrow_cexgz_46"></div>
        </div>
        <div className="_section_time_row_cexgz_61 hide_on_mobile" style={{ width: showPalette ? "75%" : "100%", fontFamily: "OpenSans-Regular, sans-serif", fontWeight: 400 }}>
          <div style={{ color: "rgb(109, 109, 109)", fontSize: 16 }}>Sections</div>
          <div className="d-flex gap-2 align-items-center">
            <div><b style={{ color: timeLeft < 300 ? "#cc0000" : "rgb(54, 54, 54)", fontWeight: "normal", transition: "color 0.3s" }}>Time Left : <span className="px-1">{formatTime(timeLeft)}</span></b></div>
          </div>
        </div>
      </div>

      <div className="test-container container-fluid">
        <div className="row" style={{ height: "100%", minHeight: "100vh", backgroundColor: "white" }}>
          <div className={showPalette ? "col-xxl-10 col-lg-9 col-md-12" : "col-12"} style={{ paddingLeft: 0, paddingRight: 0 }}>

            {/* mobile palette strip */}
            <div className="custom_top_div mobile_only" style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <div style={{ flex: "1 1 auto", minWidth: 0 }}>
                <div className="_scrollmenu_r2ptz_1">
                  {currentSection?.questions.map((q, idx) => (
                    <span key={q.id}><div className="_badge_div_1fufs_1">
                      <span className={STATUS_CLASS[getQuestionStatus(q.id)]} style={{ paddingTop: 7, ...(currentQuestion?.id === q.id ? cellCur : {}) }}
                        onClick={() => { const nv = new Set(visitedQuestions); nv.add(q.id); navigateWithoutSavingAnswer(() => { setCurrentQuestionIndex(idx); setVisitedQuestions(nv); }, nv); }}>{idx + 1 + sectionOffset}</span>
                    </div></span>
                  ))}
                </div>
              </div>
            </div>

            {/* section tabs */}
            <div style={{ position: "relative" }}>
              <div className="custom_tab nav" role="tablist" style={{ overflowX: "auto", whiteSpace: "nowrap", padding: "0px 30px 0px 25px", display: "flex", flexFlow: "row", justifyContent: "flex-start", alignItems: "center" }}>
                {sections.map(sec => {
                  const act = activeSection === sec.id;
                  return (
                    <div key={sec.id} className="nav-item" style={{ display: "inline-block", flex: "0 0 auto", margin: 0 }}>
                      <a role="tab" aria-selected={act} tabIndex={act ? 0 : -1} href="#" className={(act ? "custom-active-tab" : "custom-inactive-tab") + " nav-link" + (act ? " active" : "")}
                        style={{ display: "inline-flex", flex: "0 0 auto", width: "auto", minWidth: "auto", justifyContent: "center", alignItems: "center", border: "1px solid rgb(211, 211, 211)", backgroundColor: act ? "rgb(55, 120, 189)" : "rgb(255, 255, 255)", color: act ? "rgb(255, 255, 255)" : "rgb(55, 120, 189)", padding: "5px 10px", margin: "6px 3px 3px", whiteSpace: "nowrap", fontSize: 14 }}
                        onClick={ev => {
                          ev.preventDefault();
                          const firstQ = sec.questions[0];
                          const nextVisited = new Set(visitedQuestions);
                          if (firstQ) nextVisited.add(firstQ.id);
                          navigateWithoutSavingAnswer(() => { setActiveSection(sec.id); setCurrentQuestionIndex(0); if (firstQ) setVisitedQuestions(nextVisited); }, nextVisited);
                        }}>
                        <div>{secLabel(sec)}</div>
                        <div className="_instruction_icon_tab_cexgz_130" data-legend-trigger onClick={e => openLegend(e, sec.id, "tab")}></div>
                      </a>
                    </div>
                  );
                })}
              </div>
              <div className="scroll-arrow" style={{ position: "absolute", top: "50%", left: 0, transform: "translateY(-50%)", cursor: "pointer", width: 20, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgb(255, 255, 255)", zIndex: 2 }}
                onClick={() => document.querySelector(".nta-root .custom_tab")?.scrollBy({ left: -150, behavior: "smooth" })}>
                <div style={{ width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderRight: "6px solid rgb(128, 128, 128)" }}></div>
              </div>
              <div className="scroll-arrow" style={{ position: "absolute", top: "50%", right: 0, transform: "translateY(-50%)", cursor: "pointer", width: 30, height: 40, display: "flex", alignItems: "center", justifyContent: "center", background: "rgb(255, 255, 255)", zIndex: 2 }}
                onClick={() => document.querySelector(".nta-root .custom_tab")?.scrollBy({ left: 150, behavior: "smooth" })}>
                <div style={{ width: 0, height: 0, borderTop: "6px solid transparent", borderBottom: "6px solid transparent", borderLeft: "6px solid rgb(128, 128, 128)" }}></div>
              </div>
            </div>

            {/* question container */}
            <div className="_ques_container_cexgz_369" id="question-container" style={{ maxHeight: "calc(100dvh - 270px)", paddingBottom: 40, overflowY: "auto", overscrollBehavior: "contain", position: "relative" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 15px", borderBottom: "1px solid rgb(224, 224, 224)", fontSize: 14, flexWrap: "nowrap", overflowX: "auto", whiteSpace: "nowrap", gap: 0 }}>
                <div>Question Type: {qTypeLabel}</div>
                <div style={{ fontSize: 14 }}>
                  <span style={{ color: "rgb(109, 109, 109)" }}> Marks for correct answer:</span> <span style={{ color: "rgb(3, 128, 1)" }}>{currentQuestion?.marks ?? 0}</span> | <span style={{ color: "rgb(109, 109, 109)" }}>Negative Marks:</span> <span style={{ color: "rgb(174, 29, 22)" }}>{fmtNeg(currentQuestion?.negative_marks)}</span>
                </div>
              </div>
              <div className="_top_row_cexgz_238" style={{ borderBottom: "1px solid rgb(200, 200, 200)" }}>
                <div className="_question_text_cexgz_248" style={{ fontWeight: "normal", marginLeft: 10 }}>
                  <span>Question No. {currentQuestionIndex + 1 + sectionOffset}<span className="ms-2 text-muted">#{currentQuestion?.id}</span></span>
                </div>
                <div className="_button_container_cexgz_252">
                  <span onClick={() => document.getElementById("question-container")?.scrollTo({ top: 99999, behavior: "smooth" })}
                    style={{ backgroundColor: "rgb(21, 126, 179)", cursor: "pointer", marginRight: 12, display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", userSelect: "none", marginBottom: 2 }}>
                    <i className="fe fe-arrow-down" style={{ fontSize: 18, fontWeight: "bold", color: "rgb(255, 255, 255)" }}></i>
                  </span>
                </div>
              </div>

              {/* section instruction box */}
              <div className="ms-md-3 ms-1" style={{ border: "2px solid rgb(51, 51, 51)", padding: 0, margin: "15px 8px", width: wq, fontFamily: "Arial, sans-serif" }}>
                <div className="accordion-trigger" onClick={() => setShowSecInstr(v => !v)} style={{ cursor: "pointer", padding: "12px 16px", fontSize: "clamp(14px, 3vw, 16px)", fontWeight: "bold", position: "relative", textAlign: "center", userSelect: "none", minHeight: 46, lineHeight: 1.4 }}>
                  <span style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center" }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={showSecInstr ? "m18 15-6-6-6 6" : "m6 9 6 6 6-6"} /></svg>
                  </span>
                  {secLabel(currentSection)} (Maximum Marks: {secMax(currentSection)})
                </div>
                <div id="instructionsCollapse" className={"collapse" + (showSecInstr ? " show" : "")}>{sectionInstructions(currentSection)}</div>
              </div>

              <div className="position-relative ps-md-3 ps-1" style={{ marginBottom: 100 }}>
                {currentQuestion?.paragraph_text && (
                  <div style={{ width: wq, margin: "0 8px 14px", padding: "10px 14px", background: "#fffde7", border: "1px solid #f0c040", lineHeight: 1.7 }}>
                    <LatexRenderer content={currentQuestion.paragraph_text} />
                    {currentQuestion.paragraph_image_urls?.map((img, i) => <img key={i} src={img} alt="" style={{ maxWidth: "min(100%, 420px)", maxHeight: 260, objectFit: "contain", marginTop: 6, display: "block" }} />)}
                  </div>
                )}
                <div className="_question_cexgz_89" style={{ width: wq, margin: "0 8px", padding: 0, fontFamily: "Arial, sans-serif" }}>
                  {currentQuestion?.question_text && <div><LatexRenderer content={currentQuestion.question_text} /></div>}
                  {(() => {
                    const imgs = currentQuestion?.image_urls?.length ? currentQuestion.image_urls : currentQuestion?.image_url ? [currentQuestion.image_url] : [];
                    return imgs.length > 0 && <div style={{ marginTop: 10 }}>{imgs.map((u, i) => <img key={i} src={u} alt="" style={{ maxWidth: "min(100%, 480px)", maxHeight: 320, objectFit: "contain", marginBottom: 6, display: "block" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />)}</div>;
                  })()}
                </div>

                <form className="_options_cexgz_284" id="option-form" onSubmit={e => e.preventDefault()} style={{ width: wq, margin: "0 8px", padding: 0, fontFamily: "Arial, sans-serif" }}>
                  {isIntegerQuestion ? (
                    <div style={{ width: 150, marginTop: 14 }}>
                      <input
                        type="text" inputMode={isMobileDevice ? "none" : "decimal"} readOnly={isMobileDevice}
                        value={typeof displayedCurrentAnswer === "string" ? displayedCurrentAnswer : ""}
                        onChange={e => handleIntegerAnswer(e.target.value)}
                        onClick={e => { const t = e.target as HTMLInputElement; setIntegerCursorPosition(Math.min(t.selectionStart ?? t.value.length, t.value.length)); }}
                        onSelect={e => { const t = e.target as HTMLInputElement; setIntegerCursorPosition(Math.min(t.selectionStart ?? t.value.length, t.value.length)); }}
                        style={{ width: "100%", height: 25, boxSizing: "border-box", border: "2px solid #000", borderRadius: 3, padding: "0 5px", fontSize: 15, outline: "none", background: "#fff", color: "#000", display: "block" }}
                      />
                      <div style={{ background: "#f4f4f4", padding: "9px 0 6px", textAlign: "center" }}>
                        <button type="button" onClick={handleIntegerKeypadBackspace} style={{ ...kb, width: 95 }}>Backspace</button>
                        <div style={{ width: 107, margin: "9px auto 0", display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 4 }}>
                          {["7", "8", "9", "4", "5", "6", "1", "2", "3", "0", ".", "-"].map(k => <button key={k} type="button" onClick={() => handleIntegerKeypadInsert(k)} style={kb}>{k}</button>)}
                        </div>
                        <div style={{ margin: "9px 0 6px" }}>
                          <button type="button" onClick={() => moveIntegerCursor("left")} style={{ ...kb, width: 41, marginRight: 6 }}>Left</button>
                          <button type="button" onClick={() => moveIntegerCursor("right")} style={{ ...kb, width: 53 }}>Right</button>
                        </div>
                        <button type="button" onClick={clearIntegerAnswer} style={{ ...kb, width: 75, whiteSpace: "nowrap" }}>Clear All</button>
                      </div>
                    </div>
                  ) : (
                    options.map((opt, idx) => {
                      const optStr = String(idx), cur = displayedCurrentAnswer;
                      const selected = isMultipleChoice ? Array.isArray(cur) && cur.includes(optStr) : cur === optStr;
                      return (
                        <div key={idx} className="col-xs-12 col-md-6 col-lg-4" style={{ width: "75%", padding: 0, margin: 0 }}>
                          <label className="_option_labels_cexgz_292">
                            <input type={isMultipleChoice ? "checkbox" : "radio"} name={`selected-${currentQuestion?.id}`} autoComplete="off" checked={selected} onChange={() => handleAnswer(idx)} />
                            <span className="_option_text_cexgz_300">
                              <div>
                                <LatexRenderer content={opt.text} />
                                {opt.image_url && <img src={opt.image_url} alt="" style={{ maxWidth: "min(100%, 360px)", maxHeight: 220, objectFit: "contain", marginTop: 6, display: "block" }} onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />}
                              </div>
                            </span>
                          </label>
                        </div>
                      );
                    })
                  )}

                  {/* footer actions */}
                  <div className="_footer_cexgz_304" style={{ position: "fixed", left: 0, bottom: 0, width: "100%", backgroundColor: "rgb(255, 255, 255)", zIndex: 1000 }}>
                    <div className="row">
                      <div className="d-flex justify-content-between justify-content-md-start col-md-7 col-12">
                        <button type="button" className="_button_transparent_cexgz_165 order-md-1 order-2 btn btn-primary" style={{ fontFamily: "Arial, sans-serif" }} onClick={markForReviewAndNext}>Mark for Review &amp; Next</button>
                        <button type="button" className="_button_transparent_cexgz_165 order-md-2 order-1 btn btn-primary" style={{ fontFamily: "Arial, sans-serif" }} onClick={clearResponse}>Clear Response</button>
                      </div>
                      <div className="d-flex justify-content-between justify-content-md-around col-md-5 col-12">
                        <button type="button" className="_button_save_cexgz_203 me-md-4 btn btn-primary" style={{ order: 1, marginLeft: "-16rem" }} onClick={saveAndNext}>Save &amp; Next</button>
                      </div>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>

          {/* ── SIDEBAR ── */}
          <div className={showPalette ? "d-none d-lg-block col-xxl-2 col-lg-3" : "d-none"} style={{ paddingLeft: 0, paddingRight: 0, zIndex: 1000 }}>
            <div className="container-fluid" style={{ padding: 0, position: "relative", margin: "-90px 0px 0px", height: "100%", borderLeft: "1px solid rgb(200, 200, 200)", backgroundColor: "rgb(229, 246, 253)", color: "rgb(0, 0, 0)" }}>
              <button type="button" className="d-none d-lg-flex align-items-center justify-content-center btn btn-primary" onClick={() => setShowPalette(false)}
                style={{ width: 20, height: 62, position: "absolute", top: "50%", left: -20, right: "auto", transform: "translateY(-50%)", borderRadius: "5px 0px 0px 5px", backgroundColor: "rgba(0, 0, 0, 0.973)", border: "1px solid rgba(200, 200, 200, 0.333)", color: "rgba(255, 255, 255, 0.392)", padding: 0, zIndex: 1000 }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -2 }}><path d="m9 18 6-6-6-6" /></svg>
              </button>
              <div className="d-md-block" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <div style={{ display: "flex", alignItems: "flex-start", padding: 15, borderBottom: "1px solid rgb(200, 200, 200)", color: "rgb(0, 0, 0)", flexShrink: 0 }}>
                  <img src={studentAvatar || "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="90" height="90"><rect width="90" height="90" fill="#dcdcdc"/><circle cx="45" cy="34" r="16" fill="#aaa"/><path d="M12 90c0-24 15-34 33-34s33 10 33 34z" fill="#aaa"/></svg>')} alt="user-profile" data-a11y-preserve-img className="no-invert" width={90} height={90} style={{ width: 90, height: 90, border: "1px solid rgb(200, 200, 200)", marginRight: 12, filter: "none", objectFit: "cover" }} />
                  <div style={{ fontSize: 16, marginTop: 4 }}>{studentName}</div>
                </div>

                <div style={{ padding: "0px 12px", backgroundColor: "white", flexShrink: 0 }}>
                  <div className="row"><div className="col">
                    <div className="row" style={{ marginTop: "2%", marginBottom: "4%", alignItems: "center", display: "flex", flexWrap: "wrap" }}>
                      {([["answered", sc.answered, "Answered"], ["not-answered", sc.notAnswered, "Not Answered"]] as [string, number, string][]).map(([st, v, label]) => (
                        <Fragment key={st}>
                          <div className="col-md-2 col-3" style={{ marginBottom: 6 }}><div className="_badge_div_1fufs_1"><span className={STATUS_CLASS[st]} style={{ paddingTop: 7, transform: "scale(0.65)", transformOrigin: "center center", display: "inline-block", marginLeft: -4 }}>{v}</span></div></div>
                          <div className="col-md-4 col-9" style={{ fontFamily: "Arial, sans-serif" }}><div className="_badge_ins_cexgz_148" style={{ color: "black" }}>{label}</div></div>
                        </Fragment>
                      ))}
                    </div>
                    <div className="row" style={{ marginBottom: "3%", alignItems: "center", display: "flex", flexWrap: "wrap" }}>
                      <div className="col-md-2 col-3" style={{ marginBottom: 6 }}><div className="_badge_div_1fufs_1"><span className={STATUS_CLASS["not-visited"]} style={{ paddingTop: 7, transform: "scale(0.65)", transformOrigin: "center center", display: "inline-block", marginLeft: -4 }}>{sc.notVisited}</span></div></div>
                      <div className="col-md-4 col-9" style={{ fontFamily: "Arial, sans-serif" }}><div className="_badge_ins_cexgz_148" style={{ color: "black" }}>Not Visited</div></div>
                      <div className="col-md-2 col-3" style={{ marginBottom: 6 }}><div className="_badge_div_1fufs_1"><span className={STATUS_CLASS["marked"]} style={{ paddingTop: 7, transform: "scale(0.65)", transformOrigin: "center center", display: "inline-block", marginLeft: -4 }}>{sc.markedCount}</span></div></div>
                      <div className="col-md-4 col-9" style={{ fontFamily: "Arial, sans-serif" }}><div className="_badge_ins_cexgz_148" style={{ color: "black" }}>Marked <span style={{ whiteSpace: "nowrap" }}>for review</span></div></div>
                    </div>
                    <div className="row" style={{ marginBottom: "3%", alignItems: "center", display: "flex", flexWrap: "wrap" }}>
                      <div className="col-md-2 col-3" style={{ marginBottom: 6 }}><div className="_badge_div_1fufs_1"><span className={STATUS_CLASS["answered-marked"]} style={{ paddingTop: 7, transform: "scale(0.65)", transformOrigin: "center center", display: "inline-block", marginLeft: -4 }}>{sc.answeredMarked}</span></div></div>
                      <div className="col-md-9 col-9" style={{ fontFamily: "Arial, sans-serif" }}><div className="_badge_ins_cexgz_148" style={{ color: "black" }}>Answered and Marked for Review (will also be evaluated)</div></div>
                    </div>
                  </div></div>
                </div>

                <div style={{ padding: "0px 12px", flexShrink: 0, backgroundColor: "rgb(229, 246, 253)" }}>
                  <div className="row"><span className="_small_header_cexgz_153">{secLabel(currentSection)}</span></div>
                  <div className="row" style={{ marginTop: "3%", marginBottom: "5%" }}><span style={{ fontSize: "0.85rem" }}>Choose a Question</span></div>
                </div>

                <div style={{ padding: "0px 12px", flex: "1 1 0%", overflowY: "auto", maxHeight: "max(138px, calc(100dvh - 500px))", backgroundColor: "rgb(229, 246, 253)" }}>
                  <div className="_right_section_mid_cexgz_444 row">
                    <div className="container-fluid" style={{ paddingLeft: "4%", paddingRight: "4%" }}>
                      <div className="g-0 row">
                        {currentSection?.questions.map((q, idx) => (
                          <div key={q.id} className="col-xl-3 col-lg-3 col-md-3 col-4">
                            <div className="_badge_div_1fufs_1">
                              <span className={STATUS_CLASS[getQuestionStatus(q.id)]}
                                style={{ paddingTop: 7, marginBottom: "7%", transform: "scale(0.9)", transformOrigin: "center center", display: "inline-block", marginLeft: -4, ...(currentQuestion?.id === q.id ? cellCur : {}) }}
                                onClick={() => {
                                  const nextVisited = new Set(visitedQuestions);
                                  nextVisited.add(q.id);
                                  navigateWithoutSavingAnswer(() => { setCurrentQuestionIndex(idx); setVisitedQuestions(nextVisited); }, nextVisited);
                                  if (window.innerWidth <= 768) setShowPalette(false);
                                }}>{idx + 1 + sectionOffset}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* sidebar re-open tab (only when the palette is collapsed) */}
      {!showPalette && (
        <button type="button" className="d-none d-lg-flex align-items-center justify-content-center btn btn-primary" onClick={() => setShowPalette(true)}
          style={{ width: 20, height: 62, position: "fixed", top: "50%", right: 0, transform: "translateY(-50%)", borderRadius: "5px 0px 0px 5px", backgroundColor: "rgba(0, 0, 0, 0.973)", border: "1px solid rgba(200, 200, 200, 0.333)", color: "rgba(255, 255, 255, 0.392)", padding: 0, zIndex: 1000 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#ffffff60" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: -2 }}><path d="m15 18-6-6 6-6" /></svg>
        </button>
      )}

      {/* Submit + footer divider (fixed, as on the NTA page) */}
      <button type="button" className="_button_save_cexgz_203 me-md-5 btn btn-primary" onClick={() => setShowSubmitModal(true)} disabled={submitting || submitDisabled}
        style={{ backgroundColor: "rgb(21, 126, 179)", borderColor: "rgb(21, 126, 179)", fontFamily: "Arial, sans-serif", zIndex: 1020, position: "fixed", bottom: "0vh", right: "0.6vw", order: 2 }}>
        {submitDisabled ? "Submit Disabled" : submitting ? "Submitting…" : "Submit"}
      </button>
      <div style={{ position: "fixed", bottom: 76, left: 0, width: "100%", height: 1, backgroundColor: "rgb(200, 200, 200)", zIndex: 1000 }}></div>

      {/* legend popup */}
      {legendPopup && <LegendPopup pos={legendPopup} counts={legendPopup.key === "__all" ? countsOf() : countsOf(sections.find(s => s.id === legendPopup.key))} />}

      {/* ── INSTRUCTIONS / QUESTION PAPER POPUPS (view only) ── */}
      {showInstructions && modalShell("Instructions", "Note that the timer is ticking while you read the instructions. Close this page to return to answering the questions.", () => setShowInstructions(false), (
        <div style={{ padding: "0 24px", fontSize: 16, lineHeight: 1.9 }}>
          <h3 style={{ fontSize: 20, fontWeight: "bold", margin: "16px 0 12px" }}>INSTRUCTIONS TO CANDIDATES</h3>
          <h4 style={{ fontSize: 15, fontWeight: "bold" }}>GENERAL INSTRUCTIONS</h4>
          <ol style={{ paddingLeft: 20, listStyle: "decimal" }}>
            <li>Total duration of the paper is {testDuration} minutes.</li>
            <li>The on-screen computer clock will be set at the server. The countdown timer in the top right corner of the computer screen will display the remaining time (in minutes) available for you to complete the examination. When the timer reaches zero, the examination will end by itself automatically. You will not be required to end or submit the answers of examination.</li>
            <li>The question palette shows the status of each question:</li>
          </ol>
          <div style={{ background: "rgb(229, 246, 253)", padding: 8 }}>
            {([["not-visited", "You have not visited the question yet."], ["not-answered", "You have not answered the question."], ["answered", "You have answered the question."], ["marked", "You have NOT answered the question, but have marked it for review."], ["answered-marked", "You have answered the question and marked it for review (it will also be evaluated)."]] as [string, string][]).map(([s, t], i) => (
              <div key={s} style={{ display: "flex", alignItems: "center", fontSize: 13, minHeight: 50 }}><span className={STATUS_CLASS[s]} style={{ paddingTop: 7, display: "inline-block", flexShrink: 0 }}>{i + 1}</span><span style={{ marginLeft: 8 }}>{t}</span></div>
            ))}
          </div>
        </div>
      ))}
      {showQuestionPaper && modalShell("Question Paper", "Note that the timer is ticking while you read the questions. Close this page to return to answering the questions.", () => setShowQuestionPaper(false), (
        <div>
          {(() => { let n = 0; return sections.map(sec => sec.questions.map(q => {
            n++;
            const opts: any[] = Array.isArray(q.options) ? q.options : [];
            return (
              <div key={q.id} style={{ display: "flex", padding: "8px 4px", borderBottom: "1px solid #ddd" }}>
                <b style={{ minWidth: 40, fontSize: 15, marginTop: 6 }}>Q.{n})</b>
                <div style={{ flex: 1, minWidth: 0, fontSize: 14 }}>
                  <div style={{ border: "2px solid #000", margin: "4px 0 8px" }}>
                    <div style={{ textAlign: "center", fontWeight: "bold", padding: "8px 10px" }}>{secLabel(sec)} (Maximum Marks: {secMax(sec)})</div>
                    {sectionInstructions(sec)}
                  </div>
                  <LatexRenderer content={q.question_text} />
                  {opts.map((o, k) => <div key={k} style={{ margin: "10px 6px", display: "flex", gap: 6 }}><span>{String.fromCharCode(65 + k)}.</span><LatexRenderer content={typeof o === "object" && o ? (o.text || o.label || "") : String(o)} /></div>)}
                  <div style={{ fontStyle: "italic", fontSize: 13, marginTop: 10 }}>Question Type: <b>{typeLabelOf(q)}</b> ; Marks for correct answer: <b style={{ color: "green" }}>{q.marks}</b> ; Negative Marks: <b style={{ color: "red" }}>{fmtNeg(q.negative_marks)}</b></div>
                </div>
              </div>
            );
          })); })()}
        </div>
      ))}

      {/* ── OFFLINE POPUP ── */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -40 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -40 }}
            style={{
              position: "fixed", top: 36, left: "50%", transform: "translateX(-50%)", zIndex: 99999,
              background: "#cc0000", color: "#fff", padding: "10px 24px", borderRadius: 6,
              boxShadow: "0 4px 16px rgba(0,0,0,.3)", display: "flex", alignItems: "center", gap: 8,
              fontFamily: "Arial,sans-serif", fontSize: 13, fontWeight: "bold",
            }}>
            <WifiOff style={{ width: 16, height: 16 }} />
            No internet connection. Your progress may not be saved.
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── MONITORING RECOVERY POPUP ── */}
      <AnimatePresence>
        {proctoring.needsRecovery && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.66)", zIndex: 100000, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
            <motion.div initial={{ scale: .96, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .96, opacity: 0 }}
              style={{ width: 430, maxWidth: "100%", background: "#fff", border: "1px solid #999", borderRadius: 4, padding: 20, fontFamily: "Arial,sans-serif", boxShadow: "0 10px 40px rgba(0,0,0,.35)" }}>
              <div style={{ fontSize: 16, fontWeight: "bold", color: "#cc0000", borderBottom: "2px solid #cc0000", paddingBottom: 8, marginBottom: 12 }}>
                Live monitoring stopped
              </div>
              <p style={{ fontSize: 13, color: "#333", lineHeight: 1.6, marginBottom: 14 }}>
                {proctoring.recoveryReason || "Camera or screen sharing stopped. Resume monitoring to continue the test."}
              </p>
              <button onClick={resumeMonitoring} disabled={proctoring.isPreparing}
                style={{ width: "100%", padding: "10px 18px", background: C.secActive, border: "none", color: "#fff", fontSize: 14, fontWeight: "bold", cursor: proctoring.isPreparing ? "wait" : "pointer", borderRadius: 2 }}>
                {proctoring.isPreparing ? "Opening permissions…" : "Resume Camera & Screen"}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── SUBMIT MODAL ── */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.55)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowSubmitModal(false)}>
            <motion.div initial={{ scale: .95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: .95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              style={{ background: "#fff", border: "1px solid #bbb", borderRadius: 4, padding: 22, width: 420, fontFamily: "Arial,sans-serif", boxShadow: "0 8px 32px rgba(0,0,0,.25)" }}>
              <div style={{ borderBottom: "2px solid #2979c5", paddingBottom: 8, marginBottom: 14, fontSize: 15, fontWeight: "bold", color: "#1a3a5c" }}>⚠ Submit Test — Confirmation</div>
              <p style={{ fontSize: 12, color: "#555", marginBottom: 12 }}>Are you sure you want to submit? Once submitted, you cannot change your answers.</p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 12 }}>
                {[
                  { bg: "#e8f5e9", color: "#2e7d32", val: sc.answered,                  lbl: "Answered" },
                  { bg: "#ffebee", color: "#c62828", val: questions.length - sc.answered, lbl: "Not Answered" },
                  { bg: "#f3e5f5", color: "#6a1b9a", val: sc.markedCount,                lbl: "Marked for Review" },
                  { bg: "#eceff1", color: "#455a64", val: sc.notVisited,                 lbl: "Not Visited" },
                ].map((s, i) => (
                  <div key={i} style={{ background: s.bg, padding: "10px 8px", textAlign: "center", borderRadius: 3 }}>
                    <div style={{ fontSize: 24, fontWeight: "bold", color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 11, color: "#666", marginTop: 2 }}>{s.lbl}</div>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 11, color: "#888", marginBottom: 14 }}>Answered &amp; Marked for Review questions will also be evaluated.</p>
              <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                <button onClick={() => setShowSubmitModal(false)}
                  style={{ padding: "8px 20px", background: "#fff", border: "1px solid #aaa", fontSize: 13, cursor: "pointer", borderRadius: 2, color: "#333" }}>Cancel</button>
                <button onClick={() => handleSubmit()} disabled={submitting || submitDisabled}
                  style={{ padding: "8px 20px", background: "#cc0000", border: "none", color: "#fff", fontSize: 13, fontWeight: "bold", cursor: "pointer", borderRadius: 2 }}>
                  {submitDisabled ? "Submit Disabled" : submitting ? "Submitting…" : "Yes, Submit"}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  if (fullscreenEnabled) {
    return (
      <FullscreenGuard maxExits={7} onMaxExitsReached={handleMaxFullscreenExits} onExitCountChange={handleFullscreenExitCountChange} initialExitCount={fullscreenExitCount}>
        {testContent}
      </FullscreenGuard>
    );
  }
  return testContent;
}
