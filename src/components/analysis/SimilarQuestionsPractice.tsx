import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, ChevronDown, ChevronUp, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface SimilarQ {
  id: string;
  question_type: string;
  question_text: string | null;
  image_urls: string[] | null;
  options: { label: string; text: string; image_url: string | null }[] | null;
  correct_answer: any;
  solution_text: string | null;
  solution_image_urls: string[] | null;
  difficulty: string | null;
}

const toLetters = (v: any): string[] => {
  if (v === null || v === undefined || v === "") return [];
  const arr = Array.isArray(v) ? v : String(v).split(",");
  return arr.map((x) => String(x).trim().toUpperCase()).filter(Boolean).sort();
};

export function SimilarQuestionsPractice({ questionId }: { questionId: string }) {
  const [items, setItems] = useState<SimilarQ[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    setItems([]);
    setOpen(false);
    supabase
      .from("test_similar_questions" as any)
      .select("id, question_type, question_text, image_urls, options, correct_answer, solution_text, solution_image_urls, difficulty")
      .eq("parent_question_id", questionId)
      .order("order_index")
      .then(({ data }) => {
        if (active) setItems(((data as any[]) ?? []) as SimilarQ[]);
      });
    return () => { active = false; };
  }, [questionId]);

  if (items.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6">
      <button type="button" onClick={() => setOpen((o) => !o)} className="w-full flex items-center justify-between gap-3 text-left">
        <div>
          <h3 className="font-semibold font-display flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" />
            Practice similar questions
            <Badge variant="secondary">{items.length}</Badge>
          </h3>
          <p className="text-sm text-muted-foreground mt-1">Strengthen this concept with questions picked by your teacher.</p>
        </div>
        {open ? <ChevronUp className="w-5 h-5 text-muted-foreground" /> : <ChevronDown className="w-5 h-5 text-muted-foreground" />}
      </button>

      {open && (
        <div className="mt-5 space-y-5">
          {items.map((q, i) => <PracticeCard key={q.id} q={q} index={i} />)}
        </div>
      )}
    </motion.div>
  );
}

function PracticeCard({ q, index }: { q: SimilarQ; index: number }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [numeric, setNumeric] = useState("");
  const [checked, setChecked] = useState(false);

  const isInteger = q.question_type === "integer";
  const isMulti = q.question_type === "multiple_choice";
  const correct = isInteger ? [] : toLetters(q.correct_answer);

  const isCorrect = (() => {
    if (!checked) return false;
    if (isInteger) {
      const a = parseFloat(numeric);
      const b = parseFloat(String(q.correct_answer ?? ""));
      if (!isNaN(a) && !isNaN(b)) return Math.abs(a - b) < 1e-6;
      return numeric.trim() === String(q.correct_answer ?? "").trim();
    }
    return JSON.stringify([...selected].sort()) === JSON.stringify(correct);
  })();

  const toggle = (label: string) => {
    if (checked) return;
    if (isMulti) setSelected((s) => (s.includes(label) ? s.filter((x) => x !== label) : [...s, label]));
    else setSelected([label]);
  };

  const canCheck = isInteger ? numeric.trim() !== "" : selected.length > 0;
  const reset = () => { setSelected([]); setNumeric(""); setChecked(false); };

  return (
    <div className="rounded-xl border border-border bg-card/60 p-4 space-y-4">
      <div className="flex items-center gap-2">
        <span className="px-2 py-0.5 rounded bg-primary/15 text-primary text-xs font-semibold">Practice {index + 1}</span>
        <span className="text-xs text-muted-foreground capitalize">{q.question_type.replace("_", " ")}</span>
        {q.difficulty && <span className="text-xs text-muted-foreground capitalize">· {q.difficulty}</span>}
      </div>

      {q.question_text && <div className="text-sm leading-relaxed"><LatexRenderer content={q.question_text} /></div>}
      {(q.image_urls ?? []).map((u) => (
        <img key={u} src={u} alt="Question" className="max-w-full max-h-72 object-contain rounded-md border border-border" />
      ))}

      {isInteger ? (
        <Input
          value={numeric}
          onChange={(e) => setNumeric(e.target.value)}
          disabled={checked}
          placeholder="Enter your answer"
          className="max-w-xs font-mono"
        />
      ) : (
        <div className="grid gap-2">
          {(q.options ?? []).map((o) => {
            const picked = selected.includes(o.label);
            const right = correct.includes(o.label);
            return (
              <button
                key={o.label}
                type="button"
                onClick={() => toggle(o.label)}
                className={cn(
                  "flex items-start gap-3 p-3 rounded-lg border text-left transition-colors",
                  !checked && picked && "border-primary bg-primary/10",
                  !checked && !picked && "border-border hover:border-primary/40",
                  checked && right && "border-success bg-success/10",
                  checked && picked && !right && "border-destructive bg-destructive/10",
                  checked && !picked && !right && "border-border opacity-70",
                )}
              >
                <span className={cn(
                  "w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0",
                  checked && right ? "bg-success text-success-foreground"
                    : checked && picked ? "bg-destructive text-destructive-foreground"
                    : picked ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                )}>
                  {o.label}
                </span>
                <div className="flex-1 text-sm pt-0.5">
                  {o.text && <LatexRenderer content={o.text} />}
                  {o.image_url && <img src={o.image_url} alt={`Option ${o.label}`} className="max-h-40 mt-1 rounded" />}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        {!checked ? (
          <Button size="sm" disabled={!canCheck} onClick={() => setChecked(true)}>Check answer</Button>
        ) : (
          <>
            <span className={cn("flex items-center gap-1.5 text-sm font-medium", isCorrect ? "text-success" : "text-destructive")}>
              {isCorrect ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
              {isCorrect ? "Correct!" : `Incorrect — answer: ${isInteger ? String(q.correct_answer) : correct.join(", ")}`}
            </span>
            <Button size="sm" variant="ghost" onClick={reset}><RotateCcw className="w-3.5 h-3.5 mr-1" /> Try again</Button>
          </>
        )}
      </div>

      {checked && (q.solution_text || (q.solution_image_urls ?? []).length > 0) && (
        <div className="rounded-lg bg-muted/50 p-3 space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Solution</p>
          {q.solution_text && <div className="text-sm"><LatexRenderer content={q.solution_text} /></div>}
          {(q.solution_image_urls ?? []).map((u) => (
            <img key={u} src={u} alt="Solution" className="max-w-full max-h-72 object-contain rounded-md" />
          ))}
        </div>
      )}
    </div>
  );
}
