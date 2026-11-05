import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import {
  LayoutDashboard, BookOpen, FileText, ClipboardList, BarChart3, Settings,
  Menu, X, ChevronDown, Bell, UserRound, LogOut, ChevronLeft, ChevronRight,
  UserPlus, ShieldPlus, Users, CheckCheck
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStaffRoles, ROLE_DEFINITIONS } from "@/hooks/useStaffRoles";
import { supabase } from "@/integrations/supabase/client";
import { BrandLogo } from "@/components/BrandLogo";
import { cn } from "@/lib/utils";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

const navItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { label: "My Batches", path: "/my-batches", icon: BookOpen },
  { label: "Test Library", path: "/tests", icon: FileText },
  { label: "DPP", path: "/dpps", icon: ClipboardList },
  { label: "Analytics", path: "/analytics", icon: BarChart3 },
  { label: "Settings", path: "/settings", icon: Settings },
];

const titles: Record<string, string> = {
  "/dashboard": "Dashboard", "/my-batches": "My Batches", "/tests": "Test Library",
  "/dpps": "Daily Practice Problems", "/analytics": "Analytics", "/settings": "Settings",
  "/profile": "My Profile", "/payments": "Payment History", "/batches": "Explore Courses",
};

type Notice = { id: string; title: string; message: string; created_at: string | null; is_read: boolean | null };

export default function StudentWorkspaceLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [notices, setNotices] = useState<Notice[]>([]);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, signOut, isAdmin } = useAuth();
  const { userRoles } = useStaffRoles();

  const canManageUsers = isAdmin || userRoles.some((role) => ["operations_admin", "head", "manager"].includes(role));
  const roleLabel = isAdmin ? "Admin" : (userRoles[0] ? ROLE_DEFINITIONS[userRoles[0]]?.label : "Student") || "Student";
  const title = titles[location.pathname] || "Student Workspace";
  const name = profile?.full_name || user?.email?.split("@")[0] || "Student";
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const unread = useMemo(() => notices.filter((notice) => notice.is_read === false).length, [notices]);

  useEffect(() => { setDrawerOpen(false); }, [location.pathname]);
  useEffect(() => {
    if (!user) return;
    const load = async () => {
      const [{ data: p }, { data: n }] = await Promise.all([
        supabase.from("profiles").select("full_name, avatar_url").eq("id", user.id).maybeSingle(),
        supabase.from("notifications").select("id, title, message, created_at, is_read")
          .eq("user_id", user.id).order("created_at", { ascending: false }).limit(8),
      ]);
      setProfile(p || null);
      setNotices((n || []) as Notice[]);
    };
    void load();
    const channel = supabase.channel(`student-notifications-${user.id}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` }, () => { void load(); })
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [user]);

  const logout = async () => { await signOut(); navigate("/auth"); };
  const markRead = async (id: string) => {
    if (!user) return;
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id).eq("user_id", user.id);
    if (!error) setNotices((items) => items.map((item) => item.id === id ? { ...item, is_read: true } : item));
  };
  const markAllRead = async () => {
    if (!user) return;
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("user_id", user.id).eq("is_read", false);
    if (!error) setNotices((items) => items.map((item) => ({ ...item, is_read: true })));
  };

  if (isLoading || !user) return <div className="min-h-screen bg-[#050A12] grid place-items-center"><div className="h-8 w-8 rounded-full border-2 border-[#233A54] border-t-[#36A9FF] animate-spin" /></div>;

  const Sidebar = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="flex h-full flex-col">
      <div className="flex h-[76px] items-center border-b border-white/[0.07] px-5">
        <Link to="/dashboard" className="flex min-w-0 items-center gap-3">
          <BrandLogo compact={collapsed && !mobile} />
          {(!collapsed || mobile) && <span className="text-[17px] font-semibold tracking-tight text-white">PhyNetix</span>}
        </Link>
        {mobile && <button type="button" onClick={() => setDrawerOpen(false)} aria-label="Close navigation" className="ml-auto rounded-lg p-2 text-slate-400 hover:bg-white/5"><X size={18} /></button>}
      </div>
      <div className="px-4 pt-6 pb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-slate-500">{(!collapsed || mobile) ? "Workspace" : " "}</div>
      <nav className="flex-1 space-y-1 px-3">
        {navItems.map(({ label, path, icon: Icon }) => {
          const active = location.pathname === path || (path !== "/dashboard" && location.pathname.startsWith(path + "/"));
          return <Link key={path} to={path} title={collapsed && !mobile ? label : undefined}
            className={cn("group flex items-center gap-3 rounded-xl border px-3 py-3 text-[13px] font-medium transition-all",
              active ? "border-[#258DD2]/30 bg-[#0E3450] text-white shadow-[inset_2px_0_0_#38A8F4]" : "border-transparent text-slate-400 hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-slate-100")}>
            <Icon size={18} strokeWidth={1.8} className={active ? "text-[#58B9FF]" : "text-slate-500 group-hover:text-slate-300"} />
            {(!collapsed || mobile) && <span>{label}</span>}
          </Link>;
        })}
      </nav>
      <div className="border-t border-white/[0.07] p-3">
        <div className={cn("mb-3 flex items-center gap-3 rounded-xl bg-white/[0.035] p-3", collapsed && !mobile && "justify-center px-1")}>
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#123B5A] text-xs font-semibold text-[#A9DDFF]">{initials}</div>
          {(!collapsed || mobile) && <div className="min-w-0"><p className="truncate text-xs font-medium text-slate-200">{name}</p><p className="text-[10px] text-slate-500">{roleLabel}</p></div>}
        </div>
        <button onClick={logout} className={cn("flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-xs text-slate-500 transition hover:bg-rose-500/10 hover:text-rose-300", collapsed && !mobile && "justify-center")}><LogOut size={16} />{(!collapsed || mobile) && "Sign out"}</button>
        {!mobile && <button onClick={() => setCollapsed((value) => !value)} className="mt-2 hidden w-full items-center justify-center rounded-lg p-2 text-slate-500 hover:bg-white/5 hover:text-slate-200 lg:flex" aria-label="Collapse sidebar">{collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}</button>}
      </div>
    </div>
  );

  return <div className="min-h-screen bg-[#050A12] text-[#EAF2FA]">
    <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(ellipse_at_70%_0%,rgba(21,112,177,0.12),transparent_38%),radial-gradient(ellipse_at_0%_100%,rgba(22,80,125,0.08),transparent_35%)]" />
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-white/[0.07] bg-[#08111D]/95 backdrop-blur-xl transition-[width] duration-200 lg:block", collapsed ? "w-[82px]" : "w-[238px]")}><Sidebar /></aside>
    <AnimatePresence>
      {drawerOpen && <>
        <motion.button aria-label="Close navigation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setDrawerOpen(false)} className="fixed inset-0 z-50 bg-black/70 lg:hidden" />
        <motion.aside initial={{ x: -300 }} animate={{ x: 0 }} exit={{ x: -300 }} transition={{ type: "spring", damping: 28, stiffness: 300 }} className="fixed inset-y-0 left-0 z-[60] w-[280px] border-r border-white/10 bg-[#08111D] lg:hidden"><Sidebar mobile /></motion.aside>
      </>}
    </AnimatePresence>
    <div className={cn("relative min-h-screen transition-[margin] duration-200", collapsed ? "lg:ml-[82px]" : "lg:ml-[238px]")}>
      <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-white/[0.07] bg-[#07101B]/85 px-4 backdrop-blur-xl sm:px-6 lg:px-8">
        <button onClick={() => setDrawerOpen(true)} className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/5 lg:hidden" aria-label="Open navigation"><Menu size={18} /></button>
        <div className="min-w-0"><p className="hidden text-[10px] uppercase tracking-[0.18em] text-slate-500 sm:block">Student workspace</p><h1 className="truncate text-[16px] font-semibold text-white sm:text-[17px]">{title}</h1></div>
        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          {canManageUsers && <div className="hidden items-center gap-2 xl:flex">
            <Link to="/admin/users?action=add-student" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] text-slate-300 hover:border-sky-400/40 hover:text-white"><UserPlus size={14} />Add Student</Link>
            <Link to="/admin/users?action=add-admin" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] text-slate-300 hover:border-sky-400/40 hover:text-white"><ShieldPlus size={14} />Add Admin</Link>
            <Link to="/admin/users" className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] text-slate-300 hover:border-sky-400/40 hover:text-white"><Users size={14} />Users</Link>
          </div>}
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button aria-label="Notifications" className="relative rounded-xl border border-white/10 bg-white/[0.03] p-2.5 text-slate-300 hover:bg-white/[0.07]"><Bell size={17} />{unread > 0 && <span className="absolute right-2 top-2 h-1.5 w-1.5 rounded-full bg-sky-400 ring-2 ring-[#07101B]" />}</button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[min(360px,calc(100vw-24px))] border-white/10 bg-[#0B1725] text-slate-100">
              <div className="flex items-center justify-between px-3 py-2"><DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>{unread > 0 && <button onClick={markAllRead} className="inline-flex items-center gap-1 text-[10px] text-sky-300 hover:text-sky-200"><CheckCheck size={12} />Mark all read</button>}</div>
              <DropdownMenuSeparator className="bg-white/10" />
              {notices.length === 0 ? <p className="px-3 py-5 text-center text-xs text-slate-500">You're all caught up.</p> : notices.map((notice) => <DropdownMenuItem key={notice.id} onSelect={() => { if (!notice.is_read) void markRead(notice.id); }} className="cursor-pointer items-start gap-2 px-3 py-3 focus:bg-white/5">
                <span className={cn("mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full", notice.is_read ? "bg-slate-700" : "bg-sky-400")} />
                <span className="min-w-0"><span className="block text-xs font-medium">{notice.title}</span><span className="mt-1 block line-clamp-2 text-[11px] text-slate-400">{notice.message}</span></span>
              </DropdownMenuItem>)}
            </DropdownMenuContent>
          </DropdownMenu>
          <DropdownMenu>
            <DropdownMenuTrigger asChild><button className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-1.5 pr-2.5 hover:bg-white/[0.07]">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-lg object-cover" /> : <span className="grid h-8 w-8 place-items-center rounded-lg bg-[#123B5A] text-[11px] font-semibold text-sky-100">{initials}</span>}
              <span className="hidden max-w-[120px] truncate text-xs font-medium text-slate-200 sm:block">{name}</span><ChevronDown size={14} className="text-slate-500" />
            </button></DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52 border-white/10 bg-[#0B1725] text-slate-100">
              <DropdownMenuLabel><span className="block truncate text-xs">{name}</span><span className="text-[10px] font-normal text-slate-500">{roleLabel}</span></DropdownMenuLabel><DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem onSelect={() => navigate("/profile")} className="cursor-pointer focus:bg-white/5"><UserRound size={15} className="mr-2" />My Profile</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => navigate("/settings")} className="cursor-pointer focus:bg-white/5"><Settings size={15} className="mr-2" />Account Settings</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" /><DropdownMenuItem onSelect={logout} className="cursor-pointer text-rose-300 focus:bg-rose-500/10"><LogOut size={15} className="mr-2" />Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>
      <main className="relative min-h-[calc(100vh-72px)] p-4 sm:p-6 lg:p-8">{children}</main>
    </div>
  </div>;
}
