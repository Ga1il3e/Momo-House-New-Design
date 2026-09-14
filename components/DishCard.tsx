"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";
import { tagClass, type DishCard as DishCardType } from "@/lib/menu";

export function DishCard({ dish }: { dish: DishCardType }) {
  const reduced = usePrefersReducedMotion();

  return (
    <motion.article
      className="flex h-full flex-col justify-between rounded-2xl border border-[rgba(228,190,186,0.4)] bg-white p-6 shadow-sm"
      whileHover={
        reduced
          ? undefined
          : { y: -6, boxShadow: "0 16px 40px rgba(29, 28, 21, 0.12)" }
      }
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
    >
      <div>
        <div className="relative mb-3 h-48 overflow-hidden rounded-xl bg-paper-muted">
          <motion.div
            className="absolute inset-0"
            whileHover={reduced ? undefined : { scale: 1.08 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          >
            <Image
              src={dish.image}
              alt={dish.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
            />
          </motion.div>
          <span
            className={`font-label absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold uppercase ${tagClass(dish.tagTone)}`}
          >
            {dish.tag}
          </span>
        </div>
        <div className="mb-2 flex items-baseline justify-between gap-3 pt-2">
          <h3 className="font-display text-xl font-semibold">{dish.name}</h3>
          <p className="font-display shrink-0 font-bold text-amber-deep">
            {dish.price}
          </p>
        </div>
        <p className="text-sm leading-6 text-ink-muted">{dish.description}</p>
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-paper-muted pt-3">
        <p className="font-label text-sm text-ink-muted">{dish.footerLeft}</p>
        <p className="font-label text-sm font-bold text-burgundy">
          {dish.footerRight}
        </p>
      </div>
    </motion.article>
  );
}
