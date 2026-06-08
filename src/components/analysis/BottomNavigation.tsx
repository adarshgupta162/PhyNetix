import { ChevronLeft, ChevronRight, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";

interface BottomNavigationProps {
  currentIndex: number;
  totalQuestions: number;
  onPrevious: () => void;
  onNext: () => void;
  onViewSolution?: () => void;
  isAttemptMode?: boolean;
}

export function BottomNavigation({
  currentIndex,
  totalQuestions,
  onPrevious,
  onNext,
  onViewSolution,
  isAttemptMode = false,
}: BottomNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 lg:left-[72px] z-30 bg-card/90 backdrop-blur-xl border-t border-border px-3 py-2">
      <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
        <Button
          variant="outline"
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="gap-1 px-3"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            {currentIndex + 1} / {totalQuestions}
          </span>
          
          {isAttemptMode && onViewSolution && (
            <Button onClick={onViewSolution} className="gap-1 bg-primary text-primary-foreground px-3">
              <Eye className="w-4 h-4" />
              <span className="hidden sm:inline">View Solution</span>
            </Button>
          )}
        </div>

        <Button
          variant="outline"
          onClick={onNext}
          disabled={currentIndex === totalQuestions - 1}
          className="gap-1 px-3"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
