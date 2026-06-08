import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import CompleteProfileDialog from "@/components/admin/CompleteProfileDialog";

interface ProfileGuardProps {
  children: React.ReactNode;
}

export default function ProfileGuard({ children }: ProfileGuardProps) {
  const { user } = useAuth();
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [checking, setChecking] = useState(true);
  const [existingName, setExistingName] = useState<string | undefined>();

  useEffect(() => {
    if (user) {
      checkProfileComplete();
    } else {
      setChecking(false);
    }
  }, [user]);

  const checkProfileComplete = async () => {
    try {
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("profile_completed, full_name")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) {
        console.error("Error checking profile:", error);
        setChecking(false);
        return;
      }

      // If profile not completed, show dialog
      if (!profile?.profile_completed) {
        setExistingName(profile?.full_name || user?.user_metadata?.full_name);
        setShowProfileDialog(true);
      }
    } catch (error) {
      console.error("Profile check error:", error);
    } finally {
      setChecking(false);
    }
  };

  const handleProfileComplete = () => {
    setShowProfileDialog(false);
  };

  if (checking) {
    return null; // Or a loading spinner
  }

  return (
    <>
      {children}
      {user && (
        <CompleteProfileDialog
          open={showProfileDialog}
          onComplete={handleProfileComplete}
          userId={user.id}
          existingName={existingName}
          isGoogleUser={user.app_metadata?.provider === 'google'}
        />
      )}
    </>
  );
}