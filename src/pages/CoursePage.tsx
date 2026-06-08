import { Link, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Atom,
  Zap,
  FlaskConical,
  Clock,
  FileText,
  Users,
  Trophy,
  ArrowRight,
  Star,
  CheckCircle2,
  BookOpen,
  BarChart3,
  Target,
  PlayCircle,
  Download,
  Shield
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

// This would typically come from an API or database
const coursesData: Record<string, any> = {
  "jee-mains-complete": {
    id: "jee-mains-complete",
    icon: Atom,
    title: "JEE Mains Complete Package",
    description: "Comprehensive test series for JEE Mains preparation with 50+ full-length tests designed by experts.",
    longDescription: "This complete package is designed to provide you with extensive practice for JEE Mains. With over 50 full-length tests, chapter-wise practice, and detailed solutions, you'll be fully prepared for the exam. Our AI-powered analysis helps you identify weak areas and track your progress throughout your preparation journey.",
    difficulty: "Intermediate",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    tests: 50,
    students: 2500,
    rating: 4.8,
    reviews: 456,
    duration: "6 Months",
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    price: "₹2,999",
    originalPrice: "₹4,999",
    features: [
      "50+ Full Length Mock Tests",
      "Chapter-wise Practice Tests",
      "Previous Year Question Papers",
      "Detailed Step-by-Step Solutions",
      "AI-Powered Performance Analysis",
      "Subject-wise Score Tracking",
      "Time Management Tips",
      "Exam Pattern Analysis",
      "Video Solutions for Difficult Questions",
      "Doubt Resolution Support"
    ],
    syllabus: [
      {
        subject: "Physics",
        topics: ["Mechanics", "Thermodynamics", "Electromagnetism", "Optics", "Modern Physics"]
      },
      {
        subject: "Chemistry",
        topics: ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"]
      },
      {
        subject: "Mathematics",
        topics: ["Algebra", "Calculus", "Trigonometry", "Coordinate Geometry", "Probability"]
      }
    ]
  },
  "jee-advanced-complete": {
    id: "jee-advanced-complete",
    icon: Zap,
    title: "JEE Advanced Complete Package",
    description: "Advanced level test series designed for JEE Advanced pattern with 40+ tests.",
    longDescription: "Prepare for JEE Advanced with our comprehensive test series featuring 40+ challenging tests. Each test is designed to match the difficulty level and pattern of JEE Advanced, helping you build the problem-solving skills needed for this prestigious exam.",
    difficulty: "Advanced",
    subjects: ["Physics", "Chemistry", "Mathematics"],
    tests: 40,
    students: 1800,
    rating: 4.9,
    reviews: 324,
    duration: "6 Months",
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
    price: "₹3,999",
    originalPrice: "₹5,999",
    features: [
      "40+ Full Length Mock Tests",
      "Topic-wise Practice Tests",
      "Previous Year Analysis",
      "Detailed Solutions with Tricks",
      "Performance Tracking Dashboard",
      "Advanced Problem Solving",
      "Conceptual Questions",
      "Time-bound Practice",
      "Comparative Analysis",
      "Expert Doubt Support"
    ],
    syllabus: [
      {
        subject: "Physics",
        topics: ["Advanced Mechanics", "Thermodynamics & Kinetic Theory", "Electrodynamics", "Wave Optics", "Modern Physics"]
      },
      {
        subject: "Chemistry",
        topics: ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry", "Chemical Bonding"]
      },
      {
        subject: "Mathematics",
        topics: ["Advanced Algebra", "Differential Calculus", "Integral Calculus", "Vectors & 3D Geometry", "Probability & Statistics"]
      }
    ]
  },
  "neet-complete": {
    id: "neet-complete",
    icon: FlaskConical,
    title: "NEET Complete Package",
    description: "Complete NEET test series with 60+ full-length tests covering all topics.",
    longDescription: "Our NEET Complete Package provides comprehensive preparation with 60+ full-length tests. Special focus on Biology with detailed coverage of Botany and Zoology, along with Physics and Chemistry. Perfect for NEET aspirants aiming for top medical colleges.",
    difficulty: "Intermediate",
    subjects: ["Physics", "Chemistry", "Biology"],
    tests: 60,
    students: 3200,
    rating: 4.7,
    reviews: 589,
    duration: "6 Months",
    color: "from-green-500/20 to-emerald-500/20",
    borderColor: "border-green-500/30",
    price: "₹2,999",
    originalPrice: "₹4,999",
    features: [
      "60+ Full Length Mock Tests",
      "Biology Deep Dive Tests",
      "Previous Year Question Papers",
      "Video Solutions Available",
      "Detailed Biology Diagrams",
      "NCERT-Based Questions",
      "Subject-wise Analysis",
      "Speed & Accuracy Training",
      "Doubt Resolution Forum",
      "Mobile App Access"
    ],
    syllabus: [
      {
        subject: "Physics",
        topics: ["Mechanics", "Thermodynamics", "Electrodynamics", "Optics", "Modern Physics"]
      },
      {
        subject: "Chemistry",
        topics: ["Physical Chemistry", "Organic Chemistry", "Inorganic Chemistry"]
      },
      {
        subject: "Biology",
        topics: ["Botany", "Zoology", "Human Physiology", "Genetics", "Ecology"]
      }
    ]
  }
};

export default function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>();
  const course = courseId ? coursesData[courseId] : null;

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
          <Link to="/courses">
            <Button variant="gradient">View All Courses</Button>
          </Link>
        </div>
      </div>
    );
  }

  const Icon = course.icon;

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

      {/* Course Hero Section */}
      <section className="relative z-10 py-12 md:py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <Link to="/courses" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
              ← Back to Courses
            </Link>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Left: Course Info */}
              <div className="lg:col-span-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6 }}
                >
                  <div className="flex items-center gap-3 mb-4">
                    <Badge variant="secondary">{course.difficulty}</Badge>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm font-medium">{course.rating}</span>
                      <span className="text-sm text-muted-foreground">({course.reviews} reviews)</span>
                    </div>
                  </div>

                  <h1 className="text-3xl md:text-5xl font-bold font-display mb-4">
                    {course.title}
                  </h1>

                  <p className="text-lg text-muted-foreground mb-6">
                    {course.longDescription}
                  </p>

                  {/* Course Stats */}
                  <div className="flex flex-wrap gap-6 mb-6">
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" />
                      <span className="text-sm"><strong>{course.tests}</strong> Tests</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" />
                      <span className="text-sm"><strong>{course.students.toLocaleString()}</strong> Students</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-primary" />
                      <span className="text-sm"><strong>{course.duration}</strong> Access</span>
                    </div>
                  </div>

                  {/* Subjects */}
                  <div className="flex flex-wrap gap-2">
                    {course.subjects.map((subject: string, i: number) => (
                      <Badge key={i} variant="outline">{subject}</Badge>
                    ))}
                  </div>
                </motion.div>
              </div>

              {/* Right: Enrollment Card */}
              <div className="lg:col-span-1">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className="glass-card p-6 sticky top-4"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>

                  <div className="text-center mb-6">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <span className="text-3xl font-bold">{course.price}</span>
                      <span className="text-lg text-muted-foreground line-through">{course.originalPrice}</span>
                    </div>
                    <p className="text-sm text-green-500 font-medium">Save {Math.round((1 - parseInt(course.price.replace(/[^0-9]/g, '')) / parseInt(course.originalPrice.replace(/[^0-9]/g, ''))) * 100)}%</p>
                  </div>

                  <Link to="/auth" className="block mb-4">
                    <Button variant="gradient" size="lg" className="w-full">
                      Enroll Now
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  </Link>

                  <p className="text-xs text-center text-muted-foreground mb-4">
                    Start your free trial today
                  </p>

                  <div className="space-y-3 pt-4 border-t border-border/50">
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Lifetime access to all tests</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Detailed solutions included</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>AI-powered analytics</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                      <span>Mobile app access</span>
                    </div>
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What You'll Get Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-8">
              What's <span className="gradient-text">Included</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-4">
              {course.features.map((feature: string, index: number) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="flex items-center gap-3 glass-card p-4"
                >
                  <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
                  <span>{feature}</span>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Syllabus Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-8">
              Course <span className="gradient-text">Syllabus</span>
            </h2>

            <Accordion type="single" collapsible className="space-y-4">
              {course.syllabus.map((section: any, index: number) => (
                <AccordionItem
                  key={index}
                  value={`section-${index}`}
                  className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
                >
                  <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                    {section.subject}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground pb-5">
                    <ul className="list-disc list-inside space-y-2">
                      {section.topics.map((topic: string, i: number) => (
                        <li key={i}>{topic}</li>
                      ))}
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-8 text-center">
              Why Choose This <span className="gradient-text">Course</span>
            </h2>

            <div className="grid md:grid-cols-4 gap-6">
              <div className="glass-card p-6 text-center">
                <Target className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Exam Focused</h3>
                <p className="text-sm text-muted-foreground">
                  Tests designed to match exam patterns
                </p>
              </div>
              <div className="glass-card p-6 text-center">
                <BarChart3 className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Track Progress</h3>
                <p className="text-sm text-muted-foreground">
                  Detailed analytics and insights
                </p>
              </div>
              <div className="glass-card p-6 text-center">
                <PlayCircle className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Video Solutions</h3>
                <p className="text-sm text-muted-foreground">
                  Step-by-step video explanations
                </p>
              </div>
              <div className="glass-card p-6 text-center">
                <Shield className="w-10 h-10 text-primary mx-auto mb-3" />
                <h3 className="font-semibold mb-2">Trusted Platform</h3>
                <p className="text-sm text-muted-foreground">
                  Used by thousands of students
                </p>
              </div>
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
              <Trophy className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Ready to Excel?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of successful students and start your preparation today.
              </p>
              <Link to="/auth">
                <Button variant="gradient" size="xl">
                  Enroll in This Course
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
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
