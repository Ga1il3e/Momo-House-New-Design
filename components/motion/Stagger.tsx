"use client";

import { motion } from "motion/react";
import { createContext, useContext, type ReactNode } from "react";
import { easeOut, fadeUp, usePrefersReducedMotion } from "./usePrefersReducedMotion";

const StaggerActiveContext = createContext(false);

type StaggerProps = {
  children: ReactNode;
  className?: string;
  delay?: number;
  stagger?: number;
};

export function Stagger({
  children,
  className,
  delay = 0.08,
  stagger = 0.14,
}: StaggerProps) {
  const reduced = usePrefersReducedMotion();

  if (reduced) {
    return (
      <StaggerActiveContext.Provider value={false}>
        <div className={className}>{children}</div>
      </StaggerActiveContext.Provider>
    );
  }

  return (
    <StaggerActiveContext.Provider value>
      <motion.div
        className={className}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "0px 0px -10% 0px", amount: 0.12 }}
        variants={{
          hidden: {},
          visible: {
            transition: {
              delayChildren: delay,
              staggerChildren: stagger,
            },
          },
        }}
      >
        {children}
      </motion.div>
    </StaggerActiveContext.Provider>
  );
}

type StaggerItemProps = {
  children: ReactNode;
  className?: string;
};

export function StaggerItem({ children, className }: StaggerItemProps) {
  const active = useContext(StaggerActiveContext);

  if (!active) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      variants={fadeUp}
      transition={{ duration: 0.7, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
