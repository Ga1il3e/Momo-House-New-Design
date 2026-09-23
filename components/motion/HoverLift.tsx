"use client";

import type { ReactNode } from "react";

type HoverLiftProps = {
  children: ReactNode;
  className?: string;
  /** Kept for API compatibility; CSS uses an 8px lift. */
  lift?: number;
};

/** CSS hover lift — avoids Motion SSR/hydration mismatches. */
export function HoverLift({ children, className }: HoverLiftProps) {
  return (
    <div
      className={`transition-[transform,box-shadow] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-2 hover:shadow-[0_18px_36px_-12px_rgba(29,28,21,0.22)] ${className ?? ""}`}
    >
      {children}
    </div>
  );
}
