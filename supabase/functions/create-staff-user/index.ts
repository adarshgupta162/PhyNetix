import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    // Verify the requester is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error("Unauthorized");
    }

    // Check if requester is admin
    const { data: roleData } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      throw new Error("Unauthorized - Admin access required");
    }

    const { email, password, role, fullName, departmentId } = await req.json();

    if (!email || !password || !role) {
      throw new Error("Missing required fields: email, password, role");
    }

    // Validate role
    const validRoles = ['admin', 'head', 'manager', 'teacher', 'data_manager', 'test_manager', 'student'];
    if (!validRoles.includes(role)) {
      throw new Error(`Invalid role. Must be one of: ${validRoles.join(', ')}`);
    }

    // Validate password length
    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    console.log("Creating user:", email, "with role:", role);

    // Create the user
    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || email.split('@')[0]
      }
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    if (!newUser.user) {
      throw new Error("User creation failed");
    }

    // Create profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        full_name: fullName || email.split('@')[0]
      });

    if (profileError) {
      console.error("Profile creation error:", profileError);
    }

    // Assign role
    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .insert({
        user_id: newUser.user.id,
        role: role,
        department_id: departmentId || null
      });

    if (roleError) {
      console.error("Role assignment error:", roleError);
      // Rollback - delete the user
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to assign role: ${roleError.message}`);
    }

    // Log the action
    await supabaseAdmin
      .from("audit_logs")
      .insert({
        user_id: user.id,
        action: 'create_user',
        entity_type: 'user',
        entity_id: newUser.user.id,
        new_value: { email, role, departmentId }
      });

    console.log("User created successfully:", newUser.user.id);

    return new Response(
      JSON.stringify({ 
        success: true, 
        userId: newUser.user.id,
        message: `User ${email} created with role ${role}`
      }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in create-staff-user:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
