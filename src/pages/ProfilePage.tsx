import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { CalendarDays, Camera, Check, Clock3, GraduationCap, Mail, Pencil, Phone, Save, Target, Trophy, UserRound, X, BookOpen, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import StudentWorkspaceLayout from "@/components/layout/StudentWorkspaceLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type Profile = {
  full_name: string | null;
  avatar_url: string | null;
  target_exam: string | null;
  roll_number: string | null;
  phone: string | null;
  academic_status: string | null;
  state: string | null;
  city: string | null;
};
type RecentAttempt = { id: string; score: number | null; total_marks: number | null; completed_at: string; test: { name: string } | null };
type Stats = { testsCompleted: number; questionsAttempted: number; scorePercent: number; studyMinutes: number };

const panel = "rounded-2xl border border-white/[0.08] bg-[#0B1725]/90 shadow-[0_16px_48px_rgba(0,0,0,0.18)]";
const fieldLabel = "mb-1.5 block text-[11px] font-medium uppercase tracking-wider text-slate-500";

export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [recent, setRecent] = useState<RecentAttempt[]>([]);
  const [stats, setStats] = useState<Stats>({ testsCompleted: 0, questionsAttempted: 0, scorePercent: 0, studyMinutes: 0 });
  const [edit, setEdit] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ full_name: "", target_exam: "", phone: "", academic_status: "", state: "", city: "" });

  useEffect(() => {
    if (!user) return;
    let active = true;
    const load = async () => {
      setLoading(true);
      try {
        const [{ data: p, error: profileError }, { data: attempts, error: attemptsError }] = await Promise.all([
          supabase.from("profiles").select("full_name, avatar_url, target_exam, roll_number, phone, academic_status, state, city").eq("id", user.id).maybeSingle(),
          supabase.from("test_attempts").select("id, score, total_marks, time_taken_seconds, answers, completed_at, awaiting_result, test:tests(name)")
            .eq("user_id", user.id).not("completed_at", "is", null).order("completed_at", { ascending: false }),
        ]);
        if (profileError) throw profileError;
        if (attemptsError) throw attemptsError;
        if (!active) return;
        const safeProfile = p as Profile | null;
        setProfile(safeProfile);
        setForm({
          full_name: safeProfile?.full_name || "",
          target_exam: safeProfile?.target_exam || "",
          phone: safeProfile?.phone || "",
          academic_status: safeProfile?.academic_status || "",
          state: safeProfile?.state || "",
          city: safeProfile?.city || "",
        });
        const valid = (attempts || []).filter((a: any) => a.completed_at && a.awaiting_result !== true && a.score !== null && a.total_marks !== null);
        const totalScore = valid.reduce((sum: number, a: any) => sum + Number(a.score || 0), 0);
        const totalMarks = valid.reduce((sum: number, a: any) => sum + Number(a.total_marks || 0), 0);
        const questionsAttempted = valid.reduce((sum: number, a: any) => {
          const answers = a.answers && typeof a.answers === "object" ? Object.values(a.answers) : [];
          const hasAnswer = (answer: any) => Array.isArray(answer)
            ? answer.length > 0
            : answer && typeof answer === "object"
              ? Object.keys(answer).length > 0
              : answer !== null && answer !== undefined && answer !== "";
          return sum + answers.filter(hasAnswer).length;
        }, 0);
        setStats({
          testsCompleted: valid.length,
          questionsAttempted,
          scorePercent: totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0,
          studyMinutes: Math.round(valid.reduce((sum: number, a: any) => sum + Number(a.time_taken_seconds || 0), 0) / 60),
        });
        setRecent(valid.slice(0, 5) as RecentAttempt[]);
      } catch (error) {
        console.error(error);
        toast({ title: "Couldn't load profile", description: "Please refresh and try again.", variant: "destructive" });
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => { active = false; };
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase.from("profiles").update({
      full_name: form.full_name.trim(),
      target_exam: form.target_exam.trim() || null,
      phone: form.phone.trim() || null,
      academic_status: form.academic_status.trim() || null,
      state: form.state.trim() || null,
      city: form.city.trim() || null,
    }).eq("id", user.id).select("full_name, avatar_url, target_exam, roll_number, phone, academic_status, state, city").maybeSingle();
    setSaving(false);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    if (data) setProfile(data as Profile);
    setEdit(false);
    toast({ title: "Profile updated", description: "Your changes have been saved." });
  };

  const uploadPhoto = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/") || file.size > 3 * 1024 * 1024) {
      toast({ title: "Choose an image under 3 MB", variant: "destructive" });
      event.target.value = "";
      return;
    }
    setUploading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("Could not read image"));
        reader.readAsDataURL(file);
      });
      const { error } = await supabase.from("profiles").update({ avatar_url: dataUrl }).eq("id", user.id);
      if (error) throw error;
      setProfile((previous) => previous ? { ...previous, avatar_url: dataUrl } : previous);
      toast({ title: "Profile photo updated" });
    } catch (error: any) {
      toast({ title: "Photo upload failed", description: error?.message || "Try again.", variant: "destructive" });
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  const name = profile?.full_name || user?.email?.split("@")[0] || "Student";
  const initials = name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  const dateJoined = user?.created_at ? new Date(user.created_at).toLocaleDateString("en-IN", { month: "long", year: "numeric" }) : null;

  if (loading) return <StudentWorkspaceLayout><div className="mx-auto max-w-6xl space-y-5"><div className="h-48 animate-pulse rounded-2xl bg-white/[0.04]" /><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[1,2,3,4].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/[0.04]" />)}</div></div></StudentWorkspaceLayout>;

  return <StudentWorkspaceLayout>
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-sky-400">Your workspace</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-white sm:text-3xl">Student Profile</h1><p className="mt-1 text-sm text-slate-500">Your account and academic activity in one place.</p></div>
        {!edit ? <Button onClick={() => setEdit(true)} className="rounded-xl bg-[#167CC0] text-white hover:bg-[#208FD5]"><Pencil size={15} className="mr-2" />Edit profile</Button> : <div className="flex gap-2"><Button variant="outline" onClick={() => { setEdit(false); setForm({ full_name: profile?.full_name || "", target_exam: profile?.target_exam || "", phone: profile?.phone || "", academic_status: profile?.academic_status || "", state: profile?.state || "", city: profile?.city || "" }); }} className="rounded-xl border-white/10 bg-white/[0.03] text-slate-300"><X size={15} className="mr-2" />Cancel</Button><Button onClick={saveProfile} disabled={saving} className="rounded-xl bg-[#167CC0] text-white hover:bg-[#208FD5]"><Save size={15} className="mr-2" />{saving ? "Saving..." : "Save changes"}</Button></div>}
      </div>

      <section className={panel + " relative overflow-hidden p-5 sm:p-7"}>
        <div className="pointer-events-none absolute -right-16 -top-24 h-64 w-64 rounded-full bg-sky-500/[0.08] blur-3xl" />
        <div className="relative flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="relative h-24 w-24 shrink-0">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt={name} className="h-24 w-24 rounded-2xl border border-white/10 object-cover" /> : <div className="grid h-24 w-24 place-items-center rounded-2xl border border-sky-400/20 bg-[#123B5A] text-2xl font-semibold text-sky-100">{initials}</div>}
            <input ref={photoRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />
            <button onClick={() => photoRef.current?.click()} disabled={uploading} aria-label="Change profile photo" className="absolute -bottom-2 -right-2 rounded-xl border border-white/10 bg-[#13263A] p-2 text-sky-300 shadow-lg hover:bg-[#1A3A55]"><Camera size={15} /></button>
          </div>
          <div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h2 className="truncate text-xl font-semibold text-white sm:text-2xl">{name}</h2><span className="rounded-full border border-sky-400/20 bg-sky-400/10 px-2.5 py-1 text-[10px] font-medium text-sky-300">Student</span></div>
            <p className="mt-1 flex items-center gap-2 break-all text-sm text-slate-400"><Mail size={14} />{user?.email}</p>
            <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-slate-500">{profile?.target_exam && <span className="inline-flex items-center gap-1.5"><Target size={13} />{profile.target_exam}</span>}{dateJoined && <span className="inline-flex items-center gap-1.5"><CalendarDays size={13} />Joined {dateJoined}</span>}</div>
          </div>
          <div className="hidden h-16 w-px bg-white/[0.08] sm:block" />
          <div className="min-w-[110px]"><p className="text-[10px] uppercase tracking-wider text-slate-500">Account status</p><p className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-emerald-300"><span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />Active</p></div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[{ label: "Completed tests", value: stats.testsCompleted.toLocaleString(), icon: Trophy, hint: "Evaluated submissions" }, { label: "Questions attempted", value: stats.questionsAttempted.toLocaleString(), icon: BookOpen, hint: "Based on saved answers" }, { label: "Average score", value: stats.scorePercent + "%", icon: Target, hint: "Total marks earned / available" }, { label: "Study time", value: stats.studyMinutes >= 60 ? (stats.studyMinutes / 60).toFixed(1) + "h" : stats.studyMinutes + "m", icon: Clock3, hint: "Recorded test time" }].map((item) => <div key={item.label} className={panel + " p-4 sm:p-5"}><div className="flex items-center justify-between"><span className="text-xs text-slate-400">{item.label}</span><item.icon size={17} className="text-sky-400" /></div><p className="mt-3 text-2xl font-semibold tracking-tight text-white">{item.value}</p><p className="mt-1 text-[10px] text-slate-600">{item.hint}</p></div>)}
      </section>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <section className={panel + " p-5 sm:p-6"}>
          <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-white">Personal information</h3><p className="mt-1 text-xs text-slate-500">Keep your student details up to date.</p></div><UserRound size={18} className="text-slate-500" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={fieldLabel}>Full name</label>{edit ? <Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} className="border-white/10 bg-[#07111D] text-white" /> : <p className="text-sm text-slate-200">{profile?.full_name || "Not provided"}</p>}</div>
            <div><label className={fieldLabel}>Email address</label><p className="break-all text-sm text-slate-400">{user?.email || "—"}</p></div>
            <div><label className={fieldLabel}>Phone number</label>{edit ? <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="border-white/10 bg-[#07111D] text-white" /> : <p className="text-sm text-slate-200">{profile?.phone || "Not provided"}</p>}</div>
            <div><label className={fieldLabel}>Academic status</label>{edit ? <Input value={form.academic_status} onChange={(e) => setForm({ ...form, academic_status: e.target.value })} placeholder="e.g. Class 12 / Dropper" className="border-white/10 bg-[#07111D] text-white" /> : <p className="text-sm text-slate-200">{profile?.academic_status || "Not provided"}</p>}</div>
            <div><label className={fieldLabel}>Target exam</label>{edit ? <Input value={form.target_exam} onChange={(e) => setForm({ ...form, target_exam: e.target.value })} placeholder="e.g. JEE Advanced" className="border-white/10 bg-[#07111D] text-white" /> : <p className="text-sm text-slate-200">{profile?.target_exam || "Not provided"}</p>}</div>
            <div><label className={fieldLabel}>Roll number</label><p className="text-sm text-slate-200">{profile?.roll_number || "Not provided"}</p></div>
            <div><label className={fieldLabel}>City</label>{edit ? <Input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="border-white/10 bg-[#07111D] text-white" /> : <p className="text-sm text-slate-200">{profile?.city || "Not provided"}</p>}</div>
            <div><label className={fieldLabel}>State</label>{edit ? <Input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })} className="border-white/10 bg-[#07111D] text-white" /> : <p className="text-sm text-slate-200">{profile?.state || "Not provided"}</p>}</div>
          </div>
          {edit && <p className="mt-4 text-[10px] text-slate-600">Email and roll number are managed by your account and cannot be edited here.</p>}
        </section>

        <section className={panel + " p-5 sm:p-6"}>
          <div className="mb-5 flex items-center justify-between"><div><h3 className="font-semibold text-white">Recent academic activity</h3><p className="mt-1 text-xs text-slate-500">Your latest evaluated tests.</p></div><GraduationCap size={19} className="text-slate-500" /></div>
          {recent.length === 0 ? <div className="rounded-xl border border-dashed border-white/10 px-4 py-10 text-center"><BookOpen size={22} className="mx-auto text-slate-600" /><p className="mt-3 text-sm text-slate-400">No completed tests yet</p><p className="mt-1 text-xs text-slate-600">Your test history will appear here.</p></div> : <div className="space-y-2">{recent.map((attempt) => {
            const percent = attempt.total_marks && attempt.total_marks > 0 ? Math.round((Number(attempt.score || 0) / attempt.total_marks) * 100) : 0;
            return <div key={attempt.id} className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3"><div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-sky-400/10 text-sky-300"><BookOpen size={16} /></div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-slate-200">{attempt.test?.name || "Completed test"}</p><p className="mt-1 text-[10px] text-slate-500">{new Date(attempt.completed_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</p></div><span className="text-sm font-semibold text-sky-300">{percent}%</span></div>;
          })}</div>}
        </section>
      </div>
      <p className="flex items-center gap-2 pb-2 text-[10px] text-slate-600"><MapPin size={12} />Only information available in your PhyNetix profile is shown. No institution or streak data is fabricated.</p>
    </div>
  </StudentWorkspaceLayout>;
}
