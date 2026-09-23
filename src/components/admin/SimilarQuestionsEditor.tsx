import { useEffect, useState, useCallback } from "react";
import { Plus, Trash2, Pencil, Loader2, Check, BookOpen, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MultiImageUpload } from "@/components/admin/MultiImageUpload";
import { LibraryPickerModal } from "@/components/admin/LibraryPickerModal";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

export interface SimilarQuestion {
  id?: string;
  question_type: string;
  question_text: string | null;
  image_urls: string[];
  options: { label: string; text: string; image_url: string | null }[] | null;
  correct_answer: any;
  solution_text: string | null;
  solution_image_urls: string[];
  difficulty: string;
  library_question_id?: string | null;
  order_index?: number;
}

const blankOptions = () => ["A", "B", "C", "D"].map((label) => ({ label, text: "", image_url: null }));

const emptyQuestion = (type = "single_choice"): SimilarQuestion => ({
  question_type: type,
  question_text: "",
  image_urls: [],
  options: blankOptions(),
  correct_answer: type === "multiple_choice" ? [] : "",
  solution_text: "",
  solution_image_urls: [],
  difficulty: "medium",
});

const toLetter = (v: any): string => {
  if (v === null || v === undefined || v === "") return "";
  const s = String(v).trim();
  if (/^[A-Za-z]$/.test(s)) return s.toUpperCase();
  const n = parseInt(s, 10);
  if (!isNaN(n) && String(n) === s && n >= 0 && n <= 25) return String.fromCharCode(65 + n);
  return s;
};

const normalizeType = (t?: string | null) => {
  const s = (t || "").toLowerCase();
  if (s.includes("multi")) return "multiple_choice";
  if (s.includes("int") || s.includes("numer")) return "integer";
  return "single_choice";
};

interface Props {
  testId: string;
  parentQuestionId: string;
  defaultType?: string;
}

export function SimilarQuestionsEditor({ testId, parentQuestionId, defaultType = "single_choice" }: Props) {
  const { toast } = useToast();
  const [items, setItems] = useState<SimilarQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<SimilarQuestion | null>(null);
  const [saving, setSaving] = useState(false);
  const [libraryOpen, setLibraryOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("test_similar_questions" as any)
      .select("*")
      .eq("parent_question_id", parentQuestionId)
      .order("order_index");
    if (error) toast({ title: "Couldn't load similar questions", description: error.message, variant: "destructive" });
    setItems(((data as any[]) ?? []) as SimilarQuestion[]);
    setLoading(false);
  }, [parentQuestionId, toast]);

  useEffect(() => { load(); }, [load]);

  const save = async (q: SimilarQuestion) => {
    const isChoice = q.question_type !== "integer";
    const hasAnswer = Array.isArray(q.correct_answer) ? q.correct_answer.length > 0 : String(q.correct_answer ?? "").trim() !== "";
    if (!q.question_text?.trim() && q.image_urls.length === 0) {
      toast({ title: "Add question text or an image", variant: "destructive" });
      return;
    }
    if (!hasAnswer) {
      toast({ title: "Select the correct answer", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    const payload: any = {
      test_id: testId,
      parent_question_id: parentQuestionId,
      question_type: q.question_type,
      question_text: q.question_text || null,
      image_urls: q.image_urls ?? [],
      options: isChoice ? q.options : null,
      correct_answer: q.correct_answer,
      solution_text: q.solution_text || null,
      solution_image_urls: q.solution_image_urls ?? [],
      difficulty: q.difficulty,
      library_question_id: q.library_question_id ?? null,
    };
    let error;
    if (q.id) {
      ({ error } = await supabase.from("test_similar_questions" as any).update(payload).eq("id", q.id));
    } else {
      payload.order_index = items.length;
      payload.created_by = user?.id;
      ({ error } = await supabase.from("test_similar_questions" as any).insert(payload));
    }
    setSaving(false);
    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: q.id ? "Similar question updated" : "Similar question added" });
    setEditing(null);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remove this similar question?")) return;
    const { error } = await supabase.from("test_similar_questions" as any).delete().eq("id", id);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    load();
  };

  const addFromLibrary = async (lib: any) => {
    const type = normalizeType(lib.question_type);
    let options: SimilarQuestion["options"] = null;
    if (type !== "integer") {
      const raw = Array.isArray(lib.options) ? lib.options : [];
      options = raw.map((o: any, i: number) => ({
        label: String.fromCharCode(65 + i),
        text: typeof o === "object" && o ? (o.text ?? "") : String(o ?? ""),
        image_url: typeof o === "object" && o ? (o.image_url ?? null) : null,
      }));
      if (options.length === 0) options = blankOptions();
    }
    let correct: any = lib.correct_answer;
    if (type === "multiple_choice") {
      const arr = Array.isArray(correct) ? correct : String(correct ?? "").split(",");
      correct = arr.map(toLetter).filter(Boolean);
    } else if (type === "single_choice") {
      correct = toLetter(Array.isArray(correct) ? correct[0] : correct);
    } else {
      correct = String(correct ?? "");
    }
    setLibraryOpen(false);
    setEditing({
      question_type: type,
      question_text: lib.question_text ?? "",
      image_urls: lib.question_image_url ? [lib.question_image_url] : [],
      options,
      correct_answer: correct,
      solution_text: lib.solution_text ?? "",
      solution_image_urls: lib.solution_image_url ? [lib.solution_image_url] : [],
      difficulty: lib.difficulty || "medium",
      library_question_id: lib.id,
    });
  };

  return (
    <div className="pt-4 border-t space-y-3">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div>
          <Label className="text-xs flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-primary" /> Similar questions for practice
          </Label>
          <p className="text-[11px] text-muted-foreground">Shown to students only after they submit the test. Hidden if none are added.</p>
        </div>
        <div className="flex gap-2">
          <Button type="button" size="sm" variant="outline" className="h-7 text-xs" onClick={() => setLibraryOpen(true)}>
            <BookOpen className="w-3 h-3 mr-1" /> From library
          </Button>
          <Button type="button" size="sm" className="h-7 text-xs" onClick={() => setEditing(emptyQuestion(normalizeType(defaultType)))}>
            <Plus className="w-3 h-3 mr-1" /> Add
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="py-3 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground italic">No similar questions attached.</p>
      ) : (
        <div className="space-y-2">
          {items.map((q, i) => (
            <div key={q.id} className="flex items-start gap-2 p-2 rounded-md border bg-card">
              <span className="text-xs font-semibold text-primary mt-0.5">S{i + 1}</span>
              <div className="flex-1 min-w-0 text-xs line-clamp-2">
                {q.question_text ? <LatexRenderer content={q.question_text} /> : <span className="text-muted-foreground">[Image question]</span>}
              </div>
              <Badge variant="secondary" className="text-[10px] shrink-0">{q.question_type.replace("_", " ")}</Badge>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6" onClick={() => setEditing({ ...q, image_urls: q.image_urls ?? [], solution_image_urls: q.solution_image_urls ?? [] })}>
                <Pencil className="w-3 h-3" />
              </Button>
              <Button type="button" size="icon" variant="ghost" className="h-6 w-6 text-destructive" onClick={() => remove(q.id!)}>
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>
          ))}
        </div>
      )}

      {editing && (
        <SimilarQuestionDialog
          value={editing}
          saving={saving}
          onChange={setEditing}
          onCancel={() => setEditing(null)}
          onSave={() => save(editing)}
        />
      )}

      <LibraryPickerModal open={libraryOpen} onClose={() => setLibraryOpen(false)} onSelect={addFromLibrary} />
    </div>
  );
}

function SimilarQuestionDialog({
  value, onChange, onCancel, onSave, saving,
}: {
  value: SimilarQuestion;
  onChange: (q: SimilarQuestion) => void;
  onCancel: () => void;
  onSave: () => void;
  saving: boolean;
}) {
  const q = value;
  const set = (patch: Partial<SimilarQuestion>) => onChange({ ...q, ...patch });
  const options = q.options ?? blankOptions();

  const setType = (t: string) => {
    set({
      question_type: t,
      correct_answer: t === "multiple_choice" ? [] : "",
      options: t === "integer" ? null : (q.options ?? blankOptions()),
    });
  };

  const isSelected = (label: string) =>
    q.question_type === "multiple_choice"
      ? Array.isArray(q.correct_answer) && q.correct_answer.includes(label)
      : q.correct_answer === label;

  const pick = (label: string) => {
    if (q.question_type === "multiple_choice") {
      const cur: string[] = Array.isArray(q.correct_answer) ? q.correct_answer : [];
      set({ correct_answer: cur.includes(label) ? cur.filter((x) => x !== label) : [...cur, label].sort() });
    } else {
      set({ correct_answer: label });
    }
  };

  const updateOption = (i: number, text: string) => {
    const next = options.map((o, idx) => (idx === i ? { ...o, text } : o));
    set({ options: next });
  };
  const addOption = () => set({ options: [...options, { label: String.fromCharCode(65 + options.length), text: "", image_url: null }] });
  const removeOption = (i: number) => {
    if (options.length <= 2) return;
    const next = options.filter((_, idx) => idx !== i).map((o, idx) => ({ ...o, label: String.fromCharCode(65 + idx) }));
    set({ options: next, correct_answer: q.question_type === "multiple_choice" ? [] : "" });
  };

  return (
    <Dialog open onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{q.id ? "Edit similar question" : "Add similar question"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Question type</Label>
              <Select value={q.question_type} onValueChange={setType}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_choice">Single correct</SelectItem>
                  <SelectItem value="multiple_choice">Multiple correct</SelectItem>
                  <SelectItem value="integer">Integer / Numerical</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Difficulty</Label>
              <Select value={q.difficulty} onValueChange={(v) => set({ difficulty: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="easy">Easy</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs">Question (LaTeX supported, e.g. $x^2$)</Label>
            <Textarea
              value={q.question_text ?? ""}
              onChange={(e) => set({ question_text: e.target.value })}
              className="min-h-[90px] font-mono text-sm"
              placeholder="Type the question..."
            />
            <MultiImageUpload value={q.image_urls} onChange={(urls) => set({ image_urls: urls })} compact label="Question images" />
          </div>

          {q.question_type !== "integer" ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs">Options — tap the letter to mark correct</Label>
                <Button type="button" variant="ghost" size="sm" className="h-7 text-xs" onClick={addOption}>
                  <Plus className="w-3 h-3 mr-1" /> Option
                </Button>
              </div>
              {options.map((o, i) => (
                <div key={i} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => pick(o.label)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors",
                      isSelected(o.label) ? "bg-success text-success-foreground" : "bg-muted text-muted-foreground hover:bg-primary/20",
                    )}
                  >
                    {isSelected(o.label) ? <Check className="w-4 h-4" /> : o.label}
                  </button>
                  <Input value={o.text} onChange={(e) => updateOption(i, e.target.value)} placeholder={`Option ${o.label}`} />
                  {options.length > 2 && (
                    <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => removeOption(i)}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div>
              <Label className="text-xs">Correct answer</Label>
              <Input
                value={String(q.correct_answer ?? "")}
                onChange={(e) => set({ correct_answer: e.target.value })}
                placeholder="e.g. 42 or -2.5"
                className="font-mono"
              />
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs">Solution</Label>
            <Textarea
              value={q.solution_text ?? ""}
              onChange={(e) => set({ solution_text: e.target.value })}
              className="min-h-[80px] font-mono text-sm"
              placeholder="Explain the solution..."
            />
            <MultiImageUpload value={q.solution_image_urls} onChange={(urls) => set({ solution_image_urls: urls })} compact label="Solution images" />
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onCancel}>Cancel</Button>
          <Button onClick={onSave} disabled={saving}>
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
