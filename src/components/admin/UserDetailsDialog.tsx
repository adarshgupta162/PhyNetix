import { useState } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  MapPin, 
  Shield, 
  Ban,
  Key,
  Send,
  Trash2
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole, roleLabels } from "@/lib/permissions";

interface Profile {
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

interface UserDetailsDialogProps {
  user: Profile | null;
  userEmail: string | null;
  userRole: AppRole;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: () => void;
}

export default function UserDetailsDialog({
  user,
  userEmail,
  userRole,
  open,
  onOpenChange,
  onUpdate
}: UserDetailsDialogProps) {
  const [newPassword, setNewPassword] = useState("");
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState("7");
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  if (!user) return null;

  const handleResetPassword = async () => {
    if (!newPassword || newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke('admin-reset-password', {
        body: { userId: user.id, newPassword }
      });

      if (response.error) throw new Error(response.error.message);
      
      toast({ title: "Password reset successfully" });
      setNewPassword("");
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleBanUser = async () => {
    setIsLoading(true);
    try {
      const bannedUntil = new Date();
      bannedUntil.setDate(bannedUntil.getDate() + parseInt(banDuration));

      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: true,
          banned_until: bannedUntil.toISOString(),
          banned_reason: banReason
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({ title: `User banned for ${banDuration} days` });
      onUpdate();
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUnbanUser = async () => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_banned: false,
          banned_until: null,
          banned_reason: null
        })
        .eq('id', user.id);

      if (error) throw error;
      
      toast({ title: "User unbanned successfully" });
      onUpdate();
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailMessage || !userEmail) {
      toast({ title: "Please fill all email fields", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('send-notification', {
        body: { 
          userEmail, 
          subject: emailSubject, 
          message: emailMessage,
          userName: user.full_name 
        }
      });

      if (response.error) throw new Error(response.error.message);
      
      toast({ title: "Email sent successfully" });
      setEmailSubject("");
      setEmailMessage("");
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    setIsLoading(true);
    try {
      const response = await supabase.functions.invoke('delete-user', {
        body: { userId: user.id }
      });

      if (response.error) throw new Error(response.error.message);
      
      toast({ title: "User deleted successfully" });
      onOpenChange(false);
      onUpdate();
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 flex items-center justify-center text-lg font-semibold text-white">
              {user.full_name?.charAt(0) || 'U'}
            </div>
            <div>
              <div className="font-semibold">{user.full_name || 'Unknown User'}</div>
              <div className="text-sm text-muted-foreground font-normal">
                {roleLabels[userRole] || 'Student'}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="info" className="mt-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="info">Info</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="access">Access</TabsTrigger>
            <TabsTrigger value="notify">Notify</TabsTrigger>
            <TabsTrigger value="danger" className="text-destructive">Danger</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <User className="w-4 h-4" /> Full Name
                </Label>
                <Input value={user.full_name || 'Not set'} disabled />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Mail className="w-4 h-4" /> Email
                </Label>
                <Input value={userEmail || 'Not available'} disabled />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Shield className="w-4 h-4" /> Roll Number
                </Label>
                <Input value={user.roll_number || 'Not assigned'} disabled />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Phone className="w-4 h-4" /> Phone
                </Label>
                <Input value={user.phone || 'Not set'} disabled />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" /> Date of Birth
                </Label>
                <Input value={user.date_of_birth || 'Not set'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Target Exam</Label>
                <Input value={user.target_exam || 'Not set'} disabled />
              </div>
              <div className="space-y-2 col-span-2">
                <Label className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" /> Address
                </Label>
                <Input value={`${user.address || ''} ${user.city || ''} ${user.state || ''}`.trim() || 'Not set'} disabled />
              </div>
              <div className="space-y-2">
                <Label>Joined</Label>
                <Input value={new Date(user.created_at).toLocaleDateString()} disabled />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="security" className="space-y-4 mt-4">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Key className="w-4 h-4" /> Reset Password
              </h4>
              <div className="flex gap-2">
                <Input
                  type="password"
                  placeholder="New password (min 6 characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <Button onClick={handleResetPassword} disabled={isLoading}>
                  Reset
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                This will immediately change the user's password. They will need to use the new password on their next login.
              </p>
            </div>
          </TabsContent>

          <TabsContent value="access" className="space-y-4 mt-4">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Ban className="w-4 h-4" /> Access Control
              </h4>
              
              {user.is_banned ? (
                <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <p className="font-medium text-destructive">User is currently banned</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Reason: {user.banned_reason || 'No reason provided'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Until: {user.banned_until ? new Date(user.banned_until).toLocaleDateString() : 'Indefinitely'}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-3"
                    onClick={handleUnbanUser}
                    disabled={isLoading}
                  >
                    Unban User
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Ban Duration (days)</Label>
                    <Input
                      type="number"
                      value={banDuration}
                      onChange={(e) => setBanDuration(e.target.value)}
                      min="1"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Reason for ban</Label>
                    <Textarea
                      placeholder="Enter reason for banning this user..."
                      value={banReason}
                      onChange={(e) => setBanReason(e.target.value)}
                    />
                  </div>
                  <Button 
                    variant="destructive" 
                    onClick={handleBanUser}
                    disabled={isLoading}
                  >
                    <Ban className="w-4 h-4 mr-2" /> Ban User
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="notify" className="space-y-4 mt-4">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <Send className="w-4 h-4" /> Send Email Notification
              </h4>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Email subject..."
                    value={emailSubject}
                    onChange={(e) => setEmailSubject(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Enter your message..."
                    value={emailMessage}
                    onChange={(e) => setEmailMessage(e.target.value)}
                    rows={5}
                  />
                </div>
                <Button onClick={handleSendEmail} disabled={isLoading || !userEmail}>
                  <Send className="w-4 h-4 mr-2" /> Send Email
                </Button>
                {!userEmail && (
                  <p className="text-sm text-muted-foreground">
                    Email not available for this user
                  </p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="danger" className="space-y-4 mt-4">
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2 text-destructive">
                <Trash2 className="w-4 h-4" /> Delete User Account
              </h4>
              <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                <p className="text-sm text-muted-foreground mb-4">
                  This action is irreversible. Deleting this user will permanently remove:
                </p>
                <ul className="text-sm text-muted-foreground list-disc list-inside space-y-1 mb-4">
                  <li>User profile and personal data</li>
                  <li>All test attempts and scores</li>
                  <li>User roles and permissions</li>
                  <li>Authentication credentials</li>
                </ul>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={isLoading}>
                      <Trash2 className="w-4 h-4 mr-2" /> Delete User Permanently
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will permanently delete <strong>{user.full_name || 'this user'}</strong> and all their data. 
                        This action cannot be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={handleDeleteUser}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete User
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
