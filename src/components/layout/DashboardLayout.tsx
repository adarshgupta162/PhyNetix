import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  BookOpen, 
  ClipboardList, 
  BarChart3, 
  User, 
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  Library,
  FileText,
  Menu,
  X
} from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AtomIcon } from "@/components/icons/AtomIcon";

const navItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/dashboard" },
  { icon: BookOpen, label: "My Batches", path: "/my-batches" },
  { icon: Library, label: "Browse Batches", path: "/batches" },
  { icon: FileText, label: "Test Library", path: "/tests" },
  { icon: BookOpen, label: "DPPs", path: "/dpps" },
  { icon: ClipboardList, label: "My Attempts", path: "/attempts" },
  { icon: BarChart3, label: "Analytics", path: "/analytics" },
  { icon: User, label: "Profile", path: "/profile" },
  { icon: Settings, label: "Settings", path: "/settings" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isLoading, signOut, isAdmin, viewMode, setViewMode } = useAuth();

  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth');
    }
  }, [user, isLoading, navigate]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const toggleViewMode = () => {
    const newMode = viewMode === 'admin' ? 'student' : 'admin';
    setViewMode(newMode);
    if (newMode === 'admin') {
      navigate('/admin');
    } else {
      navigate('/dashboard');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <Link to="/dashboard" className="flex items-center gap-3 px-4 py-5 border-b border-border">
        <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
          <AtomIcon className="w-5 h-5 text-primary-foreground" />
        </div>
        <AnimatePresence mode="wait">
          {(!collapsed || mobileOpen) && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="text-lg font-bold tracking-wider uppercase text-primary whitespace-nowrap overflow-hidden"
            >
              PhyNetix
            </motion.span>
          )}
        </AnimatePresence>
      </Link>

      {/* Admin Toggle */}
      {isAdmin && (
        <div className="px-3 py-3 border-b border-border">
          <button
            onClick={toggleViewMode}
            className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-lg w-full transition-all duration-200",
              viewMode === 'admin'
                ? "bg-primary/10 text-primary"
                : "bg-secondary/50 text-muted-foreground hover:text-foreground"
            )}
          >
            {viewMode === 'admin' ? (
              <Shield className="w-[18px] h-[18px] flex-shrink-0" />
            ) : (
              <Users className="w-[18px] h-[18px] flex-shrink-0" />
            )}
            <AnimatePresence mode="wait">
              {(!collapsed || mobileOpen) && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-sm font-medium"
                >
                  {viewMode === 'admin' ? 'Admin Mode' : 'Student Mode'}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              <AnimatePresence mode="wait">
                {(!collapsed || mobileOpen) && (
                  <motion.span
                    initial={{ opacity: 0, x: -10 }}
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

      {/* Bottom */}
      <div className="border-t border-border px-3 py-3 space-y-1">
        <div className="flex items-center justify-between px-3 py-1">
          <ThemeToggle />
          {!mobileOpen && (
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1.5 rounded-md text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors hidden lg:block"
            >
              {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          )}
        </div>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors w-full"
        >
          <LogOut className="w-[18px] h-[18px] flex-shrink-0" />
          <AnimatePresence mode="wait">
            {(!collapsed || mobileOpen) && (
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-sm font-medium"
              >
                Logout
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {/* Mobile header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-card border-b border-border z-50 flex items-center px-4 gap-3">
        <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-secondary">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
            <AtomIcon className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="font-bold text-sm uppercase tracking-wider text-primary">PhyNetix</span>
        </div>
      </div>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-50"
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 h-screen w-[280px] bg-card border-r border-border z-[60]"
            >
              <div className="absolute top-3 right-3">
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg hover:bg-secondary">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <SidebarContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 64 : 240 }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="hidden lg:block fixed left-0 top-0 h-screen bg-card border-r border-border z-50"
      >
        <SidebarContent />
      </motion.aside>

      {/* Main Content */}
      <main
        className={cn(
          "flex-1 transition-all duration-300 pt-14 lg:pt-0",
          collapsed ? "lg:ml-[64px]" : "lg:ml-[240px]"
        )}
      >
        {children}
      </main>
    </div>
  );
}
