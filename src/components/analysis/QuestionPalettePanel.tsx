import { useState } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Grid3X3 } from "lucide-react";

interface QuestionStatus {
  id: string;
  number: number;
  status: "correct" | "incorrect" | "skipped";
  subject: string;
}

interface QuestionPalettePanelProps {
  questions: QuestionStatus[];
  currentIndex: number;
  onSelectQuestion: (index: number) => void;
  filter: "all" | "correct" | "incorrect" | "skipped";
  onFilterChange: (filter: "all" | "correct" | "incorrect" | "skipped") => void;
}

const filters = [
  { id: "all" as const, label: "All" },
  { id: "correct" as const, label: "Correct" },
  { id: "incorrect" as const, label: "Wrong" },
  { id: "skipped" as const, label: "Skip" },
];

export function QuestionPalettePanel({
  questions,
  currentIndex,
  onSelectQuestion,
  filter,
  onFilterChange,
}: QuestionPalettePanelProps) {
  const filteredQuestions = questions.filter(
    (q) => filter === "all" || q.status === filter
  );

  const stats = {
    correct: questions.filter((q) => q.status === "correct").length,
    incorrect: questions.filter((q) => q.status === "incorrect").length,
    skipped: questions.filter((q) => q.status === "skipped").length,
  };

  const PaletteContent = () => (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <Button
            key={f.id}
            variant={filter === f.id ? "default" : "ghost"}
            size="sm"
            onClick={() => onFilterChange(f.id)}
            className={cn(
              "rounded-full text-xs",
              filter === f.id && "bg-primary text-primary-foreground"
            )}
          >
            {f.label}
          </Button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-5 gap-2">
        {filteredQuestions.map((q, idx) => {
          const originalIndex = questions.findIndex((oq) => oq.id === q.id);
          const isCurrent = originalIndex === currentIndex;

          return (
            <button
              key={q.id}
              onClick={() => onSelectQuestion(originalIndex)}
              className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center text-sm font-medium transition-all",
                q.status === "correct" && "bg-success/20 text-success border border-success/30",
                q.status === "incorrect" && "bg-destructive/20 text-destructive border border-destructive/30",
                q.status === "skipped" && "bg-secondary text-muted-foreground border border-border",
                isCurrent && "ring-2 ring-primary ring-offset-2 ring-offset-card"
              )}
            >
              {q.number}
            </button>
          );
        })}
      </div>

      {/* Stats */}
      <div className="pt-4 border-t border-border/50 space-y-2 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-success/20 border border-success/30" />
          <span className="text-muted-foreground">Correct</span>
          <span className="ml-auto font-medium">{stats.correct}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-destructive/20 border border-destructive/30" />
          <span className="text-muted-foreground">Wrong</span>
          <span className="ml-auto font-medium">{stats.incorrect}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded bg-secondary border border-border" />
          <span className="text-muted-foreground">Skipped</span>
          <span className="ml-auto font-medium">{stats.skipped}</span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Panel */}
      <div className="hidden lg:block glass-card p-4">
        <h3 className="font-semibold font-display mb-4">Question Palette</h3>
        <PaletteContent />
      </div>

      {/* Mobile Bottom Sheet Button */}
      <Sheet>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="lg:hidden fixed bottom-20 right-4 z-40 w-12 h-12 rounded-full bg-card border border-border shadow-lg"
          >
            <Grid3X3 className="w-5 h-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="bottom" className="h-[60vh] rounded-t-2xl bg-card border-t border-border">
          <div className="p-4">
            <h3 className="font-semibold font-display mb-4">Question Palette</h3>
            <PaletteContent />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
