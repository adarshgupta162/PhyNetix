import { Link } from "react-router-dom";
import { BookOpen, ChartNoAxesCombined, ClipboardCheck, Building2, Check } from "lucide-react";
import PublicLayout from "@/components/layout/PublicLayout";
import { TestSeriesSection } from "@/components/landing/TestSeriesSection";
const benefits=[{icon:BookOpen,title:"A place for your preparation",copy:"Batches, tests, and daily practice."},{icon:ClipboardCheck,title:"Make every attempt count",copy:"A focused computer-based test experience."},{icon:ChartNoAxesCombined,title:"See what comes next",copy:"Results and analysis to guide your revision."}];
export default function LandingPage() {
  return <PublicLayout>
    <section className="product-container product-hero">
      <div className="product-hero-copy"><p className="product-eyebrow"><span className="product-dot"/> A clearer way to prepare</p><h1>Your next attempt.<br/><em>Your best yet.</em></h1><p className="product-lead">Practice with purpose. Understand every attempt. Build the confidence to walk into your next exam ready.</p><div className="product-actions"><Link className="product-button" to="/batches">Explore test series</Link><Link className="product-button product-button-secondary" to="/auth?mode=signup">Create your account</Link></div><p className="product-hero-note"><Check size={15}/> Your practice, progress, and results. One workspace.</p></div>
      <div className="product-hero-visual"><div className="product-preview-top"><span><span className="product-dot"/> FOCUS MODE</span><span>Built around your preparation</span></div><div className="product-preview-image"><img src="/cbt-preview.png" alt="Preview of the PhyNetix computer-based test interface" width="1200" height="700" fetchPriority="high"/></div><div className="product-preview-caption"><span className="product-preview-icon"><ClipboardCheck size={24}/></span><div><strong>Practice. Review. Improve.</strong><p>A familiar exam experience, with room to learn.</p></div></div></div>
    </section>
    <section className="product-proof-strip"><div className="product-container">{benefits.map(({icon:Icon,title,copy})=><div key={title}><Icon size={23}/><div><h2>{title}</h2><p>{copy}</p></div></div>)}</div></section>
    <TestSeriesSection/>
    <section className="product-container product-section"><div className="product-section-heading"><p className="product-eyebrow">A better study rhythm</p><h2>Less guessing.<br/>More deliberate progress.</h2><p>Bring your preparation into one simple routine.</p></div><div className="product-step-grid">{[
      ["01","Choose your direction","Explore available batches and find the series that fits your exam preparation."],
      ["02","Give it your best attempt","Open your test library, follow the instructions, and work through the paper."],
      ["03","Turn results into revision","Review released results and solutions. Come back to the ideas that need another look."]
    ].map(([n,title,copy])=><article key={n} className="product-step"><span>{n}</span><h3>{title}</h3><p>{copy}</p></article>)}</div></section>
    <section className="product-container product-section"><div className="product-institute"><div><p className="product-eyebrow"><Building2 size={17}/> For educators & institutes</p><h2>Your teaching.<br/>A connected workspace.</h2><p>Manage your students, batches, tests, and results in one place. Keep your team focused on helping students learn.</p><Link to="/register-institute" className="product-button product-button-secondary">Set up your institute</Link></div><div className="product-institute-list">{["Organize students into batches","Manage your tests and schedules","Review results with your team"].map((s,i)=><div key={s}><span>0{i+1}</span><strong>{s}</strong><Check size={18}/></div>)}</div></div></section>
    <section className="product-container product-section"><div className="product-final-cta"><p className="product-eyebrow">Start with your next step</p><h2>Preparation feels better<br/>with a clear direction.</h2><Link to="/auth?mode=signup" className="product-button">Create a free account</Link><p>Explore available batches after signing up.</p></div></section>
  </PublicLayout>;
}
