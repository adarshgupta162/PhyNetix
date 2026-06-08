import { cn } from "@/lib/utils";
import { AlertCircle, Check, HelpCircle } from "lucide-react";

interface Question {
  id: string;
  question_number: number;
  correct_answer: any;
  question_text: string | null;
  section_id: string;
}

interface QuestionPaletteProps {
  questions: Question[];
  activeQuestionId: string | null;
  onSelectQuestion: (questionId: string) => void;
  sectionType?: string;
}

export function QuestionPalette({ 
  questions, 
  activeQuestionId, 
  onSelectQuestion,
  sectionType = "single_choice"
}: QuestionPaletteProps) {
  
  const getQuestionStatus = (question: Question) => {
    const hasAnswer = sectionType === 'multiple_choice' 
      ? Array.isArray(question.correct_answer) && question.correct_answer.length > 0
      : question.correct_answer && question.correct_answer !== '';
    
    const hasText = question.question_text && question.question_text.trim().length > 0;
    
    if (hasAnswer && hasText) return 'complete';
    if (hasAnswer || hasText) return 'partial';
    return 'empty';
  };

  const getStatusColor = (status: string, isActive: boolean) => {
    if (isActive) return 'bg-primary text-primary-foreground ring-2 ring-primary';
    
    switch (status) {
      case 'complete':
        return 'bg-green-500/20 text-green-700 dark:text-green-400 border-green-500/30';
      case 'partial':
        return 'bg-yellow-500/20 text-yellow-700 dark:text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide px-1">
        Questions ({questions.length})
      </div>
      
      <div className="grid grid-cols-5 gap-2">
        {questions.map((question) => {
          const status = getQuestionStatus(question);
          const isActive = activeQuestionId === question.id;
          
          return (
            <button
              key={question.id}
              onClick={() => onSelectQuestion(question.id)}
              className={cn(
                "w-9 h-9 rounded-lg border text-sm font-semibold transition-all duration-200",
                "hover:scale-105 focus:outline-none focus:ring-2 focus:ring-primary/50",
                getStatusColor(status, isActive)
              )}
              title={`Q${question.question_number} - ${status}`}
            >
              {question.question_number}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className="pt-4 border-t border-border space-y-2">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Legend
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-green-500/20 border border-green-500/30 flex items-center justify-center">
              <Check className="w-2.5 h-2.5 text-green-600" />
            </div>
            <span className="text-muted-foreground">Complete</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-yellow-500/20 border border-yellow-500/30 flex items-center justify-center">
              <AlertCircle className="w-2.5 h-2.5 text-yellow-600" />
            </div>
            <span className="text-muted-foreground">Partial</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <div className="w-4 h-4 rounded bg-muted border border-border flex items-center justify-center">
              <HelpCircle className="w-2.5 h-2.5 text-muted-foreground" />
            </div>
            <span className="text-muted-foreground">Empty</span>
          </div>
        </div>
      </div>
    </div>
  );
}
