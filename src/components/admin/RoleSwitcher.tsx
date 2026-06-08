import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  ChevronDown,
  Check
} from "lucide-react";
import { useStaffRoles, ROLE_DEFINITIONS } from "@/hooks/useStaffRoles";
import { cn } from "@/lib/utils";
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

interface RoleSwitcherProps {
  collapsed?: boolean;
}

export default function RoleSwitcher({ collapsed }: RoleSwitcherProps) {
  const navigate = useNavigate();
  const { userRoles, activeRole, setActiveRole, roleDefinition } = useStaffRoles();
  const [isOpen, setIsOpen] = useState(false);

  // Only show if user has multiple roles
  if (userRoles.length <= 1) return null;

  const ActiveIcon = roleDefinition ? iconMap[roleDefinition.icon] || Shield : Shield;

  const handleRoleSwitch = (role: AppRole) => {
    setActiveRole(role);
    setIsOpen(false);
    navigate(roleRouteMap[role] || '/admin');
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
          "bg-primary/10 border border-primary/20 text-primary",
          "hover:bg-primary/20"
        )}
      >
        <ActiveIcon className="w-5 h-5 flex-shrink-0" />
        <AnimatePresence mode="wait">
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex-1 text-left"
            >
              <span className="font-medium text-sm block">
                {roleDefinition?.label || 'Select Role'}
              </span>
              <span className="text-xs text-muted-foreground">
                {userRoles.length} roles available
              </span>
            </motion.div>
          )}
        </AnimatePresence>
        {!collapsed && (
          <ChevronDown className={cn(
            "w-4 h-4 transition-transform",
            isOpen && "rotate-180"
          )} />
        )}
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={cn(
              "absolute z-50 mt-2 py-2 rounded-xl",
              "bg-card border border-border shadow-xl",
              collapsed ? "left-full ml-2 top-0" : "left-0 right-0"
            )}
          >
            <div className="px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Switch Role
            </div>
            {userRoles.map((role) => {
              const definition = ROLE_DEFINITIONS[role];
              const Icon = iconMap[definition.icon] || Shield;
              const isActive = role === activeRole;

              return (
                <button
                  key={role}
                  onClick={() => handleRoleSwitch(role)}
                  className={cn(
                    "w-full flex items-center gap-3 px-3 py-2.5 transition-colors",
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-foreground hover:bg-secondary"
                  )}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <div className="flex-1 text-left">
                    <span className="font-medium text-sm block">
                      {definition.label}
                    </span>
                  </div>
                  {isActive && <Check className="w-4 h-4" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Click outside to close */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
