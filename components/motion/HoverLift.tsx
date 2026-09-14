"use client";

import type { ReactNode } from "react";

type HoverLiftProps = {
  children: ReactNode;
  className?: string;
  /** Kept for API compatibility; CSS uses a soft 4px lift. */
  lift?: number;
};

/** CSS hover lift — avoids Motion SSR/hydration mismatches. */
export function HoverLift({ children, className }: HoverLiftProps) {
  return (
    <div
      className={`transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1 ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
