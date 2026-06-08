import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Plus, Filter, Edit, Trash2, Copy, Eye,
  BookOpen, ChevronDown, ChevronRight, X, Save, Loader2, 
  Image as ImageIcon, Link2, FolderOpen, AlertCircle, ArrowLeft
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { LatexRenderer } from "@/components/ui/latex-renderer";
import { cn } from "@/lib/utils";
import { getSubjects, getChaptersForSubject, getTopicsForChapter } from "@/lib/jeeData";
import { ImageUrlInput } from "@/components/admin/ImageUrlInput";

interface LibraryQuestion {
  id: string;
  library_id: string;
  subject: string;
  chapter: string | null;
  topic: string | null;
  question_text: string | null;
  question_image_url: string | null;
  options: any;
  correct_answer: any;
  question_type: string;
  marks: number;
  negative_marks: number;
  difficulty: string;
  time_seconds: number;
  solution_text: string | null;
  solution_image_url: string | null;
  tags: string[];
  usage_count: number;
  created_at: string;
}

const DEFAULT_OPTIONS = [
  { label: 'A', text: '', image_url: null },
  { label: 'B', text: '', image_url: null },
  { label: 'C', text: '', image_url: null },
  { label: 'D', text: '', image_url: null }
];

const SUBJECTS = getSubjects();
const DIFFICULTIES = ['easy', 'medium', 'hard'];
const QUESTION_TYPES = [
  { value: 'single_choice', label: 'Single Choice' },
  { value: 'multiple_choice', label: 'Multiple Choice' },
  { value: 'integer', label: 'Integer Type' }
];

type ViewMode = 'subjects' | 'chapters' | 'questions';

export default function PhyNetixLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [questions, setQuestions] = useState<LibraryQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Hierarchical navigation
  const [viewMode, setViewMode] = useState<ViewMode>('subjects');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<string | null>(null);
  
  // Editor state
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<LibraryQuestion | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [viewQuestion, setViewQuestion] = useState<LibraryQuestion | null>(null);

  // Form data with pre-filled values
  const [formData, setFormData] = useState({
    subject: 'Physics',
    chapter: '',
    topic: '',
    question_text: '',
    question_image_url: null as string | null,
    options: DEFAULT_OPTIONS,
    correct_answer: '' as any,
    question_type: 'single_choice',
    marks: 4,
    negative_marks: 1,
    difficulty: 'medium',
    time_seconds: 60,
    solution_text: '',
    solution_image_url: null as string | null,
    tags: [] as string[]
  });

  const availableChapters = getChaptersForSubject(formData.subject);
  const availableTopics = formData.chapter ? getTopicsForChapter(formData.subject, formData.chapter) : [];

  // Clipboard auto-paste ref
  const questionImageRef = useRef<HTMLInputElement>(null);
  const solutionImageRef = useRef<HTMLInputElement>(null);

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('phynetix_library')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setQuestions(data || []);
    } catch (error: any) {
      toast({ title: "Error loading questions", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  // Get stats for navigation
  const getSubjectStats = () => {
    const stats: Record<string, number> = {};
    SUBJECTS.forEach(s => {
      stats[s] = questions.filter(q => q.subject === s).length;
    });
    return stats;
  };

  const getChapterStats = (subject: string) => {
    const subjectQuestions = questions.filter(q => q.subject === subject);
    const stats: Record<string, number> = {};
    const chapters = getChaptersForSubject(subject);
    
    chapters.forEach(c => {
      stats[c] = subjectQuestions.filter(q => q.chapter === c).length;
    });
    
    // Add unmapped count
    const unmappedCount = subjectQuestions.filter(q => !q.chapter || !chapters.includes(q.chapter)).length;
    if (unmappedCount > 0) {
      stats['__unmapped__'] = unmappedCount;
    }
    
    return stats;
  };

  const getFilteredQuestions = () => {
    let filtered = questions;
    
    if (selectedSubject) {
      filtered = filtered.filter(q => q.subject === selectedSubject);
    }
    
    if (selectedChapter) {
      if (selectedChapter === '__unmapped__') {
        const chapters = getChaptersForSubject(selectedSubject || '');
        filtered = filtered.filter(q => !q.chapter || !chapters.includes(q.chapter));
      } else {
        filtered = filtered.filter(q => q.chapter === selectedChapter);
      }
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(q =>
        q.library_id.toLowerCase().includes(query) ||
        q.question_text?.toLowerCase().includes(query) ||
        q.topic?.toLowerCase().includes(query)
      );
    }
    
    return filtered;
  };

  // Navigation handlers
  const handleSubjectClick = (subject: string) => {
    setSelectedSubject(subject);
    setSelectedChapter(null);
    setViewMode('chapters');
  };

  const handleChapterClick = (chapter: string) => {
    setSelectedChapter(chapter);
    setViewMode('questions');
  };

  const handleBack = () => {
    if (viewMode === 'questions') {
      setSelectedChapter(null);
      setViewMode('chapters');
    } else if (viewMode === 'chapters') {
      setSelectedSubject(null);
      setViewMode('subjects');
    }
  };

  // Open editor with pre-filled values based on current selection
  const openEditor = (question?: LibraryQuestion) => {
    if (question) {
      setEditingQuestion(question);
      setFormData({
        subject: question.subject,
        chapter: question.chapter || '',
        topic: question.topic || '',
        question_text: question.question_text || '',
        question_image_url: question.question_image_url,
        options: question.options?.length ? question.options : DEFAULT_OPTIONS,
        correct_answer: question.correct_answer,
        question_type: question.question_type,
        marks: question.marks,
        negative_marks: question.negative_marks,
        difficulty: question.difficulty,
        time_seconds: question.time_seconds,
        solution_text: question.solution_text || '',
        solution_image_url: question.solution_image_url,
        tags: question.tags || []
      });
    } else {
      setEditingQuestion(null);
      // Pre-fill based on current navigation
      setFormData({
        subject: selectedSubject || 'Physics',
        chapter: (selectedChapter && selectedChapter !== '__unmapped__') ? selectedChapter : '',
        topic: '',
        question_text: '',
        question_image_url: null,
        options: DEFAULT_OPTIONS,
        correct_answer: '',
        question_type: 'single_choice',
        marks: 4,
        negative_marks: 1,
        difficulty: 'medium',
        time_seconds: 60,
        solution_text: '',
        solution_image_url: null,
        tags: []
      });
    }
    setIsEditorOpen(true);
  };

  const handleSave = async () => {
    if (!formData.subject) {
      toast({ title: "Subject is required", variant: "destructive" });
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        subject: formData.subject,
        chapter: formData.chapter || null,
        topic: formData.topic || null,
        question_text: formData.question_text || null,
        question_image_url: formData.question_image_url,
        options: formData.options,
        correct_answer: formData.correct_answer,
        question_type: formData.question_type,
        marks: formData.marks,
        negative_marks: formData.negative_marks,
        difficulty: formData.difficulty,
        time_seconds: formData.time_seconds,
        solution_text: formData.solution_text || null,
        solution_image_url: formData.solution_image_url,
        tags: formData.tags,
        created_by: user?.id
      };

      if (editingQuestion) {
        const { error } = await supabase
          .from('phynetix_library')
          .update(payload)
          .eq('id', editingQuestion.id);
        if (error) throw error;
        toast({ title: "Question updated!" });
      } else {
        const { error } = await supabase
          .from('phynetix_library')
          .insert([payload]);
        if (error) throw error;
        toast({ title: "Question added to library!" });
      }

      setIsEditorOpen(false);
      fetchQuestions();
    } catch (error: any) {
      toast({ title: "Error saving question", description: error.message, variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this question?")) return;
    
    try {
      const { error } = await supabase
        .from('phynetix_library')
        .update({ is_active: false })
        .eq('id', id);
      if (error) throw error;
      toast({ title: "Question deleted" });
      fetchQuestions();
    } catch (error: any) {
      toast({ title: "Error deleting question", description: error.message, variant: "destructive" });
    }
  };

  const handleOptionChange = (index: number, field: 'text' | 'image_url', value: string | null) => {
    const newOptions = [...formData.options];
    newOptions[index] = { ...newOptions[index], [field]: value };
    setFormData({ ...formData, options: newOptions });
  };

  const handleAnswerSelect = (answer: string) => {
    if (formData.question_type === 'multiple_choice') {
      const current = Array.isArray(formData.correct_answer) ? formData.correct_answer : [];
      const idx = current.indexOf(answer);
      if (idx > -1) {
        setFormData({ ...formData, correct_answer: current.filter((a: string) => a !== answer) });
      } else {
        setFormData({ ...formData, correct_answer: [...current, answer] });
      }
    } else {
      setFormData({ ...formData, correct_answer: answer });
    }
  };

  const isAnswerSelected = (answer: string) => {
    if (formData.question_type === 'multiple_choice') {
      return Array.isArray(formData.correct_answer) && formData.correct_answer.includes(answer);
    }
    return formData.correct_answer === answer;
  };

  const copyLibraryId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({ title: "Library ID copied!" });
  };

  // Auto-paste from clipboard
  const handlePasteUrl = async (type: 'question' | 'solution' | 'option', optionIndex?: number) => {
    try {
      const text = await navigator.clipboard.readText();
      if (text && (text.startsWith('http://') || text.startsWith('https://'))) {
        if (type === 'question') {
          setFormData(prev => ({ ...prev, question_image_url: text }));
        } else if (type === 'solution') {
          setFormData(prev => ({ ...prev, solution_image_url: text }));
        } else if (type === 'option' && optionIndex !== undefined) {
          handleOptionChange(optionIndex, 'image_url', text);
        }
        toast({ title: "URL pasted!" });
      } else {
        toast({ title: "No valid URL in clipboard", variant: "destructive" });
      }
    } catch {
      toast({ title: "Could not access clipboard", variant: "destructive" });
    }
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isEditorOpen) {
        // Ctrl+S to save
        if ((e.ctrlKey || e.metaKey) && e.key === 's') {
          e.preventDefault();
          handleSave();
        }
        // Escape to close
        if (e.key === 'Escape') {
          setIsEditorOpen(false);
        }
      } else {
        // Ctrl+N to add new question
        if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
          e.preventDefault();
          openEditor();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isEditorOpen]);

  const subjectStats = getSubjectStats();
  const chapterStats = selectedSubject ? getChapterStats(selectedSubject) : {};
  const filteredQuestions = getFilteredQuestions();

  return (
    <AdminLayout>
      <div className="h-[calc(100vh-2rem)] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-border bg-card/50">
          <div className="flex items-center gap-3">
            {viewMode !== 'subjects' && (
              <Button variant="ghost" size="sm" onClick={handleBack}>
                <ArrowLeft className="w-4 h-4" />
              </Button>
            )}
            <BookOpen className="w-6 h-6 text-primary" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold">PhyNetix Library</h1>
                {selectedSubject && (
                  <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-primary font-medium">{selectedSubject}</span>
                  </>
                )}
                {selectedChapter && (
                  <>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    <span className="text-primary font-medium">
                      {selectedChapter === '__unmapped__' ? 'Unmapped Questions' : selectedChapter}
                    </span>
                  </>
                )}
              </div>
              <p className="text-sm text-muted-foreground">
                {viewMode === 'subjects' && 'Select a subject to browse chapters'}
                {viewMode === 'chapters' && `${questions.filter(q => q.subject === selectedSubject).length} questions in this subject`}
                {viewMode === 'questions' && `${filteredQuestions.length} questions`}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground hidden sm:block">
              Ctrl+N: Add | Ctrl+S: Save
            </span>
            <Button onClick={() => openEditor()} className="gap-2">
              <Plus className="w-4 h-4" />
              Add Question
            </Button>
          </div>
        </div>

        {/* Search (only in questions view) */}
        {viewMode === 'questions' && (
          <div className="p-4 border-b border-border bg-card/30">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by ID, text, topic..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        )}

        {/* Content Area */}
        <ScrollArea className="flex-1 p-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <>
              {/* Subjects View */}
              {viewMode === 'subjects' && (
                <div className="grid gap-4 md:grid-cols-3">
                  {SUBJECTS.map((subject) => (
                    <motion.div
                      key={subject}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleSubjectClick(subject)}
                      className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 cursor-pointer transition-all hover:shadow-lg group"
                    >
                      <div className="flex items-center justify-between mb-4">
                        <div className={cn(
                          "w-12 h-12 rounded-xl flex items-center justify-center",
                          subject === 'Physics' && "bg-blue-500/20",
                          subject === 'Chemistry' && "bg-green-500/20",
                          subject === 'Mathematics' && "bg-orange-500/20"
                        )}>
                          <BookOpen className={cn(
                            "w-6 h-6",
                            subject === 'Physics' && "text-blue-500",
                            subject === 'Chemistry' && "text-green-500",
                            subject === 'Mathematics' && "text-orange-500"
                          )} />
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <h3 className="text-lg font-semibold mb-1">{subject}</h3>
                      <p className="text-sm text-muted-foreground">
                        {subjectStats[subject]} questions
                      </p>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Chapters View */}
              {viewMode === 'chapters' && selectedSubject && (
                <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
                  {/* Unmapped questions section */}
                  {chapterStats['__unmapped__'] > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      onClick={() => handleChapterClick('__unmapped__')}
                      className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4 hover:border-yellow-500/50 cursor-pointer transition-all group col-span-full"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <AlertCircle className="w-5 h-5 text-yellow-500" />
                          <div>
                            <h3 className="font-medium">Unmapped Questions</h3>
                            <p className="text-sm text-muted-foreground">Questions without a chapter assignment</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary">{chapterStats['__unmapped__']}</Badge>
                          <ChevronRight className="w-4 h-4 text-muted-foreground" />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {Object.entries(chapterStats)
                    .filter(([chapter]) => chapter !== '__unmapped__')
                    .map(([chapter, count], index) => (
                      <motion.div
                        key={chapter}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        onClick={() => handleChapterClick(chapter)}
                        className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 cursor-pointer transition-all group"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <FolderOpen className="w-5 h-5 text-primary" />
                            <h3 className="font-medium truncate">{chapter}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{count}</Badge>
                            <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                        </div>
                      </motion.div>
                    ))}

                  {Object.keys(chapterStats).filter(c => c !== '__unmapped__').length === 0 && (
                    <div className="col-span-full text-center py-12 text-muted-foreground">
                      <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No chapters with questions yet</p>
                      <Button variant="link" onClick={() => openEditor()}>
                        Add your first question
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {/* Questions View */}
              {viewMode === 'questions' && (
                <>
                  {filteredQuestions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No questions found</p>
                      <Button variant="link" onClick={() => openEditor()}>
                        Add your first question
                      </Button>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {filteredQuestions.map((q) => (
                        <motion.div
                          key={q.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-card border border-border rounded-xl p-4 hover:border-primary/50 transition-colors"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => copyLibraryId(q.library_id)}
                                className="px-2 py-1 bg-primary/10 text-primary rounded text-xs font-mono hover:bg-primary/20 transition-colors"
                                title="Click to copy ID"
                              >
                                {q.library_id}
                              </button>
                              <Badge variant="outline" className="text-xs">
                                {q.question_type.replace('_', ' ')}
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewQuestion(q)}>
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditor(q)}>
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(q.id)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>

                          <div className="mb-3">
                            {q.question_image_url && (
                              <img
                                src={q.question_image_url}
                                alt="Question"
                                className="w-full h-24 object-cover rounded-lg mb-2 bg-muted"
                                onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                              />
                            )}
                            <p className="text-sm line-clamp-2">
                              {q.question_text ? (
                                <LatexRenderer content={q.question_text} />
                              ) : (
                                <span className="text-muted-foreground italic">No text (image only)</span>
                              )}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                            {q.topic && (
                              <span className="px-2 py-0.5 bg-secondary rounded truncate max-w-[100px]">
                                {q.topic}
                              </span>
                            )}
                            <span className={cn(
                              "px-2 py-0.5 rounded capitalize",
                              q.difficulty === 'easy' && "bg-green-500/20 text-green-600",
                              q.difficulty === 'medium' && "bg-yellow-500/20 text-yellow-600",
                              q.difficulty === 'hard' && "bg-red-500/20 text-red-600"
                            )}>
                              {q.difficulty}
                            </span>
                            <span className="ml-auto">+{q.marks}/-{q.negative_marks}</span>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </ScrollArea>

        {/* Editor Dialog */}
        <Dialog open={isEditorOpen} onOpenChange={setIsEditorOpen}>
          <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0">
            <DialogHeader className="px-6 py-4 border-b shrink-0">
              <DialogTitle className="flex items-center justify-between">
                <span>{editingQuestion ? 'Edit Question' : 'Add New Question'}</span>
                <span className="text-xs text-muted-foreground font-normal">
                  Ctrl+S to save • Esc to close
                </span>
              </DialogTitle>
            </DialogHeader>

            <div className="flex-1 overflow-y-auto px-6">
              <div className="space-y-6 py-4">
                {/* Metadata Row */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Subject *</Label>
                    <Select 
                      value={formData.subject} 
                      onValueChange={(v) => setFormData({ ...formData, subject: v, chapter: '', topic: '' })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {SUBJECTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Chapter</Label>
                    <Select 
                      value={formData.chapter} 
                      onValueChange={(v) => setFormData({ ...formData, chapter: v, topic: '' })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select chapter" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {availableChapters.map(c => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Topic</Label>
                    <Select 
                      value={formData.topic} 
                      onValueChange={(v) => setFormData({ ...formData, topic: v })}
                      disabled={!formData.chapter}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder={formData.chapter ? "Select topic" : "Select chapter first"} />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {availableTopics.map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Question Type</Label>
                    <Select 
                      value={formData.question_type} 
                      onValueChange={(v) => setFormData({ ...formData, question_type: v, correct_answer: v === 'multiple_choice' ? [] : '' })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {QUESTION_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Marks Row */}
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label>Marks</Label>
                    <Input
                      type="number"
                      value={formData.marks}
                      onChange={(e) => setFormData({ ...formData, marks: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Negative Marks</Label>
                    <Input
                      type="number"
                      value={formData.negative_marks}
                      onChange={(e) => setFormData({ ...formData, negative_marks: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                  <div>
                    <Label>Difficulty</Label>
                    <Select value={formData.difficulty} onValueChange={(v) => setFormData({ ...formData, difficulty: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {DIFFICULTIES.map(d => <SelectItem key={d} value={d} className="capitalize">{d}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Time (seconds)</Label>
                    <Input
                      type="number"
                      value={formData.time_seconds}
                      onChange={(e) => setFormData({ ...formData, time_seconds: Number(e.target.value) })}
                      min={0}
                    />
                  </div>
                </div>

                {/* Question with Preview */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Question Text (supports LaTeX: $x^2$)</Label>
                    <Textarea
                      value={formData.question_text}
                      onChange={(e) => setFormData({ ...formData, question_text: e.target.value })}
                      placeholder="Enter question text..."
                      className="min-h-[120px] font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <ImageUrlInput
                        value={formData.question_image_url}
                        onChange={(url) => setFormData({ ...formData, question_image_url: url })}
                        compact
                        label="Question Image"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePasteUrl('question')}
                        className="h-7 text-xs"
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        Paste URL
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Preview</Label>
                    <div className="min-h-[120px] p-4 bg-secondary/50 rounded-lg border">
                      {formData.question_image_url && (
                        <img 
                          src={formData.question_image_url} 
                          alt="Question" 
                          className="max-h-32 mb-2 rounded bg-muted object-contain"
                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                      )}
                      {formData.question_text ? (
                        <LatexRenderer content={formData.question_text} className="text-sm" />
                      ) : (
                        <span className="text-muted-foreground text-sm">Preview will appear here...</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Options for MCQ */}
                {formData.question_type !== 'integer' && (
                  <div className="space-y-3">
                    <Label>Options ({formData.question_type === 'multiple_choice' ? 'Multiple Select' : 'Single Select'})</Label>
                    {formData.options.map((option: any, index: number) => (
                      <div
                        key={index}
                        className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border transition-colors",
                          isAnswerSelected(option.label)
                            ? "bg-green-500/10 border-green-500/50"
                            : "bg-card border-border"
                        )}
                      >
                        <button
                          type="button"
                          onClick={() => handleAnswerSelect(option.label)}
                          className={cn(
                            "w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm flex-shrink-0",
                            isAnswerSelected(option.label)
                              ? "bg-green-500 text-white"
                              : "bg-muted text-muted-foreground hover:bg-primary/20"
                          )}
                        >
                          {option.label}
                        </button>
                        <div className="flex-1 space-y-2">
                          <Input
                            value={option.text || ''}
                            onChange={(e) => handleOptionChange(index, 'text', e.target.value)}
                            placeholder={`Option ${option.label}...`}
                          />
                          <div className="flex items-center gap-2">
                            <ImageUrlInput
                              value={option.image_url}
                              onChange={(url) => handleOptionChange(index, 'image_url', url)}
                              compact
                              label={`Option ${option.label} Image`}
                            />
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handlePasteUrl('option', index)}
                              className="h-7 text-xs"
                            >
                              <Link2 className="w-3 h-3 mr-1" />
                              Paste
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Integer Answer */}
                {formData.question_type === 'integer' && (
                  <div>
                    <Label>Correct Answer (Integer)</Label>
                    <Input
                      type="text"
                      value={String(formData.correct_answer || '')}
                      onChange={(e) => setFormData({ ...formData, correct_answer: e.target.value })}
                      placeholder="Enter numerical answer"
                      className="font-mono"
                    />
                  </div>
                )}

                {/* Solution */}
                <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Solution Text (supports LaTeX)</Label>
                    <Textarea
                      value={formData.solution_text}
                      onChange={(e) => setFormData({ ...formData, solution_text: e.target.value })}
                      placeholder="Enter solution explanation..."
                      className="min-h-[100px] font-mono"
                    />
                    <div className="flex items-center gap-2">
                      <ImageUrlInput
                        value={formData.solution_image_url}
                        onChange={(url) => setFormData({ ...formData, solution_image_url: url })}
                        compact
                        label="Solution Image"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handlePasteUrl('solution')}
                        className="h-7 text-xs"
                      >
                        <Link2 className="w-3 h-3 mr-1" />
                        Paste URL
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Solution Preview</Label>
                    <div className="min-h-[100px] p-4 bg-secondary/50 rounded-lg border">
                      {formData.solution_image_url && (
                        <img 
                          src={formData.solution_image_url} 
                          alt="Solution" 
                          className="max-h-24 mb-2 rounded bg-muted object-contain"
                          onError={(e) => (e.target as HTMLImageElement).style.display = 'none'}
                        />
                      )}
                      {formData.solution_text ? (
                        <LatexRenderer content={formData.solution_text} className="text-sm" />
                      ) : (
                        <span className="text-muted-foreground text-sm">Solution preview...</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t shrink-0">
              <Button variant="outline" onClick={() => setIsEditorOpen(false)}>Cancel</Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Question
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* View Question Dialog */}
        <Dialog open={!!viewQuestion} onOpenChange={() => setViewQuestion(null)}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <span className="font-mono text-primary">{viewQuestion?.library_id}</span>
                <Badge variant="outline">{viewQuestion?.question_type.replace('_', ' ')}</Badge>
              </DialogTitle>
            </DialogHeader>
            
            {viewQuestion && (
              <div className="space-y-4">
                <div className="flex gap-2 text-sm flex-wrap">
                  <Badge>{viewQuestion.subject}</Badge>
                  {viewQuestion.chapter && <Badge variant="secondary">{viewQuestion.chapter}</Badge>}
                  {viewQuestion.topic && <Badge variant="outline">{viewQuestion.topic}</Badge>}
                  <Badge className={cn(
                    viewQuestion.difficulty === 'easy' && "bg-green-500",
                    viewQuestion.difficulty === 'medium' && "bg-yellow-500",
                    viewQuestion.difficulty === 'hard' && "bg-red-500"
                  )}>
                    {viewQuestion.difficulty}
                  </Badge>
                </div>

                {viewQuestion.question_image_url && (
                  <img src={viewQuestion.question_image_url} alt="Question" className="max-w-full rounded-lg border" />
                )}

                {viewQuestion.question_text && (
                  <div className="p-4 bg-secondary/50 rounded-lg">
                    <LatexRenderer content={viewQuestion.question_text} />
                  </div>
                )}

                {viewQuestion.question_type !== 'integer' && viewQuestion.options && (
                  <div className="space-y-2">
                    {viewQuestion.options.map((opt: any, i: number) => {
                      const isCorrect = viewQuestion.question_type === 'multiple_choice'
                        ? Array.isArray(viewQuestion.correct_answer) && viewQuestion.correct_answer.includes(opt.label)
                        : viewQuestion.correct_answer === opt.label;
                      
                      return (
                        <div key={i} className={cn(
                          "flex items-start gap-3 p-3 rounded-lg border",
                          isCorrect ? "bg-green-500/10 border-green-500" : "border-border"
                        )}>
                          <span className={cn(
                            "w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs",
                            isCorrect ? "bg-green-500 text-white" : "bg-muted"
                          )}>
                            {opt.label}
                          </span>
                          <div className="flex-1">
                            {opt.image_url && (
                              <img src={opt.image_url} alt={`Option ${opt.label}`} className="max-h-20 rounded mb-1" />
                            )}
                            {opt.text && <LatexRenderer content={opt.text} className="text-sm" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {viewQuestion.question_type === 'integer' && (
                  <div className="p-4 bg-green-500/10 border border-green-500 rounded-lg">
                    <Label className="text-xs text-muted-foreground">Correct Answer</Label>
                    <p className="text-lg font-mono font-bold">{viewQuestion.correct_answer}</p>
                  </div>
                )}

                {(viewQuestion.solution_text || viewQuestion.solution_image_url) && (
                  <div className="pt-4 border-t">
                    <Label className="text-xs text-muted-foreground mb-2 block">Solution</Label>
                    {viewQuestion.solution_image_url && (
                      <img src={viewQuestion.solution_image_url} alt="Solution" className="max-w-full rounded-lg border mb-2" />
                    )}
                    {viewQuestion.solution_text && (
                      <div className="p-4 bg-secondary/50 rounded-lg">
                        <LatexRenderer content={viewQuestion.solution_text} />
                      </div>
                    )}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t text-sm text-muted-foreground">
                  <span>+{viewQuestion.marks}/-{viewQuestion.negative_marks} marks • {viewQuestion.time_seconds}s</span>
                  <span>Used {viewQuestion.usage_count} times</span>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}
