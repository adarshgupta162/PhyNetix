import { Link } from "react-router-dom";
import { useState } from "react";
import { ArrowRight, Menu, X, BookOpen, BarChart3, ClipboardList, Building2 } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import study from "@/assets/landing-study.jpg";
import { TestSeriesSection } from "@/components/landing/TestSeriesSection";

const features = [
  { icon: ClipboardList, title: "Exam-style tests", text: "Timed tests with a familiar computer-based exam layout." },
  { icon: BarChart3, title: "Useful analysis", text: "Review scores, accuracy and time spent after an attempt." },
  { icon: BookOpen, title: "Solutions and practice", text: "Review worked solutions and continue with daily practice problems." },
  { icon: Building2, title: "Institute workspace", text: "Tools for institutes to organise batches, tests and student work." },
];
const links = [["Test series", "#test-series"], ["How it works", "#features"], ["About", "/about"], ["Contact", "/contact"]] as const;
export default function LandingPage() {
  const [menuOpen,setMenuOpen]=useState(false);
  return <div className="landing-page min-h-screen bg-[#FAFAF8] text-[#17191B]">
    <header className="sticky top-0 z-40 border-b border-[#E9E9E5] bg-[#FAFAF8]/95 backdrop-blur">
      <div className="mx-auto flex h-[68px] max-w-6xl items-center justify-between px-5 lg:px-8">
        <Link to="/" aria-label="PhyNetix home"><BrandLogo/></Link>
        <nav className="hidden items-center gap-8 md:flex">{links.map(([label,href])=>href.startsWith("#")?<a key={label} href={href} className="text-[13px] text-[#696D70] hover:text-[#17191B]">{label}</a>:<Link key={label} to={href} className="text-[13px] text-[#696D70] hover:text-[#17191B]">{label}</Link>)}</nav>
        <div className="hidden items-center gap-3 md:flex"><Link to="/register-institute" className="text-[13px] text-[#696D70] hover:text-[#17191B]">For institutes</Link><Link to="/auth" className="rounded-md border border-[#D9DAD6] px-4 py-2 text-[13px] font-medium hover:border-[#17191B]">Log in</Link><Link to="/auth?mode=signup" className="rounded-md bg-[#17191B] px-4 py-2 text-[13px] font-medium text-white hover:bg-[#34383B]">Create account</Link></div>
        <button className="rounded-md p-2 md:hidden" onClick={()=>setMenuOpen(v=>!v)} aria-label="Toggle menu">{menuOpen?<X size={20}/>:<Menu size={20}/>}</button>
      </div>
      {menuOpen&&<nav className="flex flex-col gap-4 border-t border-[#E9E9E5] px-5 py-5 md:hidden">{links.map(([label,href])=>href.startsWith("#")?<a key={label} href={href} onClick={()=>setMenuOpen(false)}>{label}</a>:<Link key={label} to={href}>{label}</Link>)}<Link to="/register-institute">For institutes</Link><Link to="/auth">Log in / Create account</Link></nav>}
    </header>
    <main>
      <section className="mx-auto grid max-w-6xl items-center gap-12 px-5 py-20 md:grid-cols-[1.05fr_.95fr] md:py-28 lg:px-8">
        <div className="max-w-xl"><p className="mb-5 text-[11px] font-semibold uppercase tracking-[.2em] text-[#168C91]">JEE · NEET preparation</p><h1 className="text-[42px] font-semibold leading-[1.08] tracking-[-.045em] sm:text-5xl lg:text-[58px]">Prepare with clarity.<br/>Measure your progress.</h1><p className="mt-6 max-w-lg text-[16px] leading-7 text-[#666B6E]">PhyNetix brings timed practice tests, solutions and performance analysis into one focused workspace.</p><div className="mt-8 flex flex-wrap gap-3"><Link to="/auth?mode=signup" className="inline-flex h-11 items-center gap-2 rounded-md bg-[#17191B] px-5 text-[13px] font-medium text-white hover:bg-[#34383B]">Get started <ArrowRight size={15}/></Link><a href="#test-series" className="inline-flex h-11 items-center rounded-md border border-[#D9DAD6] px-5 text-[13px] font-medium text-[#42474A] hover:border-[#17191B]">Browse test series</a></div></div>
        <div className="overflow-hidden rounded-xl border border-[#E4E5E0] bg-white"><img src={study} alt="Student studying at a desk" className="aspect-[5/4] w-full object-cover"/></div>
      </section>
      <section id="test-series" className="border-y border-[#E9E9E5] bg-white"><TestSeriesSection/></section>
      <section id="features" className="mx-auto max-w-6xl px-5 py-20 lg:px-8"><div className="max-w-xl"><p className="text-[11px] font-semibold uppercase tracking-[.2em] text-[#168C91]">The platform</p><h2 className="mt-3 text-3xl font-semibold tracking-[-.035em]">Everything you need to practise, in one place.</h2><p className="mt-4 text-sm leading-6 text-[#73797A]">A focused set of tools for students and the teams that support them.</p></div><div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">{features.map(({icon:Icon,title,text})=><article key={title} className="border-t border-[#E5E7E2] pt-5"><Icon size={19} strokeWidth={1.6} className="text-[#238D83]"/><h3 className="mt-5 text-[14px] font-semibold">{title}</h3><p className="mt-2 text-[13px] leading-6 text-[#73797A]">{text}</p></article>)}</div></section>
      <section className="border-y border-[#E9E9E5] bg-[#F2F4F1]"><div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-14 sm:flex-row sm:items-center sm:justify-between lg:px-8"><div><h2 className="text-2xl font-semibold tracking-[-.03em]">Ready to get started?</h2><p className="mt-2 text-sm text-[#73797A]">Create an account to access your preparation workspace.</p></div><div className="flex flex-wrap gap-3"><Link to="/auth?mode=signup" className="rounded-md bg-[#17191B] px-5 py-3 text-[13px] font-medium text-white">Create account</Link><Link to="/register-institute" className="rounded-md border border-[#D7DAD5] px-5 py-3 text-[13px] font-medium">Institute registration</Link></div></div></section>
    </main>
    <footer className="mx-auto flex max-w-6xl flex-col gap-5 px-5 py-8 text-[12px] text-[#7C8282] sm:flex-row sm:items-center sm:justify-between lg:px-8"><BrandLogo/><div className="flex flex-wrap gap-5"><Link to="/about">About</Link><Link to="/contact">Contact</Link><Link to="/faq">FAQ</Link><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/refund">Refunds</Link></div><span>© {new Date().getFullYear()} PhyNetix</span></footer>
  </div>;
}