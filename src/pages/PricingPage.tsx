import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Check,
  Zap,
  Trophy,
  Crown,
  ArrowRight,
  Users,
  FileText,
  BarChart3,
  Headphones,
  Shield,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Free Trial",
    price: "₹0",
    period: "7 days",
    description: "Try PhyNetix with limited access",
    icon: Users,
    color: "from-gray-500/20 to-slate-500/20",
    borderColor: "border-gray-500/30",
    features: [
      "3 Practice Tests",
      "Basic Performance Analytics",
      "Limited Question Bank Access",
      "Community Support"
    ],
    limitations: [
      "No full-length tests",
      "No AI analysis",
      "No video solutions"
    ],
    cta: "Start Free Trial",
    popular: false
  },
  {
    name: "Basic Plan",
    price: "₹1,999",
    period: "3 months",
    description: "Essential features for serious students",
    icon: Zap,
    color: "from-blue-500/20 to-cyan-500/20",
    borderColor: "border-blue-500/30",
    features: [
      "25+ Full Length Tests",
      "Chapter-wise Tests",
      "Detailed Solutions",
      "Performance Analytics",
      "Subject-wise Analysis",
      "Email Support"
    ],
    limitations: [],
    cta: "Get Started",
    popular: false
  },
  {
    name: "Premium Plan",
    price: "₹3,999",
    period: "6 months",
    description: "Most popular for comprehensive prep",
    icon: Trophy,
    color: "from-purple-500/20 to-pink-500/20",
    borderColor: "border-purple-500/30",
    features: [
      "50+ Full Length Tests",
      "All Chapter-wise Tests",
      "Previous Year Papers",
      "Video Solutions",
      "AI-Powered Analysis",
      "Personalized Recommendations",
      "Progress Tracking",
      "Priority Email Support",
      "Mobile App Access"
    ],
    limitations: [],
    cta: "Get Premium",
    popular: true
  },
  {
    name: "Ultimate Plan",
    price: "₹6,999",
    period: "12 months",
    description: "Everything you need to excel",
    icon: Crown,
    color: "from-yellow-500/20 to-orange-500/20",
    borderColor: "border-yellow-500/30",
    features: [
      "Unlimited Full Length Tests",
      "All Test Series Access",
      "Previous Year Papers",
      "Video Solutions",
      "AI-Powered Analysis",
      "Personalized Study Plans",
      "1-on-1 Doubt Sessions",
      "24/7 Priority Support",
      "Exclusive Content",
      "Performance Reports",
      "Mobile App Access"
    ],
    limitations: [],
    cta: "Go Ultimate",
    popular: false
  }
];

const comparisons = [
  { feature: "Full Length Tests", free: "3", basic: "25+", premium: "50+", ultimate: "Unlimited" },
  { feature: "Chapter Tests", free: "-", basic: "✓", premium: "✓", ultimate: "✓" },
  { feature: "Previous Year Papers", free: "-", basic: "-", premium: "✓", ultimate: "✓" },
  { feature: "Video Solutions", free: "-", basic: "-", premium: "✓", ultimate: "✓" },
  { feature: "AI Analysis", free: "-", basic: "-", premium: "✓", ultimate: "✓" },
  { feature: "Study Plans", free: "-", basic: "-", premium: "-", ultimate: "✓" },
  { feature: "1-on-1 Support", free: "-", basic: "-", premium: "-", ultimate: "✓" },
];

const faqs = [
  {
    question: "Can I switch plans later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. The price difference will be prorated."
  },
  {
    question: "Is there a refund policy?",
    answer: "Yes, we offer a 7-day money-back guarantee if you're not satisfied with our service. Please check our refund policy page for more details."
  },
  {
    question: "Do you offer student discounts?",
    answer: "Yes! We offer special discounts for students. Contact our support team with your student ID for more information."
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit/debit cards, UPI, net banking, and digital wallets."
  }
];

export default function PricingPage() {
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
            <Link to="/pricing" className="text-foreground font-medium">Pricing</Link>
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
                <Trophy className="w-4 h-4" />
                Simple, Transparent Pricing
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold font-display mb-6"
            >
              Choose the Plan That's{" "}
              <span className="gradient-text">Right for You</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-8"
            >
              Start with a free trial. Upgrade anytime to unlock more features.
              <br />No hidden fees. Cancel anytime.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Pricing Cards */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {plans.map((plan, index) => (
              <motion.div
                key={plan.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`glass-card p-6 border ${plan.borderColor} relative overflow-hidden ${plan.popular ? 'ring-2 ring-primary' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0">
                    <Badge className="rounded-tl-none rounded-br-none">Most Popular</Badge>
                  </div>
                )}
                <div className={`absolute inset-0 bg-gradient-to-br ${plan.color} opacity-50`} />
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl bg-background/80 flex items-center justify-center mb-4">
                    <plan.icon className="w-6 h-6 text-primary" />
                  </div>

                  <h3 className="text-xl font-bold font-display mb-2">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">{plan.description}</p>

                  <div className="mb-4">
                    <span className="text-3xl font-bold">{plan.price}</span>
                    <span className="text-muted-foreground">/{plan.period}</span>
                  </div>

                  <Link to="/auth" className="block mb-6">
                    <Button variant={plan.popular ? "gradient" : "outline"} className="w-full">
                      {plan.cta}
                    </Button>
                  </Link>

                  <div className="space-y-3 pt-4 border-t border-border/50">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <Check className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-8 text-center">
              Compare <span className="gradient-text">Plans</span>
            </h2>

            <div className="glass-card overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border/50">
                    <th className="text-left p-4 font-semibold">Feature</th>
                    <th className="text-center p-4 font-semibold">Free</th>
                    <th className="text-center p-4 font-semibold">Basic</th>
                    <th className="text-center p-4 font-semibold">Premium</th>
                    <th className="text-center p-4 font-semibold">Ultimate</th>
                  </tr>
                </thead>
                <tbody>
                  {comparisons.map((row, index) => (
                    <tr key={index} className="border-b border-border/50 last:border-0">
                      <td className="p-4">{row.feature}</td>
                      <td className="text-center p-4 text-muted-foreground">{row.free}</td>
                      <td className="text-center p-4 text-muted-foreground">{row.basic}</td>
                      <td className="text-center p-4 text-primary font-medium">{row.premium}</td>
                      <td className="text-center p-4 text-primary font-medium">{row.ultimate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-8 text-center">
              Frequently Asked <span className="gradient-text">Questions</span>
            </h2>

            <div className="space-y-4">
              {faqs.map((faq, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className="glass-card p-6"
                >
                  <h3 className="font-semibold mb-2">{faq.question}</h3>
                  <p className="text-sm text-muted-foreground">{faq.answer}</p>
                </motion.div>
              ))}
            </div>

            <div className="text-center mt-8">
              <p className="text-muted-foreground mb-4">Have more questions?</p>
              <Link to="/contact">
                <Button variant="outline">Contact Support</Button>
              </Link>
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
              <Star className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of students preparing for JEE and NEET with PhyNetix.
                Start your free trial today!
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="gradient" size="xl">
                    Start Free Trial
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
