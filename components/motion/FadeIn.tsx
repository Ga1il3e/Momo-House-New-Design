"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import type { ReactNode } from "react";
import { easeOut, usePrefersReducedMotion } from "./usePrefersReducedMotion";

export type RevealVariant = "up" | "left" | "right" | "clip";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
  variant?: RevealVariant;
} & Omit<HTMLMotionProps<"div">, "children">;

function hiddenState(variant: RevealVariant, y: number) {
  switch (variant) {
    case "up":
      return { opacity: 0, y };
    case "left":
      return { opacity: 0, x: -56 };
    case "right":
      return { opacity: 0, x: 56 };
    case "clip":
      return {
        opacity: 0,
        clipPath: "inset(16% 12% 16% 12%)",
        scale: 1.08,
      };
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

function visibleState(variant: RevealVariant) {
  switch (variant) {
    case "up":
      return { opacity: 1, y: 0 };
    case "left":
    case "right":
      return { opacity: 1, x: 0 };
    case "clip":
      return { opacity: 1, clipPath: "inset(0% 0% 0% 0%)", scale: 1 };
    default: {
      const _exhaustive: never = variant;
      return _exhaustive;
    }
  }
}

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 44,
  once = true,
  variant = "up",
  ...rest
}: FadeInProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={hiddenState(variant, y)}
      whileInView={visibleState(variant)}
      viewport={{ once, margin: "0px 0px -12% 0px", amount: 0.15 }}
      transition={{ duration: 0.85, delay, ease: easeOut }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
