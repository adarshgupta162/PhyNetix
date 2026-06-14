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
      <div className="rounded-xl border border-border bg-secondary/30 overflow-hidden">
        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-semibold text-base leading-tight">{test.name}</h3>
            {test.syllabus_subtitle && (
              <p className="text-xs text-muted-foreground mt-0.5">{test.syllabus_subtitle}</p>
            )}
          </div>
          <div className={hideAttempt ? "" : "grid grid-cols-2 gap-2"}>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full w-full"
              onClick={() => setSyllabusOpen(true)}
            >
              View Syllabus
            </Button>
            {!hideAttempt && (
              <Button
                size="sm"
                className="rounded-full"
                disabled={!!isUpcoming}
                onClick={handleAttempt}
              >
                {ctaLabel}
              </Button>
            )}
          </div>
        </div>
        <div className="px-4 py-2.5 bg-background/40 border-t border-border/50 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {test.total_questions != null && (
            <span className="flex items-center gap-1"><HelpCircle className="w-3.5 h-3.5" /><b className="text-foreground">{test.total_questions} Qs</b></span>
          )}
          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /><b className="text-foreground">{test.duration_minutes} Min</b></span>
          {test.total_marks != null && (
            <span className="flex items-center gap-1"><FileText className="w-3.5 h-3.5" />Total Marks: <b className="text-foreground">{test.total_marks}</b></span>
          )}
          {isUpcoming && (
            <span className="ml-auto px-2 py-0.5 rounded bg-primary/15 text-primary font-medium">
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
