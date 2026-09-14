"use client";

import { motion, type HTMLMotionProps } from "motion/react";
import { useEffect, useState, type ReactNode } from "react";
import { easeOut, usePrefersReducedMotion } from "./usePrefersReducedMotion";

type FadeInProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  once?: boolean;
} & Omit<HTMLMotionProps<"div">, "children">;

export function FadeIn({
  children,
  className,
  delay = 0,
  y = 20,
  once = true,
  ...rest
}: FadeInProps) {
  const reduced = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  if (!ready || reduced) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once, margin: "0px 0px -8% 0px" }}
      transition={{ duration: 0.55, delay, ease: easeOut }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
