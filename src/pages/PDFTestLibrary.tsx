import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Filter, 
  Clock, 
  FileText, 
  Zap,
  CheckCircle2,
  BarChart3,
  BookOpen,
  Play
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface PDFTest {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  exam_type: string;
  question_count: number;
  attempt_count: number;
  user_attempted: boolean;
  user_completed: boolean;
  awaiting_result: boolean;
  scheduled_at: string | null;
}

export default function PDFTestLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [tests, setTests] = useState<PDFTest[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchTests();
    }
  }, [user]);

  const fetchTests = async () => {
    try {
      // Fetch published PDF tests
      const { data: testsData } = await supabase
        .from("tests")
        .select(`
          id,
          name,
          description,
          duration_minutes,
          exam_type,
          scheduled_at
        `)
        .eq("is_published", true)
        .eq("test_type", "pdf")
        .not("pdf_url", "is", null);

      if (testsData) {
        const testsWithCounts = await Promise.all(
          testsData.map(async (test) => {
            // Get question count
            const { count: questionCount } = await supabase
              .from("test_section_questions")
              .select("*", { count: "exact", head: true })
              .eq("test_id", test.id);

            // Get total attempt count
            const { count: attemptCount } = await supabase
              .from("test_attempts")
              .select("*", { count: "exact", head: true })
              .eq("test_id", test.id);

            // Check user's attempt status
            const { data: userAttempt } = await supabase
              .from("test_attempts")
              .select("id, completed_at, awaiting_result")
              .eq("test_id", test.id)
              .eq("user_id", user!.id)
              .maybeSingle();

            return {
              id: test.id,
              name: test.name,
              description: test.description,
              duration_minutes: test.duration_minutes,
              exam_type: test.exam_type || "jee_mains",
              question_count: questionCount || 0,
              attempt_count: attemptCount || 0,
              user_attempted: !!userAttempt,
              user_completed: !!userAttempt?.completed_at,
              awaiting_result: userAttempt?.awaiting_result || false,
              scheduled_at: test.scheduled_at,
            };
          })
        );
        setTests(testsWithCounts);
      }
    } catch (err) {
      console.error("Error fetching PDF tests:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleTestClick = (test: PDFTest) => {
    // Check if test is scheduled for future
    if (test.scheduled_at && new Date(test.scheduled_at) > new Date()) {
      return; // Test not available yet
    }

    if (test.user_completed && !test.awaiting_result) {
      navigate(`/test/${test.id}/analysis`);
    } else {
      navigate(`/pdf-test/${test.id}`);
    }
  };

  const filteredTests = tests.filter((test) =>
    test.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const isTestAvailable = (test: PDFTest) => {
    if (!test.scheduled_at) return true;
    return new Date(test.scheduled_at) <= new Date();
  };

  const getTimeUntilAvailable = (scheduledAt: string) => {
    const now = new Date();
    const scheduled = new Date(scheduledAt);
    const diff = scheduled.getTime() - now.getTime();
    
    if (diff <= 0) return null;
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days}d ${hours % 24}h`;
    }
    return `${hours}h ${minutes}m`;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold font-display mb-2">
            PDF <span className="gradient-text">Tests</span>
          </h1>
          <p className="text-muted-foreground">
            Take PDF-based tests with detailed answer sheets
          </p>
        </div>

        {/* Search */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search PDF tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        {/* Test Grid */}
        {filteredTests.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No PDF Tests Available</h3>
            <p className="text-muted-foreground">
              {searchQuery ? "No tests match your search." : "No published PDF tests yet. Check back soon!"}
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((test, index) => {
              const available = isTestAvailable(test);
              const timeUntil = test.scheduled_at ? getTimeUntilAvailable(test.scheduled_at) : null;
              
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className={`glass-card p-6 group transition-all cursor-pointer ${
                    available 
                      ? "hover:border-primary/40" 
                      : "opacity-60 cursor-not-allowed"
                  }`}
                  onClick={() => available && handleTestClick(test)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                        {test.exam_type === "jee_advanced" ? "JEE Advanced" : "JEE Mains"}
                      </span>
                      {test.user_completed && !test.awaiting_result && (
                        <span className="px-2 py-1 rounded-md bg-success/10 text-success text-xs font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Completed
                        </span>
                      )}
                      {test.awaiting_result && (
                        <span className="px-2 py-1 rounded-md bg-warning/10 text-warning text-xs font-medium">
                          Awaiting Result
                        </span>
                      )}
                      {!available && timeUntil && (
                        <span className="px-2 py-1 rounded-md bg-secondary text-muted-foreground text-xs font-medium">
                          Starts in {timeUntil}
                        </span>
                      )}
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold font-display mb-2 group-hover:text-primary transition-colors">
                    {test.name}
                  </h3>

                  {test.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {test.description}
                    </p>
                  )}

                  <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      {test.question_count} Q
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {test.duration_minutes} min
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {test.attempt_count.toLocaleString()} attempts
                    </span>
                    <Button 
                      variant="glass" 
                      size="sm" 
                      className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      disabled={!available}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (available) handleTestClick(test);
                      }}
                    >
                      {test.user_completed && !test.awaiting_result ? (
                        <>
                          <BarChart3 className="w-4 h-4" />
                          Analysis
                        </>
                      ) : test.awaiting_result ? (
                        <>
                          <Clock className="w-4 h-4" />
                          Pending
                        </>
                      ) : test.user_attempted ? (
                        <>
                          <Play className="w-4 h-4" />
                          Resume
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          Start
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
