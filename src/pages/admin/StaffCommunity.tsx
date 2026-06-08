import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Send, Users, Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { containsBadWords, filterBadWords } from "@/lib/badWordFilter";
import { format } from "date-fns";

interface Message {
  id: string;
  user_id: string;
  message: string;
  is_deleted: boolean;
  deleted_reason: string | null;
  created_at: string;
  profile?: {
    full_name: string | null;
  };
}

export default function StaffCommunity() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [profiles, setProfiles] = useState<Record<string, string>>({});
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('community-messages')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'community_messages',
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const newMsg = payload.new as Message;
            setMessages(prev => [...prev, newMsg]);
            // Fetch profile for new message if not cached
            if (!profiles[newMsg.user_id]) {
              fetchProfile(newMsg.user_id);
            }
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => 
              prev.map(m => m.id === payload.new.id ? payload.new as Message : m)
            );
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom when messages change
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchMessages = async () => {
    const { data, error } = await supabase
      .from('community_messages')
      .select('*')
      .order('created_at', { ascending: true })
      .limit(100);

    if (!error && data) {
      setMessages(data);
      // Fetch profiles for all unique user IDs
      const userIds = [...new Set(data.map(m => m.user_id))];
      await fetchProfiles(userIds);
    }
    setIsLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', userId)
      .single();
    
    if (data) {
      setProfiles(prev => ({ ...prev, [userId]: data.full_name || 'Unknown' }));
    }
  };

  const fetchProfiles = async (userIds: string[]) => {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .in('id', userIds);
    
    if (data) {
      const profileMap: Record<string, string> = {};
      data.forEach(p => {
        profileMap[p.id] = p.full_name || 'Unknown';
      });
      setProfiles(profileMap);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;

    // Check for bad words
    if (containsBadWords(newMessage)) {
      toast({
        title: "Message blocked",
        description: "Your message contains inappropriate language. Please revise.",
        variant: "destructive",
      });
      return;
    }

    setIsSending(true);
    const { error } = await supabase
      .from('community_messages')
      .insert({
        user_id: user.id,
        message: newMessage.trim(),
      });

    if (error) {
      toast({
        title: "Error sending message",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setNewMessage("");
    }
    setIsSending(false);
  };

  const handleDeleteMessage = async (messageId: string) => {
    const { error } = await supabase
      .from('community_messages')
      .update({
        is_deleted: true,
        deleted_by: user?.id,
        deleted_reason: 'Deleted by admin',
      })
      .eq('id', messageId);

    if (error) {
      toast({
        title: "Error deleting message",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8 h-[calc(100vh-2rem)]">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
                Staff <span className="gradient-text">Community</span>
              </h1>
              <p className="text-muted-foreground">
                Connect with your team members
              </p>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Users className="w-5 h-5" />
              <span>{Object.keys(profiles).length} members</span>
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 glass-card overflow-hidden flex flex-col">
            <ScrollArea className="flex-1 p-4" ref={scrollRef}>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="w-12 h-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No messages yet. Start the conversation!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message, index) => {
                    const isOwn = message.user_id === user?.id;
                    const showDate = index === 0 || 
                      format(new Date(message.created_at), 'yyyy-MM-dd') !== 
                      format(new Date(messages[index - 1].created_at), 'yyyy-MM-dd');

                    return (
                      <div key={message.id}>
                        {showDate && (
                          <div className="flex items-center justify-center my-4">
                            <span className="px-3 py-1 text-xs bg-muted rounded-full text-muted-foreground">
                              {format(new Date(message.created_at), 'MMMM d, yyyy')}
                            </span>
                          </div>
                        )}
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`max-w-[70%] ${isOwn ? 'order-2' : ''}`}>
                            {!isOwn && (
                              <span className="text-xs text-muted-foreground ml-2 mb-1 block">
                                {profiles[message.user_id] || 'Unknown'}
                              </span>
                            )}
                            <div
                              className={`px-4 py-2 rounded-2xl ${
                                message.is_deleted
                                  ? 'bg-muted/50 text-muted-foreground italic'
                                  : isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary'
                              }`}
                            >
                              {message.is_deleted ? (
                                <span className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Message deleted
                                </span>
                              ) : (
                                message.message
                              )}
                            </div>
                            <span className="text-xs text-muted-foreground ml-2 mt-1 block">
                              {format(new Date(message.created_at), 'HH:mm')}
                            </span>
                          </div>
                          {isOwn && !message.is_deleted && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 opacity-0 hover:opacity-100 transition-opacity self-center mr-2"
                              onClick={() => handleDeleteMessage(message.id)}
                            >
                              <Trash2 className="w-4 h-4 text-muted-foreground" />
                            </Button>
                          )}
                        </motion.div>
                      </div>
                    );
                  })}
                </div>
              )}
            </ScrollArea>

            {/* Message Input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  disabled={isSending}
                  className="flex-1"
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()}>
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
