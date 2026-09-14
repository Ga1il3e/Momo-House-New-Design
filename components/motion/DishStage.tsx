"use client";

import Image from "next/image";
import { motion } from "motion/react";
import type { ReactNode } from "react";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

type DishStageProps = {
  children: ReactNode;
  className?: string;
  /** Larger stage for signature cards */
  size?: "md" | "lg";
};

export function DishStage({
  children,
  className = "",
  size = "md",
}: DishStageProps) {
  const reduced = usePrefersReducedMotion();
  const height = size === "lg" ? "h-56 sm:h-64" : "h-44 sm:h-52";

  return (
    <motion.div
      className={`relative ${height} overflow-hidden rounded-2xl ${className}`}
      style={{
        background:
          "radial-gradient(ellipse at 50% 30%, rgba(255,183,128,0.28), transparent 55%), radial-gradient(ellipse at 50% 100%, rgba(152,0,18,0.12), transparent 50%), #f3eee6",
        perspective: 800,
      }}
      whileHover={
        reduced
          ? undefined
          : { y: -6, rotateX: 4, rotateY: -3, scale: 1.02 }
      }
      whileTap={reduced ? undefined : { scale: 0.98 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
    >
      <div className="absolute inset-0 flex items-end justify-center pb-3 pt-6">
        {children}
      </div>
      <div
        className="pointer-events-none absolute bottom-3 left-1/2 h-3 w-2/3 -translate-x-1/2 rounded-[100%] bg-bistro/25 blur-md"
        aria-hidden
      />
    </motion.div>
  );
}

type FloatingPlateProps = {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function FloatingPlate({
  src,
  alt,
  className = "",
  priority = false,
}: FloatingPlateProps) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.div
      className={`relative ${className}`}
      animate={
        reduced
          ? undefined
          : { y: [0, -8, 0] }
      }
      transition={
        reduced
          ? undefined
          : { duration: 4.5, repeat: Infinity, ease: "easeInOut" }
      }
    >
      <Image
        src={src}
        alt={alt}
        width={480}
        height={480}
        priority={priority}
        sizes="(max-width: 640px) 70vw, 320px"
        className="relative z-10 mx-auto h-full w-auto max-h-full object-contain drop-shadow-[0_18px_28px_rgba(29,28,21,0.28)]"
      />
      <div
        className="absolute bottom-0 left-1/2 h-4 w-3/5 -translate-x-1/2 rounded-[100%] bg-bistro/30 blur-md"
        aria-hidden
      />
    </motion.div>
  );
}
