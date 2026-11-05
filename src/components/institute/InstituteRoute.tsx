import { ReactNode } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useInstitute } from "@/hooks/useInstitute";
import InstituteLayout from "./InstituteLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, Building2, XCircle, ShieldAlert } from "lucide-react";

const REQUIRED: Record<string, string> = {
  "/institute/students": "students.view",
  "/institute/batches": "batches.view",
  "/institute/tests": "tests.view",
  "/institute/dpps": "dpps.view",\n  "/institute/proctoring": "proctoring.view",
  "/institute/results": "results.view",
};

export default function InstituteRoute({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { context, isLoading, isInstituteStaff, isInstituteAdmin, can } = useInstitute();

  if (authLoading || isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  if (!user) return <Centered icon={<Building2 className="w-10 h-10 text-primary" />} title="Sign in required" body="Sign in with your institute account to open this workspace." action={<Button onClick={() => navigate("/auth")}>Sign in</Button>} />;
  if (!context) return <Centered icon={<Building2 className="w-10 h-10 text-primary" />} title="No institute workspace" body="This account is not linked to an institute." action={<div className="flex gap-2 justify-center"><Button onClick={() => navigate("/register-institute")}>Register institute</Button><Button variant="outline" onClick={() => navigate("/dashboard")}>Student view</Button></div>} />;

  const status = context.institution.status;
  if (status === "pending") return <Centered icon={<Clock className="w-10 h-10 text-amber-500" />} title="Approval pending" body={`${context.institution.name} is awaiting review by the PhyNetix team.`} action={<Button variant="outline" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>} />;
  if (status === "rejected") return <Centered icon={<XCircle className="w-10 h-10 text-destructive" />} title="Registration rejected" body={context.institution.rejection_reason || "Your institute registration was not approved."} action={<Button variant="outline" onClick={() => navigate("/dashboard")}>Back to dashboard</Button>} />;
  if (!isInstituteStaff) return <Centered icon={<ShieldAlert className="w-10 h-10 text-destructive" />} title="Staff access required" body="This account is enrolled as a student, not institute staff." action={<Button variant="outline" onClick={() => navigate("/dashboard")}>Student dashboard</Button>} />;

  const path = location.pathname.replace(/\/$/, "") || "/institute";
  const required = REQUIRED[path];
  if ((path === "/institute/staff" || path === "/institute/settings" || path === "/institute/audit") && !isInstituteAdmin) {
    return <Centered icon={<ShieldAlert className="w-10 h-10 text-destructive" />} title="Institute admin only" body="Only the institute owner or administrator can open this section." action={<Button variant="outline" onClick={() => navigate("/institute")}>Back to institute</Button>} />;
  }
  if (required && !can(required)) return <Centered icon={<ShieldAlert className="w-10 h-10 text-destructive" />} title="Permission required" body={`Your institute role does not include ${required} access.`} action={<Button variant="outline" onClick={() => navigate("/institute")}>Back to institute</Button>} />;
  return <InstituteLayout>{children}</InstituteLayout>;
}

function Centered({ icon, title, body, action }: { icon: ReactNode; title: string; body: string; action?: ReactNode }) {
  return <div className="min-h-screen flex items-center justify-center p-6 bg-background"><Card className="max-w-md w-full"><CardContent className="py-10 text-center space-y-4">
    <div className="flex justify-center">{icon}</div><h1 className="text-xl font-semibold">{title}</h1><p className="text-sm text-muted-foreground">{body}</p>{action}
  </CardContent></Card></div>;
}
