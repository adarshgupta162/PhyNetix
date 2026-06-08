import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { 
  Shield, 
  GraduationCap, 
  Users, 
  IndianRupee, 
  Megaphone,
  Crown,
  Briefcase,
  BookOpen,
  Database,
  ClipboardList,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useStaffRoles, ROLE_DEFINITIONS, STAFF_ROLES } from "@/hooks/useStaffRoles";
import { AtomIcon } from "@/components/icons/AtomIcon";
import type { Database as DbType } from "@/integrations/supabase/types";

type AppRole = DbType['public']['Enums']['app_role'];

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Shield,
  GraduationCap,
  Users,
  IndianRupee,
  Megaphone,
  Crown,
  Briefcase,
  BookOpen,
  Database,
  ClipboardList,
};

// Role to route mapping
const roleRouteMap: Record<AppRole, string> = {
  admin: '/admin',
  academic_admin: '/admin/academic',
  operations_admin: '/admin/operations',
  finance_admin: '/admin/finance',
  marketing_admin: '/admin',
  head: '/admin',
  manager: '/admin',
  teacher: '/admin/academic',
  data_manager: '/admin/academic',
  test_manager: '/admin/tests',
  student: '/dashboard',
};

// Color scheme for each role
const roleColorMap: Record<AppRole, { bg: string; border: string; glow: string }> = {
  admin: { bg: 'from-red-500/20 to-orange-500/20', border: 'border-red-500/30', glow: 'shadow-red-500/20' },
  academic_admin: { bg: 'from-blue-500/20 to-cyan-500/20', border: 'border-blue-500/30', glow: 'shadow-blue-500/20' },
  operations_admin: { bg: 'from-green-500/20 to-emerald-500/20', border: 'border-green-500/30', glow: 'shadow-green-500/20' },
  finance_admin: { bg: 'from-yellow-500/20 to-amber-500/20', border: 'border-yellow-500/30', glow: 'shadow-yellow-500/20' },
  marketing_admin: { bg: 'from-purple-500/20 to-pink-500/20', border: 'border-purple-500/30', glow: 'shadow-purple-500/20' },
  head: { bg: 'from-indigo-500/20 to-violet-500/20', border: 'border-indigo-500/30', glow: 'shadow-indigo-500/20' },
  manager: { bg: 'from-teal-500/20 to-cyan-500/20', border: 'border-teal-500/30', glow: 'shadow-teal-500/20' },
  teacher: { bg: 'from-rose-500/20 to-pink-500/20', border: 'border-rose-500/30', glow: 'shadow-rose-500/20' },
  data_manager: { bg: 'from-slate-500/20 to-gray-500/20', border: 'border-slate-500/30', glow: 'shadow-slate-500/20' },
  test_manager: { bg: 'from-orange-500/20 to-red-500/20', border: 'border-orange-500/30', glow: 'shadow-orange-500/20' },
  student: { bg: 'from-gray-500/20 to-slate-500/20', border: 'border-gray-500/30', glow: 'shadow-gray-500/20' },
};

export default function RoleSelectorPage() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { userRoles, setActiveRole, isLoading: rolesLoading } = useStaffRoles();

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/staff-auth');
    }
  }, [user, authLoading, navigate]);

  // If user has only one role, redirect directly
  useEffect(() => {
    if (!rolesLoading && userRoles.length === 1) {
      const role = userRoles[0];
      setActiveRole(role);
      navigate(roleRouteMap[role] || '/admin');
    }
  }, [rolesLoading, userRoles, setActiveRole, navigate]);

  const handleRoleSelect = (role: AppRole) => {
    setActiveRole(role);
    navigate(roleRouteMap[role] || '/admin');
  };

  if (authLoading || rolesLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Filter to only show roles the user has
  const availableRoles = userRoles.filter(role => STAFF_ROLES.includes(role));

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="floating-orb w-[600px] h-[600px] bg-primary/20 top-0 -left-64" />
        <div className="floating-orb w-[500px] h-[500px] bg-accent/20 bottom-0 -right-48" style={{ animationDelay: '2s' }} />
        <div className="floating-orb w-[400px] h-[400px] bg-teal/20 top-1/2 left-1/2 -translate-x-1/2" style={{ animationDelay: '4s' }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-12">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <div className="flex items-center justify-center gap-3 mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-teal flex items-center justify-center">
              <AtomIcon className="w-10 h-10 text-white" />
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold font-display mb-4">
            Welcome to <span className="gradient-text">PhyNetix</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Select your dashboard to continue. You have access to {availableRoles.length} role{availableRoles.length !== 1 ? 's' : ''}.
          </p>
        </motion.div>

        {/* Role Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {availableRoles.map((role, index) => {
            const definition = ROLE_DEFINITIONS[role];
            const Icon = iconMap[definition.icon] || Shield;
            const colors = roleColorMap[role];

            return (
              <motion.button
                key={role}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                whileHover={{ scale: 1.02, y: -4 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleRoleSelect(role)}
                className={`
                  group relative p-8 rounded-3xl text-left
                  bg-gradient-to-br ${colors.bg}
                  backdrop-blur-xl border ${colors.border}
                  hover:shadow-2xl hover:${colors.glow}
                  transition-all duration-300
                `}
              >
                {/* Sparkle effect on hover */}
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                </div>

                {/* Icon */}
                <div className={`
                  w-16 h-16 rounded-2xl mb-6
                  bg-gradient-to-br ${colors.bg}
                  border ${colors.border}
                  flex items-center justify-center
                  group-hover:scale-110 transition-transform
                `}>
                  <Icon className="w-8 h-8 text-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-2xl font-bold font-display mb-2">
                  {definition.label}
                </h3>
                <p className="text-muted-foreground mb-6">
                  {definition.description}
                </p>

                {/* Features */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {definition.features.slice(0, 4).map((feature) => (
                    <span
                      key={feature}
                      className="text-xs px-3 py-1 rounded-full bg-background/50 text-foreground/80"
                    >
                      {feature}
                    </span>
                  ))}
                </div>

                {/* CTA */}
                <div className="flex items-center gap-2 text-primary font-medium group-hover:gap-3 transition-all">
                  <span>Enter Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Quick Info */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center mt-12 text-muted-foreground"
        >
          <p>
            You can switch between roles anytime from the sidebar menu.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
