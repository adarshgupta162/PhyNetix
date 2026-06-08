import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Search, 
  Users,
  Shield,
  ShieldOff,
  RefreshCw,
  Info,
  Ban,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminLayout from "@/components/layout/AdminLayout";
import UserDetailsDialog from "@/components/admin/UserDetailsDialog";
import CreateUserDialog from "@/components/admin/CreateUserDialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole, roleLabels, roleBadgeColors } from "@/lib/permissions";

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

interface UserRole {
  user_id: string;
  role: AppRole;
  department_id?: string | null;
}

interface UserEmail {
  id: string;
  email: string;
}

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Profile | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [profilesRes, rolesRes] = await Promise.all([
      supabase.from('profiles').select('*').order('created_at', { ascending: false }),
      supabase.from('user_roles').select('*')
    ]);

    if (!profilesRes.error) setProfiles(profilesRes.data || []);
    if (!rolesRes.error) setUserRoles(rolesRes.data || []);
    setIsLoading(false);
  };

  const getUserRole = (userId: string): AppRole => {
    const role = userRoles.find(r => r.user_id === userId);
    return role?.role || 'student';
  };

  const toggleAdminRole = async (userId: string) => {
    const currentRole = getUserRole(userId);
    const newRole = currentRole === 'admin' ? 'student' : 'admin';
    
    // Update the existing role instead of inserting a new one
    const { error } = await supabase
      .from('user_roles')
      .update({ role: newRole })
      .eq('user_id', userId);
    
    if (error) {
      toast({ title: "Error updating role", description: error.message, variant: "destructive" });
    } else {
      toast({ title: newRole === 'admin' ? "Admin role granted" : "Admin role removed" });
      fetchData();
    }
  };

  const handleRecalculateAllScores = async () => {
    setIsRecalculating(true);
    try {
      // Get all tests
      const { data: tests, error: testsError } = await supabase
        .from('tests')
        .select('id');
      
      if (testsError) throw testsError;

      // Recalculate scores for each test
      for (const test of tests || []) {
        await supabase.functions.invoke('recalculate-scores', {
          body: { testId: test.id }
        });
      }
      
      toast({ title: "All scores recalculated successfully" });
    } catch (error: any) {
      toast({ title: error.message, variant: "destructive" });
    } finally {
      setIsRecalculating(false);
    }
  };

  const openUserDetails = (profile: Profile) => {
    setSelectedUser(profile);
    setDialogOpen(true);
  };

  const filteredProfiles = profiles.filter(p => {
    const matchesSearch = (p.full_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.roll_number || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const role = getUserRole(p.id);
    const matchesRole = filterRole === 'all' || role === filterRole;
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'banned' && p.is_banned) ||
      (filterStatus === 'active' && !p.is_banned);

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              User <span className="gradient-text">Management</span>
            </h1>
            <p className="text-muted-foreground">
              Manage users, roles, and access controls
            </p>
          </div>
          <div className="flex gap-2">
            <CreateUserDialog onUserCreated={fetchData} />
            <Button 
              variant="outline" 
              onClick={handleRecalculateAllScores}
              disabled={isRecalculating}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRecalculating ? 'animate-spin' : ''}`} />
              {isRecalculating ? 'Recalculating...' : 'Recalculate All Scores'}
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or roll number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12"
            />
          </div>
          <Select value={filterRole} onValueChange={setFilterRole}>
            <SelectTrigger className="w-[150px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admins</SelectItem>
              <SelectItem value="student">Students</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="banned">Banned</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="glass-card p-4">
            <div className="text-2xl font-bold">{profiles.length}</div>
            <div className="text-sm text-muted-foreground">Total Users</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold">{userRoles.filter(r => r.role === 'admin').length}</div>
            <div className="text-sm text-muted-foreground">Admins</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold">{profiles.length - userRoles.filter(r => r.role === 'admin').length}</div>
            <div className="text-sm text-muted-foreground">Students</div>
          </div>
          <div className="glass-card p-4">
            <div className="text-2xl font-bold text-destructive">{profiles.filter(p => p.is_banned).length}</div>
            <div className="text-sm text-muted-foreground">Banned</div>
          </div>
        </div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <Users className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">No users found</h3>
            <p className="text-muted-foreground">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">User</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Roll No.</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Target Exam</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Role</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-4 px-6 font-medium text-muted-foreground">Joined</th>
                    <th className="text-right py-4 px-6 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProfiles.map((profile, index) => {
                    const role = getUserRole(profile.id);
                    return (
                      <motion.tr
                        key={profile.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3, delay: index * 0.03 }}
                        className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 via-purple-600 to-fuchsia-600 flex items-center justify-center text-sm font-semibold text-white">
                              {profile.full_name?.charAt(0) || 'U'}
                            </div>
                            <div>
                              <div className="font-medium">{profile.full_name || 'Unknown'}</div>
                              <div className="text-sm text-muted-foreground">
                                {profile.city && profile.state ? `${profile.city}, ${profile.state}` : 'Location not set'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-mono text-sm">{profile.roll_number || '-'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm">{profile.target_exam || 'Not set'}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className={`px-2 py-1 rounded-md text-xs font-medium border ${roleBadgeColors[role]}`}>
                            {roleLabels[role]}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          {profile.is_banned ? (
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-destructive/10 text-destructive flex items-center gap-1 w-fit">
                              <Ban className="w-3 h-3" /> Banned
                            </span>
                          ) : (
                            <span className="px-2 py-1 rounded-md text-xs font-medium bg-success/10 text-success">
                              Active
                            </span>
                          )}
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-sm text-muted-foreground">
                            {new Date(profile.created_at).toLocaleDateString()}
                          </span>
                        </td>
                        <td className="py-4 px-6">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => openUserDetails(profile)}
                            >
                              <Info className="w-4 h-4" />
                            </Button>
                            <Button
                              variant={role === 'admin' ? 'outline' : 'ghost'}
                              size="sm"
                              onClick={() => toggleAdminRole(profile.id)}
                            >
                              {role === 'admin' ? (
                                <ShieldOff className="w-4 h-4" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* User Details Dialog */}
        <UserDetailsDialog
          user={selectedUser}
          userEmail={null} // Email fetched inside dialog if needed
          userRole={selectedUser ? getUserRole(selectedUser.id) : 'student'}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onUpdate={fetchData}
        />
      </div>
    </AdminLayout>
  );
}
