import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Shield,
  Eye,
  Lock,
  Cookie,
  Database,
  UserCheck,
  AlertCircle,
  Mail
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function PrivacyPage() {
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
                <Shield className="w-4 h-4" />
                Your Privacy Matters
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold font-display mb-6"
            >
              Privacy{" "}
              <span className="gradient-text">Policy</span>
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
              PhyNetix is committed to protecting your privacy and ensuring the security of your personal information.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Privacy Policy Content */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem 
                value="info-collection"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Database className="w-5 h-5 text-primary" />
                    <span>Information We Collect</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    We collect various types of information to provide and improve our services:
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Personal Information:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Name, email address, and phone number (when you create an account)</li>
                      <li>Educational information (grade, target exam, preferred subjects)</li>
                      <li>Payment information (processed securely through third-party payment gateways)</li>
                      <li>Profile photo (optional)</li>
                    </ul>
                  </div>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Usage Information:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Test attempts, scores, and performance data</li>
                      <li>Time spent on platform, pages visited, and features used</li>
                      <li>Device information (browser type, OS, IP address)</li>
                      <li>Log data and analytics</li>
                    </ul>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="info-use"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Eye className="w-5 h-5 text-primary" />
                    <span>How We Use Your Information</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    We use the collected information for the following purposes:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Service Delivery:</strong> To provide access to tests, generate analytics, and deliver personalized recommendations</li>
                    <li><strong>Account Management:</strong> To create and manage your account, process payments, and provide customer support</li>
                    <li><strong>Communication:</strong> To send important updates, test results, and promotional content (you can opt-out anytime)</li>
                    <li><strong>Platform Improvement:</strong> To analyze usage patterns and improve our services</li>
                    <li><strong>Security:</strong> To detect and prevent fraud, abuse, and security incidents</li>
                    <li><strong>Legal Compliance:</strong> To comply with applicable laws and regulations</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="data-security"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <span>Data Security & Protection</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    We take data security seriously and implement industry-standard measures:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Encryption:</strong> All data transmitted between your device and our servers is encrypted using SSL/TLS</li>
                    <li><strong>Secure Storage:</strong> Your data is stored on secure servers with access controls and regular backups</li>
                    <li><strong>Password Protection:</strong> Passwords are hashed and salted using strong cryptographic algorithms</li>
                    <li><strong>Payment Security:</strong> We use PCI-compliant payment gateways and never store full credit card details</li>
                    <li><strong>Access Controls:</strong> Only authorized personnel have access to user data on a need-to-know basis</li>
                    <li><strong>Regular Audits:</strong> We conduct regular security audits and updates to protect against vulnerabilities</li>
                  </ul>
                  <p className="text-sm">
                    While we implement robust security measures, no system is 100% secure. We encourage you to use strong passwords and keep your account credentials confidential.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="data-sharing"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-5 h-5 text-primary" />
                    <span>Data Sharing & Third Parties</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    We do not sell your personal information. We may share data with:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Service Providers:</strong> Payment processors, email services, analytics providers (all bound by confidentiality)</li>
                    <li><strong>Legal Requirements:</strong> When required by law, court order, or government request</li>
                    <li><strong>Business Transfers:</strong> In case of merger, acquisition, or sale of assets (users will be notified)</li>
                    <li><strong>With Your Consent:</strong> Any other sharing will be done only with your explicit consent</li>
                  </ul>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="cookies"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Cookie className="w-5 h-5 text-primary" />
                    <span>Cookies & Tracking Technologies</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    We use cookies and similar technologies to enhance your experience:
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Types of Cookies:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Essential Cookies:</strong> Required for basic site functionality (login, navigation)</li>
                      <li><strong>Analytics Cookies:</strong> Help us understand how you use the platform</li>
                      <li><strong>Preference Cookies:</strong> Remember your settings and preferences</li>
                      <li><strong>Marketing Cookies:</strong> Used to deliver relevant advertisements (with your consent)</li>
                    </ul>
                  </div>
                  <p>
                    You can control cookies through your browser settings. Note that disabling essential cookies may affect site functionality.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="user-rights"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Shield className="w-5 h-5 text-primary" />
                    <span>Your Rights & Choices</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    You have the following rights regarding your personal data:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Access:</strong> Request a copy of your personal data</li>
                    <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                    <li><strong>Deletion:</strong> Request deletion of your account and data (subject to legal retention requirements)</li>
                    <li><strong>Data Portability:</strong> Request your data in a machine-readable format</li>
                    <li><strong>Opt-Out:</strong> Unsubscribe from marketing communications at any time</li>
                    <li><strong>Objection:</strong> Object to certain types of data processing</li>
                  </ul>
                  <p>
                    To exercise these rights, contact us at <a href="mailto:privacy@phynetix.me" className="text-primary hover:underline">privacy@phynetix.me</a>.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="children"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <span>Children's Privacy</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    PhyNetix is intended for students preparing for competitive exams (typically 16+ years old). 
                    We do not knowingly collect personal information from children under 13.
                  </p>
                  <p>
                    If you are between 13-18 years old, please ensure you have parental or guardian consent before 
                    using our services. If we become aware that we have collected data from a child under 13 without 
                    verification of parental consent, we will take steps to delete that information.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="updates"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-primary" />
                    <span>Policy Updates & Contact</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    We may update this Privacy Policy from time to time. Changes will be posted on this page with 
                    an updated "Last updated" date. For significant changes, we will notify you via email or 
                    platform notification.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Contact Us:</p>
                    <p>For privacy-related questions or concerns:</p>
                    <ul className="list-none space-y-1 ml-2">
                      <li><strong>Email:</strong> <a href="mailto:privacy@phynetix.me" className="text-primary hover:underline">privacy@phynetix.me</a></li>
                      <li><strong>Support:</strong> <a href="mailto:support@phynetix.me" className="text-primary hover:underline">support@phynetix.me</a></li>
                      <li><strong>Address:</strong> New Delhi, India</li>
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
