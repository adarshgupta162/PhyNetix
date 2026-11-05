import { useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Uses the original square PhyNetix artwork as a clipped wordmark/atom mark.
 * The compact crop reveals only the atom; the expanded crop reveals the full wordmark.
 */
export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [missing, setMissing] = useState(false);
  return (
    <span className={cn("relative inline-flex shrink-0 overflow-hidden", compact ? "h-9 w-9" : "h-10 w-[164px]", className)}>
      {!missing ? (
        <img
          src="/logo.png"
          alt="PhyNetix"
          onError={() => setMissing(true)}
          className={cn(
            "absolute top-1/2 max-w-none -translate-y-1/2 object-contain",
            compact ? "left-[-12px] h-36 w-36 mix-blend-screen" : "left-0 h-[164px] w-[164px] mix-blend-screen"
          )}
        />
      ) : (
        <span className={cn("grid h-full w-full place-items-center font-semibold leading-none text-[#13DCCB]", compact ? "text-sm" : "text-xl")}>
          {compact ? "P" : "PHYNETIX"}
        </span>
      )}
    </span>
  );
}
