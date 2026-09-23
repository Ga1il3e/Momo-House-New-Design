"use client";

import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { easeOut, usePrefersReducedMotion } from "./usePrefersReducedMotion";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduced = usePrefersReducedMotion();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={reduced ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        exit={reduced ? undefined : { opacity: 0, y: -12 }}
        transition={{ duration: reduced ? 0.01 : 0.45, ease: easeOut }}
        className="flex flex-1 flex-col"
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
