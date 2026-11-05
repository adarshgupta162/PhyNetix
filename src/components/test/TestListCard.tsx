import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { HelpCircle, Clock, FileText } from "lucide-react";
import SyllabusDialog from "./SyllabusDialog";
import { format } from "date-fns";

export interface TestCardData {
  id: string;
  name: string;
  syllabus_subtitle?: string | null;
  syllabus?: string | null;
  duration_minutes: number;
  total_questions?: number;
  total_marks?: number;
  scheduled_at?: string | null;
  isCompleted?: boolean;
  isInProgress?: boolean;
  attemptId?: string;
}

interface Props {
  test: TestCardData;
  onAttempt?: () => void;
  primaryLabel?: string;
  /** Hide the Attempt/Resume/Analysis CTA — used on Batch Details (read-only). */
  hideAttempt?: boolean;
}

export default function TestListCard({ test, onAttempt, primaryLabel, hideAttempt }: Props) {
  const navigate = useNavigate();
  const [syllabusOpen, setSyllabusOpen] = useState(false);

  const isUpcoming = test.scheduled_at && new Date(test.scheduled_at) > new Date();
  const ctaLabel = primaryLabel || (test.isCompleted ? "View Analysis" : test.isInProgress ? "Resume" : "Attempt Test");

  const handleAttempt = () => {
    if (isUpcoming) return;
    if (onAttempt) onAttempt();
    else if (test.isCompleted) navigate(`/test/${test.id}/analysis`);
    else navigate(`/test/${test.id}`);
  };

  return (
    <>
      <div className="group overflow-hidden rounded-xl border border-white/[0.08] bg-[#0B1725] transition-colors duration-200 hover:border-sky-400/20">
        <div className="space-y-3 p-4">
          <div>
            <h3 className="text-sm font-semibold leading-tight text-slate-100 transition-colors group-hover:text-white">{test.name}</h3>
            {test.syllabus_subtitle && (
              <p className="mt-1 text-xs text-slate-500">{test.syllabus_subtitle}</p>
            )}
          </div>
          <div className={hideAttempt ? "" : "grid grid-cols-2 gap-2"}>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-lg border-white/10 bg-white/[0.03] text-slate-300 hover:bg-white/[0.07] hover:text-white"
              onClick={() => setSyllabusOpen(true)}
            >
              View Syllabus
            </Button>
            {!hideAttempt && (
              <Button
                size="sm"
                className="rounded-lg bg-[#1687C9] text-white hover:bg-[#2099DB]"
                disabled={!!isUpcoming}
                onClick={handleAttempt}
              >
                {ctaLabel}
              </Button>
            )}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-white/[0.06] bg-black/10 px-4 py-2.5 text-[10px] text-slate-500">
          {test.total_questions != null && (
            <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /><b className="text-slate-300">{test.total_questions} Qs</b></span>
          )}
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><b className="text-foreground">{test.duration_minutes} Min</b></span>
          {test.total_marks != null && (
            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Total Marks: <b className="text-foreground">{test.total_marks}</b></span>
          )}
          {isUpcoming && (
            <span className="ml-auto rounded bg-sky-400/10 px-2 py-0.5 font-medium text-sky-300">
              Releasing: {format(new Date(test.scheduled_at!), "d MMM (EEE), hh:mm a")}
            </span>
          )}
        </div>
      </div>
      <SyllabusDialog
        open={syllabusOpen}
        onOpenChange={setSyllabusOpen}
        testName={test.name}
        subtitle={test.syllabus_subtitle}
        syllabus={test.syllabus}
      />
    </>
  );
}
