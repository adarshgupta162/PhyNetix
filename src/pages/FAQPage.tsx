import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  HelpCircle,
  FileText,
  Clock,
  Trophy,
  Shield,
  Eye,
  BookOpen,
  Mail,
  MessageSquare
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqCategories = [
  {
    category: "General",
    icon: HelpCircle,
    faqs: [
      {
        question: "What exams does PhyNetix support?",
        answer: "PhyNetix currently supports JEE Mains, JEE Advanced, and NEET exam patterns. Our tests are designed to match the exact format, timing, and marking scheme of these competitive exams."
      },
      {
        question: "Do I need to install any software?",
        answer: "No! PhyNetix is a completely web-based platform. You can access it from any modern web browser on your computer, tablet, or smartphone. No downloads or installations required."
      },
      {
        question: "How do I create an account?",
        answer: "Click on the 'Sign Up' button on the homepage, enter your email, create a password, and verify your email. Once verified, you can start taking tests immediately."
      }
    ]
  },
  {
    category: "Tests & Interface",
    icon: FileText,
    faqs: [
      {
        question: "How does the PDF-based test work?",
        answer: "Our unique interface displays the question paper as a PDF on the left side, just like in the actual exam. On the right, you get an OMR-style panel to mark your answers. This gives you the most realistic practice experience."
      },
      {
        question: "Can I resume a test if I leave midway?",
        answer: "Yes! Your progress is automatically saved every 10 seconds. If you need to leave, you can resume the test later from where you left off. The timer continues on the server, so manage your time wisely."
      },
      {
        question: "What happens if I exit fullscreen during a test?",
        answer: "For secure tests, exiting fullscreen triggers a warning. You have a limited number of exits allowed (typically 7). Exceeding this limit will auto-submit your test to maintain exam integrity."
      },
      {
        question: "Can I mark questions for review?",
        answer: "Yes! You can mark questions for review and skip them to come back later. The question palette shows color-coded indicators: unanswered, answered, marked for review, and not visited."
      }
    ]
  },
  {
    category: "Scoring & Analysis",
    icon: Trophy,
    faqs: [
      {
        question: "How is the ranking calculated?",
        answer: "Rankings are calculated based on your score and the time taken to complete the test. Students with higher scores rank above, and for tied scores, faster completion time determines the higher rank."
      },
      {
        question: "Can I see my mistakes after the test?",
        answer: "Absolutely! After submission, you get a detailed analysis showing each question, your answer, the correct answer, and your marks. The PDF is displayed alongside so you can review everything in context."
      },
      {
        question: "What is AI-powered analysis?",
        answer: "Our AI analyzes your test performance to identify patterns, weak areas, and provide personalized recommendations. It tracks your progress over time and suggests topics to focus on for improvement."
      },
      {
        question: "How accurate is the scoring?",
        answer: "Our scoring system follows the exact marking scheme of JEE/NEET exams, including negative marking. All calculations are automated and verified to ensure 100% accuracy."
      }
    ]
  },
  {
    category: "Payment & Subscription",
    icon: Shield,
    faqs: [
      {
        question: "Is there a free trial available?",
        answer: "Yes! We offer a 7-day free trial with limited access to tests. You can explore the platform and take a few practice tests before deciding to upgrade."
      },
      {
        question: "What payment methods do you accept?",
        answer: "We accept all major credit/debit cards, UPI, net banking, and popular digital wallets like Google Pay, PhonePe, and Paytm."
      },
      {
        question: "Can I cancel my subscription?",
        answer: "Yes, you can cancel your subscription at any time from your account settings. You'll continue to have access until the end of your current billing period."
      },
      {
        question: "Do you offer refunds?",
        answer: "Yes, we offer a 7-day money-back guarantee. If you're not satisfied with our service within the first 7 days, contact us for a full refund. Please check our refund policy page for more details."
      }
    ]
  },
  {
    category: "Technical Support",
    icon: MessageSquare,
    faqs: [
      {
        question: "I'm having trouble accessing my test. What should I do?",
        answer: "First, try refreshing your browser and clearing cache. If the issue persists, check your internet connection. For further assistance, contact our support team at support@phynetix.me."
      },
      {
        question: "The PDF is not loading properly. How do I fix it?",
        answer: "Ensure you have a stable internet connection and you're using an updated browser (Chrome, Firefox, or Safari recommended). Try disabling browser extensions that might interfere with PDF viewing."
      },
      {
        question: "Can I use PhyNetix on my mobile device?",
        answer: "Yes! PhyNetix is fully responsive and works on mobile devices. However, for the best test-taking experience, we recommend using a laptop or desktop with a larger screen."
      },
      {
        question: "Who do I contact for technical issues?",
        answer: "For technical issues, email us at support@phynetix.me or use the contact form on our Contact page. We typically respond within 24 hours."
      }
    ]
  }
];

export default function FAQPage() {
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
                <HelpCircle className="w-4 h-4" />
                Support Center
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold font-display mb-6"
            >
              Frequently Asked{" "}
              <span className="gradient-text">Questions</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-8"
            >
              Find answers to common questions about PhyNetix platform, tests, and features.
            </motion.p>
          </div>
        </div>
      </section>

      {/* FAQ Categories */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto space-y-12">
            {faqCategories.map((category, categoryIndex) => (
              <motion.div
                key={categoryIndex}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-primary/10 flex items-center justify-center">
                    <category.icon className="w-5 h-5 text-primary" />
                  </div>
                  <h2 className="text-2xl font-bold font-display">{category.category}</h2>
                </div>

                <Accordion type="single" collapsible className="space-y-4">
                  {category.faqs.map((faq, faqIndex) => (
                    <AccordionItem
                      key={faqIndex}
                      value={`faq-${categoryIndex}-${faqIndex}`}
                      className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
                    >
                      <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground pb-5">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Support Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <div className="relative z-10">
              <Mail className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Still Have Questions?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Can't find the answer you're looking for? Our support team is here to help.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/contact">
                  <Button variant="gradient" size="xl">
                    Contact Support
                    <MessageSquare className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button variant="glass" size="xl">
                    Login to Dashboard
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
