import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Target,
  Users,
  Heart,
  TrendingUp,
  Award,
  BookOpen,
  ArrowRight,
  Lightbulb,
  Shield,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";

const values = [
  {
    icon: Target,
    title: "Excellence",
    description: "We strive for the highest quality in every test, analysis, and feature we build."
  },
  {
    icon: Heart,
    title: "Student Success",
    description: "Your success is our mission. We're committed to helping you achieve your goals."
  },
  {
    icon: Lightbulb,
    title: "Innovation",
    description: "We continuously innovate to provide the best test preparation experience."
  },
  {
    icon: Shield,
    title: "Integrity",
    description: "We maintain the highest standards of academic integrity and ethical practices."
  }
];

const milestones = [
  {
    year: "2024",
    title: "Platform Launch",
    description: "PhyNetix was founded with a vision to revolutionize test preparation for JEE and NEET aspirants."
  },
  {
    year: "2024",
    title: "AI Integration",
    description: "Introduced AI-powered analysis to provide personalized insights and recommendations."
  },
  {
    year: "2025",
    title: "Growing Community",
    description: "Expanding our reach to help thousands of students achieve their dreams."
  }
];

export default function AboutPage() {
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
            <Link to="/about" className="text-foreground font-medium">About</Link>
            <Link to="/courses" className="text-muted-foreground hover:text-foreground transition-colors">Courses</Link>
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
                <Users className="w-4 h-4" />
                Our Story
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold font-display mb-6"
            >
              Empowering Students to{" "}
              <span className="gradient-text">Achieve Excellence</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-8"
            >
              PhyNetix is a cutting-edge test preparation platform designed specifically 
              for JEE and NEET aspirants. We combine realistic exam simulation with 
              AI-powered insights to help students excel.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-6">
                Our <span className="gradient-text">Mission</span>
              </h2>
              <p className="text-lg text-muted-foreground mb-6">
                We believe that every student deserves access to high-quality test preparation 
                resources. Our mission is to democratize exam preparation by providing realistic 
                test environments, detailed analytics, and personalized insights.
              </p>
              <p className="text-lg text-muted-foreground">
                Through innovative technology and a deep understanding of competitive exams, 
                we help students identify their strengths, overcome weaknesses, and build 
                the confidence needed to succeed.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="glass-card p-8 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-primary opacity-5" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Realistic Test Experience</h3>
                    <p className="text-sm text-muted-foreground">
                      PDF-based tests that mirror the actual JEE and NEET exam patterns.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <TrendingUp className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">AI-Powered Analytics</h3>
                    <p className="text-sm text-muted-foreground">
                      Get personalized insights and recommendations to improve performance.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Award className="w-6 h-6 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold mb-2">Track Progress</h3>
                    <p className="text-sm text-muted-foreground">
                      Monitor your improvement with detailed performance tracking.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Our <span className="gradient-text">Core Values</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              The principles that guide everything we do at PhyNetix.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {values.map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="glass-card p-6 text-center hover:scale-105 transition-transform duration-300"
              >
                <div className="w-14 h-14 rounded-2xl bg-gradient-primary/10 flex items-center justify-center mx-auto mb-4">
                  <value.icon className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-bold font-display mb-2">{value.title}</h3>
                <p className="text-sm text-muted-foreground">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Journey/Timeline Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
              Our <span className="gradient-text">Journey</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Building the future of test preparation, one milestone at a time.
            </p>
          </div>

          <div className="max-w-3xl mx-auto space-y-8">
            {milestones.map((milestone, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-6"
              >
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-gradient-primary flex items-center justify-center font-bold text-sm text-primary-foreground">
                    {milestone.year}
                  </div>
                  {index < milestones.length - 1 && (
                    <div className="w-0.5 h-full bg-gradient-to-b from-primary to-transparent mt-2" />
                  )}
                </div>
                <div className="glass-card p-6 flex-1">
                  <h3 className="text-xl font-bold mb-2">{milestone.title}</h3>
                  <p className="text-muted-foreground">{milestone.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <div className="relative z-10">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Ready to Start Your Journey?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of students who are already preparing smarter with PhyNetix.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="gradient" size="xl">
                    Get Started Free
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/courses">
                  <Button variant="glass" size="xl">
                    View Courses
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
