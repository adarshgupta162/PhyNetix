// Role-based permission system
export type AppRole = 
  | 'admin' 
  | 'head' 
  | 'manager' 
  | 'teacher' 
  | 'data_manager' 
  | 'test_manager' 
  | 'finance_admin'
  | 'academic_admin'
  | 'operations_admin'
  | 'marketing_admin'
  | 'student';

export interface RolePermissions {
  // Test & Question permissions
  canCreateTest: boolean;
  canEditTest: boolean;
  canDeleteTest: boolean;
  canPublishTest: boolean;
  canViewTestAnalytics: boolean;
  canManageQuestionBank: boolean;
  
  // Student data permissions
  canViewStudentData: boolean;
  canEditStudentData: boolean;
  canDeleteStudent: boolean;
  canCreateStudent: boolean;
  
  // User management
  canCreateUser: boolean;
  canEditUserRole: boolean;
  canDeleteUser: boolean;
  canViewAllUsers: boolean;
  
  // Staff features
  canAccessAdminPanel: boolean;
  canAccessCommunity: boolean;
  canViewAuditLogs: boolean;
  canSendNotifications: boolean;
  canApproveRequests: boolean;
  
  // Settings
  canManageSettings: boolean;
  canManageDepartments: boolean;
  
  // Batch & Finance
  canManageBatches: boolean;
  canManagePayments: boolean;
  canViewRevenue: boolean;
  canProcessRefunds: boolean;
  canManageCoupons: boolean;
  canManageEnrollments: boolean;
}

export const rolePermissions: Record<AppRole, RolePermissions> = {
  admin: {
    canCreateTest: true,
    canEditTest: true,
    canDeleteTest: true,
    canPublishTest: true,
    canViewTestAnalytics: true,
    canManageQuestionBank: true,
    canViewStudentData: true,
    canEditStudentData: true,
    canDeleteStudent: true,
    canCreateStudent: true,
    canCreateUser: true,
    canEditUserRole: true,
    canDeleteUser: true,
    canViewAllUsers: true,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: true,
    canApproveRequests: true,
    canManageSettings: true,
    canManageDepartments: true,
    canManageBatches: true,
    canManagePayments: true,
    canViewRevenue: true,
    canProcessRefunds: true,
    canManageCoupons: true,
    canManageEnrollments: true,
  },
  finance_admin: {
    canCreateTest: false,
    canEditTest: false,
    canDeleteTest: false,
    canPublishTest: false,
    canViewTestAnalytics: false,
    canManageQuestionBank: false,
    canViewStudentData: true,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: true,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: false,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
    canManageBatches: false,
    canManagePayments: true,
    canViewRevenue: true,
    canProcessRefunds: true,
    canManageCoupons: true,
    canManageEnrollments: false,
  },
  academic_admin: {
    canCreateTest: true,
    canEditTest: true,
    canDeleteTest: true,
    canPublishTest: true,
    canViewTestAnalytics: true,
    canManageQuestionBank: true,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: false,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
    canManageBatches: true,
    canManagePayments: false,
    canViewRevenue: false,
    canProcessRefunds: false,
    canManageCoupons: false,
    canManageEnrollments: false,
  },
  operations_admin: {
    canCreateTest: false,
    canEditTest: false,
    canDeleteTest: false,
    canPublishTest: false,
    canViewTestAnalytics: true,
    canManageQuestionBank: false,
    canViewStudentData: true,
    canEditStudentData: true,
    canDeleteStudent: false,
    canCreateStudent: true,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: true,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
    canManageBatches: false,
    canManagePayments: false,
    canViewRevenue: false,
    canProcessRefunds: false,
    canManageCoupons: false,
    canManageEnrollments: true,
  },
  marketing_admin: {
    canCreateTest: false,
    canEditTest: false,
    canDeleteTest: false,
    canPublishTest: false,
    canViewTestAnalytics: false,
    canManageQuestionBank: false,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: false,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: false,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
    canManageBatches: false,
    canManagePayments: false,
    canViewRevenue: false,
    canProcessRefunds: false,
    canManageCoupons: true,
    canManageEnrollments: false,
  },
  head: {
    canCreateTest: true,
    canEditTest: true,
    canDeleteTest: true,
    canPublishTest: true,
    canViewTestAnalytics: true,
    canManageQuestionBank: true,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: true,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
    canManageBatches: true,
    canManagePayments: false,
    canViewRevenue: false,
    canProcessRefunds: false,
    canManageCoupons: false,
    canManageEnrollments: false,
  },
  manager: {
    canCreateTest: true,
    canEditTest: true,
    canDeleteTest: false,
    canPublishTest: true,
    canViewTestAnalytics: true,
    canManageQuestionBank: true,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: true,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
    canManageBatches: false,
    canManagePayments: false,
    canViewRevenue: false,
    canProcessRefunds: false,
    canManageCoupons: false,
    canManageEnrollments: false,
  },
  teacher: {
    canCreateTest: true,
    canEditTest: true,
    canDeleteTest: false,
    canPublishTest: false,
    canViewTestAnalytics: true,
    canManageQuestionBank: true,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: false,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: false,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
    canManageBatches: false,
    canManagePayments: false,
    canViewRevenue: false,
    canProcessRefunds: false,
    canManageCoupons: false,
    canManageEnrollments: false,
  },
  data_manager: {
    canCreateTest: false,
    canEditTest: false,
    canDeleteTest: false,
    canPublishTest: false,
    canViewTestAnalytics: true,
    canManageQuestionBank: false,
    canViewStudentData: true,
    canEditStudentData: true,
    canDeleteStudent: false,
    canCreateStudent: true,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: true,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: true,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
    canManageBatches: false,
    canManagePayments: false,
    canViewRevenue: false,
    canProcessRefunds: false,
    canManageCoupons: false,
    canManageEnrollments: false,
  },
  test_manager: {
    canCreateTest: false,
    canEditTest: true,
    canDeleteTest: false,
    canPublishTest: true,
    canViewTestAnalytics: true,
    canManageQuestionBank: false,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: false,
    canAccessAdminPanel: true,
    canAccessCommunity: true,
    canViewAuditLogs: true,
    canSendNotifications: false,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
    canManageBatches: false,
    canManagePayments: false,
    canViewRevenue: false,
    canProcessRefunds: false,
    canManageCoupons: false,
    canManageEnrollments: false,
  },
  student: {
    canCreateTest: false,
    canEditTest: false,
    canDeleteTest: false,
    canPublishTest: false,
    canViewTestAnalytics: false,
    canManageQuestionBank: false,
    canViewStudentData: false,
    canEditStudentData: false,
    canDeleteStudent: false,
    canCreateStudent: false,
    canCreateUser: false,
    canEditUserRole: false,
    canDeleteUser: false,
    canViewAllUsers: false,
    canAccessAdminPanel: false,
    canAccessCommunity: false,
    canViewAuditLogs: false,
    canSendNotifications: false,
    canApproveRequests: false,
    canManageSettings: false,
    canManageDepartments: false,
    canManageBatches: false,
    canManagePayments: false,
    canViewRevenue: false,
    canProcessRefunds: false,
    canManageCoupons: false,
    canManageEnrollments: false,
  },
};

export function getPermissions(role: AppRole): RolePermissions {
  return rolePermissions[role] || rolePermissions.student;
}

export function hasPermission(role: AppRole, permission: keyof RolePermissions): boolean {
  return rolePermissions[role]?.[permission] ?? false;
}

export function isStaffRole(role: AppRole): boolean {
  return role !== 'student';
}

export const roleLabels: Record<AppRole, string> = {
  admin: 'Super Admin',
  finance_admin: 'Finance Admin',
  academic_admin: 'Academic Admin',
  operations_admin: 'Operations Admin',
  marketing_admin: 'Marketing Admin',
  head: 'Head',
  manager: 'Manager',
  teacher: 'Teacher',
  data_manager: 'Data Manager',
  test_manager: 'Test Manager',
  student: 'Student',
};

export const roleBadgeColors: Record<AppRole, string> = {
  admin: 'bg-red-500/10 text-red-500 border-red-500/20',
  finance_admin: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20',
  academic_admin: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20',
  operations_admin: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
  marketing_admin: 'bg-pink-500/10 text-pink-500 border-pink-500/20',
  head: 'bg-purple-500/10 text-purple-500 border-purple-500/20',
  manager: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  teacher: 'bg-green-500/10 text-green-500 border-green-500/20',
  data_manager: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  test_manager: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20',
  student: 'bg-gray-500/10 text-gray-500 border-gray-500/20',
};

// Department mapping for admin roles
export const adminDepartments: Record<string, AppRole[]> = {
  finance: ['finance_admin'],
  academic: ['academic_admin', 'teacher', 'head'],
  operations: ['operations_admin', 'data_manager'],
  marketing: ['marketing_admin'],
};
