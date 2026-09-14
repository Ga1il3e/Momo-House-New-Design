"use client";

import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useState } from "react";
import type { HouseId } from "@/lib/houses";
import { houses } from "@/lib/houses";
import {
  easeOut,
  usePrefersReducedMotion,
} from "@/components/motion/usePrefersReducedMotion";

type HeaderProps = {
  variant?: "home" | "house";
  activeHouse?: HouseId;
};

export function Header({ variant = "home", activeHouse }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const isHouse = variant === "house";

  const homeNav = [{ href: "/#histoire", label: "NOTRE HISTOIRE" }];

  const houseNav = [
    {
      href: activeHouse
        ? houses[activeHouse].carteHref
        : "/poissonniere/carte",
      label: "LA CARTE",
    },
    { href: "/#histoire", label: "NOTRE HISTOIRE" },
  ];

  const nav = isHouse ? houseNav : homeNav;

  const montmartreActive =
    activeHouse === "montmartre" || pathname.startsWith("/montmartre");
  const poissonniereActive =
    activeHouse === "poissonniere" || pathname.startsWith("/poissonniere");

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(228,190,186,0.35)] bg-paper/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4 px-4 py-2.5 sm:px-12 sm:py-3">
        <div className="flex min-w-0 items-center gap-3 sm:gap-5">
          <Link href="/" className="flex shrink-0 items-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/logo-wordmark.png"
              alt="Momo House"
              width={140}
              height={72}
              className={`w-auto object-contain ${
                isHouse ? "h-10 sm:h-11" : "h-12 sm:h-[3.75rem]"
              }`}
              decoding="async"
            />
          </Link>

          <div className="relative hidden items-center gap-2 font-label text-xs font-bold uppercase tracking-wide sm:flex sm:text-[11px]">
            <Link
              href="/montmartre"
              className={`relative px-1 py-0.5 transition ${
                montmartreActive
                  ? "text-burgundy"
                  : "text-ink-muted hover:text-burgundy"
              }`}
            >
              Montmartre
              {montmartreActive && (
                <motion.span
                  layoutId="house-active"
                  className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-burgundy"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
            </Link>
            <span className="text-[rgba(152,0,18,0.35)]" aria-hidden>
              |
            </span>
            <Link
              href="/poissonniere"
              className={`relative px-1 py-0.5 transition ${
                poissonniereActive
                  ? "text-burgundy"
                  : "text-ink-muted hover:text-burgundy"
              }`}
            >
              Poissonnière
              {poissonniereActive && (
                <motion.span
                  layoutId="house-active"
                  className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-burgundy"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
            </Link>
          </div>
        </div>

        <nav className="hidden items-center gap-8 lg:flex">
          {nav.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="font-label text-sm font-medium uppercase tracking-wide text-ink-muted transition duration-200 hover:text-burgundy"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href={
              isHouse && activeHouse
                ? `/reservation?maison=${activeHouse}`
                : "/reservation"
            }
            className="btn-burgundy hidden items-center gap-2 px-5 py-2.5 text-sm sm:inline-flex"
          >
            RÉSERVER UNE TABLE
          </Link>
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[rgba(228,190,186,0.5)] lg:hidden"
            aria-label="Ouvrir le menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            <span className="font-label text-lg">{open ? "×" : "☰"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="mobile-nav"
            initial={reduced ? { opacity: 1 } : { height: 0, opacity: 0 }}
            animate={reduced ? { opacity: 1 } : { height: "auto", opacity: 1 }}
            exit={reduced ? { opacity: 0 } : { height: 0, opacity: 0 }}
            transition={{ duration: reduced ? 0.01 : 0.28, ease: easeOut }}
            className="overflow-hidden border-t border-[rgba(228,190,186,0.35)] bg-paper lg:hidden"
          >
            <div className="flex flex-col gap-3 px-4 py-4">
              <div className="mb-1 flex items-center gap-2 font-label text-xs font-bold uppercase tracking-wide">
                <Link
                  href="/montmartre"
                  className={montmartreActive ? "text-burgundy" : "text-ink"}
                  onClick={() => setOpen(false)}
                >
                  Montmartre
                </Link>
                <span className="text-[rgba(152,0,18,0.35)]" aria-hidden>
                  |
                </span>
                <Link
                  href="/poissonniere"
                  className={poissonniereActive ? "text-burgundy" : "text-ink"}
                  onClick={() => setOpen(false)}
                >
                  Poissonnière
                </Link>
              </div>
              {nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="font-label text-sm font-medium uppercase text-ink"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={
                  isHouse && activeHouse
                    ? `/reservation?maison=${activeHouse}`
                    : "/reservation"
                }
                className="btn-burgundy inline-flex justify-center px-5 py-3 text-sm"
                onClick={() => setOpen(false)}
              >
                RÉSERVER UNE TABLE
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
