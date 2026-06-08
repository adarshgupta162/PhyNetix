import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Edit2, Trash2, Check, X, FileText, Hash, 
  Circle, Square, CheckCircle2, CheckSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Question {
  id: string;
  section_id: string;
  test_id: string;
  question_number: number;
  question_text: string | null;
  options: string[] | null;
  correct_answer: string | string[];
  marks: number;
  negative_marks: number;
  pdf_page: number;
  order_index: number;
}

interface QuestionEditorProps {
  question: Question;
  sectionType: string;
  isEditing: boolean;
  onEdit: () => void;
  onSave: (updates: Partial<Question>) => void;
  onCancel: () => void;
  onDelete: () => void;
}

export default function QuestionEditor({
  question,
  sectionType,
  isEditing,
  onEdit,
  onSave,
  onCancel,
  onDelete
}: QuestionEditorProps) {
  const [formData, setFormData] = useState({
    question_text: question.question_text || '',
    options: question.options || ['', '', '', ''],
    correct_answer: question.correct_answer,
    marks: question.marks,
    negative_marks: question.negative_marks,
    pdf_page: question.pdf_page
  });

  useEffect(() => {
    setFormData({
      question_text: question.question_text || '',
      options: question.options || ['', '', '', ''],
      correct_answer: question.correct_answer,
      marks: question.marks,
      negative_marks: question.negative_marks,
      pdf_page: question.pdf_page
    });
  }, [question]);

  const handleSave = () => {
    onSave({
      question_text: formData.question_text || null,
      options: sectionType !== 'integer' ? formData.options : null,
      correct_answer: formData.correct_answer,
      marks: formData.marks,
      negative_marks: formData.negative_marks,
      pdf_page: formData.pdf_page
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
    if (e.key === 'Escape') {
      onCancel();
    }
  };

  const toggleSingleAnswer = (index: number) => {
    setFormData({ ...formData, correct_answer: String(index) });
  };

  const toggleMultiAnswer = (index: number) => {
    const currentAnswers = Array.isArray(formData.correct_answer) 
      ? formData.correct_answer 
      : [];
    const indexStr = String(index);
    
    if (currentAnswers.includes(indexStr)) {
      setFormData({ 
        ...formData, 
        correct_answer: currentAnswers.filter(a => a !== indexStr) 
      });
    } else {
      setFormData({ 
        ...formData, 
        correct_answer: [...currentAnswers, indexStr].sort() 
      });
    }
  };

  const isAnswerSelected = (index: number): boolean => {
    if (sectionType === 'single_choice') {
      return formData.correct_answer === String(index);
    }
    if (sectionType === 'multiple_choice') {
      return Array.isArray(formData.correct_answer) && 
        formData.correct_answer.includes(String(index));
    }
    return false;
  };

  // Collapsed view
  if (!isEditing) {
    const hasAnswer = sectionType === 'integer' 
      ? formData.correct_answer !== ''
      : sectionType === 'multiple_choice'
        ? Array.isArray(formData.correct_answer) && formData.correct_answer.length > 0
        : formData.correct_answer !== '';

    return (
      <div 
        className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer group"
        onClick={onEdit}
      >
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-medium ${
          hasAnswer ? 'bg-[hsl(142,76%,36%)]/20 text-[hsl(142,76%,36%)]' : 'bg-secondary'
        }`}>
          {question.question_number}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm truncate">
            {formData.question_text || 'Click to edit question'}
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>+{formData.marks}</span>
            {formData.negative_marks > 0 && <span>/-{formData.negative_marks}</span>}
            <span>•</span>
            <span>Page {formData.pdf_page}</span>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button className="p-1.5 rounded hover:bg-secondary">
            <Edit2 className="w-3 h-3" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="p-1.5 rounded hover:bg-destructive/10"
          >
            <Trash2 className="w-3 h-3 text-destructive" />
          </button>
        </div>
      </div>
    );
  }

  // Expanded editing view
  return (
    <motion.div 
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-lg bg-primary/5 border border-primary/20 space-y-4"
      onKeyDown={handleKeyDown}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-sm font-medium text-primary-foreground">
            Q{question.question_number}
          </div>
          <span className="text-sm font-medium">Editing Question</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" onClick={handleSave}>
            <Check className="w-3 h-3 mr-1" />
            Save
          </Button>
          <Button size="sm" variant="ghost" onClick={onCancel}>
            <X className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Question Text */}
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">Question Text (optional - use PDF page mapping)</label>
        <textarea
          value={formData.question_text}
          onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
          placeholder="Enter question text or leave empty to use PDF..."
          className="w-full min-h-[80px] px-3 py-2 rounded-lg border border-border bg-secondary/50 text-foreground text-sm resize-none"
        />
      </div>

      {/* Options for MCQ types */}
      {sectionType !== 'integer' && (
        <div>
          <label className="text-xs text-muted-foreground mb-2 block">
            Options (click to mark correct answer{sectionType === 'multiple_choice' ? 's' : ''})
          </label>
          <div className="space-y-2">
            {formData.options.map((opt, i) => (
              <div key={i} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => sectionType === 'single_choice' 
                    ? toggleSingleAnswer(i) 
                    : toggleMultiAnswer(i)
                  }
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                    isAnswerSelected(i)
                      ? 'bg-[hsl(142,76%,36%)] text-white'
                      : 'bg-secondary hover:bg-secondary/80'
                  }`}
                >
                  {sectionType === 'single_choice' ? (
                    isAnswerSelected(i) ? <CheckCircle2 className="w-4 h-4" /> : <Circle className="w-4 h-4" />
                  ) : (
                    isAnswerSelected(i) ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />
                  )}
                </button>
                <Input
                  value={opt}
                  onChange={(e) => {
                    const newOptions = [...formData.options];
                    newOptions[i] = e.target.value;
                    setFormData({ ...formData, options: newOptions });
                  }}
                  placeholder={`Option ${String.fromCharCode(65 + i)}`}
                  className="flex-1 h-8 text-sm"
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Integer Answer */}
      {sectionType === 'integer' && (
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Correct Answer</label>
          <Input
            value={formData.correct_answer as string}
            onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
            placeholder="Enter the correct integer/numeric value"
            className="h-10"
          />
        </div>
      )}

      {/* Marks & Page */}
      <div className="grid grid-cols-3 gap-3">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Marks</label>
          <Input
            type="number"
            value={formData.marks}
            onChange={(e) => setFormData({ ...formData, marks: parseInt(e.target.value) || 0 })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">Negative</label>
          <Input
            type="number"
            value={formData.negative_marks}
            onChange={(e) => setFormData({ ...formData, negative_marks: parseInt(e.target.value) || 0 })}
            className="h-8 text-sm"
          />
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">PDF Page</label>
          <Input
            type="number"
            value={formData.pdf_page}
            onChange={(e) => setFormData({ ...formData, pdf_page: parseInt(e.target.value) || 1 })}
            min={1}
            className="h-8 text-sm"
          />
        </div>
      </div>
    </motion.div>
  );
}
