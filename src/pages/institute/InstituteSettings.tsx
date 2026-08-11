import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useInstitute } from "@/hooks/useInstitute";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Settings, Loader2, Copy } from "lucide-react";

export default function InstituteSettings() {
  const qc = useQueryClient();
  const { institution, isInstituteAdmin, isActive } = useInstitute();
  const [form, setForm] = useState<any>({});

  useEffect(() => {
    if (institution) {
      setForm({
        name: institution.name ?? "",
        logo_url: institution.logo_url ?? "",
        description: institution.description ?? "",
        contact_email: institution.contact_email ?? "",
        contact_phone: institution.contact_phone ?? "",
        city: institution.city ?? "",
        state: institution.state ?? "",
        website: institution.website ?? "",
        primary_color: institution.primary_color ?? "",
        welcome_message: institution.welcome_message ?? "",
      });
    }
  }, [institution]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("institutions").update(form).eq("id", institution!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Settings saved");
      qc.invalidateQueries({ queryKey: ["institute-context"] });
    },
    onError: (e: any) => toast.error(e.message),
  });

  if (!institution) return null;

  return (
    <div className="p-6 space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Settings className="w-6 h-6" /> Institute settings</h1>
        <p className="text-sm text-muted-foreground">Branding and contact details shown to your students.</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            Workspace
            <Badge variant="secondary" className="capitalize">{institution.status}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-muted/30">
            <span className="text-xs text-muted-foreground">Institute code</span>
            <code className="font-mono text-sm">{institution.code}</code>
            <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => { navigator.clipboard.writeText(institution.code); toast.success("Copied"); }}>
              <Copy className="w-3 h-3" />
            </Button>
          </div>
          <span className="text-xs text-muted-foreground">/{institution.slug}</span>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Profile & branding</CardTitle></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><Label>Institute name</Label><Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Logo URL</Label><Input value={form.logo_url ?? ""} onChange={(e) => setForm({ ...form, logo_url: e.target.value })} /></div>
          <div><Label>Contact email</Label><Input value={form.contact_email ?? ""} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} /></div>
          <div><Label>Contact phone</Label><Input value={form.contact_phone ?? ""} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} /></div>
          <div><Label>City</Label><Input value={form.city ?? ""} onChange={(e) => setForm({ ...form, city: e.target.value })} /></div>
          <div><Label>State</Label><Input value={form.state ?? ""} onChange={(e) => setForm({ ...form, state: e.target.value })} /></div>
          <div><Label>Website</Label><Input value={form.website ?? ""} onChange={(e) => setForm({ ...form, website: e.target.value })} /></div>
          <div><Label>Brand colour (HSL or hex)</Label><Input value={form.primary_color ?? ""} onChange={(e) => setForm({ ...form, primary_color: e.target.value })} placeholder="#0ea5e9" /></div>
          <div className="sm:col-span-2"><Label>About</Label><Textarea rows={3} value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div className="sm:col-span-2"><Label>Welcome message for students</Label><Textarea rows={2} value={form.welcome_message ?? ""} onChange={(e) => setForm({ ...form, welcome_message: e.target.value })} /></div>
          <div className="sm:col-span-2">
            <Button onClick={() => save.mutate()} disabled={save.isPending || !isInstituteAdmin || !isActive}>
              {save.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
