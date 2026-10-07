import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BrandLogo } from "@/components/BrandLogo";
import { TestSeriesSection } from "@/components/landing/TestSeriesSection";
import { Menu, X, Timer, BarChart3, BookOpenCheck, Repeat, ListChecks, Building2, ArrowRight } from "lucide-react";
import study from "@/assets/landing-study.jpg";

const features = [
  { icon: Timer, title: "Exam-style test interface", text: "Attempt timed tests in a layout modelled on computer-based exams, with a section-wise question palette and mark-for-review." },
  { icon: BarChart3, title: "Analysis after every attempt", text: "See your score, time spent per question, subject-wise performance and difficulty breakdown once you submit." },
  { icon: BookOpenCheck, title: "Step-by-step solutions", text: "Review each question with its solution, and practise similar questions where your teacher has added them." },
  { icon: Repeat, title: "Daily practice problems", text: "Work through DPP sets chapter by chapter, aligned to the JEE Main and Advanced syllabus." },
  { icon: ListChecks, title: "Organised test library", text: "Tests are grouped into sections like full tests, part tests and chapter-wise tests, in the order your batch follows." },
  { icon: Building2, title: "For institutes", text: "Coaching institutes can run their own batches, tests and results for their students on PhyNetix." },
];

const nav: [string, string][] = [["Test series", "#test-series"], ["Features", "#features"], ["About", "/about"], ["Contact", "/contact"]];

export default function LandingPage() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link to="/" aria-label="PhyNetix home"><BrandLogo /></Link>
          <nav className="hidden items-center gap-7 text-sm md:flex">
            {nav.map(([l, h]) => h.startsWith("#")
              ? <a key={l} href={h} className="text-muted-foreground hover:text-foreground">{l}</a>
              : <Link key={l} to={h} className="text-muted-foreground hover:text-foreground">{l}</Link>)}
          </nav>
          <div className="hidden items-center gap-2 md:flex">
            <Button asChild variant="ghost" size="sm"><Link to="/register-institute">Register as Institute</Link></Button>
            <Button asChild variant="outline" size="sm"><Link to="/auth">Log in</Link></Button>
            <Button asChild size="sm"><Link to="/auth?mode=signup">Sign up</Link></Button>
          </div>
          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">{open ? <X /> : <Menu />}</button>
        </div>
        {open && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-4 md:hidden">
            {nav.map(([l, h]) => h.startsWith("#")
              ? <a key={l} href={h} onClick={() => setOpen(false)}>{l}</a>
              : <Link key={l} to={h}>{l}</Link>)}
            <Link to="/register-institute">Register as Institute</Link>
            <Button asChild><Link to="/auth">Log in / Sign up</Link></Button>
          </div>
        )}
      </header>

      <section className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-16 md:grid-cols-2 md:py-24">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">JEE Main · JEE Advanced</p>
          <h1 className="font-display text-4xl font-bold leading-tight md:text-5xl">Practise the way the real exam feels.</h1>
          <p className="mt-5 max-w-lg text-lg text-muted-foreground">
            PhyNetix is a test platform for engineering aspirants: timed mock tests, clear solutions and an honest look at where your marks go.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg"><a href="#test-series">See test series <ArrowRight className="ml-2 h-4 w-4" /></a></Button>
            <Button asChild size="lg" variant="outline"><Link to="/auth">Log in</Link></Button>
          </div>
        </div>
        <img src={study} alt="Student solving problems at a desk" className="aspect-[4/3] w-full rounded-2xl border border-border object-cover" />
      </section>

      <section id="test-series" className="border-y border-border bg-secondary/40 py-4">
        <TestSeriesSection />
      </section>

      <section id="features" className="mx-auto max-w-6xl px-5 py-20">
        <h2 className="font-display text-3xl font-bold">What you get on PhyNetix</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">Everything listed here is available in the app today.</p>
        <div className="mt-10 grid gap-px overflow-hidden rounded-xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div key={f.title} className="bg-card p-6">
              <f.icon className="h-6 w-6 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 pb-20">
        <div className="flex flex-col items-start justify-between gap-6 rounded-2xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:p-12">
          <div>
            <h2 className="font-display text-2xl font-bold md:text-3xl">Create your account and pick a test series.</h2>
            <p className="mt-2 opacity-90">Run a coaching institute? Register to manage your own batches.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild size="lg" variant="secondary"><Link to="/auth?mode=signup">Sign up</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"><Link to="/register-institute">For institutes</Link></Button>
          </div>
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-muted-foreground md:flex-row md:items-center md:justify-between">
          <BrandLogo />
          <div className="flex flex-wrap gap-5">
            <Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/faq">FAQ</Link>
            <Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/refund">Refunds</Link>
          </div>
          <p>© {new Date().getFullYear()} PhyNetix</p>
        </div>
      </footer>
    </div>
  );
}
