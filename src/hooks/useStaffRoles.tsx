import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import type { Database } from '@/integrations/supabase/types';

type AppRole = Database['public']['Enums']['app_role'];

interface StaffRole {
  role: AppRole;
  label: string;
  description: string;
  icon: string;
  features: string[];
}

// Role definitions with their features
export const ROLE_DEFINITIONS: Record<AppRole, StaffRole> = {
  admin: {
    role: 'admin',
    label: 'Administrator',
    description: 'Full access to all platform features and settings',
    icon: 'Shield',
    features: ['All Features', 'User Management', 'System Settings', 'Audit Logs'],
  },
  academic_admin: {
    role: 'academic_admin',
    label: 'Academic',
    description: 'Manage tests, questions, and educational content',
    icon: 'GraduationCap',
    features: ['Tests', 'Question Bank', 'PhyNetix Library', 'PDF Tests'],
  },
  operations_admin: {
    role: 'operations_admin',
    label: 'Operations',
    description: 'Handle enrollments, students, and support',
    icon: 'Users',
    features: ['Enrollments', 'Students', 'Batches', 'Support'],
  },
  finance_admin: {
    role: 'finance_admin',
    label: 'Finance',
    description: 'Manage payments, refunds, and financial reports',
    icon: 'IndianRupee',
    features: ['Payments', 'Refunds', 'Coupons', 'Revenue Reports'],
  },
  marketing_admin: {
    role: 'marketing_admin',
    label: 'Marketing',
    description: 'Handle promotions, campaigns, and analytics',
    icon: 'Megaphone',
    features: ['Campaigns', 'Analytics', 'Promotions'],
  },
  head: {
    role: 'head',
    label: 'Department Head',
    description: 'Oversee department operations and team',
    icon: 'Crown',
    features: ['Team Management', 'Approvals', 'Reports'],
  },
  manager: {
    role: 'manager',
    label: 'Manager',
    description: 'Manage day-to-day operations',
    icon: 'Briefcase',
    features: ['Tasks', 'Team', 'Reports'],
  },
  teacher: {
    role: 'teacher',
    label: 'Teacher',
    description: 'Create and manage educational content',
    icon: 'BookOpen',
    features: ['Questions', 'Solutions', 'Content'],
  },
  data_manager: {
    role: 'data_manager',
    label: 'Data Manager',
    description: 'Handle data entry and content management',
    icon: 'Database',
    features: ['Data Entry', 'Content Upload', 'Verification'],
  },
  test_manager: {
    role: 'test_manager',
    label: 'Test Manager',
    description: 'Create and manage tests and assessments',
    icon: 'ClipboardList',
    features: ['Test Creation', 'Scheduling', 'Results'],
  },
  student: {
    role: 'student',
    label: 'Student',
    description: 'Access learning materials and tests',
    icon: 'User',
    features: ['Tests', 'Results', 'Practice'],
  },
};

// Staff roles (non-student roles)
export const STAFF_ROLES: AppRole[] = [
  'admin',
  'academic_admin',
  'operations_admin',
  'finance_admin',
  'marketing_admin',
  'head',
  'manager',
  'teacher',
  'data_manager',
  'test_manager',
];

interface StaffRolesContextType {
  userRoles: AppRole[];
  activeRole: AppRole | null;
  setActiveRole: (role: AppRole) => void;
  isLoading: boolean;
  hasRole: (role: AppRole) => boolean;
  isStaff: boolean;
  roleDefinition: StaffRole | null;
}

const StaffRolesContext = createContext<StaffRolesContextType | undefined>(undefined);

export function StaffRolesProvider({ children }: { children: ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [userRoles, setUserRoles] = useState<AppRole[]>([]);
  const [activeRole, setActiveRoleState] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUserRoles = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching roles:', error);
        return [];
      }

      return data.map(r => r.role as AppRole);
    } catch (err) {
      console.error('Error in fetchUserRoles:', err);
      return [];
    }
  }, []);

  useEffect(() => {
    const loadRoles = async () => {
      if (authLoading) return;
      
      if (!user) {
        setUserRoles([]);
        setActiveRoleState(null);
        setIsLoading(false);
        return;
      }

      const roles = await fetchUserRoles(user.id);
      const staffRoles = roles.filter(r => STAFF_ROLES.includes(r));
      setUserRoles(staffRoles);

      // Restore active role from localStorage or default to first staff role
      const savedRole = localStorage.getItem('activeStaffRole') as AppRole | null;
      if (savedRole && staffRoles.includes(savedRole)) {
        setActiveRoleState(savedRole);
      } else if (staffRoles.length > 0) {
        // Default to admin if available, otherwise first role
        if (staffRoles.includes('admin')) {
          setActiveRoleState('admin');
        } else {
          setActiveRoleState(staffRoles[0]);
        }
      }

      setIsLoading(false);
    };

    loadRoles();
  }, [user, authLoading, fetchUserRoles]);

  const setActiveRole = useCallback((role: AppRole) => {
    setActiveRoleState(role);
    localStorage.setItem('activeStaffRole', role);
  }, []);

  const hasRole = useCallback((role: AppRole) => {
    return userRoles.includes(role) || userRoles.includes('admin');
  }, [userRoles]);

  const isStaff = userRoles.length > 0;
  const roleDefinition = activeRole ? ROLE_DEFINITIONS[activeRole] : null;

  return (
    <StaffRolesContext.Provider
      value={{
        userRoles,
        activeRole,
        setActiveRole,
        isLoading,
        hasRole,
        isStaff,
        roleDefinition,
      }}
    >
      {children}
    </StaffRolesContext.Provider>
  );
}

export function useStaffRoles() {
  const context = useContext(StaffRolesContext);
  if (context === undefined) {
    throw new Error('useStaffRoles must be used within a StaffRolesProvider');
  }
  return context;
}
