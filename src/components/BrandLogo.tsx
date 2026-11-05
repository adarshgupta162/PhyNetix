import { useState } from "react";
import { Atom } from "lucide-react";
import { cn } from "@/lib/utils";

/** Dedicated, tightly-cropped brand assets; never scale the square source artwork inside the sidebar. */
export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  const src = compact ? "/phynetix-mark.svg" : "/phynetix-wordmark.svg";

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden",
        compact ? "h-7 w-7" : "h-7 w-[132px]",
        className,
      )}
      aria-label="PhyNetix"
    >
      {!loaded && !failed && (
        <span className={cn("absolute inset-0 flex items-center", compact ? "justify-center" : "gap-2")}>
          <Atom className="h-6 w-6 shrink-0 animate-[spin_7s_linear_infinite] text-[#13DCCB]" strokeWidth={1.6} />
          {!compact && <span className="h-3 w-20 overflow-hidden rounded-sm bg-white/[0.06]"><span className="block h-full w-1/2 animate-pulse bg-gradient-to-r from-transparent via-[#13DCCB]/35 to-transparent" /></span>}
        </span>
      )}
      {!failed ? (
        <img
          src={src}
          alt="PhyNetix"
          onLoad={() => setLoaded(true)}
          onError={() => setFailed(true)}
          className={cn("relative z-[1] block max-h-full max-w-full object-contain transition-opacity duration-300", loaded ? "opacity-100" : "opacity-0")}
        />
      ) : (
        <span className={cn("relative z-[1] font-semibold tracking-tight text-[#13DCCB]", compact ? "text-xs" : "text-sm")}>
          {compact ? "P" : "PHYNETIX"}
        </span>
      )}
    </span>
  );
}
