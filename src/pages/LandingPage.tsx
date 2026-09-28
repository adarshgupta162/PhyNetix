import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowRight, Atom, BarChart3, BookOpen, Building2, CheckCircle2,
  ClipboardCheck, GraduationCap, Menu, ShieldCheck, Target, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const examTracks = [
  { name: "JEE Main", detail: "Computer-based mock tests with section navigation and exam-style question types.", logo: "/logos/test-series/jee-main.png" },
  { name: "JEE Advanced", detail: "Multi-correct, integer and subject-wise practice for advanced preparation.", logo: "/logos/test-series/jee-advanced.png" },
  { name: "NEET", detail: "Timed subject practice, full tests and clear performance review.", logo: "/logos/test-series/neet.png" },
];

const journey = [
  { number: "01", title: "Choose a test series", text: "Browse published batches and select the course that matches your exam and preparation stage.", icon: BookOpen },
  { number: "02", title: "Practice in the real format", text: "Attempt scheduled tests, DPPs and chapter-wise work in a focused computer-based interface.", icon: ClipboardCheck },
  { number: "03", title: "Review every decision", text: "Use question-level solutions, timing and section analysis to decide what to revise next.", icon: BarChart3 },
];

const capabilities = [
  { icon: Target, title: "Exam-style interface", text: "Section tabs, question palette, marking controls and a visible countdown timer." },
  { icon: BarChart3, title: "Detailed analysis", text: "Review accuracy, time spent and question outcomes after submission." },
  { icon: BookOpen, title: "Structured practice", text: "Follow chapter-wise DPPs and tests arranged by your batch administrator." },
  { icon: ShieldCheck, title: "Managed test sessions", text: "Fullscreen rules, timed submission and monitored sessions where enabled." },
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5" aria-label="Phynetix home">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Atom className="h-5 w-5" /></span>
            <span className="text-lg font-extrabold">Phynetix<span className="text-primary">.</span></span>
          </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <Link to="/courses" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Courses</Link>
            <a href="#platform" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Platform</a>
            <Link to="/pricing" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">Pricing</Link>
            <Link to="/register-institute" className="text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">For institutes</Link>
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button variant="ghost" asChild><Link to="/auth">Log in</Link></Button>
            <Button asChild><Link to="/auth">Start preparing <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMenuOpen((open) => !open)} aria-label="Toggle menu">
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {menuOpen && (
          <div className="border-t bg-background px-5 py-4 md:hidden">
            <nav className="flex flex-col gap-3">
              <Link to="/courses" onClick={() => setMenuOpen(false)}>Courses</Link>
              <Link to="/pricing" onClick={() => setMenuOpen(false)}>Pricing</Link>
              <Link to="/register-institute" onClick={() => setMenuOpen(false)}>For institutes</Link>
              <Button className="mt-2" asChild><Link to="/auth">Start preparing</Link></Button>
            </nav>
          </div>
        )}
      </header>

      <main>
        <section className="border-b bg-secondary/40">
          <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-12 px-5 py-14 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:py-20">
            <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-xs font-semibold text-primary">
                <span className="h-2 w-2 rounded-full bg-primary" /> JEE and NEET test preparation
              </div>
              <h1 className="max-w-3xl text-5xl font-extrabold leading-[1.06] sm:text-6xl lg:text-7xl">
                Practice the exam.<br /><span className="text-primary">Understand the result.</span>
              </h1>
              <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
                Phynetix brings timed tests, structured practice and question-level analysis into one clear preparation workspace.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button size="lg" asChild><Link to="/courses">Explore test series <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
                <Button size="lg" variant="outline" asChild><Link to="/auth">Student login</Link></Button>
              </div>
              <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground">
                {["JEE Main & Advanced", "NEET", "Chapter-wise practice"].map((item) => <span key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-primary" />{item}</span>)}
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.55, delay: 0.12 }} className="relative">
              <div className="overflow-hidden rounded-2xl border bg-card p-3 shadow-xl">
                <div className="mb-3 flex items-center justify-between border-b px-2 pb-3">
                  <div><p className="text-xs font-semibold text-primary">TEST WORKSPACE</p><p className="mt-1 font-bold">JEE Main practice test</p></div>
                  <div className="rounded-md bg-secondary px-3 py-2 font-mono text-sm font-semibold">01:42:18</div>
                </div>
                <img src="/cbt-preview.png" alt="Phynetix computer-based test interface" className="aspect-[16/9] w-full rounded-lg border object-cover object-top" />
                <div className="grid grid-cols-3 gap-2 pt-3">
                  {["Answer", "Review", "Analyse"].map((label, index) => <div key={label} className={`rounded-md border px-3 py-2 text-center text-xs font-semibold ${index === 1 ? "border-primary bg-primary text-primary-foreground" : "bg-secondary"}`}>{label}</div>)}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="border-b py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="mb-10 max-w-2xl"><p className="text-sm font-bold text-primary">EXAM TRACKS</p><h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Start with the exam you are preparing for.</h2><p className="mt-4 text-muted-foreground">See the available courses and published test series without invented claims or inflated numbers.</p></div>
            <div className="grid gap-4 md:grid-cols-3">
              {examTracks.map((exam) => (
                <Link key={exam.name} to="/courses" className="group flex min-h-52 flex-col rounded-xl border bg-card p-6 transition hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg">
                  <img src={exam.logo} alt="" className="h-12 w-12 object-contain" />
                  <h3 className="mt-7 text-xl font-bold">{exam.name}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted-foreground">{exam.detail}</p>
                  <span className="mt-5 flex items-center text-sm font-bold text-primary">View courses <ArrowRight className="ml-2 h-4 w-4 transition group-hover:translate-x-1" /></span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="platform" className="border-b bg-secondary/50 py-20">
          <div className="mx-auto max-w-7xl px-5 lg:px-8">
            <div className="text-center"><p className="text-sm font-bold text-primary">YOUR PREPARATION JOURNEY</p><h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">One flow, from practice to revision.</h2></div>
            <div className="relative mt-14 grid gap-5 md:grid-cols-3">
              {journey.map((step, index) => (
                <motion.div key={step.number} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: index * 0.08 }} className={`relative rounded-xl border bg-card p-7 ${index === 1 ? "border-2 border-primary shadow-lg md:-translate-y-4" : ""}`}>
                  {index === 1 && <span className="absolute right-6 top-0 -translate-y-1/2 rounded-full bg-primary px-3 py-1 text-[10px] font-bold text-primary-foreground">CORE STEP</span>}
                  <div className="flex items-center justify-between"><span className="font-mono text-sm font-bold text-primary">{step.number}</span><step.icon className="h-5 w-5 text-primary" /></div>
                  <h3 className="mt-8 text-xl font-bold">{step.title}</h3><p className="mt-3 text-sm leading-6 text-muted-foreground">{step.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20">
          <div className="mx-auto grid max-w-7xl gap-14 px-5 lg:grid-cols-[.8fr_1.2fr] lg:px-8">
            <div><p className="text-sm font-bold text-primary">WHAT IS INCLUDED</p><h2 className="mt-3 text-3xl font-extrabold sm:text-4xl">Tools that support the work, not distract from it.</h2><p className="mt-5 leading-7 text-muted-foreground">Each part of Phynetix is built around attempting a test, reviewing the outcome and returning to the right topic.</p></div>
            <div className="grid gap-x-8 gap-y-9 sm:grid-cols-2">
              {capabilities.map((item) => <div key={item.title} className="border-t pt-5"><item.icon className="h-6 w-6 text-primary" /><h3 className="mt-4 font-bold">{item.title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{item.text}</p></div>)}
            </div>
          </div>
        </section>

        <section className="border-y bg-primary py-16 text-primary-foreground">
          <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-5 md:flex-row md:items-center lg:px-8">
            <div className="max-w-2xl"><Building2 className="h-7 w-7" /><h2 className="mt-4 text-3xl font-extrabold">Run your institute on Phynetix.</h2><p className="mt-3 leading-7 text-primary-foreground/80">Create batches, arrange tests, add staff and review student results from a dedicated institute workspace.</p></div>
            <Button size="lg" variant="secondary" asChild><Link to="/register-institute">Register an institute <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
          </div>
        </section>
      </main>

      <footer className="bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-[1.4fr_1fr_1fr] lg:px-8">
          <div><div className="flex items-center gap-2 font-extrabold"><Atom className="h-5 w-5 text-primary" />Phynetix<span className="text-primary">.</span></div><p className="mt-3 max-w-sm text-sm leading-6 text-muted-foreground">Online test preparation and institute management for focused exam practice.</p></div>
          <div><p className="text-sm font-bold">Platform</p><div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground"><Link to="/courses">Courses</Link><Link to="/pricing">Pricing</Link><Link to="/register-institute">For institutes</Link></div></div>
          <div><p className="text-sm font-bold">Information</p><div className="mt-4 flex flex-col gap-3 text-sm text-muted-foreground"><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link></div></div>
        </div>
        <div className="border-t py-5 text-center text-xs text-muted-foreground">© 2026 Phynetix. All rights reserved.</div>
      </footer>
    </div>
  );
}