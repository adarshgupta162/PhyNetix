import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  FileCheck,
  UserCheck,
  AlertCircle,
  Lock,
  Scale,
  Mail,
  ScrollText
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function TermsPage() {
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
                <ScrollText className="w-4 h-4" />
                Legal Agreement
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold font-display mb-6"
            >
              Terms &{" "}
              <span className="gradient-text">Conditions</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lg md:text-xl text-muted-foreground mb-4"
            >
              Last updated: January 2026
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-muted-foreground"
            >
              Please read these terms carefully before using PhyNetix platform.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Terms Content */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem 
                value="acceptance"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <FileCheck className="w-5 h-5 text-primary" />
                    <span>Acceptance of Terms</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    By accessing and using PhyNetix ("the Platform"), you agree to be bound by these Terms and Conditions. 
                    If you do not agree to these terms, please do not use our services.
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>These terms constitute a legally binding agreement between you and PhyNetix</li>
                    <li>You must be at least 13 years old to use this platform</li>
                    <li>If you are under 18, you must have parental or guardian consent</li>
                    <li>By creating an account, you confirm that all information provided is accurate</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="account"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <span>User Accounts & Responsibilities</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    When you create an account on PhyNetix, you are responsible for:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Account Security:</strong> Maintaining the confidentiality of your password and account credentials</li>
                    <li><strong>Accurate Information:</strong> Providing truthful and complete information during registration</li>
                    <li><strong>Account Activity:</strong> All activities conducted under your account are your responsibility</li>
                    <li><strong>Unauthorized Access:</strong> Immediately notifying us of any unauthorized use of your account</li>
                    <li><strong>One Account:</strong> Each user may maintain only one account on the platform</li>
                    <li><strong>No Sharing:</strong> You may not share your account credentials with others</li>
                  </ul>
                  <p>
                    We reserve the right to suspend or terminate accounts that violate these terms.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="services"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <ScrollText className="w-5 h-5 text-primary" />
                    <span>Services & Access</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    PhyNetix provides online test preparation services including:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Access to practice tests and mock exams for JEE and NEET</li>
                    <li>Performance analytics and personalized insights</li>
                    <li>Question banks and study materials</li>
                    <li>Video solutions and explanations (for premium plans)</li>
                  </ul>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Service Availability:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>We strive to maintain 99.9% uptime but cannot guarantee uninterrupted access</li>
                      <li>Scheduled maintenance will be communicated in advance when possible</li>
                      <li>We reserve the right to modify, suspend, or discontinue any service feature</li>
                      <li>Access to certain features may vary based on your subscription plan</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="conduct"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <span>Prohibited Conduct</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    You agree NOT to engage in any of the following prohibited activities:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Cheating:</strong> Using unauthorized aids, multiple accounts, or sharing answers during tests</li>
                    <li><strong>Content Theft:</strong> Copying, distributing, or reproducing test materials without permission</li>
                    <li><strong>System Abuse:</strong> Attempting to hack, reverse engineer, or compromise the platform</li>
                    <li><strong>Misrepresentation:</strong> Impersonating others or providing false information</li>
                    <li><strong>Harassment:</strong> Engaging in abusive, threatening, or inappropriate behavior</li>
                    <li><strong>Commercial Use:</strong> Using the platform for unauthorized commercial purposes</li>
                    <li><strong>Automated Access:</strong> Using bots, scrapers, or automated tools without permission</li>
                  </ul>
                  <p className="text-sm">
                    Violations may result in account suspension, termination, and potential legal action.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="payment"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <span>Payment & Subscription Terms</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Pricing & Billing:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>All prices are in Indian Rupees (INR) unless otherwise stated</li>
                      <li>Subscription fees are charged upfront for the selected period</li>
                      <li>Prices are subject to change with 30 days notice to existing subscribers</li>
                      <li>Taxes may apply based on your location</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Payment Processing:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Payments are processed through secure third-party payment gateways</li>
                      <li>By providing payment information, you authorize us to charge the applicable fees</li>
                      <li>Failed payments may result in service suspension</li>
                      <li>All sales are final unless otherwise specified in our refund policy</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Subscription Management:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Subscriptions automatically renew unless canceled before the renewal date</li>
                      <li>You can cancel your subscription anytime from account settings</li>
                      <li>Cancellations take effect at the end of the current billing period</li>
                      <li>Refunds are subject to our refund policy (see Refund Policy page)</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="ip"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <span>Intellectual Property Rights</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    All content on PhyNetix, including tests, questions, solutions, videos, and materials, is protected by copyright and intellectual property laws.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Our Rights:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>PhyNetix owns all rights to the platform, content, and materials</li>
                      <li>Trademarks, logos, and branding are property of PhyNetix</li>
                      <li>Unauthorized use of our intellectual property is prohibited</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Your License:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>We grant you a limited, non-exclusive, non-transferable license to access and use our services</li>
                      <li>You may not copy, modify, distribute, or create derivative works</li>
                      <li>This license terminates upon account closure or violation of terms</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="disclaimer"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <span>Disclaimers & Limitations</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Service Disclaimer:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Services are provided "as is" without warranties of any kind</li>
                      <li>We do not guarantee specific exam scores or results</li>
                      <li>Test content is for practice purposes and may not reflect actual exam questions</li>
                      <li>We are not responsible for technical issues beyond our control</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Limitation of Liability:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>PhyNetix is not liable for indirect, incidental, or consequential damages</li>
                      <li>Our total liability is limited to the amount you paid for services in the past 12 months</li>
                      <li>We are not responsible for user-generated content or third-party links</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="governing"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Scale className="w-5 h-5 text-primary" />
                    <span>Governing Law & Dispute Resolution</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    These Terms and Conditions are governed by the laws of India.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Dispute Resolution:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Informal Resolution:</strong> Contact us first at <a href="mailto:support@phynetix.me" className="text-primary hover:underline">support@phynetix.me</a> to resolve disputes</li>
                      <li><strong>Mediation:</strong> If informal resolution fails, we agree to attempt mediation</li>
                      <li><strong>Arbitration:</strong> Disputes may be resolved through binding arbitration per Indian Arbitration and Conciliation Act</li>
                      <li><strong>Jurisdiction:</strong> Courts in New Delhi, India have exclusive jurisdiction</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="contact"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>Updates & Contact Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    We reserve the right to modify these Terms and Conditions at any time. Changes will be effective 
                    immediately upon posting. Continued use of the platform constitutes acceptance of modified terms.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Contact Us:</p>
                    <p>For questions about these terms:</p>
                    <ul className="list-none space-y-1 ml-2">
                      <li><strong>General Inquiries:</strong> <a href="mailto:contact@phynetix.me" className="text-primary hover:underline">contact@phynetix.me</a></li>
                      <li><strong>Technical Support:</strong> <a href="mailto:support@phynetix.me" className="text-primary hover:underline">support@phynetix.me</a></li>
                      <li><strong>Legal Questions:</strong> <a href="mailto:legal@phynetix.me" className="text-primary hover:underline">legal@phynetix.me</a></li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
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
