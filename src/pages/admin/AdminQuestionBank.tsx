import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Trash2,
  Edit2,
  BookOpen,
  Layers,
  FileQuestion,
  ChevronRight,
  GripVertical,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import AdminLayout from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Course {
  id: string;
  title: string;
  slug: string;
  description: string | null;
  created_at: string;
}

interface Chapter {
  id: string;
  course_id: string;
  title: string;
  order_index: number;
  created_at: string;
}

interface Question {
  id: string;
  course_id: string;
  chapter_id: string;
  qno: number;
  type: "mcq_single" | "mcq_multi" | "integer" | "numeric";
  options: string[] | null;
  correct: string | string[] | number;
  difficulty: "easy" | "medium" | "hard";
  marks: { positive: number; negative: number };
  text_source: "pdf" | "inline";
  pdf_page: number | null;
  pdf_coords: object | null;
  created_at: string;
}

const difficultyColors = {
  easy: "bg-green-500/10 text-green-500 border-green-500/20",
  medium: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
  hard: "bg-red-500/10 text-red-500 border-red-500/20",
};

export default function AdminQuestionBank() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedChapter, setSelectedChapter] = useState<Chapter | null>(null);
  const [loading, setLoading] = useState(true);

  // Dialog states
  const [courseDialog, setCourseDialog] = useState(false);
  const [chapterDialog, setChapterDialog] = useState(false);
  const [questionDialog, setQuestionDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState<{
    type: "course" | "chapter" | "question";
    id: string;
    name: string;
  } | null>(null);

  // Edit states
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingChapter, setEditingChapter] = useState<Chapter | null>(null);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);

  // Form states
  const [courseForm, setCourseForm] = useState({ title: "", slug: "", description: "" });
  const [chapterForm, setChapterForm] = useState({ title: "" });
  const [questionForm, setQuestionForm] = useState({
    type: "mcq_single" as Question["type"],
    difficulty: "medium" as Question["difficulty"],
    options: ["", "", "", ""],
    correct: "" as string | string[],
    marks: { positive: 4, negative: 1 },
    pdf_page: "",
  });

  useEffect(() => {
    fetchCourses();
  }, []);

  useEffect(() => {
    if (selectedCourse) {
      fetchChapters(selectedCourse.id);
    } else {
      setChapters([]);
      setSelectedChapter(null);
    }
  }, [selectedCourse]);

  useEffect(() => {
    if (selectedChapter) {
      fetchQuestions(selectedChapter.id);
    } else {
      setQuestions([]);
    }
  }, [selectedChapter]);

  const fetchCourses = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("qb_courses")
      .select("*")
      .order("title");
    if (error) {
      toast.error("Failed to fetch courses");
    } else {
      setCourses(data || []);
    }
    setLoading(false);
  };

  const fetchChapters = async (courseId: string) => {
    const { data, error } = await supabase
      .from("qb_chapters")
      .select("*")
      .eq("course_id", courseId)
      .order("order_index");
    if (error) {
      toast.error("Failed to fetch chapters");
    } else {
      setChapters(data || []);
    }
  };

  const fetchQuestions = async (chapterId: string) => {
    const { data, error } = await supabase
      .from("qb_questions")
      .select("*")
      .eq("chapter_id", chapterId)
      .order("qno");
    if (error) {
      toast.error("Failed to fetch questions");
    } else if (data) {
      setQuestions(data.map((q) => ({
        ...q,
        type: q.type as Question["type"],
        difficulty: q.difficulty as Question["difficulty"],
        options: q.options as string[] | null,
        correct: q.correct as string | string[] | number,
        marks: q.marks as { positive: number; negative: number },
        text_source: q.text_source as "pdf" | "inline",
        pdf_coords: q.pdf_coords as object | null,
      })));
    }
  };

  // Course CRUD
  const handleSaveCourse = async () => {
    if (!courseForm.title || !courseForm.slug) {
      toast.error("Title and slug are required");
      return;
    }

    if (editingCourse) {
      const { error } = await supabase
        .from("qb_courses")
        .update({
          title: courseForm.title,
          slug: courseForm.slug,
          description: courseForm.description || null,
        })
        .eq("id", editingCourse.id);
      if (error) {
        toast.error("Failed to update course");
      } else {
        toast.success("Course updated");
        fetchCourses();
      }
    } else {
      const { error } = await supabase.from("qb_courses").insert({
        title: courseForm.title,
        slug: courseForm.slug,
        description: courseForm.description || null,
      });
      if (error) {
        toast.error("Failed to create course");
      } else {
        toast.success("Course created");
        fetchCourses();
      }
    }

    setCourseDialog(false);
    setEditingCourse(null);
    setCourseForm({ title: "", slug: "", description: "" });
  };

  // Chapter CRUD
  const handleSaveChapter = async () => {
    if (!chapterForm.title || !selectedCourse) {
      toast.error("Title is required");
      return;
    }

    const maxOrder = chapters.length > 0 ? Math.max(...chapters.map((c) => c.order_index)) + 1 : 0;

    if (editingChapter) {
      const { error } = await supabase
        .from("qb_chapters")
        .update({ title: chapterForm.title })
        .eq("id", editingChapter.id);
      if (error) {
        toast.error("Failed to update chapter");
      } else {
        toast.success("Chapter updated");
        fetchChapters(selectedCourse.id);
      }
    } else {
      const { error } = await supabase.from("qb_chapters").insert({
        course_id: selectedCourse.id,
        title: chapterForm.title,
        order_index: maxOrder,
      });
      if (error) {
        toast.error("Failed to create chapter");
      } else {
        toast.success("Chapter created");
        fetchChapters(selectedCourse.id);
      }
    }

    setChapterDialog(false);
    setEditingChapter(null);
    setChapterForm({ title: "" });
  };

  // Question CRUD
  const handleSaveQuestion = async () => {
    if (!selectedChapter || !selectedCourse) {
      toast.error("Please select a chapter first");
      return;
    }

    const qno = editingQuestion
      ? editingQuestion.qno
      : questions.length > 0
      ? Math.max(...questions.map((q) => q.qno)) + 1
      : 1;

    let correctValue: string | string[] | number = questionForm.correct;
    if (questionForm.type === "integer" || questionForm.type === "numeric") {
      correctValue = parseFloat(questionForm.correct as string);
    } else if (questionForm.type === "mcq_multi") {
      correctValue = Array.isArray(questionForm.correct) ? questionForm.correct : [questionForm.correct];
    }

    const questionData = {
      course_id: selectedCourse.id,
      chapter_id: selectedChapter.id,
      qno,
      type: questionForm.type,
      difficulty: questionForm.difficulty,
      options: questionForm.type.startsWith("mcq") ? questionForm.options.filter((o) => o) : null,
      correct: correctValue,
      marks: questionForm.marks,
      pdf_page: questionForm.pdf_page ? parseInt(questionForm.pdf_page) : null,
    };

    if (editingQuestion) {
      const { error } = await supabase
        .from("qb_questions")
        .update(questionData)
        .eq("id", editingQuestion.id);
      if (error) {
        toast.error("Failed to update question");
      } else {
        toast.success("Question updated");
        fetchQuestions(selectedChapter.id);
      }
    } else {
      const { error } = await supabase.from("qb_questions").insert(questionData);
      if (error) {
        toast.error("Failed to create question");
      } else {
        toast.success("Question created");
        fetchQuestions(selectedChapter.id);
      }
    }

    setQuestionDialog(false);
    setEditingQuestion(null);
    resetQuestionForm();
  };

  const resetQuestionForm = () => {
    setQuestionForm({
      type: "mcq_single",
      difficulty: "medium",
      options: ["", "", "", ""],
      correct: "",
      marks: { positive: 4, negative: 1 },
      pdf_page: "",
    });
  };

  // Delete handlers
  const handleDelete = async () => {
    if (!deleteDialog) return;

    const table =
      deleteDialog.type === "course"
        ? "qb_courses"
        : deleteDialog.type === "chapter"
        ? "qb_chapters"
        : "qb_questions";

    const { error } = await supabase.from(table).delete().eq("id", deleteDialog.id);

    if (error) {
      toast.error(`Failed to delete ${deleteDialog.type}`);
    } else {
      toast.success(`${deleteDialog.type} deleted`);
      if (deleteDialog.type === "course") {
        fetchCourses();
        if (selectedCourse?.id === deleteDialog.id) {
          setSelectedCourse(null);
        }
      } else if (deleteDialog.type === "chapter") {
        if (selectedCourse) fetchChapters(selectedCourse.id);
        if (selectedChapter?.id === deleteDialog.id) {
          setSelectedChapter(null);
        }
      } else {
        if (selectedChapter) fetchQuestions(selectedChapter.id);
      }
    }

    setDeleteDialog(null);
  };

  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({
      title: course.title,
      slug: course.slug,
      description: course.description || "",
    });
    setCourseDialog(true);
  };

  const openEditChapter = (chapter: Chapter) => {
    setEditingChapter(chapter);
    setChapterForm({ title: chapter.title });
    setChapterDialog(true);
  };

  const openEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setQuestionForm({
      type: question.type,
      difficulty: question.difficulty,
      options: question.options || ["", "", "", ""],
      correct: Array.isArray(question.correct)
        ? question.correct
        : String(question.correct),
      marks: question.marks,
      pdf_page: question.pdf_page ? String(question.pdf_page) : "",
    });
    setQuestionDialog(true);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold font-display gradient-text">Question Bank</h1>
          <p className="text-muted-foreground mt-1">
            Manage courses, chapters, and questions
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Courses Column */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Courses</h2>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setEditingCourse(null);
                  setCourseForm({ title: "", slug: "", description: "" });
                  setCourseDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
              {courses.map((course) => (
                <motion.div
                  key={course.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-all",
                    selectedCourse?.id === course.id
                      ? "bg-primary/10 border-primary/30"
                      : "bg-secondary/30 border-border hover:bg-secondary/50"
                  )}
                  onClick={() => setSelectedCourse(course)}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{course.title}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => {
                          e.stopPropagation();
                          openEditCourse(course);
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteDialog({
                            type: "course",
                            id: course.id,
                            name: course.title,
                          });
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                  {course.description && (
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                      {course.description}
                    </p>
                  )}
                </motion.div>
              ))}
              {courses.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>No courses yet</p>
                </div>
              )}
            </div>
          </div>

          {/* Chapters Column */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Chapters</h2>
              </div>
              <Button
                size="sm"
                disabled={!selectedCourse}
                onClick={() => {
                  setEditingChapter(null);
                  setChapterForm({ title: "" });
                  setChapterDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {!selectedCourse ? (
              <div className="text-center py-8 text-muted-foreground">
                <ChevronRight className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Select a course</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                {chapters.map((chapter) => (
                  <motion.div
                    key={chapter.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all",
                      selectedChapter?.id === chapter.id
                        ? "bg-primary/10 border-primary/30"
                        : "bg-secondary/30 border-border hover:bg-secondary/50"
                    )}
                    onClick={() => setSelectedChapter(chapter)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <GripVertical className="w-4 h-4 text-muted-foreground" />
                        <span className="font-medium">{chapter.title}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={(e) => {
                            e.stopPropagation();
                            openEditChapter(chapter);
                          }}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteDialog({
                              type: "chapter",
                              id: chapter.id,
                              name: chapter.title,
                            });
                          }}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {chapters.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No chapters yet</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Questions Column */}
          <div className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <FileQuestion className="w-5 h-5 text-primary" />
                <h2 className="font-semibold">Questions</h2>
              </div>
              <Button
                size="sm"
                disabled={!selectedChapter}
                onClick={() => {
                  setEditingQuestion(null);
                  resetQuestionForm();
                  setQuestionDialog(true);
                }}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add
              </Button>
            </div>

            {!selectedChapter ? (
              <div className="text-center py-8 text-muted-foreground">
                <ChevronRight className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p>Select a chapter</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[calc(100vh-250px)] overflow-y-auto">
                {questions.map((question) => (
                  <motion.div
                    key={question.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 rounded-lg border bg-secondary/30 border-border"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-bold">Q{question.qno}</span>
                        <Badge variant="outline" className={difficultyColors[question.difficulty]}>
                          {question.difficulty}
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {question.type.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => openEditQuestion(question)}
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-destructive hover:text-destructive"
                          onClick={() =>
                            setDeleteDialog({
                              type: "question",
                              id: question.id,
                              name: `Question ${question.qno}`,
                            })
                          }
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                      <span>+{question.marks.positive}/-{question.marks.negative}</span>
                      {question.pdf_page && <span>Page {question.pdf_page}</span>}
                    </div>
                  </motion.div>
                ))}
                {questions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <FileQuestion className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No questions yet</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Course Dialog */}
      <Dialog open={courseDialog} onOpenChange={setCourseDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingCourse ? "Edit Course" : "Add Course"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={courseForm.title}
                onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                placeholder="e.g., Physics"
              />
            </div>
            <div>
              <Label>Slug</Label>
              <Input
                value={courseForm.slug}
                onChange={(e) =>
                  setCourseForm({
                    ...courseForm,
                    slug: e.target.value.toLowerCase().replace(/\s+/g, "-"),
                  })
                }
                placeholder="e.g., physics"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={courseForm.description}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                placeholder="Course description..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCourseDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveCourse}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Chapter Dialog */}
      <Dialog open={chapterDialog} onOpenChange={setChapterDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingChapter ? "Edit Chapter" : "Add Chapter"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={chapterForm.title}
                onChange={(e) => setChapterForm({ title: e.target.value })}
                placeholder="e.g., Kinematics"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setChapterDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChapter}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Question Dialog */}
      <Dialog open={questionDialog} onOpenChange={setQuestionDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingQuestion ? `Edit Question ${editingQuestion.qno}` : "Add Question"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Type</Label>
                <Select
                  value={questionForm.type}
                  onValueChange={(v) =>
                    setQuestionForm({ ...questionForm, type: v as Question["type"], correct: "" })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mcq_single">Single Choice</SelectItem>
                    <SelectItem value="mcq_multi">Multiple Choice</SelectItem>
                    <SelectItem value="integer">Integer</SelectItem>
                    <SelectItem value="numeric">Numeric</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Difficulty</Label>
                <Select
                  value={questionForm.difficulty}
                  onValueChange={(v) =>
                    setQuestionForm({ ...questionForm, difficulty: v as Question["difficulty"] })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="easy">Easy</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="hard">Hard</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {questionForm.type.startsWith("mcq") && (
              <div>
                <Label>Options</Label>
                <div className="space-y-2 mt-2">
                  {questionForm.options.map((opt, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <span className="w-6 h-6 flex items-center justify-center rounded-full bg-secondary text-xs font-bold">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <Input
                        value={opt}
                        onChange={(e) => {
                          const newOpts = [...questionForm.options];
                          newOpts[idx] = e.target.value;
                          setQuestionForm({ ...questionForm, options: newOpts });
                        }}
                        placeholder={`Option ${String.fromCharCode(65 + idx)}`}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Correct Answer</Label>
              {questionForm.type === "mcq_single" ? (
                <div className="flex gap-2 mt-2">
                  {["A", "B", "C", "D"].map((opt) => (
                    <Button
                      key={opt}
                      type="button"
                      variant={questionForm.correct === opt ? "default" : "outline"}
                      size="sm"
                      onClick={() => setQuestionForm({ ...questionForm, correct: opt })}
                    >
                      {opt}
                    </Button>
                  ))}
                </div>
              ) : questionForm.type === "mcq_multi" ? (
                <div className="flex gap-2 mt-2">
                  {["A", "B", "C", "D"].map((opt) => {
                    const selected = Array.isArray(questionForm.correct)
                      ? questionForm.correct.includes(opt)
                      : false;
                    return (
                      <Button
                        key={opt}
                        type="button"
                        variant={selected ? "default" : "outline"}
                        size="sm"
                        onClick={() => {
                          const current = Array.isArray(questionForm.correct)
                            ? questionForm.correct
                            : [];
                          const newCorrect = selected
                            ? current.filter((c) => c !== opt)
                            : [...current, opt];
                          setQuestionForm({ ...questionForm, correct: newCorrect });
                        }}
                      >
                        {opt}
                      </Button>
                    );
                  })}
                </div>
              ) : (
                <Input
                  type="number"
                  value={questionForm.correct as string}
                  onChange={(e) => setQuestionForm({ ...questionForm, correct: e.target.value })}
                  placeholder="Enter numeric answer"
                  className="mt-2"
                />
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Positive Marks</Label>
                <Input
                  type="number"
                  value={questionForm.marks.positive}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      marks: { ...questionForm.marks, positive: parseInt(e.target.value) || 0 },
                    })
                  }
                />
              </div>
              <div>
                <Label>Negative Marks</Label>
                <Input
                  type="number"
                  value={questionForm.marks.negative}
                  onChange={(e) =>
                    setQuestionForm({
                      ...questionForm,
                      marks: { ...questionForm.marks, negative: parseInt(e.target.value) || 0 },
                    })
                  }
                />
              </div>
            </div>

            <div>
              <Label>PDF Page (optional)</Label>
              <Input
                type="number"
                value={questionForm.pdf_page}
                onChange={(e) => setQuestionForm({ ...questionForm, pdf_page: e.target.value })}
                placeholder="Page number"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuestionDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveQuestion}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteDialog} onOpenChange={() => setDeleteDialog(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {deleteDialog?.type}?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog?.name}"? This action cannot be undone.
              {deleteDialog?.type === "course" &&
                " All chapters and questions in this course will also be deleted."}
              {deleteDialog?.type === "chapter" &&
                " All questions in this chapter will also be deleted."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
