import { useState } from "react";
import { motion } from "framer-motion";
import { 
  User, 
  Bell, 
  Lock, 
  Palette, 
  Shield,
  LogOut,
  Moon,
  Sun
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("account");
  const [notifications, setNotifications] = useState({
    email: true,
    testReminders: true,
    performance: false,
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const tabs = [
    { id: "account", label: "Account", icon: User },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "appearance", label: "Appearance", icon: Palette },
    { id: "security", label: "Security", icon: Shield },
  ];

  return (
    <DashboardLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl lg:text-3xl font-bold font-display mb-2">
            <span className="gradient-text">Settings</span>
          </h1>
          <p className="text-muted-foreground">
            Manage your account preferences
          </p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="glass-card p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-all",
                    activeTab === tab.id
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                  )}
                >
                  <tab.icon className="w-5 h-5" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            {activeTab === "account" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-semibold font-display mb-6">Account Settings</h2>
                
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <Label className="text-sm text-muted-foreground">Email</Label>
                    <p className="font-medium mt-1">{user?.email}</p>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/30">
                    <Label className="text-sm text-muted-foreground">Account ID</Label>
                    <p className="font-mono text-sm mt-1">{user?.id}</p>
                  </div>

                  <div className="pt-4 border-t border-border">
                    <Button variant="destructive" onClick={handleSignOut}>
                      <LogOut className="w-4 h-4 mr-2" />
                      Sign Out
                    </Button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-semibold font-display mb-6">Notification Preferences</h2>
                
                <div className="space-y-6">
                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">Receive important updates via email</p>
                    </div>
                    <Switch 
                      checked={notifications.email}
                      onCheckedChange={(checked) => setNotifications({...notifications, email: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium">Test Reminders</p>
                      <p className="text-sm text-muted-foreground">Get reminded about scheduled tests</p>
                    </div>
                    <Switch 
                      checked={notifications.testReminders}
                      onCheckedChange={(checked) => setNotifications({...notifications, testReminders: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/30">
                    <div>
                      <p className="font-medium">Performance Reports</p>
                      <p className="text-sm text-muted-foreground">Weekly performance summary</p>
                    </div>
                    <Switch 
                      checked={notifications.performance}
                      onCheckedChange={(checked) => setNotifications({...notifications, performance: checked})}
                    />
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "appearance" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-semibold font-display mb-6">Appearance</h2>
                
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <p className="font-medium mb-4">Theme</p>
                    <div className="flex gap-4">
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-background border border-border">
                        <Moon className="w-4 h-4" />
                        Dark
                      </button>
                      <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-secondary/50 text-muted-foreground">
                        <Sun className="w-4 h-4" />
                        Light
                      </button>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">Currently using dark theme</p>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "security" && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card p-6"
              >
                <h2 className="text-lg font-semibold font-display mb-6">Security</h2>
                
                <div className="space-y-6">
                  <div className="p-4 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Password</p>
                        <p className="text-sm text-muted-foreground">Last changed: Never</p>
                      </div>
                      <Button variant="outline" onClick={() => navigate("/auth?mode=reset")}>
                        Change Password
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-secondary/30">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Two-Factor Authentication</p>
                        <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                      </div>
                      <Button variant="outline" disabled>
                        Coming Soon
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
