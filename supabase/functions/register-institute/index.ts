import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...corsHeaders },
  });

function slugify(s: string) {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 48);
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } },
    );

    const body = await req.json().catch(() => null);
    if (!body) return json({ error: "Invalid request body" }, 400);

    const {
      instituteName, adminFullName, adminEmail, phone, city, state, country,
      website, password, description, logoUrl, acceptedTerms, autoApprove,
    } = body as Record<string, string | boolean>;

    // Only a platform admin may create an already-approved institute manually.
    let isPlatformAdmin = false;
    const authHeader = req.headers.get("Authorization") ?? "";
    if (authHeader.startsWith("Bearer ")) {
      const token = authHeader.slice(7);
      const { data: userData } = await admin.auth.getUser(token);
      if (userData?.user) {
        const { data: roleOk } = await admin.rpc("has_role", { _user_id: userData.user.id, _role: "admin" });
        isPlatformAdmin = roleOk === true;
      }
    }
    const approveNow = autoApprove === true && isPlatformAdmin;
    if (autoApprove === true && !isPlatformAdmin) {
      return json({ error: "Only platform administrators can create approved institutes" }, 403);
    }

    const errors: Record<string, string> = {};
    const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");

    if (str(instituteName).length < 3) errors.instituteName = "Institute name must be at least 3 characters";
    if (str(adminFullName).length < 3) errors.adminFullName = "Admin name must be at least 3 characters";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str(adminEmail))) errors.adminEmail = "Enter a valid email";
    if (!/^[0-9+\-\s()]{7,20}$/.test(str(phone))) errors.phone = "Enter a valid phone number";
    if (!str(city)) errors.city = "City is required";
    if (!str(state)) errors.state = "State is required";
    if (!str(country)) errors.country = "Country is required";
    if (str(password).length < 8) errors.password = "Password must be at least 8 characters";
    if (str(website) && !/^https?:\/\/.+/.test(str(website))) errors.website = "Website must start with http(s)://";
    if (acceptedTerms !== true && !isPlatformAdmin) errors.acceptedTerms = "You must accept the terms";
    if (Object.keys(errors).length) return json({ error: "Validation failed", fields: errors }, 400);

    const email = str(adminEmail).toLowerCase();

    // Find existing auth user with this email (never create a duplicate account)
    let userId: string | null = null;
    for (let page = 1; page <= 20 && !userId; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) break;
      const hit = data.users.find((u) => (u.email ?? "").toLowerCase() === email);
      if (hit) userId = hit.id;
      if (data.users.length < 200) break;
    }

    let createdUser = false;
    if (!userId) {
      const { data: created, error: createErr } = await admin.auth.admin.createUser({
        email,
        password: str(password),
        email_confirm: true,
        user_metadata: { full_name: str(adminFullName) },
      });
      if (createErr || !created.user) return json({ error: createErr?.message ?? "Could not create admin account" }, 400);
      userId = created.user.id;
      createdUser = true;
    }

    // Block a second pending/active registration by the same admin
    const { data: existingMembership } = await admin
      .from("institution_members")
      .select("institution_id, institutions:institution_id(status,name)")
      .eq("user_id", userId)
      .eq("role", "owner")
      .maybeSingle();

    if (existingMembership) {
      const st = (existingMembership as any).institutions?.status;
      if (st === "pending" || st === "active") {
        return json({
          error: `You already have an institute (${(existingMembership as any).institutions?.name}) with status "${st}".`,
        }, 409);
      }
    }

    // Unique slug
    let slug = slugify(str(instituteName)) || "institute";
    for (let i = 0; i < 25; i++) {
      const { data: clash } = await admin.from("institutions").select("id").eq("slug", slug).maybeSingle();
      if (!clash) break;
      slug = `${slugify(str(instituteName))}-${Math.floor(Math.random() * 9000 + 1000)}`;
    }

    const { data: institution, error: instErr } = await admin
      .from("institutions")
      .insert({
        name: str(instituteName),
        slug,
        description: str(description) || null,
        logo_url: str(logoUrl) || null,
        contact_email: email,
        contact_phone: str(phone),
        city: str(city),
        state: str(state),
        country: str(country),
        website: str(website) || null,
        status: approveNow ? "active" : "pending",
        is_active: approveNow,
        approved_at: approveNow ? new Date().toISOString() : null,
        owner_user_id: userId,
        created_by: userId,
      })
      .select()
      .single();

    if (instErr) {
      if (createdUser) await admin.auth.admin.deleteUser(userId!);
      return json({ error: instErr.message }, 400);
    }

    const { error: memberErr } = await admin.from("institution_members").insert({
      institution_id: institution.id,
      user_id: userId,
      role: "owner",
      is_primary: true,
      status: "active",
      full_name: str(adminFullName),
      email,
    });

    if (memberErr) {
      await admin.from("institutions").delete().eq("id", institution.id);
      if (createdUser) await admin.auth.admin.deleteUser(userId!);
      return json({ error: memberErr.message }, 400);
    }

    await admin.from("audit_logs").insert({
      user_id: userId,
      action: "institute_registered",
      entity_type: "institution",
      entity_id: institution.id,
      institution_id: institution.id,
      new_value: { name: institution.name, slug, city: str(city), state: str(state) },
    });

    return json({
      success: true,
      institutionId: institution.id,
      status: approveNow ? "active" : "pending",
      accountCreated: createdUser,
      message: approveNow
        ? "Institute created and activated."
        : createdUser
          ? "Institute registered. Sign in with your new admin account once approved."
          : "Institute registered against your existing PhyNetix account.",
    });
  } catch (e) {
    console.error("register-institute error", e);
    return json({ error: e instanceof Error ? e.message : "Unexpected error" }, 500);
  }
});
