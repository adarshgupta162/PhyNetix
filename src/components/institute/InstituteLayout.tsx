import { useState, useEffect, type ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard,Users,Layers,ClipboardList,BarChart3,UserCog,Settings,LogOut,Building2,ShieldAlert,Menu,HelpCircle } from "lucide-react";
import { useInstitute } from "@/hooks/useInstitute";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { Sheet,SheetContent,SheetTitle,SheetDescription } from "@/components/ui/sheet";
import { Alert,AlertDescription,AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
const NAV=[
 {to:"/institute",label:"Overview",icon:LayoutDashboard,end:true,permission:null},
 {to:"/institute/students",label:"Students",icon:Users,permission:"students.view"},
 {to:"/institute/batches",label:"Batches",icon:Layers,permission:"batches.view"},
 {to:"/institute/tests",label:"Tests",icon:ClipboardList,permission:"tests.view"},
 {to:"/institute/results",label:"Results",icon:BarChart3,permission:"results.view"},
 {to:"/institute/staff",label:"Staff",icon:UserCog,permission:"admin"},
 {to:"/institute/settings",label:"Settings",icon:Settings,permission:"admin"}
];
export default function InstituteLayout({children}:{children:ReactNode}) {
 const {institution,role,isSuspended,isInstituteAdmin,can}=useInstitute();
 const [open,setOpen]=useState(false);const location=useLocation(),navigate=useNavigate();
 const nav=NAV.filter(n=>!n.permission||(n.permission==="admin"?isInstituteAdmin:can(n.permission)));
 useEffect(()=>setOpen(false),[location.pathname]);
 async function logout(){const {error}=await supabase.auth.signOut();if(error){toast.error("Sign out failed. Please try again.");return;}navigate("/auth");}
 const Sidebar=()=> <div className="institute-nav"><div className="institute-brand"><Link to="/institute" aria-label="Institute home"><BrandLogo/></Link></div><div className="institute-identity">{institution?.logo_url?<img src={institution.logo_url} alt=""/>:<Building2 size={30} className="shrink-0 text-emerald-700"/>}<div><strong>{institution?.name||"Your institute"}</strong><small>{role||"Team member"}</small></div></div><nav aria-label="Institute navigation">{nav.map(({to,label,icon:Icon,end})=><NavLink key={to} to={to} end={end}><Icon size={18}/>{label}</NavLink>)}</nav><div className="institute-nav-footer"><Link to="/contact"><HelpCircle size={17}/>Help & support</Link><Link to="/dashboard"><LayoutDashboard size={17}/>Student workspace</Link><button onClick={()=>void logout()}><LogOut size={17}/>Sign out</button></div></div>;
 return <div className="institute-layout min-h-screen flex"><aside className="institute-sidebar"><Sidebar/></aside><Sheet open={open} onOpenChange={setOpen}><SheetContent side="left" className="institute-layout p-0 w-[280px]"><SheetTitle className="sr-only">Institute navigation</SheetTitle><SheetDescription className="sr-only">Manage your institute and account.</SheetDescription><Sidebar/></SheetContent></Sheet><main className="institute-main"><header className="institute-header"><button aria-label="Open navigation" onClick={()=>setOpen(true)}><Menu size={22}/></button><div><p>Institute workspace</p><h1>{NAV.find(n=>n.to===location.pathname)?.label||"Institute"}</h1></div><Link to="/">View website</Link></header>{isSuspended&&<div className="p-5"><Alert variant="destructive"><ShieldAlert size={18}/><AlertTitle>Institute suspended</AlertTitle><AlertDescription>Your existing data is preserved. New changes are blocked until a PhyNetix administrator reactivates your institute.</AlertDescription></Alert></div>}{children}</main></div>;
}
