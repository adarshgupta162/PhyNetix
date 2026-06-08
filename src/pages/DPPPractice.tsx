import { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ChevronLeft, ChevronRight, Clock, CheckCircle2,
  BookOpen, Send, AlertCircle, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import LatexRenderer from "@/components/ui/latex-renderer";
import AccessibilityToolbar from "@/components/test/AccessibilityToolbar";

interface DPPQuestion {
  id: string;
  question_number: number;
  question_text: string | null;
  question_image_url: string | null;
  question_image_urls?: string[] | null;
  question_type: string;
  options: any[];
  correct_answer: any;
  marks: number;
  negative_marks: number;
  solution_text: string | null;
  solution_image_url: string | null;
  solution_image_urls?: string[] | null;
  difficulty: string;
}

interface DPPInfo {
  id: string;
  title: string;
  subject: string;
  chapter: string | null;
  is_timed: boolean | null;
  duration_minutes: number | null;
}

export default function DPPPractice() {
  const { dppId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();

  const [dpp, setDpp] = useState<DPPInfo | null>(null);
  const [questions, setQuestions] = useState<DPPQuestion[]>([]);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [showSolution, setShowSolution] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);
  const [score, setScore] = useState({ correct: 0, wrong: 0, unattempted: 0, total: 0, marks: 0, maxMarks: 0 });
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [startTime] = useState(Date.now());

  useEffect(() => {
    if (dppId) fetchData();
  }, [dppId]);

  // Timer
  useEffect(() => {
    if (!dpp?.is_timed || !dpp.duration_minutes || submitted) return;
    setTimeLeft(dpp.duration_minutes * 60);
    const interval = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [dpp, submitted]);

  const fetchData = async () => {
    const [dppRes, qRes] = await Promise.all([
      supabase.from('dpps').select('id, title, subject, chapter, is_timed, duration_minutes').eq('id', dppId!).single(),
      supabase.from('dpp_questions').select('*').eq('dpp_id', dppId!).order('order_index'),
    ]);
    if (dppRes.data) setDpp(dppRes.data);
    if (qRes.data) setQuestions(qRes.data as DPPQuestion[]);
    setLoading(false);
  };

  const setAnswer = (qId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [qId]: value }));
  };

  const toggleSolution = (qId: string) => {
    setShowSolution(prev => ({ ...prev, [qId]: !prev[qId] }));
  };

  const handleSubmit = async () => {
    if (submitted) return;
    let correct = 0, wrong = 0, unattempted = 0, marks = 0, maxMarks = 0;

    questions.forEach(q => {
      maxMarks += q.marks;
      const ans = answers[q.id];
      if (!ans && ans !== 0) {
        unattempted++;
        return;
      }

      let isCorrect = false;
      if (q.question_type === 'single_choice') {
        isCorrect = ans === q.correct_answer;
      } else if (q.question_type === 'multi_choice') {
        const correctArr = Array.isArray(q.correct_answer) ? q.correct_answer.sort() : [];
        const ansArr = Array.isArray(ans) ? ans.sort() : [];
        isCorrect = JSON.stringify(correctArr) === JSON.stringify(ansArr);
      } else if (q.question_type === 'integer') {
        isCorrect = parseInt(ans) === parseInt(q.correct_answer);
      }

      if (isCorrect) {
        correct++;
        marks += q.marks;
      } else {
        wrong++;
        marks -= q.negative_marks;
      }
    });

    setScore({ correct, wrong, unattempted, total: questions.length, marks, maxMarks });
    setSubmitted(true);

    // Save attempt
    if (user) {
      await supabase.from('dpp_attempts').insert({
        user_id: user.id,
        dpp_id: dppId!,
        answers: answers as any,
        score: marks,
        total_marks: maxMarks,
        completed_at: new Date().toISOString(),
        time_taken_seconds: Math.floor((Date.now() - startTime) / 1000),
      });
    }
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!dpp || questions.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">DPP not found</h2>
          <Button onClick={() => navigate('/dpps')}>Go back</Button>
        </div>
      </div>
    );
  }

  const q = questions[currentQ];
  const isAnswered = (qId: string) => answers[qId] !== undefined;

  const getAnswerStatus = (q: DPPQuestion) => {
    const ans = answers[q.id];
    if (!ans && ans !== 0) return 'unattempted';
    if (q.question_type === 'single_choice') return ans === q.correct_answer ? 'correct' : 'wrong';
    if (q.question_type === 'integer') return parseInt(ans) === parseInt(q.correct_answer) ? 'correct' : 'wrong';
    if (q.question_type === 'multi_choice') {
      const ca = Array.isArray(q.correct_answer) ? q.correct_answer.sort() : [];
      const a = Array.isArray(ans) ? ans.sort() : [];
      return JSON.stringify(ca) === JSON.stringify(a) ? 'correct' : 'wrong';
    }
    return 'unattempted';
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="flex items-center justify-between px-4 py-3 max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dpps')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-semibold text-sm">{dpp.title}</h1>
              <p className="text-xs text-muted-foreground">{dpp.subject} {dpp.chapter ? `• ${dpp.chapter}` : ''}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {dpp.is_timed && timeLeft !== null && !submitted && (
              <Badge variant="outline" className="gap-1 text-sm">
                <Clock className="w-3.5 h-3.5" />
                {formatTime(timeLeft)}
              </Badge>
            )}
            {!submitted ? (
              <Button size="sm" onClick={handleSubmit} className="gap-1">
                <Send className="w-4 h-4" />Submit
              </Button>
            ) : (
              <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-sm">
                Score: {score.marks}/{score.maxMarks}
              </Badge>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto flex gap-6 p-6">
        {/* Main Question Area */}
        <div className="flex-1 min-w-0">
          {/* Score card after submission */}
          {submitted && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="glass-card p-6 mb-6"
            >
              <h3 className="font-bold text-lg mb-4">Results</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 rounded-lg bg-emerald-500/10">
                  <p className="text-2xl font-bold text-emerald-500">{score.correct}</p>
                  <p className="text-xs text-muted-foreground">Correct</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-red-500/10">
                  <p className="text-2xl font-bold text-red-500">{score.wrong}</p>
                  <p className="text-xs text-muted-foreground">Wrong</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-secondary">
                  <p className="text-2xl font-bold">{score.unattempted}</p>
                  <p className="text-xs text-muted-foreground">Skipped</p>
                </div>
                <div className="text-center p-3 rounded-lg bg-primary/10">
                  <p className="text-2xl font-bold text-primary">{score.marks}/{score.maxMarks}</p>
                  <p className="text-xs text-muted-foreground">Score</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Question */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQ}
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              className="glass-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <Badge variant="outline">Q{q.question_number}</Badge>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">{q.difficulty}</Badge>
                  <Badge variant="outline">+{q.marks} / -{q.negative_marks}</Badge>
                </div>
              </div>

              {q.question_text && (
                <div className="prose prose-sm dark:prose-invert mb-4">
                  <LatexRenderer content={q.question_text} />
                </div>
              )}

              {(() => {
                const imgs = q.question_image_urls?.length ? q.question_image_urls : q.question_image_url ? [q.question_image_url] : [];
                return imgs.map((url, idx) => (
                  <img key={idx} src={url} alt={`Question ${idx+1}`} className="max-h-60 rounded-lg border border-border mb-4" />
                ));
              })()}

              {/* Answer Input */}
              <div className="mt-6">
                {q.question_type === 'single_choice' && (
                  <RadioGroup
                    value={answers[q.id] || ''}
                    onValueChange={(v) => setAnswer(q.id, v)}
                    disabled={submitted}
                    className="space-y-3"
                  >
                    {(q.options || []).map((opt: any) => {
                      const isCorrect = submitted && opt.id === q.correct_answer;
                      const isWrong = submitted && answers[q.id] === opt.id && opt.id !== q.correct_answer;
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            isCorrect ? 'border-emerald-500 bg-emerald-500/10' :
                            isWrong ? 'border-red-500 bg-red-500/10' :
                            answers[q.id] === opt.id ? 'border-primary bg-primary/5' :
                            'border-border hover:border-primary/50'
                          }`}
                        >
                          <RadioGroupItem value={opt.id} />
                          <span className="font-medium mr-2">{opt.id}.</span>
                          <span className="flex-1">{opt.text}</span>
                          {isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                          {isWrong && <AlertCircle className="w-4 h-4 text-red-500" />}
                        </label>
                      );
                    })}
                  </RadioGroup>
                )}

                {q.question_type === 'multi_choice' && (
                  <div className="space-y-3">
                    {(q.options || []).map((opt: any) => {
                      const selected = Array.isArray(answers[q.id]) && answers[q.id].includes(opt.id);
                      const correctArr = Array.isArray(q.correct_answer) ? q.correct_answer : [];
                      const isCorrect = submitted && correctArr.includes(opt.id);
                      const isWrong = submitted && selected && !correctArr.includes(opt.id);
                      return (
                        <label
                          key={opt.id}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                            isCorrect ? 'border-emerald-500 bg-emerald-500/10' :
                            isWrong ? 'border-red-500 bg-red-500/10' :
                            selected ? 'border-primary bg-primary/5' :
                            'border-border hover:border-primary/50'
                          }`}
                        >
                          <Checkbox
                            checked={selected}
                            disabled={submitted}
                            onCheckedChange={(checked) => {
                              const cur = Array.isArray(answers[q.id]) ? answers[q.id] : [];
                              setAnswer(q.id, checked ? [...cur, opt.id] : cur.filter((x: string) => x !== opt.id));
                            }}
                          />
                          <span className="font-medium mr-2">{opt.id}.</span>
                          <span className="flex-1">{opt.text}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {q.question_type === 'integer' && (
                  <div className="space-y-2">
                    <Label>Your Answer</Label>
                    <Input
                      type="number"
                      value={answers[q.id] ?? ''}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      disabled={submitted}
                      placeholder="Enter integer answer"
                      className="max-w-xs"
                    />
                    {submitted && (
                      <p className={`text-sm font-medium ${getAnswerStatus(q) === 'correct' ? 'text-emerald-500' : 'text-red-500'}`}>
                        Correct answer: {q.correct_answer}
                      </p>
                    )}
                  </div>
                )}
              </div>

              {/* Solution (show after submit or on demand) */}
              {(submitted || showSolution[q.id]) && (q.solution_text || q.solution_image_url || q.solution_image_urls?.length) && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-6 p-4 rounded-lg border border-primary/20 bg-primary/5"
                >
                  <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                    <Eye className="w-4 h-4" />Solution
                  </h4>
                  {q.solution_text && <LatexRenderer content={q.solution_text} />}
                  {(() => {
                    const imgs = q.solution_image_urls?.length ? q.solution_image_urls : q.solution_image_url ? [q.solution_image_url] : [];
                    return imgs.map((url, idx) => (
                      <img key={idx} src={url} alt={`Solution ${idx+1}`} className="max-h-60 rounded-lg mt-2" />
                    ));
                  })()}
                </motion.div>
              )}

              {/* Navigation */}
              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setCurrentQ(prev => Math.max(0, prev - 1))}
                  disabled={currentQ === 0}
                >
                  <ChevronLeft className="w-4 h-4 mr-1" />Previous
                </Button>
                {!submitted && (
                  <Button variant="ghost" size="sm" onClick={() => toggleSolution(q.id)}>
                    <Eye className="w-4 h-4 mr-1" />
                    {showSolution[q.id] ? 'Hide' : 'Show'} Solution
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => setCurrentQ(prev => Math.min(questions.length - 1, prev + 1))}
                  disabled={currentQ === questions.length - 1}
                >
                  Next<ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Question Palette */}
        <div className="hidden lg:block w-64">
          <div className="glass-card p-4 sticky top-20">
            <h3 className="font-semibold text-sm mb-3">Questions</h3>
            <div className="grid grid-cols-5 gap-1.5">
              {questions.map((qq, i) => {
                let bg = 'bg-secondary text-muted-foreground';
                if (submitted) {
                  const status = getAnswerStatus(qq);
                  bg = status === 'correct' ? 'bg-emerald-500 text-white' :
                    status === 'wrong' ? 'bg-red-500 text-white' : 'bg-secondary text-muted-foreground';
                } else if (isAnswered(qq.id)) {
                  bg = 'bg-primary text-primary-foreground';
                }
                return (
                  <button
                    key={qq.id}
                    onClick={() => setCurrentQ(i)}
                    className={`w-10 h-10 rounded-lg text-xs font-medium transition-all ${bg} ${i === currentQ ? 'ring-2 ring-primary ring-offset-2 ring-offset-background' : ''}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>

            {submitted && (
              <div className="mt-4 space-y-2 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-emerald-500" />
                  <span>Correct ({score.correct})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-red-500" />
                  <span>Wrong ({score.wrong})</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded bg-secondary" />
                  <span>Skipped ({score.unattempted})</span>
                </div>
              </div>
            )}

            {!submitted && (
              <Button className="w-full mt-4" size="sm" onClick={handleSubmit}>
                <Send className="w-4 h-4 mr-1" />Submit
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
