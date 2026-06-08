import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Sparkles,
  Undo2,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Mail,
  FileText,
  CreditCard,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function RefundPage() {
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
                <Undo2 className="w-4 h-4" />
                Money-Back Guarantee
              </span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl md:text-6xl font-bold font-display mb-6"
            >
              Refund{" "}
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
              We want you to be completely satisfied with PhyNetix. Here's our refund policy.
            </motion.p>
          </div>
        </div>
      </section>

      {/* Policy Content */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <Accordion type="single" collapsible className="space-y-4">
              <AccordionItem 
                value="money-back"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary" />
                    <span>7-Day Money-Back Guarantee</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    We offer a <strong>7-day money-back guarantee</strong> for all paid subscriptions. 
                    If you're not satisfied with PhyNetix for any reason, you can request a full refund within 
                    7 days of your initial purchase.
                  </p>
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Coverage:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li>Applies to all new subscriptions (Basic, Premium, Ultimate plans)</li>
                      <li>Valid for first-time subscribers only</li>
                      <li>Full refund of the subscription amount (excluding payment gateway charges)</li>
                      <li>No questions asked - we respect your decision</li>
                    </ul>
                  </div>
                  <p className="text-sm bg-primary/10 p-3 rounded-lg">
                    <strong>Note:</strong> The 7-day period starts from the date of purchase, not from when you first access the platform.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="eligibility"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <span>Refund Eligibility Criteria</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <div className="space-y-3">
                    <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground mb-2">Eligible for Refund:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Request made within 7 days of purchase</li>
                            <li>First-time subscriber to the platform</li>
                            <li>Payment successfully processed through our official channels</li>
                            <li>Technical issues preventing platform access (we'll try to resolve first)</li>
                            <li>Dissatisfaction with service quality or features</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
                      <div className="flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground mb-2">Not Eligible for Refund:</p>
                          <ul className="list-disc list-inside space-y-1 text-sm">
                            <li>Request made after 7 days from purchase date</li>
                            <li>Subscription renewals (only new subscriptions)</li>
                            <li>Partial month refunds after trial period</li>
                            <li>Account violations or terms of service breaches</li>
                            <li>Free trial users (no payment made)</li>
                            <li>Promotional or discounted subscriptions (unless explicitly stated)</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="process"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-primary" />
                    <span>Refund Request Process</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    To request a refund, follow these simple steps:
                  </p>
                  <ol className="list-decimal list-inside space-y-2 ml-2">
                    <li>
                      <strong>Contact Support:</strong> Email us at <a href="mailto:support@phynetix.me" className="text-primary hover:underline">support@phynetix.me</a> with subject line "Refund Request"
                    </li>
                    <li>
                      <strong>Provide Information:</strong> Include your account email, transaction ID, and purchase date
                    </li>
                    <li>
                      <strong>Reason (Optional):</strong> While not required, feedback helps us improve our services
                    </li>
                    <li>
                      <strong>Verification:</strong> We'll verify your eligibility (usually within 24 hours)
                    </li>
                    <li>
                      <strong>Processing:</strong> Once approved, refund will be initiated within 3-5 business days
                    </li>
                    <li>
                      <strong>Credit:</strong> Amount will be credited to your original payment method within 7-10 business days
                    </li>
                  </ol>
                  <p className="text-sm bg-primary/10 p-3 rounded-lg">
                    <strong>Processing Time:</strong> While we initiate refunds quickly, the actual credit to your account depends on your bank or payment provider and may take 7-10 business days.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="methods"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <span>Refund Methods & Timeline</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <div className="space-y-2">
                    <p className="font-medium text-foreground">Refund will be processed to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-2">
                      <li><strong>Credit/Debit Card:</strong> 7-10 business days to reflect in your account</li>
                      <li><strong>UPI/Net Banking:</strong> 5-7 business days</li>
                      <li><strong>Digital Wallets:</strong> 3-5 business days</li>
                      <li><strong>Bank Transfer:</strong> 7-14 business days (for special cases)</li>
                    </ul>
                  </div>
                  <p className="text-sm">
                    <strong>Note:</strong> Payment gateway charges (typically 2-3%) are non-refundable as they are third-party fees. 
                    You will receive a refund of the subscription amount minus these charges.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="cancellation"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-primary" />
                    <span>Subscription Cancellation</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    You can cancel your subscription at any time:
                  </p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Immediate Effect:</strong> Access continues until the end of current billing period</li>
                    <li><strong>No Partial Refunds:</strong> Canceling mid-period does not qualify for prorated refunds</li>
                    <li><strong>How to Cancel:</strong> Go to Account Settings → Subscription → Cancel Subscription</li>
                    <li><strong>Data Retention:</strong> Your data is retained for 90 days after cancellation</li>
                    <li><strong>Reactivation:</strong> You can reactivate anytime during the billing period</li>
                  </ul>
                  <p className="text-sm bg-yellow-500/10 p-3 rounded-lg border border-yellow-500/30">
                    <strong>Important:</strong> Cancellation is not the same as requesting a refund. To get a refund, you must follow the refund request process outlined above within the 7-day window.
                  </p>
                </AccordionContent>
              </AccordionItem>

              <AccordionItem 
                value="special"
                className="glass-card border border-border/50 rounded-xl px-6 data-[state=open]:bg-muted/30"
              >
                <AccordionTrigger className="text-left font-semibold hover:no-underline py-5">
                  <div className="flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-primary" />
                    <span>Special Circumstances</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <div className="space-y-3">
                    <div>
                      <p className="font-medium text-foreground mb-2">Technical Issues:</p>
                      <p>
                        If you're experiencing technical problems preventing access to the platform, please contact 
                        our support team first. We'll work to resolve the issue promptly. If the issue cannot be 
                        resolved within 48 hours, you may be eligible for a full refund regardless of the 7-day window.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">Duplicate Payments:</p>
                      <p>
                        If you were charged multiple times for the same subscription due to a technical error, 
                        contact us immediately. We'll refund the duplicate charge(s) within 3-5 business days.
                      </p>
                    </div>
                    <div>
                      <p className="font-medium text-foreground mb-2">Unauthorized Charges:</p>
                      <p>
                        If you notice an unauthorized charge on your account, contact us immediately at{" "}
                        <a href="mailto:support@phynetix.me" className="text-primary hover:underline">support@phynetix.me</a>. 
                        We take security seriously and will investigate and resolve such issues promptly.
                      </p>
                    </div>
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
                    <span>Contact & Support</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-5 space-y-3">
                  <p>
                    For refund requests or questions about our refund policy:
                  </p>
                  <div className="space-y-2">
                    <p><strong>Email:</strong> <a href="mailto:support@phynetix.me" className="text-primary hover:underline">support@phynetix.me</a></p>
                    <p><strong>Subject Line:</strong> "Refund Request" or "Refund Policy Question"</p>
                    <p><strong>Response Time:</strong> Within 24 hours (business days)</p>
                  </div>
                  <p className="text-sm">
                    We're committed to providing excellent customer service and will work with you to resolve any 
                    issues or concerns. Our goal is your satisfaction with PhyNetix.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-16 border-t border-border/50">
        <div className="container mx-auto px-4">
          <div className="glass-card p-8 md:p-12 text-center relative overflow-hidden max-w-4xl mx-auto">
            <div className="absolute inset-0 bg-gradient-primary opacity-5" />
            <div className="relative z-10">
              <CheckCircle2 className="w-12 h-12 text-primary mx-auto mb-4" />
              <h2 className="text-3xl md:text-4xl font-bold font-display mb-4">
                Risk-Free Trial
              </h2>
              <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
                Try PhyNetix with confidence. If you're not satisfied within 7 days, 
                we'll refund your payment—no questions asked.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link to="/auth">
                  <Button variant="gradient" size="xl">
                    Start Free Trial
                    <ArrowRight className="w-5 h-5" />
                  </Button>
                </Link>
                <Link to="/contact">
                  <Button variant="glass" size="xl">
                    Contact Support
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
