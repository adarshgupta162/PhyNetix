import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Search, Users, Shield, RefreshCw, Ban, Filter as FilterIcon, Download, Mail,
  ChevronDown, MoreHorizontal, ArrowUpDown, Loader2, UserPlus, Trash2, Copy,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AdminLayout from "@/components/layout/AdminLayout";
import CreateUserDialog from "@/components/admin/CreateUserDialog";
import UserManagementDrawer from "@/components/admin/UserManagementDrawer";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppRole, roleLabels, roleBadgeColors } from "@/lib/permissions";
import { cn } from "@/lib/utils";

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

interface UserRole { user_id: string; role: AppRole; }

const ALL_ROLES: AppRole[] = [
  "admin", "head", "manager", "academic_admin", "finance_admin",
  "operations_admin", "marketing_admin", "test_manager", "data_manager",
  "teacher", "student",
];

type SortKey = "name" | "joined" | "attempts" | "enrollments" | "last_active";
type SortDir = "asc" | "desc";
type Density = "comfortable" | "compact";

const COLUMNS = [
  { key: "user", label: "User", required: true },
  { key: "role", label: "Role" },
  { key: "exam", label: "Exam" },
  { key: "enrollments", label: "Batches" },
  { key: "attempts", label: "Attempts" },
  { key: "last_active", label: "Last Active" },
  { key: "status", label: "Status" },
  { key: "joined", label: "Joined" },
] as const;

export default function AdminUsers() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [userRoles, setUserRoles] = useState<UserRole[]>([]);
  const [enrollmentCounts, setEnrollmentCounts] = useState<Record<string, number>>({});
  const [attemptStats, setAttemptStats] = useState<Record<string, { count: number; last: string | null }>>({});
  const [emails, setEmails] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRecalculating, setIsRecalculating] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterExam, setFilterExam] = useState<string>("all");
  const [filterActivity, setFilterActivity] = useState<string>("all"); // all | active7 | active30 | never
  const [filterEnrollment, setFilterEnrollment] = useState<string>("all"); // all | enrolled | none

  // Sort + density + pagination
  const [sortKey, setSortKey] = useState<SortKey>("joined");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [density, setDensity] = useState<Density>("comfortable");
  const [visibleCols, setVisibleCols] = useState<Set<string>>(
    new Set(["user", "role", "exam", "enrollments", "attempts", "last_active", "status", "joined"])
  );

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Drawer
  const [drawerUser, setDrawerUser] = useState<Profile | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Bulk notification dialog
  const [bulkNotifyOpen, setBulkNotifyOpen] = useState(false);
  const [bulkSubject, setBulkSubject] = useState("");
  const [bulkMessage, setBulkMessage] = useState("");
  const [bulkSending, setBulkSending] = useState(false);

  // Bulk role dialog
  const [bulkRoleOpen, setBulkRoleOpen] = useState(false);
  const [bulkRole, setBulkRole] = useState<AppRole>("student");

  const { toast } = useToast();

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    setIsLoading(true);
    const [profilesRes, rolesRes, attemptsRes, enrRes] = await Promise.all([
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("test_attempts").select("user_id, started_at"),
      supabase.from("batch_enrollments").select("user_id, status").eq("status", "active"),
    ]);
    if (profilesRes.data) setProfiles(profilesRes.data as any);
    if (rolesRes.data) setUserRoles(rolesRes.data as any);

    // Build attempt stats
    const stats: Record<string, { count: number; last: string | null }> = {};
    (attemptsRes.data || []).forEach((a: any) => {
      const cur = stats[a.user_id] || { count: 0, last: null };
      cur.count++;
      if (!cur.last || new Date(a.started_at) > new Date(cur.last)) cur.last = a.started_at;
      stats[a.user_id] = cur;
    });
    setAttemptStats(stats);

    const enr: Record<string, number> = {};
    (enrRes.data || []).forEach((e: any) => { enr[e.user_id] = (enr[e.user_id] || 0) + 1; });
    setEnrollmentCounts(enr);

    setIsLoading(false);
  };

  const getUserRole = (id: string): AppRole => userRoles.find(r => r.user_id === id)?.role || "student";

  const exams = useMemo(() => {
    const s = new Set<string>();
    profiles.forEach(p => p.target_exam && s.add(p.target_exam));
    return Array.from(s).sort();
  }, [profiles]);

  const filtered = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    const now = Date.now();
    const out = profiles.filter(p => {
      if (q) {
        const hay = `${p.full_name || ""} ${p.roll_number || ""} ${p.phone || ""} ${p.city || ""} ${p.state || ""}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      const role = getUserRole(p.id);
      if (filterRole !== "all" && role !== filterRole) return false;
      if (filterStatus !== "all") {
        if (filterStatus === "banned" && !p.is_banned) return false;
        if (filterStatus === "active" && p.is_banned) return false;
      }
      if (filterExam !== "all" && p.target_exam !== filterExam) return false;
      if (filterEnrollment !== "all") {
        const has = (enrollmentCounts[p.id] || 0) > 0;
        if (filterEnrollment === "enrolled" && !has) return false;
        if (filterEnrollment === "none" && has) return false;
      }
      if (filterActivity !== "all") {
        const last = attemptStats[p.id]?.last;
        if (filterActivity === "never" && last) return false;
        if (filterActivity === "active7") {
          if (!last || now - new Date(last).getTime() > 7 * 86400000) return false;
        }
        if (filterActivity === "active30") {
          if (!last || now - new Date(last).getTime() > 30 * 86400000) return false;
        }
      }
      return true;
    });

    const dir = sortDir === "asc" ? 1 : -1;
    out.sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "name": av = (a.full_name || "").toLowerCase(); bv = (b.full_name || "").toLowerCase(); break;
        case "joined": av = a.created_at; bv = b.created_at; break;
        case "attempts": av = attemptStats[a.id]?.count || 0; bv = attemptStats[b.id]?.count || 0; break;
        case "enrollments": av = enrollmentCounts[a.id] || 0; bv = enrollmentCounts[b.id] || 0; break;
        case "last_active": av = attemptStats[a.id]?.last || ""; bv = attemptStats[b.id]?.last || ""; break;
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    return out;
  }, [profiles, searchQuery, filterRole, filterStatus, filterExam, filterEnrollment, filterActivity, sortKey, sortDir, userRoles, attemptStats, enrollmentCounts]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pageItems = filtered.slice((page - 1) * pageSize, page * pageSize);
  useEffect(() => { setPage(1); }, [searchQuery, filterRole, filterStatus, filterExam, filterEnrollment, filterActivity, pageSize]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const toggleSelect = (id: string) => {
    setSelected(s => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };
  const allOnPageSelected = pageItems.length > 0 && pageItems.every(p => selected.has(p.id));
  const toggleSelectAllOnPage = () => {
    setSelected(s => {
      const n = new Set(s);
      if (allOnPageSelected) pageItems.forEach(p => n.delete(p.id));
      else pageItems.forEach(p => n.add(p.id));
      return n;
    });
  };

  const updateRole = async (userId: string, role: AppRole) => {
    const { error } = await supabase.from("user_roles").update({ role }).eq("user_id", userId);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: `Role updated to ${roleLabels[role]}` });
    fetchData();
  };

  const quickBan = async (p: Profile) => {
    if (p.is_banned) {
      await supabase.from("profiles").update({ is_banned: false, banned_until: null, banned_reason: null }).eq("id", p.id);
      toast({ title: "Unbanned" });
    } else {
      const until = new Date(Date.now() + 7 * 86400000).toISOString();
      await supabase.from("profiles").update({ is_banned: true, banned_until: until, banned_reason: "Quick ban (7d)" }).eq("id", p.id);
      toast({ title: "Banned 7 days" });
    }
    fetchData();
  };

  // ── Bulk operations ────────────────────────────
  const bulkBan = async (ban: boolean) => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const patch = ban
      ? { is_banned: true, banned_until: new Date(Date.now() + 7 * 86400000).toISOString(), banned_reason: "Bulk action" }
      : { is_banned: false, banned_until: null, banned_reason: null };
    const { error } = await supabase.from("profiles").update(patch).in("id", ids);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: `${ban ? "Banned" : "Unbanned"} ${ids.length} user${ids.length > 1 ? "s" : ""}` });
    setSelected(new Set());
    fetchData();
  };

  const bulkAssignRole = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    const { error } = await supabase.from("user_roles").update({ role: bulkRole }).in("user_id", ids);
    if (error) return toast({ title: error.message, variant: "destructive" });
    toast({ title: `Updated ${ids.length} user${ids.length > 1 ? "s" : ""} to ${roleLabels[bulkRole]}` });
    setBulkRoleOpen(false);
    setSelected(new Set());
    fetchData();
  };

  const bulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    if (!confirm(`Permanently delete ${ids.length} users? This cannot be undone.`)) return;
    let ok = 0, fail = 0;
    for (const id of ids) {
      const res = await supabase.functions.invoke("delete-user", { body: { userId: id } });
      res.error ? fail++ : ok++;
    }
    toast({ title: `Deleted ${ok}${fail ? `, ${fail} failed` : ""}` });
    setSelected(new Set());
    fetchData();
  };

  const bulkSendNotification = async () => {
    const ids = Array.from(selected);
    if (!ids.length || !bulkSubject || !bulkMessage) return;
    setBulkSending(true);
    const res = await supabase.functions.invoke("send-bulk-notification", {
      body: { userIds: ids, subject: bulkSubject, message: bulkMessage },
    });
    setBulkSending(false);
    if (res.error) return toast({ title: res.error.message, variant: "destructive" });
    toast({ title: `Notification sent to ${ids.length} user${ids.length > 1 ? "s" : ""}` });
    setBulkNotifyOpen(false);
    setBulkSubject(""); setBulkMessage("");
    setSelected(new Set());
  };

  const exportCSV = (onlySelected = false) => {
    const rows = onlySelected ? filtered.filter(p => selected.has(p.id)) : filtered;
    if (!rows.length) return toast({ title: "Nothing to export", variant: "destructive" });
    const headers = ["Name", "Roll Number", "Phone", "Target Exam", "City", "State", "Role", "Status", "Enrollments", "Attempts", "Last Active", "Joined"];
    const csv = [headers.join(","), ...rows.map(p => [
      p.full_name, p.roll_number, p.phone, p.target_exam, p.city, p.state,
      roleLabels[getUserRole(p.id)], p.is_banned ? "Banned" : "Active",
      enrollmentCounts[p.id] || 0, attemptStats[p.id]?.count || 0,
      attemptStats[p.id]?.last || "", p.created_at,
    ].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(",")) ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `users-${Date.now()}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleRecalculateAllScores = async () => {
    setIsRecalculating(true);
    try {
      const { data: tests } = await supabase.from("tests").select("id");
      for (const t of tests || []) {
        await supabase.functions.invoke("recalculate-scores", { body: { testId: t.id } });
      }
      toast({ title: "All scores recalculated" });
    } catch (e: any) { toast({ title: e.message, variant: "destructive" }); }
    finally { setIsRecalculating(false); }
  };

  // Stats
  const stats = useMemo(() => {
    const total = profiles.length;
    const admins = userRoles.filter(r => r.role !== "student").length;
    const banned = profiles.filter(p => p.is_banned).length;
    const now = Date.now();
    const active7 = profiles.filter(p => {
      const last = attemptStats[p.id]?.last;
      return last && now - new Date(last).getTime() <= 7 * 86400000;
    }).length;
    return { total, admins, banned, active7, students: total - admins };
  }, [profiles, userRoles, attemptStats]);

  const rowPad = density === "compact" ? "py-2 px-3" : "py-3 px-4";

  return (
    <AdminLayout>
      <div className="p-4 lg:p-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold font-display">
              User <span className="gradient-text">Management</span>
            </h1>
            <p className="text-sm text-muted-foreground">Filter, segment, and act on users in bulk or one-by-one.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <CreateUserDialog onUserCreated={fetchData} />
            <Button variant="outline" size="sm" onClick={() => exportCSV(false)}>
              <Download className="w-4 h-4 mr-2" />Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={fetchData} disabled={isLoading}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />Refresh
            </Button>
            <Button variant="outline" size="sm" onClick={handleRecalculateAllScores} disabled={isRecalculating}>
              <RefreshCw className={cn("w-4 h-4 mr-2", isRecalculating && "animate-spin")} />
              Recalc Scores
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-5">
          <Stat label="Total" value={stats.total} />
          <Stat label="Students" value={stats.students} />
          <Stat label="Staff" value={stats.admins} accent="text-primary" />
          <Stat label="Banned" value={stats.banned} accent="text-destructive" />
          <Stat label="Active (7d)" value={stats.active7} accent="text-emerald-500" />
        </div>

        {/* Filters */}
        <div className="rounded-xl border bg-card p-3 mb-3 space-y-3">
          <div className="flex flex-col lg:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder="Search name, roll no, phone, city…" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
            </div>
            <Select value={filterRole} onValueChange={setFilterRole}>
              <SelectTrigger className="w-full lg:w-[160px]"><FilterIcon className="w-4 h-4 mr-2" /><SelectValue placeholder="Role" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full lg:w-[140px]"><SelectValue placeholder="Status" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="banned">Banned</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterExam} onValueChange={setFilterExam}>
              <SelectTrigger className="w-full lg:w-[140px]"><SelectValue placeholder="Exam" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any Exam</SelectItem>
                {exams.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={filterEnrollment} onValueChange={setFilterEnrollment}>
              <SelectTrigger className="w-full lg:w-[160px]"><SelectValue placeholder="Enrollment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="enrolled">Enrolled</SelectItem>
                <SelectItem value="none">Not enrolled</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterActivity} onValueChange={setFilterActivity}>
              <SelectTrigger className="w-full lg:w-[150px]"><SelectValue placeholder="Activity" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Any activity</SelectItem>
                <SelectItem value="active7">Active 7d</SelectItem>
                <SelectItem value="active30">Active 30d</SelectItem>
                <SelectItem value="never">Never attempted</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="default">Columns <ChevronDown className="w-4 h-4 ml-1" /></Button>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-52">
                <div className="space-y-2">
                  {COLUMNS.map(c => (
                    <label key={c.key} className="flex items-center gap-2 text-sm cursor-pointer">
                      <Checkbox
                        checked={visibleCols.has(c.key)}
                        disabled={c.required}
                        onCheckedChange={() => {
                          setVisibleCols(s => {
                            const n = new Set(s);
                            n.has(c.key) ? n.delete(c.key) : n.add(c.key);
                            return n;
                          });
                        }}
                      />
                      {c.label}
                    </label>
                  ))}
                  <div className="pt-2 border-t">
                    <Label className="text-xs">Density</Label>
                    <Select value={density} onValueChange={(v) => setDensity(v as Density)}>
                      <SelectTrigger className="h-8 mt-1"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="comfortable">Comfortable</SelectItem>
                        <SelectItem value="compact">Compact</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="flex flex-wrap items-center gap-2 rounded-lg bg-primary/10 border border-primary/30 px-3 py-2">
              <span className="text-sm font-medium">{selected.size} selected</span>
              <span className="flex-1" />
              <Button size="sm" variant="outline" onClick={() => setBulkNotifyOpen(true)}><Mail className="w-3.5 h-3.5 mr-1" />Notify</Button>
              <Button size="sm" variant="outline" onClick={() => setBulkRoleOpen(true)}><Shield className="w-3.5 h-3.5 mr-1" />Set Role</Button>
              <Button size="sm" variant="outline" onClick={() => bulkBan(true)}><Ban className="w-3.5 h-3.5 mr-1" />Ban</Button>
              <Button size="sm" variant="outline" onClick={() => bulkBan(false)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />Unban</Button>
              <Button size="sm" variant="outline" onClick={() => exportCSV(true)}><Download className="w-3.5 h-3.5 mr-1" />Export</Button>
              <Button size="sm" variant="destructive" onClick={bulkDelete}><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
              <Button size="sm" variant="ghost" onClick={() => setSelected(new Set())}>Clear</Button>
            </div>
          )}
        </div>

        {/* Table */}
        <div className="rounded-xl border bg-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 sticky top-0 z-10">
                <tr className="border-b">
                  <th className={cn("text-left font-medium", rowPad, "w-10")}>
                    <Checkbox checked={allOnPageSelected} onCheckedChange={toggleSelectAllOnPage} />
                  </th>
                  {visibleCols.has("user") && <Th label="User" sortable onSort={() => toggleSort("name")} active={sortKey === "name"} dir={sortDir} pad={rowPad} />}
                  {visibleCols.has("role") && <th className={cn("text-left font-medium", rowPad)}>Role</th>}
                  {visibleCols.has("exam") && <th className={cn("text-left font-medium", rowPad)}>Exam</th>}
                  {visibleCols.has("enrollments") && <Th label="Batches" sortable onSort={() => toggleSort("enrollments")} active={sortKey === "enrollments"} dir={sortDir} pad={rowPad} />}
                  {visibleCols.has("attempts") && <Th label="Attempts" sortable onSort={() => toggleSort("attempts")} active={sortKey === "attempts"} dir={sortDir} pad={rowPad} />}
                  {visibleCols.has("last_active") && <Th label="Last Active" sortable onSort={() => toggleSort("last_active")} active={sortKey === "last_active"} dir={sortDir} pad={rowPad} />}
                  {visibleCols.has("status") && <th className={cn("text-left font-medium", rowPad)}>Status</th>}
                  {visibleCols.has("joined") && <Th label="Joined" sortable onSort={() => toggleSort("joined")} active={sortKey === "joined"} dir={sortDir} pad={rowPad} />}
                  <th className={cn("text-right font-medium", rowPad)}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={20} className="py-16 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></td></tr>
                ) : pageItems.length === 0 ? (
                  <tr><td colSpan={20} className="py-16 text-center text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-2 opacity-30" />No users match these filters</td></tr>
                ) : pageItems.map((p, idx) => {
                  const role = getUserRole(p.id);
                  const last = attemptStats[p.id]?.last;
                  return (
                    <motion.tr
                      key={p.id}
                      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: Math.min(idx, 10) * 0.01 }}
                      className={cn("border-b border-border/40 hover:bg-secondary/40 transition-colors", selected.has(p.id) && "bg-primary/5")}
                    >
                      <td className={rowPad}>
                        <Checkbox checked={selected.has(p.id)} onCheckedChange={() => toggleSelect(p.id)} />
                      </td>
                      {visibleCols.has("user") && (
                        <td className={rowPad}>
                          <button onClick={() => { setDrawerUser(p); setDrawerOpen(true); }} className="flex items-center gap-3 text-left">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-fuchsia-600 flex items-center justify-center text-xs font-semibold text-white">
                              {p.full_name?.charAt(0) || "U"}
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium truncate max-w-[200px]">{p.full_name || "Unknown"}</div>
                              <div className="text-xs text-muted-foreground font-mono">{p.roll_number || "—"}</div>
                            </div>
                          </button>
                        </td>
                      )}
                      {visibleCols.has("role") && (
                        <td className={rowPad}>
                          <Select value={role} onValueChange={(v) => updateRole(p.id, v as AppRole)}>
                            <SelectTrigger className={cn("h-7 text-xs w-[140px]", roleBadgeColors[role])}>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
                            </SelectContent>
                          </Select>
                        </td>
                      )}
                      {visibleCols.has("exam") && <td className={rowPad}><span className="text-xs">{p.target_exam || "—"}</span></td>}
                      {visibleCols.has("enrollments") && <td className={rowPad}><Badge variant="secondary">{enrollmentCounts[p.id] || 0}</Badge></td>}
                      {visibleCols.has("attempts") && <td className={rowPad}><Badge variant="outline">{attemptStats[p.id]?.count || 0}</Badge></td>}
                      {visibleCols.has("last_active") && <td className={rowPad}><span className="text-xs text-muted-foreground">{last ? new Date(last).toLocaleDateString() : "Never"}</span></td>}
                      {visibleCols.has("status") && (
                        <td className={rowPad}>
                          {p.is_banned ? (
                            <Badge variant="destructive" className="gap-1"><Ban className="w-3 h-3" />Banned</Badge>
                          ) : (
                            <Badge className="bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-emerald-500/30">Active</Badge>
                          )}
                        </td>
                      )}
                      {visibleCols.has("joined") && <td className={rowPad}><span className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString()}</span></td>}
                      <td className={cn(rowPad, "text-right")}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><MoreHorizontal className="w-4 h-4" /></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuLabel className="text-xs">{p.full_name}</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => { setDrawerUser(p); setDrawerOpen(true); }}>View details</DropdownMenuItem>
                            {p.phone && (
                              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(p.phone!); toast({ title: "Phone copied" }); }}>
                                <Copy className="w-3.5 h-3.5 mr-2" />Copy phone
                              </DropdownMenuItem>
                            )}
                            {p.roll_number && (
                              <DropdownMenuItem onClick={() => { navigator.clipboard.writeText(p.roll_number!); toast({ title: "Roll No copied" }); }}>
                                <Copy className="w-3.5 h-3.5 mr-2" />Copy roll no
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem onClick={() => quickBan(p)}>
                              {p.is_banned ? <><CheckCircle2 className="w-3.5 h-3.5 mr-2" />Unban</> : <><Ban className="w-3.5 h-3.5 mr-2" />Ban 7 days</>}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-t bg-muted/30 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <span>Showing <b className="text-foreground">{(page - 1) * pageSize + 1}-{Math.min(page * pageSize, filtered.length)}</b> of <b className="text-foreground">{filtered.length}</b></span>
              <Select value={String(pageSize)} onValueChange={v => setPageSize(parseInt(v))}>
                <SelectTrigger className="h-7 w-[70px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100, 200].map(n => <SelectItem key={n} value={String(n)}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-1">
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(1)}>«</Button>
              <Button size="sm" variant="outline" disabled={page === 1} onClick={() => setPage(p => p - 1)}>‹</Button>
              <span className="px-2">Page {page} / {totalPages}</span>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>›</Button>
              <Button size="sm" variant="outline" disabled={page === totalPages} onClick={() => setPage(totalPages)}>»</Button>
            </div>
          </div>
        </div>

        {/* Drawer */}
        <UserManagementDrawer
          user={drawerUser}
          userEmail={drawerUser ? emails[drawerUser.id] || null : null}
          userRole={drawerUser ? getUserRole(drawerUser.id) : "student"}
          open={drawerOpen}
          onOpenChange={setDrawerOpen}
          onUpdate={fetchData}
        />

        {/* Bulk notification */}
        <Dialog open={bulkNotifyOpen} onOpenChange={setBulkNotifyOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Send notification to {selected.size} users</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <Input placeholder="Subject" value={bulkSubject} onChange={e => setBulkSubject(e.target.value)} />
              <Textarea rows={6} placeholder="Message..." value={bulkMessage} onChange={e => setBulkMessage(e.target.value)} />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkNotifyOpen(false)}>Cancel</Button>
              <Button onClick={bulkSendNotification} disabled={bulkSending || !bulkSubject || !bulkMessage}>
                {bulkSending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Send
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Bulk role */}
        <Dialog open={bulkRoleOpen} onOpenChange={setBulkRoleOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Assign role to {selected.size} users</DialogTitle>
            </DialogHeader>
            <Select value={bulkRole} onValueChange={(v) => setBulkRole(v as AppRole)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ALL_ROLES.map(r => <SelectItem key={r} value={r}>{roleLabels[r]}</SelectItem>)}
              </SelectContent>
            </Select>
            <DialogFooter>
              <Button variant="outline" onClick={() => setBulkRoleOpen(false)}>Cancel</Button>
              <Button onClick={bulkAssignRole}>Apply</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

function Stat({ label, value, accent }: { label: string; value: number; accent?: string }) {
  return (
    <div className="rounded-xl border bg-card p-3">
      <div className={cn("text-2xl font-bold", accent)}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}

function Th({ label, sortable, onSort, active, dir, pad }: { label: string; sortable?: boolean; onSort?: () => void; active?: boolean; dir?: SortDir; pad: string }) {
  return (
    <th className={cn("text-left font-medium", pad)}>
      {sortable ? (
        <button onClick={onSort} className={cn("inline-flex items-center gap-1 hover:text-foreground transition-colors", active ? "text-foreground" : "text-muted-foreground")}>
          {label}
          <ArrowUpDown className={cn("w-3 h-3", active && "text-primary", active && dir === "asc" && "rotate-180")} />
        </button>
      ) : label}
    </th>
  );
}
