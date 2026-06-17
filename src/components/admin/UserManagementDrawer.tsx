import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  User, Mail, Phone, Calendar, MapPin, Shield, Ban, Key, Send, Trash2,
  GraduationCap, BookOpenCheck, Activity, Copy, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole, roleLabels, roleBadgeColors } from "@/lib/permissions";

export interface DrawerProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  target_exam: string | null;
  created_at: string;
  roll_number: string | null;
  phone: string | null;
  date_of_birth: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  is_banned: boolean | null;
  banned_until: string | null;
  banned_reason: string | null;
}

interface Props {
  user: DrawerProfile | null;
  userRole: AppRole;
  userEmail: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

const ALL_ROLES: AppRole[] = [
  "admin", "head", "manager", "academic_admin", "finance_admin",
  "operations_admin", "marketing_admin", "test_manager", "data_manager",
  "teacher", "student",
];

export default function UserManagementDrawer({ user, userRole, userEmail, open, onOpenChange, onUpdate }: Props) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("7");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [role, setRole] = useState<AppRole>(userRole);
  const [enrollments, setEnrollments] = useState<any[]>([]);
  const [attempts, setAttempts] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(false);

  useEffect(() => { setRole(userRole); }, [userRole, user?.id]);

  useEffect(() => {
    if (!open || !user) return;
    let cancel = false;
    (async () => {
      setLoadingActivity(true);
      const [enrRes, attRes] = await Promise.all([
        supabase.from("batch_enrollments")
          .select("id, status, enrolled_at, expires_at, batch:batches(id, name)")
          .eq("user_id", user.id)
          .order("enrolled_at", { ascending: false }),
        supabase.from("test_attempts")
          .select("id, started_at, completed_at, score, test:tests(id, name)")
          .eq("user_id", user.id)
          .order("started_at", { ascending: false })
          .limit(50),
      ]);
      if (cancel) return;
      setEnrollments((enrRes.data as any) || []);
      setAttempts((attRes.data as any) || []);
      setLoadingActivity(false);
    })();
    return () => { cancel = true; };
  }, [open, user?.id]);

  if (!user) return null;

  const copy = (v?: string | null, label = "Copied") => {
    if (!v) return;
    navigator.clipboard.writeText(v);
    toast({ title: label });
  };

  const updateRole = async () => {
    setBusy(true);
    const { error } = await supabase.from("user_roles").update({ role }).eq("user_id", user.id);
    setBusy(false);
    if (error) return toast({ title: "Failed", description: error.message, variant: "destructive" });
    toast({ title: `Role set to ${roleLabels[role]}` });
    onUpdate();
  };

  const resetPassword = async () => {
    if (newPassword.length < 6) return toast({ title: "Min 6 characters", variant: "destructive" });
    setBusy(true);
    const res = await supabase.functions.invoke("admin-reset-password", { body: { userId: user.id, newPassword } });
    setBusy(false);
    if (res.error) return toast({ title: "Failed", description: res.error.message, variant: "destructive" });
    toast({ title: "Password reset" });
    setNewPassword("");
  };

  const banUser = async () => {
    setBusy(true);
    const until = banDuration === "0" ? null : new Date(Date.now() + parseInt(banDuration) * 86400000).toISOString();
    const { error } = await supabase.from("profiles")
      .update({ is_banned: true, banned_until: until, banned_reason: banReason || null })
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: banDuration === "0" ? "Banned permanently" : `Banned for ${banDuration} days` });
    onUpdate();
  };

  const unbanUser = async () => {
    setBusy(true);
    const { error } = await supabase.from("profiles")
      .update({ is_banned: false, banned_until: null, banned_reason: null })
      .eq("id", user.id);
    setBusy(false);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: "Unbanned" });
    onUpdate();
  };

  const sendEmail = async () => {
    if (!emailSubject || !emailMessage) return toast({ title: "Subject & message required", variant: "destructive" });
    if (!userEmail) return toast({ title: "Email unavailable", variant: "destructive" });
    setBusy(true);
    const res = await supabase.functions.invoke("send-notification", {
      body: { userEmail, subject: emailSubject, message: emailMessage, userName: user.full_name },
    });
    setBusy(false);
    if (res.error) return toast({ title: res.error.message, variant: "destructive" });
    toast({ title: "Email sent" });
    setEmailSubject(""); setEmailMessage("");
  };

  const deleteUser = async () => {
    setBusy(true);
    const res = await supabase.functions.invoke("delete-user", { body: { userId: user.id } });
    setBusy(false);
    if (res.error) return toast({ title: res.error.message, variant: "destructive" });
    toast({ title: "User deleted" });
    onOpenChange(false);
    onUpdate();
  };

  const completed = attempts.filter(a => a.completed_at).length;
  const avgScore = (() => {
    const s = attempts.filter(a => a.completed_at && a.score != null).map(a => a.score!);
    return s.length ? (s.reduce((x, y) => x + y, 0) / s.length).toFixed(1) : "—";
  })();
  const lastActive = attempts[0]?.started_at;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-2xl p-0 flex flex-col">
        <SheetHeader className="p-6 pb-4 border-b">
          <SheetTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-fuchsia-600 flex items-center justify-center text-lg font-semibold text-white">
              {user.full_name?.charAt(0) || "U"}
            </div>
            <div className="text-left flex-1 min-w-0">
              <div className="font-semibold truncate">{user.full_name || "Unknown User"}</div>
              <div className="flex items-center gap-2 text-xs text-muted-foreground font-normal mt-0.5">
                <Badge variant="outline" className={roleBadgeColors[userRole]}>{roleLabels[userRole]}</Badge>
                {user.is_banned && <Badge variant="destructive" className="gap-1"><Ban className="w-3 h-3" />Banned</Badge>}
                <span className="font-mono">{user.roll_number || "—"}</span>
              </div>
            </div>
          </SheetTitle>
        </SheetHeader>

        <Tabs defaultValue="profile" className="flex-1 flex flex-col overflow-hidden">
          <div className="px-6 pt-3">
            <TabsList className="grid grid-cols-6 w-full">
              <TabsTrigger value="profile">Profile</TabsTrigger>
              <TabsTrigger value="roles">Roles</TabsTrigger>
              <TabsTrigger value="enrollments">Batches</TabsTrigger>
              <TabsTrigger value="attempts">Attempts</TabsTrigger>
              <TabsTrigger value="notify">Notify</TabsTrigger>
              <TabsTrigger value="danger" className="text-destructive">Danger</TabsTrigger>
            </TabsList>
          </div>

          <ScrollArea className="flex-1">
            <div className="p-6">
              <TabsContent value="profile" className="space-y-4 mt-0">
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Tests Taken</div><div className="text-xl font-bold">{completed}</div></div>
                  <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Avg Score</div><div className="text-xl font-bold">{avgScore}</div></div>
                  <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Last Active</div><div className="text-sm font-medium">{lastActive ? new Date(lastActive).toLocaleDateString() : "Never"}</div></div>
                </div>
                <Field icon={User} label="Full Name" value={user.full_name} />
                <Field icon={Mail} label="Email" value={userEmail} onCopy={() => copy(userEmail, "Email copied")} />
                <div className="grid grid-cols-2 gap-3">
                  <Field icon={Phone} label="Phone" value={user.phone} onCopy={() => copy(user.phone, "Phone copied")} />
                  <Field icon={Calendar} label="Date of Birth" value={user.date_of_birth} />
                  <Field icon={Shield} label="Roll Number" value={user.roll_number} onCopy={() => copy(user.roll_number, "Roll No copied")} />
                  <Field icon={GraduationCap} label="Target Exam" value={user.target_exam} />
                </div>
                <Field icon={MapPin} label="Address" value={[user.address, user.city, user.state].filter(Boolean).join(", ") || null} />
                <Field icon={Calendar} label="Joined" value={new Date(user.created_at).toLocaleString()} />
              </TabsContent>

              <TabsContent value="roles" className="space-y-4 mt-0">
                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2"><Shield className="w-4 h-4" />Assign Role</h4>
                  <Select value={role} onValueChange={(v) => setRole(v as AppRole)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {ALL_ROLES.map(r => (
                        <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button onClick={updateRole} disabled={busy || role === userRole}>
                    {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    Update Role
                  </Button>
                  <p className="text-xs text-muted-foreground">Changing role will instantly update this user's access to admin panels and features.</p>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2"><Key className="w-4 h-4" />Reset Password</h4>
                  <div className="flex gap-2">
                    <Input type="password" placeholder="New password (min 6 chars)" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                    <Button onClick={resetPassword} disabled={busy}>Reset</Button>
                  </div>
                </div>

                <div className="rounded-lg border p-4 space-y-3">
                  <h4 className="font-medium flex items-center gap-2"><Ban className="w-4 h-4" />Access</h4>
                  {user.is_banned ? (
                    <div className="space-y-2">
                      <p className="text-sm text-destructive">Currently banned{user.banned_until && ` until ${new Date(user.banned_until).toLocaleDateString()}`}</p>
                      {user.banned_reason && <p className="text-xs text-muted-foreground">Reason: {user.banned_reason}</p>}
                      <Button variant="outline" onClick={unbanUser} disabled={busy}>Unban</Button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <Label className="text-xs">Duration</Label>
                          <Select value={banDuration} onValueChange={setBanDuration}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="1">1 day</SelectItem>
                              <SelectItem value="7">7 days</SelectItem>
                              <SelectItem value="30">30 days</SelectItem>
                              <SelectItem value="90">90 days</SelectItem>
                              <SelectItem value="0">Permanent</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Textarea placeholder="Reason (optional)" value={banReason} onChange={e => setBanReason(e.target.value)} rows={2} />
                      <Button variant="destructive" onClick={banUser} disabled={busy}>
                        <Ban className="w-4 h-4 mr-2" />Ban User
                      </Button>
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="enrollments" className="space-y-2 mt-0">
                {loadingActivity ? <Loader2 className="w-5 h-5 animate-spin mx-auto my-8" /> :
                  enrollments.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No batch enrollments</p> :
                  enrollments.map((e) => (
                    <div key={e.id} className="rounded-lg border p-3 flex items-center justify-between">
                      <div>
                        <div className="font-medium text-sm">{e.batch?.name || "Unknown batch"}</div>
                        <div className="text-xs text-muted-foreground">
                          Enrolled {new Date(e.enrolled_at).toLocaleDateString()}
                          {e.expires_at && ` · Expires ${new Date(e.expires_at).toLocaleDateString()}`}
                        </div>
                      </div>
                      <Badge variant={e.status === "active" ? "default" : "secondary"}>{e.status}</Badge>
                    </div>
                  ))
                }
              </TabsContent>

              <TabsContent value="attempts" className="space-y-2 mt-0">
                {loadingActivity ? <Loader2 className="w-5 h-5 animate-spin mx-auto my-8" /> :
                  attempts.length === 0 ? <p className="text-sm text-muted-foreground text-center py-8">No test attempts</p> :
                  attempts.map((a) => (
                    <div key={a.id} className="rounded-lg border p-3 flex items-center justify-between">
                      <div className="min-w-0">
                        <div className="font-medium text-sm truncate">{a.test?.name || "Test"}</div>
                        <div className="text-xs text-muted-foreground">{new Date(a.started_at).toLocaleString()}</div>
                      </div>
                      <div className="text-right">
                        {a.completed_at ? (
                          <>
                            <div className="text-sm font-bold">{a.score ?? "—"}</div>
                            <Badge variant="outline" className="text-xs">Completed</Badge>
                          </>
                        ) : (
                          <Badge variant="secondary">In progress</Badge>
                        )}
                      </div>
                    </div>
                  ))
                }
              </TabsContent>

              <TabsContent value="notify" className="space-y-3 mt-0">
                <Input placeholder="Subject" value={emailSubject} onChange={e => setEmailSubject(e.target.value)} />
                <Textarea placeholder="Message..." rows={6} value={emailMessage} onChange={e => setEmailMessage(e.target.value)} />
                <Button onClick={sendEmail} disabled={busy || !userEmail}>
                  <Send className="w-4 h-4 mr-2" />Send Email
                </Button>
                {!userEmail && <p className="text-xs text-muted-foreground">Email not available for this user</p>}
              </TabsContent>

              <TabsContent value="danger" className="mt-0">
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <h4 className="font-medium text-destructive mb-2">Permanently delete user</h4>
                  <p className="text-sm text-muted-foreground mb-3">Removes profile, roles, attempts, and credentials. Cannot be undone.</p>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" disabled={busy}><Trash2 className="w-4 h-4 mr-2" />Delete Permanently</Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete {user.full_name || "this user"}?</AlertDialogTitle>
                        <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={deleteUser} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TabsContent>
            </div>
          </ScrollArea>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function Field({ icon: Icon, label, value, onCopy }: { icon: any; label: string; value?: string | null; onCopy?: () => void }) {
  return (
    <div className="space-y-1">
      <Label className="flex items-center gap-2 text-xs text-muted-foreground"><Icon className="w-3.5 h-3.5" />{label}</Label>
      <div className="flex gap-2">
        <Input value={value || "—"} disabled />
        {onCopy && value && <Button variant="outline" size="icon" onClick={onCopy}><Copy className="w-4 h-4" /></Button>}
      </div>
    </div>
  );
}
