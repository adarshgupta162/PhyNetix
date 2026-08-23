import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Github,
  Linkedin,
  Instagram,
  GraduationCap,
  Trophy,
  Rocket,
  Code2,
  Sparkles,
  Target,
  ArrowUpRight,
  Atom,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import portrait from "@/assets/adarsh-portrait.jpg";

const focusItems = [
  { icon: Rocket, label: "Building PhyNetix" },
  { icon: Code2, label: "C++ & DSA" },
  { icon: Sparkles, label: "Generative AI" },
  { icon: Target, label: "Software Engineering" },
  { icon: Atom, label: "Product Development" },
];

const socials = [
  {
    icon: Linkedin,
    label: "LinkedIn",
    handle: "adarshgupta1317",
    href: "https://www.linkedin.com/in/adarshgupta1317",
  },
  {
    icon: Github,
    label: "GitHub",
    handle: "adarshgupta162",
    href: "https://github.com/adarshgupta162",
  },
  {
    icon: Instagram,
    label: "Instagram",
    handle: "@_adarxh.in_",
    href: "https://instagram.com/_adarxh.in_",
  },
];

export default function DevPortfolio() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Ambient background */}
      <div className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute -top-40 -left-40 w-[520px] h-[520px] rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-[520px] h-[520px] rounded-full bg-accent/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-[520px] h-[520px] rounded-full bg-success/10 blur-3xl" />
      </div>

      {/* Nav */}
      <header className="max-w-6xl mx-auto px-6 py-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-success/20 flex items-center justify-center">
            <Atom className="w-5 h-5 text-success" />
          </div>
          <span className="font-display font-bold text-lg">Phynetix</span>
        </Link>
        <div className="hidden md:flex items-center gap-2">
          {socials.map((s) => (
            <a key={s.label} href={s.href} target="_blank" rel="noreferrer">
              <Button variant="ghost" size="icon" aria-label={s.label}>
                <s.icon className="w-4 h-4" />
              </Button>
            </a>
          ))}
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-6xl mx-auto px-6 pt-8 pb-20 grid lg:grid-cols-[1.2fr_1fr] gap-12 items-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/40 backdrop-blur text-xs font-medium mb-6">
            <span className="w-2 h-2 rounded-full bg-success animate-pulse" />
            Founder & Developer · PhyNetix
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold leading-[1.02] tracking-tight mb-6">
            Adarsh <span className="gradient-text">Gupta</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-xl mb-8 leading-relaxed">
            B.Tech (CSE) student at IIEST Shibpur, building
            AI-powered products that solve real-world problems — starting with
            how India prepares for JEE.
          </p>
          <div className="flex flex-wrap gap-3">
            <a href="https://www.linkedin.com/in/adarshgupta1317" target="_blank" rel="noreferrer">
              <Button variant="gradient" size="lg">
                <Linkedin className="w-4 h-4" /> Connect on LinkedIn
              </Button>
            </a>
            <Link to="/">
              <Button variant="outline" size="lg">
                Visit PhyNetix <ArrowUpRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.94 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="relative mx-auto"
        >
          <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-tr from-primary/40 via-accent/30 to-success/30 blur-2xl" />
          <div className="relative rounded-[2rem] overflow-hidden border border-border/60 shadow-2xl aspect-square w-[280px] md:w-[380px]">
            <img
              src={portrait}
              alt="Adarsh Gupta portrait"
              width={816}
              height={816}
              className="w-full h-full object-cover"
            />
          </div>
          <div className="absolute -bottom-4 -left-4 bg-card/90 backdrop-blur border border-border rounded-xl px-4 py-3 shadow-lg">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">JEE Main</div>
            <div className="text-xl font-bold font-display">98.41 %ile</div>
          </div>
          <div className="absolute -top-4 -right-4 bg-card/90 backdrop-blur border border-border rounded-xl px-4 py-3 shadow-lg">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">Qualified</div>
            <div className="text-xl font-bold font-display">JEE Advanced</div>
          </div>
        </motion.div>
      </section>

      {/* About */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-10">
        <div>
          <h2 className="text-3xl font-display font-bold mb-4">The story</h2>
          <p className="text-muted-foreground leading-relaxed mb-4">
            I founded PhyNetix with a vision to make JEE preparation more
            personalized, interactive, and technology-driven. What started as
            an idea has grown into a live platform focused on realistic test
            simulations, detailed analytics, and AI-assisted learning.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Right now I'm strengthening my foundations in C++, Data Structures
            & Algorithms, and core Computer Science — while continuously
            shipping improvements to PhyNetix and exploring Generative AI.
          </p>
        </div>

        <div className="glass-card p-6 rounded-2xl">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-lg">Current focus</h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {focusItems.map((f) => (
              <div
                key={f.label}
                className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-border/50"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <f.icon className="w-4 h-4 text-primary" />
                </div>
                <span className="text-sm font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Education & Achievements */}
      <section className="max-w-6xl mx-auto px-6 py-12 grid md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="glass-card p-6 rounded-2xl"
        >
          <GraduationCap className="w-8 h-8 text-primary mb-3" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Education
          </div>
          <div className="text-xl font-display font-bold mb-1">
            B.Tech, Computer Science & Engineering
          </div>
          <div className="text-muted-foreground">
            Indian Institute of Engineering Science and Technology, Shibpur 
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="glass-card p-6 rounded-2xl"
        >
          <Trophy className="w-8 h-8 text-warning mb-3" />
          <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">
            Achievements
          </div>
          <ul className="space-y-2 mt-2">
            <li className="flex items-center justify-between">
              <span>JEE Main</span>
              <span className="font-bold font-display">98.41 Percentile</span>
            </li>
            <li className="flex items-center justify-between">
              <span>JEE Advanced</span>
              <span className="font-bold font-display">Qualified</span>
            </li>
          </ul>
        </motion.div>
      </section>

      {/* Vision */}
      <section className="max-w-4xl mx-auto px-6 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-border bg-card/40 text-xs font-medium mb-6">
          Vision
        </div>
        <p className="text-2xl md:text-3xl font-display leading-snug">
          I believe technology should simplify learning and unlock opportunities
          for every student. My long-term goal is to build products that create
          <span className="gradient-text"> meaningful impact at scale </span>
          through AI and software engineering.
        </p>
      </section>

      {/* Socials */}
      <section className="max-w-6xl mx-auto px-6 pb-24">
        <h2 className="text-3xl font-display font-bold mb-6">Elsewhere</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          {socials.map((s) => (
            <a
              key={s.label}
              href={s.href}
              target="_blank"
              rel="noreferrer"
              className="group glass-card p-5 rounded-2xl flex items-center justify-between hover:border-primary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold">{s.label}</div>
                  <div className="text-sm text-muted-foreground">{s.handle}</div>
                </div>
              </div>
              <ArrowUpRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </a>
          ))}
        </div>
      </section>

      <footer className="border-t border-border/60 py-8 text-center text-sm text-muted-foreground">
        © {new Date().getFullYear()} Adarsh Gupta · Built on{" "}
        <Link to="/" className="text-primary hover:underline">
          Phynetix
        </Link>
      </footer>
    </div>
  );
}
