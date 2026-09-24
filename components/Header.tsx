"use client";

import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
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

function HouseSwitcher({
  montmartreActive,
  poissonniereActive,
  compact = false,
}: {
  montmartreActive: boolean;
  poissonniereActive: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`relative flex items-center font-label font-bold uppercase tracking-wide ${
        compact ? "gap-1.5 text-[10px]" : "gap-2 text-xs sm:text-[11px]"
      }`}
    >
      <Link
        href="/montmartre"
        className={`relative px-1 py-0.5 transition ${
          montmartreActive
            ? "text-burgundy"
            : "text-ink-muted hover:text-burgundy"
        }`}
      >
        {compact ? "Montm." : "Montmartre"}
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
        {compact ? "Poiss." : "Poissonnière"}
        {poissonniereActive && (
          <motion.span
            layoutId="house-active"
            className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-burgundy"
            transition={{ type: "spring", stiffness: 420, damping: 32 }}
          />
        )}
      </Link>
    </div>
  );
}

export function Header({ variant = "home", activeHouse }: HeaderProps) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const reduced = usePrefersReducedMotion();
  const isHouse = variant === "house" && Boolean(activeHouse);

  const homeNav = [{ href: "/#histoire", label: "NOTRE HISTOIRE" }];

  const houseNav = [
    {
      href: activeHouse
        ? houses[activeHouse].carteHref
        : "/#maisons",
      label: "LA CARTE",
    },
    { href: "/#histoire", label: "NOTRE HISTOIRE" },
  ];

  const nav = isHouse ? houseNav : homeNav;

  const montmartreActive =
    activeHouse === "montmartre" || pathname.startsWith("/montmartre");
  const poissonniereActive =
    activeHouse === "poissonniere" || pathname.startsWith("/poissonniere");

  const reserveHref =
    isHouse && activeHouse
      ? `/reservation?maison=${activeHouse}`
      : "/reservation";
  const staffHref =
    isHouse && activeHouse
      ? `/admin/login?maison=${activeHouse}`
      : "/admin/login";

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile menu on navigation
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-[rgba(228,190,186,0.35)] bg-paper/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center gap-2 px-4 py-2.5 sm:gap-4 sm:px-12 sm:py-3">
        {/* Left: logo */}
        <div className="flex min-w-0 items-center justify-start">
          <Link href="/" className="flex shrink-0 items-center">
            <Image
              src="/assets/logo-wordmark.png"
              alt="Momo House"
              width={140}
              height={72}
              priority
              className={`h-auto w-auto object-contain ${
                isHouse ? "h-9 sm:h-11" : "h-10 sm:h-[3.75rem]"
              }`}
            />
          </Link>
        </div>

        {/* Center: maisons */}
        <div className="flex justify-center px-1">
          <div className="sm:hidden">
            <HouseSwitcher
              montmartreActive={montmartreActive}
              poissonniereActive={poissonniereActive}
              compact
            />
          </div>
          <div className="hidden sm:block">
            <HouseSwitcher
              montmartreActive={montmartreActive}
              poissonniereActive={poissonniereActive}
            />
          </div>
        </div>

        {/* Right: nav + CTA + menu */}
        <div className="flex items-center justify-end gap-2 sm:gap-3">
          <nav className="hidden items-center gap-6 lg:flex xl:gap-8">
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
          <Link
            href={reserveHref}
            className="btn-burgundy hidden items-center gap-2 px-4 py-2.5 text-xs sm:inline-flex sm:px-5 sm:text-sm"
          >
            RÉSERVER
          </Link>
          <Link
            href={reserveHref}
            className="btn-burgundy inline-flex px-3 py-2 text-[10px] sm:hidden"
            aria-label="Réserver une table"
          >
            RÉSERVER
          </Link>
          <Link
            href={staffHref}
            aria-label="Espace équipe"
            title="Espace équipe"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(228,190,186,0.5)] text-burgundy transition duration-200 hover:border-burgundy hover:bg-burgundy/[0.06]"
          >
            <Image
              src="/icons/icon-user.svg"
              alt=""
              width={18}
              height={18}
              className="h-[18px] w-[18px]"
            />
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[rgba(228,190,186,0.5)] lg:hidden"
            aria-label={open ? "Fermer le menu" : "Ouvrir le menu"}
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
              <p className="font-label text-[10px] font-bold uppercase tracking-[1.5px] text-burgundy">
                Choisissez votre maison
              </p>
              <div className="grid grid-cols-2 gap-2">
                <Link
                  href="/montmartre"
                  className={`rounded-2xl border px-4 py-3.5 text-center font-label text-xs font-bold uppercase tracking-wide transition ${
                    montmartreActive
                      ? "border-burgundy bg-burgundy text-paper"
                      : "border-[rgba(228,190,186,0.5)] bg-paper-soft text-ink"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Montmartre
                </Link>
                <Link
                  href="/poissonniere"
                  className={`rounded-2xl border px-4 py-3.5 text-center font-label text-xs font-bold uppercase tracking-wide transition ${
                    poissonniereActive
                      ? "border-burgundy bg-burgundy text-paper"
                      : "border-[rgba(228,190,186,0.5)] bg-paper-soft text-ink"
                  }`}
                  onClick={() => setOpen(false)}
                >
                  Poissonnière
                </Link>
              </div>
              {nav.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  className="min-h-11 font-label text-sm font-medium uppercase leading-[44px] text-ink"
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              <Link
                href={reserveHref}
                className="btn-burgundy inline-flex min-h-11 justify-center px-5 py-3 text-sm"
                onClick={() => setOpen(false)}
              >
                RÉSERVER UNE TABLE
              </Link>
              <Link
                href={staffHref}
                className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-[rgba(228,190,186,0.5)] font-label text-sm font-medium uppercase tracking-wide text-burgundy"
                onClick={() => setOpen(false)}
              >
                <Image
                  src="/icons/icon-user.svg"
                  alt=""
                  width={18}
                  height={18}
                  className="h-[18px] w-[18px]"
                />
                Espace équipe
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
