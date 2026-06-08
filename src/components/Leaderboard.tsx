import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Trophy, Medal, Crown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  full_name: string;
  roll_number: string | null;
  score: number;
  total_marks: number;
  accuracy: number;
  time_taken_seconds: number;
}

interface LeaderboardProps {
  testId: string;
  currentUserId?: string;
}

export default function Leaderboard({ testId, currentUserId }: LeaderboardProps) {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [testId]);

  const fetchLeaderboard = async () => {
    const { data: attempts } = await supabase
      .from("test_attempts")
      .select(`
        user_id,
        score,
        total_marks,
        time_taken_seconds,
        rank,
        percentile
      `)
      .eq("test_id", testId)
      .not("completed_at", "is", null)
      .order("score", { ascending: false })
      .order("time_taken_seconds", { ascending: true });

    if (attempts && attempts.length > 0) {
      // Fetch profiles for all users
      const userIds = [...new Set(attempts.map(a => a.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, roll_number")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      const leaderboard = attempts.map((attempt, index) => {
        const profile = profileMap.get(attempt.user_id);
        return {
          rank: index + 1,
          user_id: attempt.user_id,
          full_name: profile?.full_name || "Anonymous",
          roll_number: profile?.roll_number || null,
          score: attempt.score || 0,
          total_marks: attempt.total_marks || 0,
          accuracy: attempt.total_marks ? Math.round((attempt.score || 0) / attempt.total_marks * 100) : 0,
          time_taken_seconds: attempt.time_taken_seconds || 0,
        };
      });

      setEntries(leaderboard);
    }
    setLoading(false);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-600" />;
    return <span className="w-5 h-5 flex items-center justify-center text-sm font-bold">{rank}</span>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="text-center p-8 text-muted-foreground">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No completed attempts yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-muted-foreground uppercase">
        <div className="col-span-1">Rank</div>
        <div className="col-span-4">Student</div>
        <div className="col-span-2">Roll No.</div>
        <div className="col-span-2 text-center">Score</div>
        <div className="col-span-2 text-center">Accuracy</div>
        <div className="col-span-1 text-right">Time</div>
      </div>

      {entries.map((entry, index) => (
        <motion.div
          key={entry.user_id}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className={cn(
            "grid grid-cols-12 gap-2 px-4 py-3 rounded-lg items-center",
            entry.user_id === currentUserId && "bg-primary/10 border border-primary/30",
            entry.rank === 1 && "bg-yellow-500/10 border border-yellow-500/30",
            entry.rank === 2 && "bg-gray-400/10",
            entry.rank === 3 && "bg-amber-600/10",
            entry.rank > 3 && entry.user_id !== currentUserId && "bg-secondary/30"
          )}
        >
          <div className="col-span-1 flex items-center">
            {getRankIcon(entry.rank)}
          </div>
          <div className="col-span-4 font-medium truncate">
            {entry.full_name}
            {entry.user_id === currentUserId && (
              <span className="ml-2 text-xs text-primary">(You)</span>
            )}
          </div>
          <div className="col-span-2 text-sm text-muted-foreground">
            {entry.roll_number || "-"}
          </div>
          <div className="col-span-2 text-center font-semibold">
            {entry.score}/{entry.total_marks}
          </div>
          <div className="col-span-2 text-center">
            <span className={cn(
              "px-2 py-1 rounded text-xs font-medium",
              entry.accuracy >= 80 && "bg-success/20 text-success",
              entry.accuracy >= 50 && entry.accuracy < 80 && "bg-warning/20 text-warning",
              entry.accuracy < 50 && "bg-destructive/20 text-destructive"
            )}>
              {entry.accuracy}%
            </span>
          </div>
          <div className="col-span-1 text-right text-sm text-muted-foreground">
            {formatTime(entry.time_taken_seconds)}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
