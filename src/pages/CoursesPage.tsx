import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  BookOpen,
  Atom,
  Zap,
  FlaskConical,
  Clock,
  FileText,
  Users,
  Trophy,
  ArrowRight,
  Star,
  CheckCircle2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const courses = [
  {
    id: "jee-mains-complete",
    icon: Atom,
    title: "JEE Mains Complete Package",
    description: "Comprehensive test series for JEE Mains preparation with 50+ full-length tests.",
    difficulty: "Intermediate",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    features: [
      "50+ Full Length Tests",
      "Chapter-wise Tests",
      "Previous Year Papers",
      "Detailed Solutions",
      "AI-Powered Analysis"
    ],
    tests: 50,
    students: 2500,
    rating: 4.8,
    duration: "6 Months",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    price: "₹2,999",
    originalPrice: "₹4,999"
  },
  {
    id: "jee-advanced-complete",
    icon: Zap,
    title: "JEE Advanced Complete Package",
    description: "Advanced level test series designed for JEE Advanced pattern with 40+ tests.",
    difficulty: "Advanced",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    features: [
      "40+ Full Length Tests",
      "Topic-wise Practice",
      "Previous Year Analysis",
      "Detailed Solutions",
      "Performance Tracking"
    ],
    tests: 40,
    students: 1800,
    rating: 4.9,
    duration: "6 Months",
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
    price: "₹3,999",
    originalPrice: "₹5,999"
  },
  {
    id: "neet-complete",
    icon: FlaskConical,
    title: "NEET Complete Package",
    description: "Complete NEET test series with 60+ full-length tests covering all topics.",
    difficulty: "Intermediate",
    subjects: ["Physics", "Chemistry", "Biology"],
    features: [
      "60+ Full Length Tests",
      "Biology Deep Dive",
      "Previous Year Papers",
      "Video Solutions",
      "Doubt Resolution"
    ],
    tests: 60,
    students: 3200,
    rating: 4.7,
    duration: "6 Months",
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
    price: "₹2,999",
    originalPrice: "₹4,999"
  },
  {
    id: "jee-crash-course",
    icon: Zap,
    title: "JEE Mains Crash Course",
    description: "Intensive 3-month crash course with 25+ tests for last-minute preparation.",
    difficulty: "All Levels",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    features: [
      "25+ Mock Tests",
      "Quick Revision",
      "Time Management Tips",
      "Exam Strategy",
      "Performance Analysis"
    ],
    tests: 25,
    students: 1500,
    rating: 4.6,
    duration: "3 Months",
    color: "from-orange-500/20 to-red-500/20",
    borderColor: "border-orange-500/30",
    price: "₹1,999",
    originalPrice: "₹2,999"
  },
  {
    id: "physics-mastery",
    icon: Atom,
    title: "Physics Mastery Bundle",
    description: "Specialized physics test series with concept-based questions and solutions.",
    difficulty: "All Levels",
    subjects: ["Physics"],
    features: [
      "30+ Physics Tests",
      "Concept Building",
      "Problem Solving",
      "Formula Sheets",
      "Video Explanations"
    ],
    tests: 30,
    students: 1200,
    rating: 4.8,
    duration: "4 Months",
    color: "from-indigo-500/20 to-blue-500/20",
    borderColor: "border-indigo-500/30",
    price: "₹1,499",
    originalPrice: "₹2,499"
  },
  {
    id: "chemistry-excellence",
    icon: FlaskConical,
    title: "Chemistry Excellence Bundle",
    description: "Complete chemistry preparation with organic, inorganic, and physical chemistry.",
    difficulty: "All Levels",
    subjects: ["Chemistry"],
    features: [
      "30+ Chemistry Tests",
      "All Three Branches",
      "Reaction Mechanisms",
      "Periodic Table Mastery",
      "Detailed Solutions"
    ],
    tests: 30,
    students: 1000,
    rating: 4.7,
    duration: "4 Months",
    color: "from-teal-500/20 to-green-500/20",
    borderColor: "border-teal-500/30",
    price: "₹1,499",
    originalPrice: "₹2,499"
  }
];

export default function CoursesPage() {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Animated Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="floating-orb w-96 h-96 bg-primary/30 top-20 -left-48" />
        <div className="floating-orb w-80 h-80 bg-accent/30 top-1/2 -right-40" style={{ animationDelay: '2s' }} />
        <div className="floating-orb w-72 h-72 bg-primary/20 bottom-20 left-1/3" style={{ animationDelay: '4s' }} />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-border/50 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold font-display gradient-text">PhyNetix</span>
          </Link>
          
          <nav className="hidden md:flex items-center gap-8">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">Home</Link>
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
            <Link to="/courses" className="text-foreground font-medium">Courses</Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</Link>
            <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/auth">
              <Button variant="gradient">Sign Up</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 py-20 md:py-28">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
                <BookOpen className="w-4 h-4" />
                Test Series & Bundles
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold font-display mb-6"
            >
              Choose Your{" "}
              <span className="gradient-text">Perfect Course</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-8"
            >
              Comprehensive test series designed for JEE and NEET preparation.
              <br />Choose from complete packages or subject-specific bundles.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Courses Grid */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`glass-card p-6 border ${course.borderColor} relative overflow-hidden group hover:scale-105 transition-transform duration-300`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${course.color} opacity-50`} />
                <div className="relative z-10">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-14 h-14 rounded-2xl bg-background/80 flex items-center justify-center">
                      <course.icon className="w-7 h-7 text-primary" />
                    </div>
                    <Badge variant="secondary" className="text-xs">
                      {course.difficulty}
                    </Badge>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold font-display mb-2">{course.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{course.description}</p>

                  {/* Subjects */}
                  <div className="flex flex-wrap gap-2 mb-4">
                    {course.subjects.map((subject, i) => (
                      <span key={i} className="px-2 py-1 rounded-full bg-background/60 text-xs font-medium">
                        {subject}
                      </span>
                    ))}
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-4 pb-4 border-b border-border/50">
                    <div className="text-center">
                      <FileText className="w-4 h-4 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{course.tests} Tests</p>
                    </div>
                    <div className="text-center">
                      <Users className="w-4 h-4 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{course.students.toLocaleString()}</p>
                    </div>
                    <div className="text-center">
                      <Star className="w-4 h-4 text-primary mx-auto mb-1" />
                      <p className="text-xs text-muted-foreground">{course.rating}</p>
                    </div>
                  </div>

                  {/* Features */}
                  <div className="space-y-2 mb-4">
                    {course.features.slice(0, 3).map((feature, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3 h-3 text-primary flex-shrink-0" />
                        <span className="text-xs text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Pricing */}
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl font-bold">{course.price}</span>
                    <span className="text-sm text-muted-foreground line-through">{course.originalPrice}</span>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <Clock className="w-4 h-4" />
                    <span>{course.duration} Access</span>
                  </div>

                  {/* CTA */}
                  <div className="flex gap-2">
                    <Link to={`/course/${course.id}`} className="flex-1">
                      <Button variant="outline" className="w-full" size="sm">
                        View Details
                      </Button>
                    </Link>
                    <Link to="/auth" className="flex-1">
                      <Button variant="gradient" className="w-full" size="sm">
                        Enroll Now
                      </Button>
                    </Link>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Why Choose <span className="gradient-text">PhyNetix Courses</span>
              </h2>
              <p className="text-muted-foreground">
                Our courses are designed by experts to help you excel in your exams.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="glass-card p-6 text-center"
              >
                <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Exam Pattern</h3>
                <p className="text-sm text-muted-foreground">
                  Tests designed to match the exact pattern of JEE and NEET exams.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="glass-card p-6 text-center"
              >
                <FileText className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">Detailed Solutions</h3>
                <p className="text-sm text-muted-foreground">
                  Every question comes with step-by-step solutions and explanations.
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="glass-card p-6 text-center"
              >
                <Sparkles className="w-12 h-12 text-primary mx-auto mb-4" />
                <h3 className="font-bold mb-2">AI Analysis</h3>
                <p className="text-sm text-muted-foreground">
                  Get personalized insights and recommendations to improve your performance.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <div className="relative z-10">
              <BookOpen className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Ready to Start Learning?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Create an account to access all our courses and start your preparation journey.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="gradient" size="xl">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/pricing">
                  <Button variant="glass" size="xl">
                    View Pricing
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t border-border/50 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-bold font-display">PhyNetix</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm">
              <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">About</Link>
              <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">Contact</Link>
              <Link to="/privacy" className="text-muted-foreground hover:text-foreground transition-colors">Privacy</Link>
              <Link to="/terms" className="text-muted-foreground hover:text-foreground transition-colors">Terms</Link>
              <Link to="/refund" className="text-muted-foreground hover:text-foreground transition-colors">Refund Policy</Link>
            </div>
            <div className="text-sm text-muted-foreground">
              © 2024 PhyNetix. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
