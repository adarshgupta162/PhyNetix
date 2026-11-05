import { ReactNode } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { LayoutDashboard, Users, Layers, ClipboardList, BarChart3, UserCog, Settings, LogOut, Building2, ShieldAlert, FileText } from "lucide-react";
import { useInstitute } from "@/hooks/useInstitute";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ThemeToggle } from "@/components/ThemeToggle";

const NAV = [
  { to: "/institute", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/institute/students", label: "Students", icon: Users, permission: "students.view" },
  { to: "/institute/batches", label: "Batches", icon: Layers, permission: "batches.view" },
  { to: "/institute/tests", label: "Tests", icon: ClipboardList, permission: "tests.view" },
  { to: "/institute/dpps", label: "DPPs", icon: FileText, permission: "dpps.view" },
  { to: "/institute/results", label: "Results", icon: BarChart3, permission: "results.view" },
  { to: "/institute/staff", label: "Staff", icon: UserCog, adminOnly: true },
  { to: "/institute/settings", label: "Settings", icon: Settings, adminOnly: true },
];

export default function InstituteLayout({ children }: { children: ReactNode }) {
  const { institution, role, isSuspended, can, isInstituteAdmin } = useInstitute();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const visibleNav = NAV.filter((item) => (!item.permission || can(item.permission)) && (!item.adminOnly || isInstituteAdmin));
  const navClass = (active: boolean, mobile = false) => mobile
    ? `whitespace-nowrap rounded-full px-3 py-1.5 text-xs border ${active ? "bg-primary text-primary-foreground border-primary" : "text-muted-foreground"}`
    : `flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors ${active ? "bg-primary/10 text-primary font-medium" : "text-muted-foreground hover:bg-muted"}`;

  return (
    <div className="institute-layout min-h-screen flex">
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r bg-card">
        <div className="p-4 border-b">
          <div className="flex items-center gap-3">
            {institution?.logo_url ? <img src={institution.logo_url} alt={`${institution.name} logo`} className="w-10 h-10 rounded-lg object-cover border" />
              : <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center"><Building2 className="w-5 h-5 text-primary" /></div>}
            <div className="min-w-0"><div className="font-semibold truncate">{institution?.name ?? "Institute"}</div><div className="text-[11px] text-muted-foreground">Powered by PhyNetix</div></div>
          </div>
          <Badge variant="secondary" className="mt-3 capitalize">{role}</Badge>
        </div>
        <nav className="flex-1 overflow-y-auto p-2 space-y-1">
          {visibleNav.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({isActive}) => navClass(isActive)}>
            <item.icon className="w-4 h-4" />{item.label}
          </NavLink>)}
        </nav>
        <div className="p-2 border-t flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>Student view</Button>
          <div className="flex items-center gap-1"><ThemeToggle /><Button variant="ghost" size="icon" onClick={() => signOut()} aria-label="Sign out"><LogOut className="w-4 h-4" /></Button></div>
        </div>
      </aside>
      <main className="flex-1 min-w-0">
        <div className="md:hidden border-b p-3 flex items-center gap-2 overflow-x-auto">
          {visibleNav.map((item) => <NavLink key={item.to} to={item.to} end={item.end} className={({isActive}) => navClass(isActive, true)}>{item.label}</NavLink>)}
        </div>
        {isSuspended && <div className="p-4"><Alert variant="destructive"><ShieldAlert className="h-4 w-4" /><AlertTitle>Institute suspended</AlertTitle>
          <AlertDescription>Workspace changes are disabled. Existing records remain available to authorized staff until a platform administrator reactivates the institute.</AlertDescription>
        </Alert></div>}
        {children}
      </main>
    </div>
  );
}
