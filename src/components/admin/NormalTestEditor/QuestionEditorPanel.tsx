import { useState, useEffect, useCallback } from "react";
import { 
  GripVertical, Plus, Trash2, Copy, MoveUp, MoveDown, 
  Save, X, Check, Image as ImageIcon, ToggleLeft, ToggleRight 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { QuestionImageUpload } from "../QuestionImageUpload";
import { MultiImageUpload } from "../MultiImageUpload";
import { mergeImageUrls } from "@/lib/imageUtils";
import { cn } from "@/lib/utils";

interface Question {
  id: string;
  section_id: string;
  test_id: string;
  question_number: number;
  question_text: string | null;
  correct_answer: any;
  options: any;
  marks: number;
  negative_marks: number;
  pdf_page: number | null;
  order_index: number;
  is_bonus?: boolean;
  image_url?: string | null;
  image_urls?: string[] | null;
  solution_text?: string | null;
  solution_image_url?: string | null;
  solution_image_urls?: string[] | null;
  difficulty?: string;
  time_seconds?: number;
  paragraph_id?: string | null;
}

interface QuestionEditorPanelProps {
  question: Question | null;
  sectionType: string;
  onUpdate: (questionId: string, updates: Partial<Question>) => Promise<void>;
  onDelete: (questionId: string) => Promise<void>;
  onDuplicate: (questionId: string) => Promise<void>;
  onAddAbove: (questionId: string) => Promise<void>;
  onAddBelow: (questionId: string) => Promise<void>;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  chapters?: { id: string; name: string; course_id: string }[];
  courses?: { id: string; name: string }[];
}

const DEFAULT_OPTIONS = [
  { label: 'A', text: '', image_url: null },
  { label: 'B', text: '', image_url: null },
  { label: 'C', text: '', image_url: null },
  { label: 'D', text: '', image_url: null }
];

export function QuestionEditorPanel({
  question,
  sectionType,
  onUpdate,
  onDelete,
  onDuplicate,
  onAddAbove,
  onAddBelow,
  isSaving,
  hasUnsavedChanges,
  chapters = [],
  courses = []
}: QuestionEditorPanelProps) {
  const [localQuestion, setLocalQuestion] = useState<Question | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (question) {
      setLocalQuestion({
        ...question,
        options: question.options || DEFAULT_OPTIONS,
        image_urls: mergeImageUrls(question.image_url, question.image_urls),
        solution_image_urls: mergeImageUrls(question.solution_image_url, question.solution_image_urls),
      });
    }
  }, [question?.id]);

  const handleFieldChange = useCallback((field: keyof Question, value: any) => {
    if (!localQuestion) return;
    setLocalQuestion({ ...localQuestion, [field]: value });
  }, [localQuestion]);

  const handleOptionChange = useCallback((index: number, field: 'text' | 'image_url', value: string | null) => {
    if (!localQuestion) return;
    const options = [...(localQuestion.options || DEFAULT_OPTIONS)];
    options[index] = { ...options[index], [field]: value };
    setLocalQuestion({ ...localQuestion, options });
  }, [localQuestion]);

  const handleAddOption = useCallback(() => {
    if (!localQuestion) return;
    const options = [...(localQuestion.options || [])];
    const nextLabel = String.fromCharCode(65 + options.length); // A, B, C, D, E...
    options.push({ label: nextLabel, text: '', image_url: null });
    setLocalQuestion({ ...localQuestion, options });
  }, [localQuestion]);

  const handleRemoveOption = useCallback((index: number) => {
    if (!localQuestion) return;
    const options = [...(localQuestion.options || [])];
    if (options.length <= 2) return; // Minimum 2 options
    options.splice(index, 1);
    // Re-label options
    options.forEach((opt, i) => {
      opt.label = String.fromCharCode(65 + i);
    });
    setLocalQuestion({ ...localQuestion, options });
  }, [localQuestion]);

  const handleAnswerSelect = useCallback((answer: string) => {
    if (!localQuestion) return;
    if (sectionType === 'multiple_choice') {
      const currentAnswers = Array.isArray(localQuestion.correct_answer) 
        ? [...localQuestion.correct_answer] 
        : [];
      const idx = currentAnswers.indexOf(answer);
      if (idx > -1) {
        currentAnswers.splice(idx, 1);
      } else {
        currentAnswers.push(answer);
      }
      setLocalQuestion({ ...localQuestion, correct_answer: currentAnswers });
    } else {
      setLocalQuestion({ ...localQuestion, correct_answer: answer });
    }
  }, [localQuestion, sectionType]);

  const handleSave = useCallback(async () => {
    if (!localQuestion) return;
    await onUpdate(localQuestion.id, {
      question_text: localQuestion.question_text,
      correct_answer: localQuestion.correct_answer,
      options: localQuestion.options,
      marks: localQuestion.marks,
      negative_marks: localQuestion.negative_marks,
      is_bonus: localQuestion.is_bonus,
      image_url: null, // Clear legacy single image
      image_urls: localQuestion.image_urls || [],
      solution_text: localQuestion.solution_text,
      solution_image_url: null, // Clear legacy single image
      solution_image_urls: localQuestion.solution_image_urls || [],
      difficulty: localQuestion.difficulty,
      time_seconds: localQuestion.time_seconds
    });
  }, [localQuestion, onUpdate]);

  const isAnswerSelected = (answer: string) => {
    if (!localQuestion) return false;
    if (sectionType === 'multiple_choice') {
      return Array.isArray(localQuestion.correct_answer) && localQuestion.correct_answer.includes(answer);
    }
    return localQuestion.correct_answer === answer;
  };

  if (!question || !localQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center">
        <div className="text-muted-foreground">
          <p className="text-lg font-medium mb-2">No question selected</p>
          <p className="text-sm">Click a question from the palette to edit</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Editor Header */}
      <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-primary">Q{localQuestion.question_number}</span>
          <span className="px-2 py-1 rounded bg-secondary text-xs font-medium">
            {sectionType.replace('_', ' ')}
          </span>
          {localQuestion.is_bonus && (
            <span className="px-2 py-1 rounded bg-yellow-500/20 text-yellow-600 text-xs font-medium">
              Bonus
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <span className="text-xs text-yellow-600 mr-2">Unsaved changes</span>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-primary" />
            ) : (
              <>
                <Save className="w-4 h-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Editor Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6">
        {/* Question Text */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Question Text (supports LaTeX: $x^2$ for inline)</Label>
          <Textarea
            value={localQuestion.question_text || ''}
            onChange={(e) => handleFieldChange('question_text', e.target.value)}
            placeholder="Enter question text... Use LaTeX: $\frac{a}{b}$ for fractions"
            className="min-h-[120px] font-mono text-sm"
          />
          <MultiImageUpload
            value={localQuestion.image_urls || []}
            onChange={(urls) => handleFieldChange('image_urls', urls)}
            compact
            label="Question Images"
          />
        </div>

        {/* Marks */}
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-sm font-medium">Marks</Label>
            <Input
              type="number"
              value={localQuestion.marks}
              onChange={(e) => handleFieldChange('marks', parseInt(e.target.value) || 0)}
              min={0}
              max={100}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Negative Marks</Label>
            <Input
              type="number"
              value={localQuestion.negative_marks}
              onChange={(e) => handleFieldChange('negative_marks', parseInt(e.target.value) || 0)}
              min={0}
              max={100}
            />
          </div>
          <div className="space-y-2">
            <Label className="text-sm font-medium">Bonus Question</Label>
            <Button
              type="button"
              variant={localQuestion.is_bonus ? "default" : "outline"}
              size="sm"
              onClick={() => handleFieldChange('is_bonus', !localQuestion.is_bonus)}
              className="w-full"
            >
              {localQuestion.is_bonus ? (
                <>
                  <ToggleRight className="w-4 h-4 mr-1" />
                  Yes
                </>
              ) : (
                <>
                  <ToggleLeft className="w-4 h-4 mr-1" />
                  No
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Options for MCQ */}
        {(sectionType === 'single_choice' || sectionType === 'multiple_choice') && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                Options ({sectionType === 'multiple_choice' ? 'Multiple Select' : 'Single Select'})
              </Label>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAddOption}
                className="h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Option
              </Button>
            </div>
            
            <div className="space-y-2">
              {(localQuestion.options || DEFAULT_OPTIONS).map((option: any, index: number) => (
                <div
                  key={index}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                    isAnswerSelected(option.label)
                      ? "bg-green-500/10 border-green-500/50"
                      : "bg-card border-border hover:border-primary/30"
                  )}
                >
                  {/* Answer selector */}
                  <button
                    type="button"
                    onClick={() => handleAnswerSelect(option.label)}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0 transition-colors",
                      isAnswerSelected(option.label)
                        ? "bg-green-500 text-white"
                        : "bg-muted text-muted-foreground hover:bg-primary/20"
                    )}
                  >
                    {isAnswerSelected(option.label) ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      option.label
                    )}
                  </button>
                  
                  {/* Option content */}
                  <div className="flex-1 space-y-2">
                    <Input
                      value={option.text || ''}
                      onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                      placeholder={`Option ${option.label} text...`}
                      className="text-sm"
                    />
                    <QuestionImageUpload
                      value={option.image_url}
                      onChange={(url) => handleOptionChange(index, 'image_url', url)}
                      compact
                    />
                  </div>
                  
                  {/* Remove button */}
                  {(localQuestion.options || []).length > 2 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveOption(index)}
                      className="h-8 w-8 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Integer Input */}
        {sectionType === 'integer' && (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Correct Answer (Integer)</Label>
            <Input
              type="text"
              value={localQuestion.correct_answer || ''}
              onChange={(e) => handleFieldChange('correct_answer', e.target.value)}
              placeholder="Enter integer answer (e.g., 42 or -5.5)"
              className="text-lg font-mono"
            />
            <p className="text-xs text-muted-foreground">
              For integer type, enter the exact numerical answer
            </p>
          </div>
        )}

        {/* Solution */}
        <div className="space-y-2 pt-4 border-t border-border">
          <Label className="text-sm font-medium">Solution (shown after test)</Label>
          <Textarea
            value={localQuestion.solution_text || ''}
            onChange={(e) => handleFieldChange('solution_text', e.target.value)}
            placeholder="Enter solution explanation... Supports LaTeX"
            className="min-h-[100px] font-mono text-sm"
          />
          <MultiImageUpload
            value={localQuestion.solution_image_urls || []}
            onChange={(urls) => handleFieldChange('solution_image_urls', urls)}
            compact
            label="Solution Images"
          />
        </div>
      </div>

      {/* Editor Footer Actions */}
      <div className="flex items-center justify-between p-4 border-t border-border bg-card/50">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddAbove(localQuestion.id)}
            title="Add question above"
          >
            <MoveUp className="w-4 h-4 mr-1" />
            Add Above
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAddBelow(localQuestion.id)}
            title="Add question below"
          >
            <MoveDown className="w-4 h-4 mr-1" />
            Add Below
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDuplicate(localQuestion.id)}
            title="Duplicate question"
          >
            <Copy className="w-4 h-4 mr-1" />
            Duplicate
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          {showDeleteConfirm ? (
            <>
              <span className="text-sm text-destructive mr-2">Delete this question?</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDelete(localQuestion.id);
                  setShowDeleteConfirm(false);
                }}
              >
                Yes, Delete
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDeleteConfirm(false)}
              >
                Cancel
              </Button>
            </>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
