import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FileText, Clock, Hash, ArrowRight, Upload, Check, X, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { createDeferred, isCancelError, withTimeout } from "@/lib/async";

const MARKING_SCHEMES = {
  jee_mains: {
    single_choice: { marks: 4, negative_marks: 1 },
    multiple_choice: { marks: 4, negative_marks: 0 },
    integer: { marks: 4, negative_marks: 0 }
  },
  jee_advanced: {
    single_choice: { marks: 3, negative_marks: 1 },
    multiple_choice: { marks: 4, negative_marks: 0, partial: true },
    integer: { marks: 3, negative_marks: 0 }
  }
};

const UPLOAD_TIMEOUT_MS = 120000; // 2 minutes timeout

export default function PDFTestCreate() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const cancelRef = useRef<ReturnType<typeof createDeferred> | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    exam_type: "jee_mains" as "jee_mains" | "jee_advanced",
    subject: "Mixed",
    duration_minutes: 180,
    total_questions: 90
  });

  const scheme = MARKING_SCHEMES[formData.exam_type];

  const handlePDFSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === "application/pdf") {
      setPdfFile(file);
    } else {
      toast({ title: "Please select a valid PDF file", variant: "destructive" });
    }
  };

  const handleCancel = () => {
    cancelRef.current?.reject(new Error("CANCELLED"));
    cancelRef.current = null;

    setIsCreating(false);
    setUploading(false);
    setUploadProgress("");
    toast({ title: "Upload cancelled" });
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast({ title: "Please enter a test title", variant: "destructive" });
      return;
    }
    if (!pdfFile) {
      toast({ title: "PDF upload is required", variant: "destructive" });
      return;
    }

    cancelRef.current = createDeferred();
    const cancelPromise = cancelRef.current.promise as Promise<never>;

    setIsCreating(true);
    setUploading(true);
    setUploadProgress("Uploading PDF...");

    try {
      const sessionPromise = withTimeout(supabase.auth.getSession(), 15000, "Request timed out");
      // prevent unhandled rejection if cancel wins the race
      sessionPromise.catch(() => {});

      const sessionRes = (await Promise.race([sessionPromise, cancelPromise])) as any;

      const sessionData = sessionRes?.data;
      const sessionError = sessionRes?.error;
      if (sessionError || !sessionData?.session) {
        throw new Error("Session expired. Please log in again.");
      }

      // Upload PDF (race with timeout + cancel)
      const pdfPath = `tests/${Date.now()}_${pdfFile.name}`;
      const uploadTask = supabase.storage.from("test-pdfs").upload(pdfPath, pdfFile);

      const uploadPromise = withTimeout(uploadTask, UPLOAD_TIMEOUT_MS, "Upload timed out");
      // prevent unhandled rejection if cancel wins the race
      uploadPromise.catch(() => {});

      const uploadRes = (await Promise.race([uploadPromise, cancelPromise])) as any;

      if (uploadRes?.error) throw uploadRes.error;

      setUploading(false);
      setUploadProgress("Creating test...");

      const insertTask = supabase
        .from("tests")
        .insert([
          {
            name: formData.name,
            exam_type: formData.exam_type,
            duration_minutes: formData.duration_minutes,
            test_type: "pdf",
            is_published: false,
            created_by: user?.id,
            pdf_url: pdfPath,
            description: `${formData.subject} - ${formData.total_questions} questions`,
          },
        ])
        .select()
        .single();

      const insertPromise = withTimeout(insertTask, 20000, "Request timed out");
      // prevent unhandled rejection if cancel wins the race
      insertPromise.catch(() => {});

      const insertRes = (await Promise.race([insertPromise, cancelPromise])) as any;

      if (insertRes?.error) throw insertRes.error;

      toast({ title: "Test created successfully!" });
      navigate(`/admin/pdf-tests/${insertRes.data.id}/edit`);
    } catch (err: any) {
      if (isCancelError(err)) {
        return;
      }

      const message = err?.message || "An unexpected error occurred";

      if (message === "Upload timed out") {
        toast({
          title: "Upload timed out",
          description: "The upload took too long. Please try again (or use a smaller PDF / better connection).",
          variant: "destructive",
        });
      } else if (message.includes("Session expired")) {
        toast({
          title: "Session expired",
          description: "Please log in again to continue.",
          variant: "destructive",
        });
        navigate("/auth");
      } else {
        toast({
          title: "Error creating test",
          description: message,
          variant: "destructive",
        });
      }
    } finally {
      cancelRef.current = null;
      setIsCreating(false);
      setUploading(false);
      setUploadProgress("");
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-3xl lg:text-4xl font-bold font-display mb-2">
            Create PDF <span className="gradient-text">Test</span>
          </h1>
          <p className="text-muted-foreground">
            Upload a test PDF and set up the answer key
          </p>
        </motion.div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                step >= s 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-secondary text-muted-foreground"
              }`}>
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div className={`w-16 h-1 mx-2 rounded ${
                  step > s ? "bg-primary" : "bg-secondary"
                }`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Exam Type */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 space-y-6"
          >
            <h2 className="text-xl font-semibold mb-4">Select Exam Type</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, exam_type: "jee_mains" })}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  formData.exam_type === "jee_mains"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-semibold text-lg mb-2">JEE Mains</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• MCQ Single: +4 / -1</p>
                  <p>• MCQ Multiple: +4 / 0</p>
                  <p>• Numerical: +4 / 0</p>
                </div>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, exam_type: "jee_advanced" })}
                className={`p-6 rounded-xl border-2 transition-all text-left ${
                  formData.exam_type === "jee_advanced"
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <div className="font-semibold text-lg mb-2">JEE Advanced</div>
                <div className="text-sm text-muted-foreground space-y-1">
                  <p>• MCQ Single: +3 / -1</p>
                  <p>• MCQ Multiple: +4 (partial)</p>
                  <p>• Numerical: +3 / 0</p>
                </div>
              </button>
            </div>

            <div className="p-4 rounded-lg bg-secondary/50 mt-6">
              <h3 className="font-medium mb-2">Selected Marking Scheme</h3>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium">Single Choice</p>
                  <p className="text-muted-foreground">
                    +{scheme.single_choice.marks} / -{scheme.single_choice.negative_marks}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium">Multiple Choice</p>
                  <p className="text-muted-foreground">
                    +{scheme.multiple_choice.marks} / -{scheme.multiple_choice.negative_marks}
                    {formData.exam_type === "jee_advanced" && " (Partial)"}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-background/50">
                  <p className="font-medium">Numerical</p>
                  <p className="text-muted-foreground">
                    +{scheme.integer.marks} / -{scheme.integer.negative_marks}
                  </p>
                </div>
              </div>
            </div>

            <Button
              variant="gradient"
              className="w-full"
              onClick={() => setStep(2)}
            >
              Continue
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 space-y-6"
          >
            <h2 className="text-xl font-semibold mb-4">Test Information</h2>

            <div className="space-y-4">
              <div>
                <Label className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-primary" />
                  Test Title
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g., JEE Mains Mock Test 2024"
                  className="h-12"
                />
              </div>

              <div>
                <Label className="mb-2 block">Subject</Label>
                <Select
                  value={formData.subject}
                  onValueChange={(value) => setFormData({ ...formData, subject: value })}
                >
                  <SelectTrigger className="h-12">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Physics">Physics</SelectItem>
                    <SelectItem value="Chemistry">Chemistry</SelectItem>
                    <SelectItem value="Mathematics">Mathematics</SelectItem>
                    <SelectItem value="Mixed">Mixed (All Subjects)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-primary" />
                    Duration (minutes)
                  </Label>
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
                  <Label className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-primary" />
                    Total Questions
                  </Label>
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
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                Back
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                onClick={() => setStep(3)}
                disabled={!formData.name.trim()}
              >
                Continue
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </div>
          </motion.div>
        )}

        {/* Step 3: PDF Upload */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="glass-card p-8 space-y-6"
          >
            <h2 className="text-xl font-semibold mb-4">Upload Test PDF</h2>

            <div className="border-2 border-dashed border-border rounded-xl p-8 text-center">
              {pdfFile ? (
                <div className="space-y-4">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-[hsl(142,76%,36%)]/20 flex items-center justify-center">
                    <Check className="w-8 h-8 text-[hsl(142,76%,36%)]" />
                  </div>
                  <div>
                    <p className="font-medium">{pdfFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                  <Button variant="outline" onClick={() => setPdfFile(null)} disabled={isCreating}>
                    Change PDF
                  </Button>
                </div>
              ) : (
                <label className="cursor-pointer block">
                  <div className="w-16 h-16 mx-auto rounded-xl bg-primary/20 flex items-center justify-center mb-4">
                    <Upload className="w-8 h-8 text-primary" />
                  </div>
                  <p className="font-medium mb-1">Click to upload PDF</p>
                  <p className="text-sm text-muted-foreground">
                    or drag and drop your test PDF here
                  </p>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handlePDFSelect}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Upload Progress */}
            {isCreating && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 text-primary animate-spin" />
                    <p className="text-sm font-medium text-primary">{uploadProgress}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleCancel}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="w-4 h-4 mr-1" />
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="p-4 rounded-lg bg-[hsl(45,93%,47%)]/10 border border-[hsl(45,93%,47%)]/30">
              <p className="text-sm text-[hsl(45,93%,47%)]">
                <strong>Important:</strong> The PDF will be displayed to students during the test. 
                Make sure it contains all questions clearly.
              </p>
            </div>

            <div className="flex gap-4">
              <Button variant="outline" onClick={() => setStep(2)} className="flex-1" disabled={isCreating}>
                Back
              </Button>
              <Button
                variant="gradient"
                className="flex-1"
                onClick={handleCreate}
                disabled={!pdfFile || isCreating}
              >
                {isCreating ? (
                  uploading ? "Uploading PDF..." : "Creating Test..."
                ) : (
                  <>
                    Create & Open Editor
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </motion.div>
        )}
      </div>
    </AdminLayout>
  );
}
