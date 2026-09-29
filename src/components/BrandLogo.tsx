import { useState } from "react";
import { cn } from "@/lib/utils";

/** Place the original PhyNetix logo at public/logo.png to replace the text fallback everywhere. */
export function BrandLogo({ className, compact = false }: { className?: string; compact?: boolean }) {
  const [missing, setMissing] = useState(false);
  return (
    <span className={cn("inline-flex items-center font-display font-bold text-primary", className)}>
      {!missing ? (
        <img src="/logo.png" alt="PhyNetix" className={cn("object-contain object-left", compact ? "h-9 w-9" : "h-10 max-w-40")} onError={() => setMissing(true)} />
      ) : (
        <span className={cn("leading-none", compact ? "text-sm" : "text-xl")}>{compact ? "P" : "PhyNetix"}</span>
      )}
    </span>
  );
}