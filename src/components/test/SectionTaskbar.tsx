import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Section {
  id: string;
  name: string;
  type: string;
  subjectName: string;
  questionIds: string[];
}

interface SectionTaskbarProps {
  sections: Section[];
  activeSection: string;
  onSectionChange: (sectionId: string) => void;
  answers: Record<string, string | string[]>;
  markedForReview: Set<string>;
  viewedQuestions: Set<string>;
}

export default function SectionTaskbar({
  sections,
  activeSection,
  onSectionChange,
  answers,
  markedForReview,
  viewedQuestions
}: SectionTaskbarProps) {
  const getSectionStats = (section: Section) => {
    let attempted = 0;
    let notAttempted = 0;
    let unseen = 0;
    let marked = 0;
    let attemptedMarked = 0;

    section.questionIds.forEach(qId => {
      const ans = answers[qId];
      const isAnswered = ans !== undefined && ans !== '' && 
        (Array.isArray(ans) ? ans.length > 0 : true);
      const isMarked = markedForReview.has(qId);
      const isSeen = viewedQuestions.has(qId);

      if (isAnswered && isMarked) {
        attemptedMarked++;
      } else if (isAnswered) {
        attempted++;
      } else if (isMarked) {
        marked++;
      } else if (!isSeen) {
        unseen++;
      } else {
        notAttempted++;
      }
    });

    return { attempted, notAttempted, unseen, marked, attemptedMarked, total: section.questionIds.length };
  };

  const formatSectionName = (section: Section) => {
    const typeLabel = section.type === 'single_choice' ? 'Single' 
      : section.type === 'multiple_choice' ? 'Multiple' 
      : 'Integer';
    return `${section.subjectName} (${typeLabel})`;
  };

  return (
    <div className="flex items-center gap-1 overflow-x-auto p-2 bg-secondary/30 border-b border-border">
      {sections.map((section) => {
        const stats = getSectionStats(section);
        const isActive = activeSection === section.id;

        return (
          <TooltipProvider key={section.id}>
            <Tooltip delayDuration={200}>
              <TooltipTrigger asChild>
                <button
                  onClick={() => onSectionChange(section.id)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground"
                  )}
                >
                  <span>{formatSectionName(section)}</span>
                  <div className="flex items-center gap-1">
                    <span className={cn(
                      "px-1.5 py-0.5 rounded text-xs",
                      isActive ? "bg-primary-foreground/20" : "bg-background/50"
                    )}>
                      {stats.attempted + stats.attemptedMarked}/{stats.total}
                    </span>
                    <Info className="w-3.5 h-3.5 opacity-60" />
                  </div>
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="p-3">
                <div className="space-y-1.5 text-xs">
                  <div className="font-semibold mb-2">{formatSectionName(section)}</div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[hsl(142,76%,36%)]" />
                    <span>Attempted: {stats.attempted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-secondary" />
                    <span>Not Attempted: {stats.notAttempted}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-muted" />
                    <span>Unseen: {stats.unseen}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded bg-[hsl(270,60%,50%)]" />
                    <span>Marked for Review: {stats.marked}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded" style={{
                      background: 'linear-gradient(135deg, hsl(142,76%,36%) 50%, hsl(270,60%,50%) 50%)'
                    }} />
                    <span>Attempted + Marked: {stats.attemptedMarked}</span>
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      })}
    </div>
  );
}
