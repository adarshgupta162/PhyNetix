import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Inbox, 
  Send, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Plus,
  Filter
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface StaffRequest {
  id: string;
  from_user_id: string;
  to_user_id: string;
  request_type: string;
  title: string;
  description: string | null;
  status: string;
  created_at: string;
  updated_at: string;
}

interface StaffMember {
  id: string;
  full_name: string | null;
  role: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  approved: 'bg-green-500/10 text-green-500 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const statusIcons: Record<string, React.ElementType> = {
  pending: Clock,
  approved: CheckCircle,
  rejected: XCircle,
};

export default function StaffRequests() {
  const [incomingRequests, setIncomingRequests] = useState<StaffRequest[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<StaffRequest[]>([]);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newRequest, setNewRequest] = useState({
    to_user_id: '',
    request_type: 'add_student',
    title: '',
    description: '',
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchRequests();
    fetchStaffMembers();
  }, []);

  const fetchRequests = async () => {
    if (!user) return;

    const [incoming, outgoing] = await Promise.all([
      supabase
        .from('staff_requests')
        .select('*')
        .eq('to_user_id', user.id)
        .order('created_at', { ascending: false }),
      supabase
        .from('staff_requests')
        .select('*')
        .eq('from_user_id', user.id)
        .order('created_at', { ascending: false }),
    ]);

    if (!incoming.error) setIncomingRequests(incoming.data || []);
    if (!outgoing.error) setOutgoingRequests(outgoing.data || []);

    // Fetch profiles
    const allUserIds = [
      ...(incoming.data?.map(r => r.from_user_id) || []),
      ...(outgoing.data?.map(r => r.to_user_id) || []),
    ];
    await fetchProfiles([...new Set(allUserIds)]);
    
    setIsLoading(false);
  };

  const fetchStaffMembers = async () => {
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id, role')
      .neq('role', 'student');

    if (roles) {
      const userIds = roles.map(r => r.user_id).filter(id => id !== user?.id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      if (profiles) {
        const members = profiles.map(p => ({
          id: p.id,
          full_name: p.full_name,
          role: roles.find(r => r.user_id === p.id)?.role || 'unknown',
        }));
        setStaffMembers(members);
      }
    }
  };

  const fetchProfiles = async (userIds: string[]) => {
    if (userIds.length === 0) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    
    if (data) {
      const profileMap: Record<string, string> = {};
      data.forEach(p => {
        profileMap[p.id] = p.full_name || 'Unknown';
      });
      setProfiles(prev => ({ ...prev, ...profileMap }));
    }
  };

  const handleCreateRequest = async () => {
    if (!user || !newRequest.to_user_id || !newRequest.title) {
      toast({ title: "Please fill all required fields", variant: "destructive" });
      return;
    }

    const { error } = await supabase
      .from('staff_requests')
      .insert({
        from_user_id: user.id,
        to_user_id: newRequest.to_user_id,
        request_type: newRequest.request_type,
        title: newRequest.title,
        description: newRequest.description || null,
      });

    if (error) {
      toast({ title: "Error creating request", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request sent successfully" });
      setDialogOpen(false);
      setNewRequest({ to_user_id: '', request_type: 'add_student', title: '', description: '' });
      fetchRequests();

      // Create notification for the recipient
      await supabase.from('notifications').insert({
        user_id: newRequest.to_user_id,
        title: 'New Request',
        message: `${profiles[user.id] || 'A staff member'} sent you a request: ${newRequest.title}`,
        type: 'request',
        requires_action: true,
      });
    }
  };

  const handleUpdateRequest = async (requestId: string, status: 'approved' | 'rejected') => {
    const { error } = await supabase
      .from('staff_requests')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (error) {
      toast({ title: "Error updating request", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Request ${status}` });
      fetchRequests();
    }
  };

  const pendingCount = incomingRequests.filter(r => r.status === 'pending').length;

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              Staff <span className="gradient-text">Requests</span>
            </h1>
            <p className="text-muted-foreground">
              Manage incoming and outgoing requests
            </p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Request
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Request</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div>
                  <label className="text-sm font-medium">Send to</label>
                  <Select
                    value={newRequest.to_user_id}
                    onValueChange={(value) => setNewRequest(prev => ({ ...prev, to_user_id: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      {staffMembers.map(member => (
                        <SelectItem key={member.id} value={member.id}>
                          {member.full_name || 'Unknown'} ({member.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Request Type</label>
                  <Select
                    value={newRequest.request_type}
                    onValueChange={(value) => setNewRequest(prev => ({ ...prev, request_type: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="add_student">Add Student</SelectItem>
                      <SelectItem value="publish_test">Publish Test</SelectItem>
                      <SelectItem value="access_request">Access Request</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Title</label>
                  <Input
                    placeholder="Request title"
                    value={newRequest.title}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, title: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Description (optional)</label>
                  <Textarea
                    placeholder="Provide details about your request..."
                    value={newRequest.description}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, description: e.target.value }))}
                    className="mt-1"
                  />
                </div>
                <Button onClick={handleCreateRequest} className="w-full">
                  Send Request
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="incoming" className="space-y-6">
          <TabsList>
            <TabsTrigger value="incoming" className="relative">
              <Inbox className="w-4 h-4 mr-2" />
              Incoming
              {pendingCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-destructive text-destructive-foreground text-xs rounded-full flex items-center justify-center">
                  {pendingCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="outgoing">
              <Send className="w-4 h-4 mr-2" />
              Outgoing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="incoming">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : incomingRequests.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Inbox className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No incoming requests</h3>
                <p className="text-muted-foreground">Requests from other staff will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {incomingRequests.map((request, index) => {
                  const StatusIcon = statusIcons[request.status] || Clock;
                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="glass-card p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{request.title}</span>
                            <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[request.status]}`}>
                              {request.status}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            From: {profiles[request.from_user_id] || 'Unknown'} • {request.request_type.replace(/_/g, ' ')}
                          </p>
                          {request.description && (
                            <p className="text-sm">{request.description}</p>
                          )}
                          <span className="text-xs text-muted-foreground mt-2 block">
                            {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                          </span>
                        </div>
                        {request.status === 'pending' && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-green-500 border-green-500/20 hover:bg-green-500/10"
                              onClick={() => handleUpdateRequest(request.id, 'approved')}
                            >
                              <CheckCircle className="w-4 h-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 border-red-500/20 hover:bg-red-500/10"
                              onClick={() => handleUpdateRequest(request.id, 'rejected')}
                            >
                              <XCircle className="w-4 h-4 mr-1" />
                              Reject
                            </Button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="outgoing">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
              </div>
            ) : outgoingRequests.length === 0 ? (
              <div className="glass-card p-12 text-center">
                <Send className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No outgoing requests</h3>
                <p className="text-muted-foreground">Your sent requests will appear here</p>
              </div>
            ) : (
              <div className="space-y-4">
                {outgoingRequests.map((request, index) => {
                  const StatusIcon = statusIcons[request.status] || Clock;
                  return (
                    <motion.div
                      key={request.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="glass-card p-4"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium">{request.title}</span>
                        <span className={`px-2 py-0.5 text-xs rounded-full border ${statusColors[request.status]}`}>
                          {request.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        To: {profiles[request.to_user_id] || 'Unknown'} • {request.request_type.replace(/_/g, ' ')}
                      </p>
                      {request.description && (
                        <p className="text-sm">{request.description}</p>
                      )}
                      <span className="text-xs text-muted-foreground mt-2 block">
                        {format(new Date(request.created_at), 'MMM d, yyyy HH:mm')}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AdminLayout>
  );
}
