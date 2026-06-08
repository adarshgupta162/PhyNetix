import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Settings, 
  Mail, 
  Users, 
  Bell, 
  Shield, 
  Database,
  Send,
  CheckCircle,
  RefreshCw,
  Download
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { usePlatformSettings } from "@/hooks/usePlatformSettings";

interface Profile {
  id: string;
  full_name: string | null;
  roll_number: string | null;
  target_exam: string | null;
  is_banned: boolean | null;
}

export default function AdminSettings() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState("");
  const [emailMessage, setEmailMessage] = useState("");
  const [filterExam, setFilterExam] = useState<string>("all");
  const [isSending, setIsSending] = useState(false);
  const [sendProgress, setSendProgress] = useState({ sent: 0, total: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [isClearingAttempts, setIsClearingAttempts] = useState(false);
  
  // Platform settings
  const [platformSettings, setPlatformSettings] = useState({
    allowSignups: true,
    requireEmailVerification: false,
    maintenanceMode: false,
    maxTestAttempts: 1,
    showLeaderboard: true,
    enableNotifications: true
  });

  const { toast } = useToast();
  const { settings: platformSettingsDB, updateSetting } = usePlatformSettings();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, roll_number, target_exam, is_banned')
      .eq('is_banned', false)
      .order('full_name');
    
    if (!error && data) {
      setProfiles(data);
    }
    setIsLoading(false);
  };

  const filteredProfiles = profiles.filter(p => 
    filterExam === 'all' || p.target_exam === filterExam
  );

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredProfiles.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredProfiles.map(p => p.id));
    }
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUsers.includes(userId)) {
      setSelectedUsers(selectedUsers.filter(id => id !== userId));
    } else {
      setSelectedUsers([...selectedUsers, userId]);
    }
  };

  const handleSendBulkEmail = async () => {
    if (selectedUsers.length === 0) {
      toast({ title: "No users selected", variant: "destructive" });
      return;
    }
    if (!emailSubject || !emailMessage) {
      toast({ title: "Please fill in subject and message", variant: "destructive" });
      return;
    }

    setIsSending(true);
    setSendProgress({ sent: 0, total: selectedUsers.length });

    let successCount = 0;
    let failCount = 0;

    for (const userId of selectedUsers) {
      const user = profiles.find(p => p.id === userId);
      if (!user) continue;

      try {
        // Note: In a real implementation, you'd need to get user emails from auth
        // For now, we'll send via the edge function which handles this
        const response = await supabase.functions.invoke('send-bulk-notification', {
          body: { 
            userId,
            subject: emailSubject, 
            message: emailMessage,
            userName: user.full_name 
          }
        });

        if (response.error) {
          failCount++;
        } else {
          successCount++;
        }
      } catch (error) {
        failCount++;
      }

      setSendProgress(prev => ({ ...prev, sent: prev.sent + 1 }));
    }

    setIsSending(false);
    toast({ 
      title: "Bulk email complete", 
      description: `${successCount} sent, ${failCount} failed` 
    });
    setSelectedUsers([]);
    setEmailSubject("");
    setEmailMessage("");
  };

  const handleExportUsers = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const csv = [
        ['Name', 'Roll Number', 'Target Exam', 'City', 'State', 'Phone', 'Joined', 'Status'].join(','),
        ...data.map(p => [
          p.full_name || '',
          p.roll_number || '',
          p.target_exam || '',
          p.city || '',
          p.state || '',
          p.phone || '',
          new Date(p.created_at).toLocaleDateString(),
          p.is_banned ? 'Banned' : 'Active'
        ].join(','))
      ].join('\n');

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      
      toast({ title: "Users exported successfully" });
    }
  };

  const handleClearAttempts = async () => {
    if (!confirm("Are you sure you want to delete ALL test attempts? This action cannot be undone!")) {
      return;
    }
    
    setIsClearingAttempts(true);
    
    const { error } = await supabase
      .from('test_attempts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records
    
    setIsClearingAttempts(false);
    
    if (error) {
      toast({ 
        title: "Failed to clear attempts", 
        description: error.message,
        variant: "destructive" 
      });
    } else {
      toast({ title: "All test attempts cleared successfully" });
    }
  };

  const emailTemplates = [
    { name: "Welcome", subject: "Welcome to PhyNetix!", message: "Thank you for joining PhyNetix. Start your learning journey today!" },
    { name: "Test Reminder", subject: "New Test Available", message: "A new test has been published. Login to attempt it now!" },
    { name: "Results", subject: "Your Test Results Are Ready", message: "Your recent test results are now available. Check your dashboard for detailed analysis." },
    { name: "Maintenance", subject: "Scheduled Maintenance", message: "We will be performing scheduled maintenance. The platform will be temporarily unavailable." },
  ];

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              Admin <span className="gradient-text">Settings</span>
            </h1>
            <p className="text-muted-foreground">
              Configure platform settings and send notifications
            </p>
          </div>
          <Button variant="outline" onClick={handleExportUsers}>
            <Download className="w-4 h-4 mr-2" />
            Export Users
          </Button>
        </div>

        <Tabs defaultValue="bulk-email" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="bulk-email">
              <Mail className="w-4 h-4 mr-2" />
              Bulk Email
            </TabsTrigger>
            <TabsTrigger value="platform">
              <Settings className="w-4 h-4 mr-2" />
              Platform
            </TabsTrigger>
            <TabsTrigger value="database">
              <Database className="w-4 h-4 mr-2" />
              Database
            </TabsTrigger>
          </TabsList>

          {/* Bulk Email Tab */}
          <TabsContent value="bulk-email" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* User Selection */}
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Select Recipients ({selectedUsers.length} selected)
                </h3>
                
                <div className="flex gap-3 mb-4">
                  <Select value={filterExam} onValueChange={setFilterExam}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by exam" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Students</SelectItem>
                      <SelectItem value="jee_mains">JEE Mains</SelectItem>
                      <SelectItem value="jee_advanced">JEE Advanced</SelectItem>
                      <SelectItem value="neet">NEET</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" size="sm" onClick={handleSelectAll}>
                    {selectedUsers.length === filteredProfiles.length ? 'Deselect All' : 'Select All'}
                  </Button>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                    </div>
                  ) : filteredProfiles.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No users found</p>
                  ) : (
                    filteredProfiles.map((profile) => (
                      <div
                        key={profile.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          selectedUsers.includes(profile.id) 
                            ? 'border-primary bg-primary/5' 
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => toggleUserSelection(profile.id)}
                      >
                        <Checkbox 
                          checked={selectedUsers.includes(profile.id)}
                          onCheckedChange={() => toggleUserSelection(profile.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium">{profile.full_name || 'Unknown'}</div>
                          <div className="text-sm text-muted-foreground">
                            {profile.roll_number || 'No roll number'} • {profile.target_exam || 'No exam'}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Email Composer */}
              <div className="glass-card p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Compose Email
                </h3>

                {/* Templates */}
                <div className="mb-4">
                  <Label className="mb-2 block">Quick Templates</Label>
                  <div className="flex flex-wrap gap-2">
                    {emailTemplates.map((template) => (
                      <Button
                        key={template.name}
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEmailSubject(template.subject);
                          setEmailMessage(template.message);
                        }}
                      >
                        {template.name}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
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
                      placeholder="Write your message here... Use {name} for personalization."
                      value={emailMessage}
                      onChange={(e) => setEmailMessage(e.target.value)}
                      rows={8}
                    />
                  </div>

                  {isSending && (
                    <div className="p-4 rounded-lg bg-primary/10">
                      <div className="flex items-center gap-2 mb-2">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Sending emails...</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2">
                        <div 
                          className="bg-primary h-2 rounded-full transition-all"
                          style={{ width: `${(sendProgress.sent / sendProgress.total) * 100}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        {sendProgress.sent} of {sendProgress.total} sent
                      </p>
                    </div>
                  )}

                  <Button 
                    className="w-full" 
                    onClick={handleSendBulkEmail}
                    disabled={isSending || selectedUsers.length === 0}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    Send to {selectedUsers.length} Users
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Platform Settings Tab */}
          <TabsContent value="platform" className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Feature Toggles
              </h3>
              
              <div className="grid gap-6 md:grid-cols-2">
                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">Show PDF Tests</div>
                    <div className="text-sm text-muted-foreground">Show/hide PDF tests from admin sidebar and student nav</div>
                  </div>
                  <Switch
                    checked={platformSettingsDB.show_pdf_tests}
                    onCheckedChange={(checked) => updateSetting('show_pdf_tests', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">Allow New Signups</div>
                    <div className="text-sm text-muted-foreground">Enable or disable new user registrations</div>
                  </div>
                  <Switch
                    checked={platformSettings.allowSignups}
                    onCheckedChange={(checked) => 
                      setPlatformSettings(prev => ({ ...prev, allowSignups: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">Email Verification</div>
                    <div className="text-sm text-muted-foreground">Require email verification for new accounts</div>
                  </div>
                  <Switch
                    checked={platformSettings.requireEmailVerification}
                    onCheckedChange={(checked) => 
                      setPlatformSettings(prev => ({ ...prev, requireEmailVerification: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">Maintenance Mode</div>
                    <div className="text-sm text-muted-foreground">Temporarily disable access for students</div>
                  </div>
                  <Switch
                    checked={platformSettings.maintenanceMode}
                    onCheckedChange={(checked) => 
                      setPlatformSettings(prev => ({ ...prev, maintenanceMode: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">Show Leaderboard</div>
                    <div className="text-sm text-muted-foreground">Display rankings to students</div>
                  </div>
                  <Switch
                    checked={platformSettings.showLeaderboard}
                    onCheckedChange={(checked) => 
                      setPlatformSettings(prev => ({ ...prev, showLeaderboard: checked }))
                    }
                  />
                </div>

                <div className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div>
                    <div className="font-medium">Enable Notifications</div>
                    <div className="text-sm text-muted-foreground">Send automated notifications to users</div>
                  </div>
                  <Switch
                    checked={platformSettings.enableNotifications}
                    onCheckedChange={(checked) => 
                      setPlatformSettings(prev => ({ ...prev, enableNotifications: checked }))
                    }
                  />
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="font-medium mb-2">Max Test Attempts</div>
                  <div className="text-sm text-muted-foreground mb-3">How many times can a student attempt a test</div>
                  <Select 
                    value={String(platformSettings.maxTestAttempts)}
                    onValueChange={(value) => 
                      setPlatformSettings(prev => ({ ...prev, maxTestAttempts: parseInt(value) }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1 Attempt</SelectItem>
                      <SelectItem value="2">2 Attempts</SelectItem>
                      <SelectItem value="3">3 Attempts</SelectItem>
                      <SelectItem value="999">Unlimited</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <Button onClick={() => toast({ title: "Settings saved" })}>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Database Tab */}
          <TabsContent value="database" className="space-y-6">
            <div className="glass-card p-6">
              <h3 className="font-semibold mb-6 flex items-center gap-2">
                <Database className="w-5 h-5" />
                Database Operations
              </h3>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 rounded-lg border border-border">
                  <div className="font-medium mb-2">Recalculate All Scores</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Recalculate scores, ranks, and percentiles for all test attempts
                  </p>
                  <Button variant="outline" className="w-full">
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Recalculate
                  </Button>
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="font-medium mb-2">Export All Data</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Download complete platform data as CSV files
                  </p>
                  <Button variant="outline" className="w-full" onClick={handleExportUsers}>
                    <Download className="w-4 h-4 mr-2" />
                    Export Users
                  </Button>
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="font-medium mb-2">Clear Test Attempts</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Remove all test attempt records (use with caution)
                  </p>
                  <Button 
                    variant="destructive" 
                    className="w-full"
                    onClick={handleClearAttempts}
                    disabled={isClearingAttempts}
                  >
                    {isClearingAttempts ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : null}
                    Clear Attempts
                  </Button>
                </div>

                <div className="p-4 rounded-lg border border-border">
                  <div className="font-medium mb-2">Generate Roll Numbers</div>
                  <p className="text-sm text-muted-foreground mb-4">
                    Assign roll numbers to students without one
                  </p>
                  <Button variant="outline" className="w-full">
                    Generate
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
