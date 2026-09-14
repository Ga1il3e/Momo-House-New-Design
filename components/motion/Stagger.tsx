"use client";

import { motion } from "motion/react";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
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
  delay = 0,
  stagger = 0.08,
}: StaggerProps) {
  const reduced = usePrefersReducedMotion();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setReady(true);
  }, []);

  const active = ready && !reduced;

  if (!active) {
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
        viewport={{ once: true, margin: "0px 0px -6% 0px" }}
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
      transition={{ duration: 0.45, ease: easeOut }}
    >
      {children}
    </motion.div>
  );
}
