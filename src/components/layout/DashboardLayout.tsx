import StudentWorkspaceLayout from "@/components/layout/StudentWorkspaceLayout";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

/**
 * Shared student-facing application shell.
 * The examination interface has its own isolated layout and does not use this component.
 */
export default function DashboardLayout({ children }: DashboardLayoutProps) {
  return <StudentWorkspaceLayout>{children}</StudentWorkspaceLayout>;
}
