import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, Filter, Clock, BookOpen, Zap, Star, CheckCircle2, BarChart3, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Link, useNavigate } from "react-router-dom";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Course {
  id: string;
  name: string;
  color: string | null;
  icon: string | null;
}

interface Test {
  id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  test_type: string;
  question_count: number;
  attempt_count: number;
  user_attempted: boolean;
  user_completed: boolean;
  unlock_date: string | null;
}

const difficultyColors: Record<string, string> = {
  easy: "text-success bg-success/10",
  medium: "text-warning bg-warning/10",
  hard: "text-destructive bg-destructive/10",
};

export default function TestLibrary() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [tests, setTests] = useState<Test[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    // Fetch courses
    const { data: coursesData } = await supabase
      .from("courses")
      .select("id, name, color, icon");
    if (coursesData) setCourses(coursesData);

    // Fetch tests that are in user's enrolled batches only
    const { data: enrolledBatches } = await supabase
      .from("batch_enrollments")
      .select("batch_id")
      .eq("user_id", user!.id)
      .eq("is_active", true);

    const batchIds = enrolledBatches?.map(e => e.batch_id) || [];

    // Get test IDs from enrolled batches
    const { data: batchTests } = await supabase
      .from("batch_tests")
      .select("test_id, unlock_date")
      .in("batch_id", batchIds.length > 0 ? batchIds : ['00000000-0000-0000-0000-000000000000']);

    const enrolledTestIds = batchTests?.map(bt => bt.test_id) || [];

    const effectiveUnlockByTestId = new Map<string, string | null>();
    (batchTests || []).forEach((batchTest) => {
      const current = effectiveUnlockByTestId.get(batchTest.test_id);
      if (!batchTest.unlock_date) {
        if (current === undefined) {
          effectiveUnlockByTestId.set(batchTest.test_id, null);
        }
        return;
      }
      if (!current || new Date(batchTest.unlock_date) < new Date(current)) {
        effectiveUnlockByTestId.set(batchTest.test_id, batchTest.unlock_date);
      }
    });

    // Fetch only tests from enrolled batches
    let testsQuery = supabase
      .from("tests")
      .select(`id, name, description, duration_minutes, test_type, test_questions(count)`)
      .eq("is_published", true)
      .neq("test_type", "pdf");

    // If user has enrolled batches, filter by those test IDs
    if (enrolledTestIds.length > 0) {
      testsQuery = testsQuery.in("id", enrolledTestIds);
    } else {
      // No enrolled tests - return empty
      setTests([]);
      setLoading(false);
      return;
    }

    const { data: testsData } = await testsQuery;

    if (testsData) {
      // Get attempt counts and user's attempts
      const testsWithCounts = await Promise.all(
        testsData.map(async (test) => {
          const { count: attemptCount } = await supabase
            .from("test_attempts")
            .select("*", { count: "exact", head: true })
            .eq("test_id", test.id);

          // Check if current user has attempted
          const { data: userAttempt } = await supabase
            .from("test_attempts")
            .select("id, completed_at")
            .eq("test_id", test.id)
            .eq("user_id", user!.id)
            .maybeSingle();

          // Prefer test_questions count; fallback to section-based count.
          let questionCount = (test.test_questions as { count: number }[])?.[0]?.count || 0;
          if (questionCount === 0) {
            const { count: sectionCount } = await supabase
              .from("test_section_questions")
              .select("*", { count: "exact", head: true })
              .eq("test_id", test.id);
            questionCount = sectionCount || 0;
          }

          return {
            id: test.id,
            name: test.name,
            description: test.description,
            duration_minutes: test.duration_minutes,
            test_type: test.test_type,
            question_count: questionCount,
            attempt_count: attemptCount || 0,
            user_attempted: !!userAttempt,
            user_completed: !!userAttempt?.completed_at,
            unlock_date: effectiveUnlockByTestId.get(test.id) ?? null,
          };
        })
      );
      setTests(testsWithCounts);
    }

    setLoading(false);
  };

  const handleTestClick = (test: Test) => {
    if (test.user_completed) {
      // Go to analysis page
      navigate(`/test/${test.id}/analysis`);
    } else {
      // Go to test interface
      navigate(`/test/${test.id}`, { state: { unlockDate: test.unlock_date } });
    }
  };

  const filteredTests = tests.filter((test) => {
    const matchesSearch = test.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getTestTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      chapter: "Chapter Test",
      full_length: "Full Length",
      topic: "Topic Test",
      mock: "Mock Test",
    };
    return labels[type] || type;
  };

  const getDifficulty = (questionCount: number) => {
    if (questionCount <= 20) return "easy";
    if (questionCount <= 50) return "medium";
    return "hard";
  };

  const isReleased = (unlockDate: string | null) => {
    if (!unlockDate) return true;
    return new Date(unlockDate) <= new Date();
  };

  const formatReleaseDateTime = (unlockDate: string | null) => {
    if (!unlockDate) return "Available now";
    return `Available on ${new Date(unlockDate).toLocaleString()}`;
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
            My <span className="gradient-text">Tests</span>
          </h1>
          <p className="text-muted-foreground">
            Tests available in your enrolled batches
          </p>
        </div>

        {/* Subject Cards */}
        {courses.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {courses.map((course, index) => (
              <motion.button
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                onClick={() => setSelectedSubject(selectedSubject === course.id ? null : course.id)}
                className={`stat-card text-left transition-all ${
                  selectedSubject === course.id ? "ring-2 ring-primary" : ""
                }`}
              >
                <div 
                  className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                  style={{ backgroundColor: `${course.color || "#8b5cf6"}20` }}
                >
                  <BookOpen className="w-6 h-6" style={{ color: course.color || "#8b5cf6" }} />
                </div>
                <h3 className="font-semibold font-display mb-1">{course.name}</h3>
                <p className="text-sm text-muted-foreground">
                  {tests.length} tests available
                </p>
              </motion.button>
            ))}
          </div>
        )}

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search tests..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <Button variant="glass" className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </Button>
        </div>

        {/* Test Grid */}
        {filteredTests.length === 0 ? (
          <div className="text-center py-12">
            <Lock className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No Tests in Your Batches</h3>
            <p className="text-muted-foreground">
              {searchQuery 
                ? "No tests match your search." 
                : "Enroll in a batch to access tests."}
            </p>
            <Link to="/batches">
              <Button variant="gradient" className="mt-4">
                Browse Batches
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredTests.map((test, index) => {
              const difficulty = getDifficulty(test.question_count);
              const released = isReleased(test.unlock_date);
              return (
                <motion.div
                  key={test.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.05 }}
                  className="glass-card p-6 group hover:border-primary/40 transition-all cursor-pointer"
                  onClick={() => handleTestClick(test)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium">
                        {getTestTypeLabel(test.test_type)}
                      </span>
                      {!released && !test.user_completed && (
                        <span className="px-2 py-1 rounded-md bg-secondary text-muted-foreground text-xs font-medium">
                          Locked
                        </span>
                      )}
                      {test.user_completed && (
                        <span className="px-2 py-1 rounded-md bg-success/10 text-success text-xs font-medium flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Attempted
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-warning">
                      <Star className="w-4 h-4 fill-warning" />
                      <span className="text-sm font-medium">4.5</span>
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

                  {!test.user_completed && (
                    <p className="text-xs text-muted-foreground mb-4">
                      {formatReleaseDateTime(test.unlock_date)}
                    </p>
                  )}

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 rounded-md text-xs font-medium capitalize ${difficultyColors[difficulty]}`}>
                        {difficulty}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {test.attempt_count.toLocaleString()} attempts
                      </span>
                    </div>
                    <Button 
                      variant="glass" 
                      size="sm" 
                      className="group-hover:bg-primary group-hover:text-primary-foreground transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleTestClick(test);
                      }}
                    >
                      {test.user_completed ? (
                        <>
                          <BarChart3 className="w-4 h-4" />
                          Analysis
                        </>
                      ) : (
                        <>
                          <Zap className="w-4 h-4" />
                          {test.user_attempted ? "Resume" : "Start"}
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
