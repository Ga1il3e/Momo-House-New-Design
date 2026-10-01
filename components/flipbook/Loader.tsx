"use client";

import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PRELOAD } from "@/lib/flipbookMenu";
import { Logo } from "./Logo";

const WORD = "MOMO HOUSE";
const MIN_MS = 2100;

export function Loader({ onDone }: { onDone: () => void }) {
  const [pct, setPct] = useState(0);
  const [exit, setExit] = useState(false);
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  }, [onDone]);

  useEffect(() => {
    let loaded = 0;
    const t0 = performance.now();
    const bump = () => {
      loaded += 1;
    };
    PRELOAD.forEach((src) => {
      const image = new Image();
      image.onload = bump;
      image.onerror = bump;
      image.src = src;
    });
    const tick = setInterval(() => {
      const elapsed = performance.now() - t0;
      const target =
        loaded >= PRELOAD.length && elapsed > MIN_MS
          ? 100
          : Math.min(96, Math.round((elapsed / MIN_MS) * 100));
      setPct((current) => Math.max(current, target));
      if (target === 100) {
        clearInterval(tick);
        setTimeout(() => setExit(true), 260);
        setTimeout(() => doneRef.current(), 1500);
      }
    }, 90);
    return () => clearInterval(tick);
  }, []);

  return (
    <motion.div
      className="loader"
      data-testid="loader"
      initial={false}
      animate={exit ? { clipPath: "inset(0% 0% 100% 0%)" } : { clipPath: "inset(0% 0% 0% 0%)" }}
      transition={{ duration: 1.05, ease: [0.76, 0, 0.24, 1] }}
    >
      <div className="loader-inner">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <Logo size={66} />
        </motion.div>
        <div className="loader-word" aria-label="Momo House">
          {WORD.split("").map((ch, i) => (
            <span className="loader-mask" key={`${ch}-${i}`}>
              <i style={{ animationDelay: `${0.3 + i * 0.05}s` }}>{ch === " " ? "\u00A0" : ch}</i>
            </span>
          ))}
        </div>
        <p className="loader-sub">Cuisine Népalaise</p>
        <div className="loader-bar">
          <i style={{ width: `${pct}%` }} />
        </div>
        <p className="loader-pct" data-testid="loader-pct">
          {pct}%
        </p>
      </div>
    </motion.div>
  );
}
