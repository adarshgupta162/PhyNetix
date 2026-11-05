import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { INDIAN_STATES } from "@/lib/indiaGeo";

interface FormState {
  instituteName: string;
  logoUrl: string;
  adminFullName: string;
  adminEmail: string;
  phone: string;
  city: string;
  state: string;
  country: string;
  website: string;
  description: string;
  acceptedTerms: boolean;
}

const initial: FormState = {
  instituteName: "", logoUrl: "", adminFullName: "", adminEmail: "", phone: "",
  city: "", state: "", country: "India", website: "", description: "", acceptedTerms: false,
};

export default function RegisterInstitutePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    if (user) setForm((f) => ({ ...f, adminEmail: user.email ?? "", adminFullName: f.adminFullName || user.user_metadata?.full_name || "" }));
  }, [user]);

  const set = (k: keyof FormState, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const validate = () => {
    const e: Record<string, string> = {};
    if (form.instituteName.trim().length < 3) e.instituteName = "Institute name must be at least 3 characters";
    if (form.adminFullName.trim().length < 3) e.adminFullName = "Enter the admin's full name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.adminEmail.trim())) e.adminEmail = "Enter a valid email";
    if (!/^[0-9+\-\s()]{7,20}$/.test(form.phone.trim())) e.phone = "Enter a valid phone number";
    if (!form.city.trim()) e.city = "City is required";
    if (!form.state.trim()) e.state = "State is required";
    if (!form.country.trim()) e.country = "Country is required";
    if (form.website.trim() && !/^https?:\/\/.+/.test(form.website.trim())) e.website = "Must start with http:// or https://";
    if (form.logoUrl.trim() && !/^https?:\/\/.+/.test(form.logoUrl.trim())) e.logoUrl = "Must be a valid image URL";
    if (!form.acceptedTerms) e.acceptedTerms = "You must accept the terms";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const submit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke("register-institute", {
        body: {
          instituteName: form.instituteName,
          logoUrl: form.logoUrl,
          adminFullName: form.adminFullName,
          adminEmail: form.adminEmail,
          phone: form.phone,
          city: form.city,
          state: form.state,
          country: form.country,
          website: form.website,
          description: form.description,
          acceptedTerms: form.acceptedTerms,
        },
      });
      const payload: any = data;
      if (error || payload?.error) {
        if (payload?.fields) setErrors(payload.fields);
        throw new Error(payload?.error || error?.message || "Registration failed");
      }
      setDone(payload?.message ?? "Registration submitted");
      toast.success("Institute registration submitted");
    } catch (err: any) {
      toast.error(err.message ?? "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) {
    return <main className="min-h-screen flex items-center justify-center p-6 bg-background"><Card className="max-w-md w-full"><CardContent className="py-10 text-center space-y-4"><Building2 className="w-10 h-10 mx-auto text-primary" /><h1 className="text-xl font-semibold">Sign in before registering</h1><p className="text-sm text-muted-foreground">Institute ownership is attached to your verified PhyNetix account. This prevents someone from registering an institute using another person's email.</p><Button onClick={() => navigate("/auth")}>Sign in to continue</Button></CardContent></Card></main>;
  }

  if (done) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-lg w-full">
          <CardContent className="py-12 text-center space-y-4">
            <CheckCircle2 className="w-12 h-12 mx-auto text-primary" />
            <h1 className="text-2xl font-bold">Pending approval</h1>
            <p className="text-muted-foreground">{done}</p>
            <p className="text-sm text-muted-foreground">
              A PhyNetix administrator will review your registration. Once approved, sign in and open your
              institute workspace at <code className="font-mono">/institute</code>.
            </p>
            <Button onClick={() => navigate("/auth")}>Go to sign in</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Register Your Institute</h1>
            <p className="text-muted-foreground text-sm">
              Run your coaching institute on PhyNetix with your own isolated workspace.
            </p>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Institute details</CardTitle>
            <CardDescription>All registrations are reviewed before activation.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={submit} className="space-y-5" noValidate>
              <div className="grid md:grid-cols-2 gap-4">
                <Field label="Institute name" error={errors.instituteName}>
                  <Input value={form.instituteName} onChange={(e) => set("instituteName", e.target.value)} placeholder="ABC Institute" />
                </Field>
                <Field label="Institute logo URL" error={errors.logoUrl} optional>
                  <Input value={form.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…/logo.png" />
                </Field>
                <Field label="Admin full name" error={errors.adminFullName}>
                  <Input value={form.adminFullName} onChange={(e) => set("adminFullName", e.target.value)} />
                </Field>
                <Field label="Signed-in admin email" error={errors.adminEmail}>
                  <Input type="email" value={form.adminEmail} disabled />
                </Field>
                <Field label="Phone number" error={errors.phone}>
                  <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+91 98765 43210" />
                </Field>
                <Field label="City" error={errors.city}>
                  <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
                </Field>
                <Field label="State" error={errors.state}>
                  <select
                    className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
                    value={form.state}
                    onChange={(e) => set("state", e.target.value)}
                  >
                    <option value="">Select state</option>
                    {INDIAN_STATES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </Field>
                <Field label="Country" error={errors.country}>
                  <Input value={form.country} onChange={(e) => set("country", e.target.value)} />
                </Field>
                <Field label="Website" error={errors.website} optional>
                  <Input value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="https://abcinstitute.com" />
                </Field>
              </div>

              <Field label="Institute description" error={errors.description} optional>
                <Textarea rows={4} value={form.description} onChange={(e) => set("description", e.target.value)}
                  placeholder="Tell us about your institute, courses and student strength." />
              </Field>

              <div className="flex items-start gap-2">
                <Checkbox id="terms" checked={form.acceptedTerms} onCheckedChange={(v) => set("acceptedTerms", !!v)} />
                <Label htmlFor="terms" className="text-sm font-normal leading-snug">
                  I accept the <Link to="/terms" className="text-primary underline">Terms &amp; Conditions</Link> and{" "}
                  <Link to="/privacy" className="text-primary underline">Privacy Policy</Link>.
                </Label>
              </div>
              {errors.acceptedTerms && <p className="text-xs text-destructive">{errors.acceptedTerms}</p>}

              <div className="flex gap-2">
                <Button type="submit" disabled={submitting}>
                  {submitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  Submit registration
                </Button>
                <Button type="button" variant="outline" onClick={() => navigate("/")}>Cancel</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function Field({ label, error, optional, children }: { label: string; error?: string; optional?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>
        {label}
        {optional && <span className="text-muted-foreground font-normal text-xs"> (optional)</span>}
      </Label>
      {children}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
