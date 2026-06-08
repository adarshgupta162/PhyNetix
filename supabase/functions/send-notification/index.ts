import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);
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

    const { userEmail, subject, message, userName } = await req.json();

    if (!userEmail || !subject || !message) {
      throw new Error("Missing required fields: userEmail, subject, message");
    }

    function escapeHtml(unsafe: string): string {
      return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    }

    const safeUserName = escapeHtml(userName || 'Student');
    const safeMessage = escapeHtml(message);

    const emailResponse = await resend.emails.send({
      from: "PhyNetix <onboarding@resend.dev>",
      to: [userEmail],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: linear-gradient(135deg, #0f0f1a 0%, #1a1a2e 50%, #16213e 100%); color: #e2e8f0; padding: 40px 20px; min-height: 100vh; }
            .container { max-width: 600px; margin: 0 auto; background: linear-gradient(180deg, rgba(30, 41, 59, 0.95) 0%, rgba(15, 23, 42, 0.98) 100%); border-radius: 24px; overflow: hidden; box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(139, 92, 246, 0.1); }
            .header { background: linear-gradient(135deg, rgba(59, 130, 246, 0.15) 0%, rgba(139, 92, 246, 0.15) 50%, rgba(217, 70, 239, 0.15) 100%); padding: 40px 32px; text-align: center; border-bottom: 1px solid rgba(139, 92, 246, 0.2); }
            .logo { display: inline-flex; align-items: center; gap: 12px; }
            .logo-icon { width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #d946ef 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center; }
            .logo-icon svg { width: 28px; height: 28px; fill: white; }
            .logo-text { font-size: 28px; font-weight: 800; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 50%, #f472b6 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; letter-spacing: -0.5px; }
            .content { padding: 40px 32px; line-height: 1.8; }
            .greeting { font-size: 20px; font-weight: 600; color: #f1f5f9; margin-bottom: 20px; }
            .message { color: #cbd5e1; font-size: 16px; background: rgba(51, 65, 85, 0.5); padding: 24px; border-radius: 16px; border-left: 4px solid #8b5cf6; }
            .cta { display: block; width: fit-content; margin: 32px auto 0; padding: 14px 32px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%); color: white; text-decoration: none; border-radius: 12px; font-weight: 600; font-size: 16px; text-align: center; box-shadow: 0 10px 30px -10px rgba(139, 92, 246, 0.5); }
            .footer { background: rgba(15, 23, 42, 0.8); padding: 32px; text-align: center; border-top: 1px solid rgba(51, 65, 85, 0.5); }
            .footer-logo { font-size: 18px; font-weight: 700; background: linear-gradient(135deg, #60a5fa 0%, #a78bfa 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text; margin-bottom: 12px; }
            .footer-text { color: #64748b; font-size: 13px; line-height: 1.6; }
            .divider { width: 60px; height: 4px; background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #d946ef 100%); border-radius: 2px; margin: 0 auto 24px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">
                <div class="logo-icon">
                  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>
                </div>
                <span class="logo-text">PhyNetix</span>
              </div>
            </div>
            <div class="content">
              <div class="divider"></div>
              <p class="greeting">Hello ${safeUserName},</p>
              <div class="message">${safeMessage}</div>
              <a href="https://phynetix.com" class="cta">Visit PhyNetix →</a>
            </div>
            <div class="footer">
              <div class="footer-logo">PhyNetix</div>
              <p class="footer-text">
                AI-Powered Learning Platform<br>
                © ${new Date().getFullYear()} PhyNetix. All rights reserved.
              </p>
            </div>
          </div>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailId: emailResponse.data?.id }),
      { headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
