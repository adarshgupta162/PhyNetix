import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus, Search, Pencil, Trash2, Eye, EyeOff, BookOpen,
  Calendar, Clock, Filter, ChevronRight, Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import AdminLayout from "@/components/layout/AdminLayout";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

interface DPP {
  id: string;
  title: string;
  description: string | null;
  subject: string;
  chapter: string | null;
  topic: string | null;
  difficulty: string | null;
  duration_minutes: number | null;
  is_published: boolean | null;
  is_timed: boolean | null;
  access_type: string | null;
  batch_id: string | null;
  publish_date: string | null;
  created_at: string;
  question_count?: number;
}

export default function DPPManager() {
  const [dpps, setDpps] = useState<DPP[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterSubject, setFilterSubject] = useState("all");
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchDPPs();
  }, []);

  const fetchDPPs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('dpps')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) {
      // Get question counts
      const dppIds = data.map(d => d.id);
      const { data: questions } = await supabase
        .from('dpp_questions')
        .select('dpp_id')
        .in('dpp_id', dppIds);

      const countMap: Record<string, number> = {};
      questions?.forEach(q => {
        countMap[q.dpp_id] = (countMap[q.dpp_id] || 0) + 1;
      });

      setDpps(data.map(d => ({ ...d, question_count: countMap[d.id] || 0 })));
    }
    setLoading(false);
  };

  const togglePublish = async (dpp: DPP) => {
    const { error } = await supabase
      .from('dpps')
      .update({ is_published: !dpp.is_published })
      .eq('id', dpp.id);

    if (!error) {
      setDpps(prev => prev.map(d => d.id === dpp.id ? { ...d, is_published: !d.is_published } : d));
      toast({ title: dpp.is_published ? "DPP unpublished" : "DPP published" });
    }
  };

  const deleteDPP = async (id: string) => {
    if (!confirm("Delete this DPP and all its questions?")) return;
    const { error } = await supabase.from('dpps').delete().eq('id', id);
    if (!error) {
      setDpps(prev => prev.filter(d => d.id !== id));
      toast({ title: "DPP deleted" });
    }
  };

  const createNewDPP = async () => {
    const { data, error } = await supabase
      .from('dpps')
      .insert({
        title: 'Untitled DPP',
        subject: 'Physics',
        created_by: user?.id,
      })
      .select()
      .single();

    if (!error && data) {
      navigate(`/admin/dpp-editor/${data.id}`);
    }
  };

  const filtered = dpps.filter(d => {
    const matchesSearch = d.title.toLowerCase().includes(search.toLowerCase()) ||
      d.subject.toLowerCase().includes(search.toLowerCase());
    const matchesSubject = filterSubject === 'all' || d.subject.toLowerCase() === filterSubject;
    return matchesSearch && matchesSubject;
  });

  const difficultyColor = (d: string | null) => {
    switch(d) {
      case 'easy': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
      case 'hard': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    }
  };

  return (
    <AdminLayout>
      <div className="p-6 lg:p-8">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display mb-1">
              Daily Practice <span className="gradient-text">Problems</span>
            </h1>
            <p className="text-muted-foreground">
              Create and manage DPPs for students
            </p>
          </div>
          <Button onClick={createNewDPP} className="gap-2">
            <Plus className="w-4 h-4" />
            Create DPP
          </Button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search DPPs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterSubject} onValueChange={setFilterSubject}>
            <SelectTrigger className="w-[160px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Subjects</SelectItem>
              <SelectItem value="physics">Physics</SelectItem>
              <SelectItem value="chemistry">Chemistry</SelectItem>
              <SelectItem value="mathematics">Mathematics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Total DPPs", value: dpps.length, icon: BookOpen },
            { label: "Published", value: dpps.filter(d => d.is_published).length, icon: Eye },
            { label: "Drafts", value: dpps.filter(d => !d.is_published).length, icon: EyeOff },
            { label: "Total Questions", value: dpps.reduce((s, d) => s + (d.question_count || 0), 0), icon: Zap },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.label}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* DPP List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No DPPs found</h3>
            <p className="text-muted-foreground mb-4">Create your first DPP to get started</p>
            <Button onClick={createNewDPP}><Plus className="w-4 h-4 mr-2" />Create DPP</Button>
          </div>
        ) : (
          <div className="grid gap-4">
            <AnimatePresence>
              {filtered.map((dpp, i) => (
                <motion.div
                  key={dpp.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card p-5 hover:border-primary/30 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold truncate">{dpp.title}</h3>
                        {dpp.is_published ? (
                          <Badge variant="default" className="text-xs">Published</Badge>
                        ) : (
                          <Badge variant="secondary" className="text-xs">Draft</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="w-3.5 h-3.5" />
                          {dpp.subject}
                        </span>
                        {dpp.chapter && <span>• {dpp.chapter}</span>}
                        <span>• {dpp.question_count} questions</span>
                        {dpp.is_timed && (
                          <span className="flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            {dpp.duration_minutes}min
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {dpp.publish_date ? new Date(dpp.publish_date).toLocaleDateString() : 'No date'}
                        </span>
                      </div>
                    </div>

                    <Badge variant="outline" className={difficultyColor(dpp.difficulty)}>
                      {dpp.difficulty || 'medium'}
                    </Badge>

                    <Badge variant="outline" className="capitalize">
                      {dpp.access_type || 'public'}
                    </Badge>

                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Switch
                        checked={!!dpp.is_published}
                        onCheckedChange={() => togglePublish(dpp)}
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => navigate(`/admin/dpp-editor/${dpp.id}`)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteDPP(dpp.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => navigate(`/admin/dpp-editor/${dpp.id}`)}
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
