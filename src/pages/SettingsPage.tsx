import { useEffect, useState } from "react";
import { Bell, LockKeyhole, LogOut, Mail, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import StudentWorkspaceLayout from "@/components/layout/StudentWorkspaceLayout";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

type Preferences = { emailUpdates: boolean; testReminders: boolean; weeklySummary: boolean };
const defaults: Preferences = { emailUpdates: true, testReminders: true, weeklySummary: false };

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [preferences, setPreferences] = useState<Preferences>(defaults);
  const [signingOut, setSigningOut] = useState(false);

  useEffect(() => {
    if (!user) return;
    try {
      const saved = window.localStorage.getItem(`phynetix:preferences:${user.id}`);
      if (saved) setPreferences({ ...defaults, ...JSON.parse(saved) });
    } catch {
      toast.error("Couldn't load saved preferences on this device.");
    }
  }, [user]);

  const updatePreference = (key: keyof Preferences, value: boolean) => {
    const next = { ...preferences, [key]: value };
    setPreferences(next);
    if (!user) return;
    try {
      window.localStorage.setItem(`phynetix:preferences:${user.id}`, JSON.stringify(next));
      toast.success("Preference saved on this device");
    } catch {
      toast.error("Could not save this preference.");
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      navigate("/auth", { replace: true });
    } catch {
      toast.error("Sign out failed. Please try again.");
      setSigningOut(false);
    }
  };

  return (
    <StudentWorkspaceLayout>
      <div className="mx-auto max-w-5xl space-y-7">
        <header>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-[#8BBAAF]">Preferences</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Settings</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-400">Manage your account, reminders and sign-in preferences.</p>
        </header>

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111819]">
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
            <UserRound size={18} className="text-[#A4C9C0]" />
            <div><h2 className="text-sm font-semibold text-slate-100">Account</h2><p className="mt-0.5 text-xs text-slate-500">Your PhyNetix sign-in identity</p></div>
          </div>
          <div className="divide-y divide-white/[0.06]">
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div className="flex items-center gap-3"><Mail size={16} className="text-slate-500" /><div><Label className="text-xs text-slate-400">Email address</Label><p className="mt-1 text-sm text-slate-100">{user?.email || "Not available"}</p></div></div>
              {user?.email_confirmed_at ? <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/20 bg-emerald-400/[0.07] px-2.5 py-1 text-[11px] text-emerald-300"><ShieldCheck size={13} />Verified</span> : <span className="rounded-full border border-amber-400/20 bg-amber-400/[0.07] px-2.5 py-1 text-[11px] text-amber-300">Not verified</span>}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div><p className="text-sm font-medium text-slate-100">Password</p><p className="mt-1 text-xs text-slate-500">Reset your password using your registered email.</p></div>
              <Button variant="outline" onClick={() => navigate("/auth?mode=reset")} className="border-white/10 bg-white/[0.03] text-slate-200 hover:bg-white/[0.07]"><LockKeyhole size={14} className="mr-2" />Reset password</Button>
            </div>
          </div>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111819]">
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
            <Bell size={18} className="text-[#A4C9C0]" />
            <div><h2 className="text-sm font-semibold text-slate-100">Notifications</h2><p className="mt-0.5 text-xs text-slate-500">Choose which reminders you want to keep enabled.</p></div>
          </div>
          <div className="divide-y divide-white/[0.06]">
            {([
              ["emailUpdates", "Important updates", "Product and account-related updates."],
              ["testReminders", "Test reminders", "Reminders for scheduled tests and practice."],
              ["weeklySummary", "Weekly study summary", "A weekly overview of your practice activity."],
            ] as const).map(([key, title, description]) => (
              <div key={key} className="flex items-center justify-between gap-4 px-5 py-4">
                <div><p className="text-sm font-medium text-slate-100">{title}</p><p className="mt-1 text-xs text-slate-500">{description}</p></div>
                <Switch checked={preferences[key]} onCheckedChange={(checked) => updatePreference(key, checked)} aria-label={title} />
              </div>
            ))}
          </div>
          <p className="px-5 pb-4 text-[11px] text-slate-500">These preferences are currently saved in this browser on this device. They do not yet control email delivery.</p>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/[0.08] bg-[#111819]">
          <div className="flex items-center gap-3 border-b border-white/[0.07] px-5 py-4">
            <SlidersHorizontal size={18} className="text-[#A4C9C0]" />
            <div><h2 className="text-sm font-semibold text-slate-100">Appearance</h2><p className="mt-0.5 text-xs text-slate-500">Interface display preferences</p></div>
          </div>
          <div className="px-5 py-4"><p className="text-sm font-medium text-slate-100">Dark workspace</p><p className="mt-1 text-xs text-slate-500">PhyNetix currently uses its dark student workspace. Theme switching is not enabled yet.</p></div>
        </section>

        <section className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-rose-400/15 bg-rose-400/[0.035] px-5 py-4">
          <div><h2 className="text-sm font-semibold text-slate-100">Sign out</h2><p className="mt-1 text-xs text-slate-500">End your current session on this device.</p></div>
          <Button variant="outline" disabled={signingOut} onClick={handleSignOut} className="border-rose-400/25 bg-transparent text-rose-300 hover:bg-rose-400/10"><LogOut size={14} className="mr-2" />{signingOut ? "Signing out…" : "Sign out"}</Button>
        </section>
      </div>
    </StudentWorkspaceLayout>
  );
}
