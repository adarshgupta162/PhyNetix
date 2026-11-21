import { useEffect, useState, type ReactNode } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { Menu } from "lucide-react";
import { BrandLogo } from "@/components/BrandLogo";
import { Sheet, SheetContent, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";

const links = [{to:"/batches",label:"Test series"},{to:"/about",label:"About PhyNetix"},{to:"/faq",label:"Help"}];
export default function PublicLayout({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const [open,setOpen] = useState(false);
  useEffect(()=>{setOpen(false);window.scrollTo({top:0});},[pathname]);
  return <div className="public-product">
    <a className="product-skip" href="#main-content">Skip to content</a>
    <header className="product-header"><div className="product-container product-header-inner">
      <Link to="/" aria-label="PhyNetix home"><BrandLogo /></Link>
      <nav aria-label="Main navigation" className="product-desktop-nav">{links.map(l=><NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}</nav>
      <div className="product-header-actions"><Link className="product-login" to={user?"/dashboard":"/auth"}>{user?"My workspace":"Log in"}</Link><Link className="product-button product-button-small" to={user?"/tests":"/auth?mode=signup"}>{user?"Find a test":"Get started"}</Link><button type="button" className="product-menu" aria-label="Open navigation" onClick={()=>setOpen(true)}><Menu size={22}/></button></div>
    </div></header>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent className="product-mobile-nav" side="right"><SheetTitle>Explore PhyNetix</SheetTitle><SheetDescription>Preparation, your account, and support.</SheetDescription><nav aria-label="Mobile navigation">{links.map(l=><NavLink key={l.to} to={l.to}>{l.label}</NavLink>)}<Link to="/register-institute">For institutes</Link><Link to={user?"/dashboard":"/auth"}>{user?"My workspace":"Log in"}</Link></nav></SheetContent></Sheet>
    <main id="main-content">{children}</main>
    <footer className="product-footer"><div className="product-container"><div className="product-footer-grid">
      <div><Link to="/" aria-label="PhyNetix home"><BrandLogo /></Link><p>Turning Tough Problems<br/>into Simple Solutions.</p></div>
      <div><h2>Prepare</h2><Link to="/batches">Explore test series</Link><Link to="/dashboard">Student workspace</Link><Link to="/real-exam-calculator">Real exam calculator</Link></div>
      <div><h2>PhyNetix</h2><Link to="/about">About us</Link><Link to="/register-institute">For institutes</Link><Link to="/staff-login">Staff sign in</Link></div>
      <div><h2>We're here to help</h2><Link to="/faq">Frequently asked questions</Link><Link to="/contact">Contact support</Link><a href="mailto:support@phynetix.me">support@phynetix.me</a></div>
    </div><div className="product-footer-bottom"><span>© {new Date().getFullYear()} PhyNetix</span><div><Link to="/privacy">Privacy</Link><Link to="/terms">Terms</Link><Link to="/refund">Refund policy</Link></div></div></div></footer>
  </div>;
}
