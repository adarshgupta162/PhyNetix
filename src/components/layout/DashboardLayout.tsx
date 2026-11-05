import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X,
  Bell,
  ChevronDown,
  User,
  UserPlus,
  ShieldPlus,
  Users,
  ClipboardList,
} from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useStaffRoles, ROLE_DEFINITIONS } from "@/hooks/useStaffRoles";
import { ThemeToggle } from "@/components/ThemeToggle";
import { BrandLogo } from "@/components/BrandLogo";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "My Batches", path: "/my-batches" },
  { icon: FileText, label: "Test Library", path: "/tests" },
  { icon: ClipboardList, label: "DPP", path: "/dpps" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: Settings, label: "Settings", path: "/settings" },
] as const;

const pageTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/my-batches": "My Batches",
  "/tests": "Test Library",
  "/dpps": "DPP",
  "/analytics": "Analytics",
  "/settings": "Settings",
  "/profile": "Profile",
  "/payments": "Payments",
  "/batches": "Browse Batches",
};

interface NotificationItem {
  id: string;
  title: string;
  message: string;
  created_at: string | null;
  is_read: boolean | null;
}

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profile, setProfile] = useState<{ full_name: string | null; avatar_url: string | null } | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, signOut, isAdmin } = useAuth();
  const { userRoles } = useStaffRoles();
  const isDashboard = location.pathname === "/dashboard";

  const canManageUsers = useMemo(
    () => isAdmin || userRoles.some((role) => ["operations_admin", "head", "manager"].includes(role)),
    [isAdmin, userRoles],
  );

  const roleLabel = useMemo(() => {
    if (isAdmin) return "Admin";
    const firstRole = userRoles[0];
    if (!firstRole) return "Student";
    return ROLE_DEFINITIONS[firstRole]?.label || "Student";
  }, [isAdmin, userRoles]);

  const pageTitle = useMemo(() => {
    if (pageTitles[location.pathname]) return pageTitles[location.pathname];
    const dynamicMatch = Object.keys(pageTitles).find((path) => location.pathname.startsWith(path));
    return dynamicMatch ? pageTitles[dynamicMatch] : "Dashboard";
  }, [location.pathname]);

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!user) return;

    const fetchTopbarData = async () => {
      const [{ data: profileData }, { data: notifData }] = await Promise.all([
        supabase
          .from("profiles")
          .select("full_name, avatar_url")
          .eq("id", user.id)
          .maybeSingle(),
        supabase
          .from("notifications")
          .select("id, title, message, created_at, is_read")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(5),
      ]);

      setProfile(profileData || null);
      const items = (notifData || []) as NotificationItem[];
      setNotifications(items);
      setUnreadNotifications(items.filter((item) => item.is_read === false).length);
    };

    fetchTopbarData();

    const channel = supabase
      .channel(`notifications-${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => {
          fetchTopbarData();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#050B16] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#168BFF]"></div>
      </div>
    );
  }

  if (!user) return null;

  const displayName = profile?.full_name || user.email?.split("@")[0] || "Student";
  const initials = displayName
    .split(" ")
    .map((name) => name[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const SidebarContent = () => (
      <div className="flex flex-col h-full">
      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-5 border-b border-[#1D364A]">
        <BrandLogo compact={collapsed && !mobileOpen} />
        <AnimatePresence mode="wait">
          {(!collapsed || mobileOpen) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
                className="text-lg font-semibold tracking-tight text-[#F4F7FF] whitespace-nowrap overflow-hidden"
            >
              PhyNetix
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 border border-transparent",
                isActive
                  ? "text-[#F4F7FF] bg-[#123552] border-[#2A82B8] shadow-[0_0_18px_rgba(22,151,232,0.12)]"
                  : "text-[#91A8BB] hover:text-[#F4F7FF] hover:bg-[#10283B] hover:border-[#1D364A]",
              )}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <AnimatePresence mode="wait">
                {(!collapsed || mobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
                    className="text-sm font-medium"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[#1D364A] px-3 py-3 space-y-2">
        <div className="flex items-center justify-between px-2">
          <ThemeToggle />
          {!mobileOpen && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md text-[#91A8BB] hover:text-[#F4F7FF] hover:bg-[#10283B] transition-colors hidden lg:block"
              aria-label="Toggle sidebar"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#91A8BB] hover:text-[#F4F7FF] hover:bg-[#10283B] transition-colors w-full"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          <AnimatePresence mode="wait">
            {(!collapsed || mobileOpen) && (
              <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-sm font-medium">
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-black flex text-[#F4F7FF] selection:bg-[#1697E8]/30">
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(circle_at_50%_35%,rgba(22,151,232,0.06),transparent_38%),radial-gradient(circle_at_0%_100%,rgba(92,184,233,0.04),transparent_34%)]" />

      <div className={cn("lg:hidden fixed top-0 left-0 right-0 h-16 bg-[#050D14]/95 border-b border-[#1D364A] z-50 items-center px-4 gap-3", isDashboard ? "hidden" : "flex")}>
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-[#10233B] text-[#F4F7FF]" aria-label="Open menu">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <BrandLogo compact />
          <span className="text-sm text-[#9AADC5]">{pageTitle}</span>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/60 z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", damping: 26, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[285px] bg-[#07131D] border-r border-[#1D364A] z-[60]"
            >
              <div className="absolute top-3 right-3">
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-[#10233B] text-[#9AADC5]">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 82 : 225 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className={cn("hidden lg:block fixed left-0 top-0 h-screen bg-[#07131D] border-r border-[#1D364A] z-40", isDashboard && "lg:hidden")}
      >
        <SidebarContent />
      </motion.aside>

      <main
        className={cn(
          "relative flex-1 transition-all duration-300",
          isDashboard ? "pt-0 ml-0" : "pt-16 lg:pt-0",
          !isDashboard && (collapsed ? "lg:ml-[82px]" : "lg:ml-[225px]"),
        )}
      >
        <header className={cn("hidden lg:flex sticky top-0 z-30 h-16 border-b border-[#1D364A] bg-[#050D14]/90 backdrop-blur-xl items-center px-6 gap-4", isDashboard && "lg:hidden")}>
          <button
            onClick={() => setCollapsed((value) => !value)}
            className="p-2 rounded-lg text-[#9AADC5] hover:text-[#F4F7FF] hover:bg-[#10233B]"
            aria-label="Toggle sidebar"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          <div>
            <p className="text-xs text-[#9AADC5]">Student Workspace</p>
            <h1 className="text-lg font-semibold text-[#F4F7FF]">{pageTitle}</h1>
          </div>

          <div className="ml-auto flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full text-xs border border-[#203B5C] text-[#9AADC5] bg-[#0B1A2E]">
              {roleLabel}
            </span>

            {canManageUsers && (
              <div className="hidden xl:flex items-center gap-2">
                <Link
                  to="/admin/users?action=add-student"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#203B5C] bg-[#0B1A2E] text-[#9AADC5] hover:text-[#F4F7FF] hover:border-[#168BFF]/50 transition"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span className="text-xs">Add Student</span>
                </Link>
                <Link
                  to="/admin/users?action=add-admin"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#203B5C] bg-[#0B1A2E] text-[#9AADC5] hover:text-[#F4F7FF] hover:border-[#168BFF]/50 transition"
                >
                  <ShieldPlus className="w-3.5 h-3.5" />
                  <span className="text-xs">Add Admin</span>
                </Link>
                <Link
                  to="/admin/users"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#203B5C] bg-[#0B1A2E] text-[#9AADC5] hover:text-[#F4F7FF] hover:border-[#168BFF]/50 transition"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span className="text-xs">User Management</span>
                </Link>
              </div>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="relative p-2 rounded-lg border border-[#203B5C] bg-[#0B1A2E] text-[#9AADC5] hover:text-[#F4F7FF] transition" aria-label="Notifications">
                  <Bell className="w-4 h-4" />
                  {unreadNotifications > 0 && <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-[#168BFF]" />}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 bg-[#0B1A2E] border-[#203B5C] text-[#F4F7FF]">
                <DropdownMenuLabel className="text-[#F4F7FF]">Notifications</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#203B5C]" />
                {notifications.length === 0 ? (
                  <DropdownMenuItem className="text-[#9AADC5] cursor-default focus:bg-[#10233B]">No notifications yet</DropdownMenuItem>
                ) : (
                  notifications.map((notification) => (
                    <DropdownMenuItem
                      key={notification.id}
                      className="focus:bg-[#10233B] flex-col items-start gap-1 py-2"
                    >
                      <div className="flex items-center gap-2 w-full">
                        <span className="text-xs font-medium text-[#F4F7FF] truncate">{notification.title}</span>
                        {notification.is_read === false && <span className="w-1.5 h-1.5 rounded-full bg-[#168BFF] ml-auto" />}
                      </div>
                      <span className="text-xs text-[#9AADC5] line-clamp-2">{notification.message}</span>
                    </DropdownMenuItem>
                  ))
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 pl-1 pr-2 py-1.5 rounded-lg border border-[#203B5C] bg-[#0B1A2E] hover:border-[#168BFF]/40 transition">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt={displayName} className="w-8 h-8 rounded-full object-cover border border-[#203B5C]" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-[#10233B] border border-[#203B5C] text-xs flex items-center justify-center text-[#F4F7FF]">
                      {initials}
                    </div>
                  )}
                  <ChevronDown className="w-4 h-4 text-[#9AADC5]" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0B1A2E] border-[#203B5C] text-[#F4F7FF]">
                <DropdownMenuLabel className="text-[#F4F7FF]">
                  <div className="flex flex-col">
                    <span className="text-sm">{displayName}</span>
                    <span className="text-xs text-[#9AADC5]">{roleLabel}</span>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#203B5C]" />
                <DropdownMenuItem asChild className="focus:bg-[#10233B]">
                  <Link to="/profile" className="flex items-center gap-2 text-[#F4F7FF]">
                    <User className="w-4 h-4" />
                    Profile
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className="focus:bg-[#10233B]">
                  <Link to="/settings" className="flex items-center gap-2 text-[#F4F7FF]">
                    <Settings className="w-4 h-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#203B5C]" />
                <DropdownMenuItem onClick={handleSignOut} className="focus:bg-[#10233B] text-[#F4F7FF]">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <div className={cn("relative", isDashboard ? "min-h-screen" : "min-h-[calc(100vh-4rem)]")}>{children}</div>
      </main>
    </div>
  );
}
