import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Plus, ChevronDown, ChevronRight, Trash2, Layers, 
  HelpCircle, GripVertical, Check, X, Edit2, FileText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import QuestionEditor from "./QuestionEditor";

interface Section {
  id: string;
  subject_id: string;
  name: string | null;
  section_type: string;
  order_index: number;
}

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

interface SubjectEditorProps {
  testId: string;
  subjectId: string;
  examType: string;
  sections: Section[];
  questions: Question[];
  onSectionsChange: (sections: Section[]) => void;
  onQuestionsChange: (questions: Question[]) => void;
  onDeleteSubject: () => void;
}

const SECTION_TYPES = [
  { value: 'single_choice', label: 'Single Choice', icon: '○' },
  { value: 'multiple_choice', label: 'Multiple Choice', icon: '☐' },
  { value: 'integer', label: 'Integer/Numeric', icon: '#' }
];

const getDefaultMarks = (examType: string, sectionType: string) => {
  if (examType === 'jee_advanced') {
    if (sectionType === 'single_choice') return { marks: 3, negative: 1 };
    if (sectionType === 'multiple_choice') return { marks: 4, negative: 2 };
    return { marks: 3, negative: 0 };
  }
  // JEE Mains
  if (sectionType === 'single_choice') return { marks: 4, negative: 1 };
  return { marks: 4, negative: 0 };
};

export default function SubjectEditor({
  testId,
  subjectId,
  examType,
  sections,
  questions,
  onSectionsChange,
  onQuestionsChange,
  onDeleteSubject
}: SubjectEditorProps) {
  const { toast } = useToast();
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [showAddSection, setShowAddSection] = useState(false);
  const [newSection, setNewSection] = useState({ name: '', type: 'single_choice' });

  const toggleSection = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const handleAddSection = async () => {
    if (!newSection.type) return;

    try {
      const { data, error } = await supabase
        .from('test_sections')
        .insert([{
          subject_id: subjectId,
          name: newSection.name.trim() || null,
          section_type: newSection.type,
          order_index: sections.length
        }])
        .select()
        .single();

      if (error) throw error;

      onSectionsChange([...sections, data]);
      setExpandedSections(new Set([...expandedSections, data.id]));
      setShowAddSection(false);
      setNewSection({ name: '', type: 'single_choice' });
      toast({ title: "Section added!" });
    } catch (err: any) {
      toast({ title: "Error adding section", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteSection = async (sectionId: string) => {
    if (!confirm("Delete this section and all its questions?")) return;

    try {
      await supabase.from('test_sections').delete().eq('id', sectionId);
      onSectionsChange(sections.filter(s => s.id !== sectionId));
      onQuestionsChange(questions.filter(q => q.section_id !== sectionId));
      toast({ title: "Section deleted" });
    } catch (err: any) {
      toast({ title: "Error deleting section", variant: "destructive" });
    }
  };

  const handleAddQuestion = async (sectionId: string) => {
    const section = sections.find(s => s.id === sectionId);
    if (!section) return;

    const sectionQuestions = questions.filter(q => q.section_id === sectionId);
    const maxQNum = Math.max(0, ...questions.map(q => q.question_number));
    const { marks, negative } = getDefaultMarks(examType, section.section_type);

    try {
      const { data, error } = await supabase
        .from('test_section_questions')
        .insert([{
          section_id: sectionId,
          test_id: testId,
          question_number: maxQNum + 1,
          question_text: null,
          options: section.section_type !== 'integer' ? ['', '', '', ''] : null,
          correct_answer: section.section_type === 'multiple_choice' ? [] : '',
          marks,
          negative_marks: negative,
          pdf_page: 1,
          order_index: sectionQuestions.length
        }])
        .select()
        .single();

      if (error) throw error;

      const newQuestion = {
        ...data,
        options: data.options as string[] | null,
        correct_answer: data.correct_answer as string | string[]
      };
      
      onQuestionsChange([...questions, newQuestion]);
      setEditingQuestionId(data.id);
      toast({ title: `Question ${maxQNum + 1} added!` });
    } catch (err: any) {
      toast({ title: "Error adding question", description: err.message, variant: "destructive" });
    }
  };

  const handleUpdateQuestion = async (questionId: string, updates: Partial<Question>) => {
    try {
      const { error } = await supabase
        .from('test_section_questions')
        .update(updates)
        .eq('id', questionId);

      if (error) throw error;

      onQuestionsChange(questions.map(q => 
        q.id === questionId ? { ...q, ...updates } : q
      ));
      toast({ title: "Question saved!" });
    } catch (err: any) {
      toast({ title: "Error saving question", description: err.message, variant: "destructive" });
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm("Delete this question?")) return;

    try {
      await supabase.from('test_section_questions').delete().eq('id', questionId);
      onQuestionsChange(questions.filter(q => q.id !== questionId));
      toast({ title: "Question deleted" });
    } catch (err: any) {
      toast({ title: "Error deleting question", variant: "destructive" });
    }
  };

  const getSectionQuestions = (sectionId: string) => 
    questions.filter(q => q.section_id === sectionId).sort((a, b) => a.order_index - b.order_index);

  return (
    <div className="space-y-3">
      {/* Sections List */}
      {sections.map(section => {
        const sectionQuestions = getSectionQuestions(section.id);
        const isExpanded = expandedSections.has(section.id);
        const typeInfo = SECTION_TYPES.find(t => t.value === section.section_type);

        return (
          <div key={section.id} className="glass-card overflow-hidden">
            {/* Section Header */}
            <div 
              className="flex items-center gap-2 p-3 cursor-pointer hover:bg-secondary/30 transition-colors"
              onClick={() => toggleSection(section.id)}
            >
              <GripVertical className="w-4 h-4 text-muted-foreground" />
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="w-4 h-4 text-muted-foreground" />
              )}
              <Layers className="w-4 h-4 text-primary" />
              <div className="flex-1">
                <div className="font-medium text-sm">
                  {section.name || 'Untitled Section'}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                    {typeInfo?.label}
                  </span>
                  <span>{sectionQuestions.length} questions</span>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteSection(section.id);
                }}
                className="p-1.5 rounded hover:bg-destructive/10 transition-colors"
              >
                <Trash2 className="w-4 h-4 text-destructive" />
              </button>
            </div>

            {/* Section Content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-border"
                >
                  <div className="p-3 space-y-2">
                    {sectionQuestions.map(question => (
                      <QuestionEditor
                        key={question.id}
                        question={question}
                        sectionType={section.section_type}
                        isEditing={editingQuestionId === question.id}
                        onEdit={() => setEditingQuestionId(question.id)}
                        onSave={(updates) => {
                          handleUpdateQuestion(question.id, updates);
                          setEditingQuestionId(null);
                        }}
                        onCancel={() => setEditingQuestionId(null)}
                        onDelete={() => handleDeleteQuestion(question.id)}
                      />
                    ))}

                    {/* Add Question Button */}
                    <button
                      onClick={() => handleAddQuestion(section.id)}
                      className="w-full p-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
                    >
                      <Plus className="w-4 h-4" />
                      Add Question
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}

      {/* Add Section */}
      {showAddSection ? (
        <div className="glass-card p-4 space-y-3">
          <div className="font-medium text-sm">New Section</div>
          <Input
            value={newSection.name}
            onChange={(e) => setNewSection({ ...newSection, name: e.target.value })}
            placeholder="Section name (optional)"
          />
          <div>
            <label className="text-xs text-muted-foreground mb-1 block">Section Type</label>
            <select
              value={newSection.type}
              onChange={(e) => setNewSection({ ...newSection, type: e.target.value })}
              className="w-full h-10 px-3 rounded-lg border border-border bg-secondary/50 text-foreground text-sm"
            >
              {SECTION_TYPES.map(type => (
                <option key={type.value} value={type.value}>
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleAddSection}>
              <Check className="w-4 h-4 mr-1" />
              Create
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setShowAddSection(false)}>
              <X className="w-4 h-4 mr-1" />
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowAddSection(true)}
          className="w-full p-4 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-all flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary"
        >
          <Plus className="w-4 h-4" />
          Add Section
        </button>
      )}

      {/* Delete Subject */}
      <Button
        variant="ghost"
        size="sm"
        className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
        onClick={onDeleteSubject}
      >
        <Trash2 className="w-4 h-4 mr-1" />
        Delete Subject
      </Button>
    </div>
  );
}
