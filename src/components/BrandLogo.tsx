import { useState } from "react";
import { cn } from "@/lib/utils";

/** Compact crop of the original PhyNetix artwork for the student workspace sidebar. */
export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [missing, setMissing] = useState(false);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 overflow-hidden",
        compact ? "h-8 w-8" : "h-8 w-[142px]",
        className,
      )}
    >
      {!missing ? (
        <img
          src="/logo.png"
          alt="PhyNetix"
          onError={() => setMissing(true)}
          className={cn(
            "pointer-events-none absolute top-1/2 max-w-none -translate-y-1/2 object-contain",
            compact
              ? "left-[-9px] h-32 w-32 mix-blend-screen"
              : "left-0 h-[142px] w-[142px] mix-blend-screen",
          )}
        />
      ) : (
        <span className={cn(
          "grid h-full w-full place-items-center font-semibold leading-none text-[#13DCCB]",
          compact ? "text-sm" : "text-lg tracking-tight",
        )}>
          {compact ? "P" : "PHYNETIX"}
        </span>
      )}
    </span>
  );
}
