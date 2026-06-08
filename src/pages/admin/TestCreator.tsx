import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Clock, Hash, ArrowRight, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";

type ExamPattern = "jee_mains" | "jee_advanced" | "custom";

interface PatternInfo {
  subjects: string[];
  sectionsPerSubject: { name: string; type: string; questionCount: number; marks: number; negative: number }[];
  totalQuestions: number;
  duration: number;
}

const JEE_MAINS_PATTERN: PatternInfo = {
  subjects: ["Physics", "Chemistry", "Mathematics"],
  sectionsPerSubject: [
    { name: "Single Correct MCQ", type: "single_choice", questionCount: 20, marks: 4, negative: 1 },
    { name: "Integer Type", type: "integer", questionCount: 5, marks: 4, negative: 1 }
  ],
  totalQuestions: 75,
  duration: 180
};

const JEE_ADVANCED_PATTERN: PatternInfo = {
  subjects: ["Physics", "Chemistry", "Mathematics"],
  sectionsPerSubject: [
    { name: "Single Correct MCQ", type: "single_choice", questionCount: 6, marks: 3, negative: 1 },
    { name: "Multiple Correct MCQ", type: "multiple_choice", questionCount: 6, marks: 4, negative: 2 },
    { name: "Integer Type", type: "integer", questionCount: 6, marks: 3, negative: 0 }
  ],
  totalQuestions: 54,
  duration: 180
};

export default function TestCreator() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [formData, setFormData] = useState({
    name: "",
    exam_type: "jee_mains" as ExamPattern,
    duration_minutes: 180,
    total_questions: 75
  });
  const [isCreating, setIsCreating] = useState(false);

  const getPatternInfo = (type: ExamPattern): PatternInfo | null => {
    switch (type) {
      case "jee_mains": return JEE_MAINS_PATTERN;
      case "jee_advanced": return JEE_ADVANCED_PATTERN;
      default: return null;
    }
  };

  const handlePatternChange = (type: ExamPattern) => {
    const pattern = getPatternInfo(type);
    if (pattern) {
      setFormData({
        ...formData,
        exam_type: type,
        duration_minutes: pattern.duration,
        total_questions: pattern.totalQuestions
      });
    } else {
      setFormData({ ...formData, exam_type: type });
    }
  };

  const createTestWithPattern = async (testId: string, pattern: PatternInfo) => {
    let questionNumber = 1;

    for (const subjectName of pattern.subjects) {
      // Create subject
      const { data: subject, error: subjError } = await supabase
        .from("test_subjects")
        .insert({
          test_id: testId,
          name: subjectName,
          order_index: pattern.subjects.indexOf(subjectName)
        })
        .select()
        .single();

      if (subjError || !subject) {
        console.error("Failed to create subject:", subjError);
        continue;
      }

      for (const sectionDef of pattern.sectionsPerSubject) {
        // Create section
        const { data: section, error: secError } = await supabase
          .from("test_sections")
          .insert({
            subject_id: subject.id,
            name: sectionDef.name,
            section_type: sectionDef.type,
            order_index: pattern.sectionsPerSubject.indexOf(sectionDef)
          })
          .select()
          .single();

        if (secError || !section) {
          console.error("Failed to create section:", secError);
          continue;
        }

        // Create placeholder questions
        const questionsToInsert = [];
        for (let i = 0; i < sectionDef.questionCount; i++) {
          questionsToInsert.push({
            test_id: testId,
            section_id: section.id,
            question_number: questionNumber++,
            correct_answer: sectionDef.type === "multiple_choice" ? [] : "",
            marks: sectionDef.marks,
            negative_marks: sectionDef.negative,
            order_index: i
          });
        }

        if (questionsToInsert.length > 0) {
          const { error: qError } = await supabase
            .from("test_section_questions")
            .insert(questionsToInsert);
          
          if (qError) {
            console.error("Failed to create questions:", qError);
          }
        }
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast({ title: "Please enter a test title", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const { data, error } = await supabase
        .from('tests')
        .insert([{
          name: formData.name,
          exam_type: formData.exam_type === 'custom' ? 'jee_mains' : formData.exam_type,
          duration_minutes: formData.duration_minutes,
          test_type: 'full',
          is_published: false,
          created_by: user?.id
        }])
        .select()
        .single();

      if (error) throw error;

      // Auto-generate structure for preset patterns
      const pattern = getPatternInfo(formData.exam_type);
      if (pattern) {
        await createTestWithPattern(data.id, pattern);
        toast({ 
          title: "Test created with JEE pattern!", 
          description: `${pattern.totalQuestions} placeholder questions generated.`
        });
      } else {
        toast({ title: "Test created successfully!" });
      }

      navigate(`/admin/test-editor/${data.id}`);
    } catch (err: any) {
      toast({ title: "Error creating test", description: err.message, variant: "destructive" });
    } finally {
      setIsCreating(false);
    }
  };

  const selectedPattern = getPatternInfo(formData.exam_type);

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold font-display mb-2">
            Create New <span className="gradient-text">Normal Test</span>
          </h1>
          <p className="text-muted-foreground">
            Set up your question-based test with exam pattern presets
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onSubmit={handleCreate}
          className="glass-card p-8 space-y-6"
        >
          {/* Test Title */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-2">
              <FileText className="w-4 h-4 text-primary" />
              Test Title
            </label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., JEE Mains Mock Test 2024"
              className="h-12 text-lg"
              required
            />
          </div>

          {/* Exam Pattern Selection */}
          <div>
            <label className="flex items-center gap-2 text-sm font-medium mb-3">
              <Sparkles className="w-4 h-4 text-primary" />
              Exam Pattern Preset
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                type="button"
                onClick={() => handlePatternChange('jee_mains')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.exam_type === 'jee_mains'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {formData.exam_type === 'jee_mains' && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                  <div className="font-bold text-lg">JEE Main</div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 75 Questions (25 per subject)</p>
                  <p>• 20 MCQ (+4/-1) + 5 Integer (+4/0)</p>
                  <p>• 180 minutes</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handlePatternChange('jee_advanced')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.exam_type === 'jee_advanced'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {formData.exam_type === 'jee_advanced' && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                  <div className="font-bold text-lg">JEE Advanced</div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• 54 Questions (18 per subject)</p>
                  <p>• Single (+3/-1) + Multi (+4/-2) + Int</p>
                  <p>• 180 minutes</p>
                </div>
              </button>
              
              <button
                type="button"
                onClick={() => handlePatternChange('custom')}
                className={`p-4 rounded-xl border-2 transition-all text-left ${
                  formData.exam_type === 'custom'
                    ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                    : 'border-border hover:border-primary/50'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {formData.exam_type === 'custom' && (
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                  )}
                  <div className="font-bold text-lg">Custom</div>
                </div>
                <div className="text-xs text-muted-foreground space-y-1">
                  <p>• Define your own pattern</p>
                  <p>• Add subjects & sections manually</p>
                  <p>• Full flexibility</p>
                </div>
              </button>
            </div>
          </div>

          {/* Pattern Preview */}
          {selectedPattern && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="bg-secondary/30 rounded-xl p-4 border border-border"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertCircle className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm">Auto-generated Structure</span>
              </div>
              <div className="grid md:grid-cols-3 gap-3">
                {selectedPattern.subjects.map((subject) => (
                  <div key={subject} className="bg-card/50 rounded-lg p-3">
                    <div className="font-semibold text-sm mb-2">{subject}</div>
                    <div className="space-y-1">
                      {selectedPattern.sectionsPerSubject.map((sec, idx) => (
                        <div key={idx} className="text-xs text-muted-foreground flex justify-between">
                          <span>{sec.questionCount}× {sec.name.split(' ')[0]}</span>
                          <span className="text-green-500">+{sec.marks}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-3 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                All questions are placeholder and fully editable after creation
              </p>
            </motion.div>
          )}

          {/* Duration & Questions (for custom) */}
          {formData.exam_type === 'custom' && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Clock className="w-4 h-4 text-primary" />
                  Duration (minutes)
                </label>
                <Input
                  type="number"
                  value={formData.duration_minutes}
                  onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) || 180 })}
                  min={30}
                  max={360}
                  className="h-12"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium mb-2">
                  <Hash className="w-4 h-4 text-primary" />
                  Total Questions (target)
                </label>
                <Input
                  type="number"
                  value={formData.total_questions}
                  onChange={(e) => setFormData({ ...formData, total_questions: parseInt(e.target.value) || 90 })}
                  min={1}
                  max={300}
                  className="h-12"
                />
              </div>
            </div>
          )}

          {/* Summary */}
          <div className="bg-primary/5 rounded-xl p-4 flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Total</div>
              <div className="font-bold text-xl">
                {selectedPattern?.totalQuestions || formData.total_questions} Questions • {selectedPattern?.duration || formData.duration_minutes} min
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-muted-foreground">Max Marks</div>
              <div className="font-bold text-xl text-primary">
                {selectedPattern ? 
                  selectedPattern.subjects.length * 
                  selectedPattern.sectionsPerSubject.reduce((sum, s) => sum + s.questionCount * s.marks, 0) 
                  : formData.total_questions * 4}
              </div>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            variant="gradient"
            className="w-full h-12 text-lg"
            disabled={isCreating}
          >
            {isCreating ? (
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-primary-foreground" />
            ) : (
              <>
                {selectedPattern ? "Create & Generate Questions" : "Create Test"}
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </motion.form>
      </div>
    </AdminLayout>
  );
}