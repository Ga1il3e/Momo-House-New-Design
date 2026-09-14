"use client";

import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";
import {
  easeOut,
  usePrefersReducedMotion,
} from "@/components/motion/usePrefersReducedMotion";

const WEEKDAYS = ["Lu", "Ma", "Me", "Je", "Ve", "Sa", "Di"];
const MONTHS = [
  "Janvier",
  "Février",
  "Mars",
  "Avril",
  "Mai",
  "Juin",
  "Juillet",
  "Août",
  "Septembre",
  "Octobre",
  "Novembre",
  "Décembre",
];

type DatePickerProps = {
  value: string;
  onChange: (iso: string) => void;
  minDate?: string;
  required?: boolean;
};

function toIso(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function parseIso(iso: string) {
  if (!iso) return null;
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d);
}

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

export function DatePicker({
  value,
  onChange,
  minDate,
}: DatePickerProps) {
  const reduced = usePrefersReducedMotion();
  const todayIso = useMemo(() => {
    const now = new Date();
    return toIso(now.getFullYear(), now.getMonth(), now.getDate());
  }, []);

  const today = useMemo(() => parseIso(todayIso)!, [todayIso]);
  const min = useMemo(() => {
    const parsed = minDate ? parseIso(minDate) : null;
    return startOfDay(parsed ?? today);
  }, [minDate, today]);
  const selected = parseIso(value);

  const [view, setView] = useState(() => {
    const base = selected ?? today;
    return new Date(base.getFullYear(), base.getMonth(), 1);
  });

  const cells = useMemo(() => {
    const year = view.getFullYear();
    const month = view.getMonth();
    const first = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startPad = (first.getDay() + 6) % 7;
    const items: Array<{
      day: number | null;
      iso: string | null;
      disabled: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    for (let i = 0; i < startPad; i++) {
      items.push({
        day: null,
        iso: null,
        disabled: true,
        isToday: false,
        isSelected: false,
      });
    }

    const todayTime = today.getTime();
    const selectedTime = selected
      ? startOfDay(selected).getTime()
      : null;
    const minTime = min.getTime();

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const iso = toIso(year, month, day);
      const time = date.getTime();
      items.push({
        day,
        iso,
        disabled: time < minTime,
        isToday: time === todayTime,
        isSelected: selectedTime !== null && time === selectedTime,
      });
    }

    while (items.length % 7 !== 0) {
      items.push({
        day: null,
        iso: null,
        disabled: true,
        isToday: false,
        isSelected: false,
      });
    }

    return items;
  }, [view, min, selected, today]);

  const canGoPrev = (() => {
    const prevMonth = new Date(view.getFullYear(), view.getMonth(), 0);
    return prevMonth >= new Date(min.getFullYear(), min.getMonth(), 1);
  })();

  function shiftMonth(delta: number) {
    setView((v) => new Date(v.getFullYear(), v.getMonth() + delta, 1));
  }

  const label = selected
    ? new Intl.DateTimeFormat("fr-FR", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(selected)
    : "Choisissez un jour";

  return (
    <div className="overflow-hidden rounded-2xl border border-[rgba(228,190,186,0.5)] bg-paper-soft">
      <div className="flex items-center justify-between gap-3 border-b border-[rgba(228,190,186,0.35)] bg-burgundy px-4 py-3 text-white">
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-[1.5px] text-amber-soft">
            Votre soirée
          </p>
          <p className="font-display text-lg font-bold capitalize leading-tight">
            {label}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            aria-label="Mois précédent"
            disabled={!canGoPrev}
            onClick={() => shiftMonth(-1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg transition hover:bg-white/20 disabled:opacity-30"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Mois suivant"
            onClick={() => shiftMonth(1)}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg transition hover:bg-white/20"
          >
            ›
          </button>
        </div>
      </div>

      <div className="px-4 pb-4 pt-3">
        <p className="mb-3 text-center font-display text-base font-semibold text-ink">
          {MONTHS[view.getMonth()]} {view.getFullYear()}
        </p>

        <div className="mb-2 grid grid-cols-7 gap-1">
          {WEEKDAYS.map((d) => (
            <div
              key={d}
              className="py-1 text-center font-label text-[10px] font-bold uppercase tracking-wide text-ink-muted/70"
            >
              {d}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={`${view.getFullYear()}-${view.getMonth()}`}
            className="grid grid-cols-7 gap-1"
            initial={reduced ? false : { opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={reduced ? undefined : { opacity: 0 }}
            transition={{
              duration: reduced ? 0 : 0.2,
              ease: easeOut,
            }}
          >
            {cells.map((cell, i) => {
              if (cell.day === null) {
                return <div key={`empty-${i}`} className="aspect-square" />;
              }

              return (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={cell.disabled}
                  onClick={() => cell.iso && onChange(cell.iso)}
                  className={`aspect-square rounded-xl font-label text-sm font-semibold transition ${
                    cell.isSelected
                      ? "bg-burgundy text-white shadow-[0_2px_0_var(--burgundy-press)]"
                      : cell.isToday
                        ? "border border-burgundy/40 bg-cream-blush text-burgundy"
                        : cell.disabled
                          ? "cursor-not-allowed text-ink-muted/30"
                          : "text-ink hover:bg-cream-peach/70"
                  }`}
                >
                  {cell.day}
                </button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => {
              const iso = toIso(
                today.getFullYear(),
                today.getMonth(),
                today.getDate(),
              );
              if (today >= min) {
                onChange(iso);
                setView(new Date(today.getFullYear(), today.getMonth(), 1));
              }
            }}
            className="font-label text-[10px] font-bold uppercase tracking-wide text-burgundy hover:underline"
          >
            Aujourd&apos;hui
          </button>
          {value ? (
            <button
              type="button"
              onClick={() => onChange("")}
              className="font-label text-[10px] font-bold uppercase tracking-wide text-ink-muted hover:underline"
            >
              Effacer
            </button>
          ) : (
            <span className="font-label text-[10px] uppercase tracking-wide text-ink-muted/50">
              Sélection requise
            </span>
          )}
        </div>
      </div>

      {/* Hidden required field for form validity */}
      <input type="hidden" name="date" value={value} required />
    </div>
  );
}
