"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { useState } from "react";
import { Icon } from "@/components/Icon";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";
import { houses, type House } from "@/lib/houses";

type PortalId = House["id"];

export function DualPortalHero() {
  const [hovered, setHovered] = useState<PortalId | null>(null);
  const montmartre = houses.montmartre;
  const poissonniere = houses.poissonniere;

  return (
    <section className="relative bg-bistro">
      <h1 className="sr-only">
        Momo House — Authentic Paris et Himalayan Gateway
      </h1>
      <div className="pointer-events-none absolute inset-x-0 top-4 z-10 hidden items-center justify-between px-12 text-paper lg:flex">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-amber" />
          <span className="font-label text-sm uppercase tracking-[1.6px] text-paper/90">
            CHOISISSEZ VOTRE MAISON
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="h-px w-8 bg-paper/40" />
          <span className="font-display text-xl font-semibold uppercase tracking-tight">
            MOMO <span className="text-amber-soft">HOUSE</span>
          </span>
          <span className="h-px w-8 bg-paper/40" />
        </div>
        <span className="font-label text-sm uppercase tracking-[1.6px] text-paper/90">
          DEUX PORTES · UNE CUISINE
        </span>
      </div>

      <div className="grid min-h-[704px] lg:grid-cols-2">
        <Portal
          house={montmartre}
          accentDot="bg-burgundy"
          accentText="text-burgundy"
          overlay="bg-[rgba(152,0,18,0.2)]"
          enterHref={montmartre.enterHref}
          isHovered={hovered === "montmartre"}
          isDimmed={hovered === "poissonniere"}
          onHoverChange={(v) => setHovered(v ? "montmartre" : null)}
        />
        <Portal
          house={poissonniere}
          accentDot="bg-amber"
          accentText="text-amber-deep"
          overlay="bg-[rgba(146,76,0,0.2)]"
          enterHref={poissonniere.enterHref}
          isHovered={hovered === "poissonniere"}
          isDimmed={hovered === "montmartre"}
          onHoverChange={(v) => setHovered(v ? "poissonniere" : null)}
        />
      </div>
    </section>
  );
}

function Portal({
  house,
  accentDot,
  accentText,
  overlay,
  enterHref,
  isHovered,
  isDimmed,
  onHoverChange,
}: {
  house: House;
  accentDot: string;
  accentText: string;
  overlay: string;
  enterHref: string;
  isHovered: boolean;
  isDimmed: boolean;
  onHoverChange: (hovered: boolean) => void;
}) {
  const reduced = usePrefersReducedMotion();

  return (
    <article
      className={`relative flex min-h-[560px] flex-col justify-end overflow-hidden border-b border-paper/20 p-8 sm:p-16 lg:min-h-[704px] lg:border-b-0 lg:border-r transition-[filter] duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        isDimmed && !reduced ? "brightness-[0.72] saturate-[0.85]" : ""
      }`}
      onMouseEnter={() => onHoverChange(true)}
      onMouseLeave={() => onHoverChange(false)}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={house.facadeImage}
        alt={house.name}
        className={`absolute inset-0 h-full w-full object-cover transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isHovered && !reduced ? "scale-[1.06]" : "scale-100"
        }`}
        decoding="async"
      />
      <div
        className={`absolute inset-0 bg-gradient-to-t from-bistro via-[rgba(50,48,41,0.65)] to-[rgba(50,48,41,0.3)] transition-opacity duration-500 ${
          isHovered && !reduced ? "opacity-90" : "opacity-100"
        }`}
      />
      <div className={`absolute inset-0 mix-blend-multiply ${overlay}`} />
      <div
        className={`absolute inset-0 bg-bistro/40 transition-opacity duration-500 ${
          isDimmed && !reduced ? "opacity-[0.35]" : "opacity-0"
        }`}
      />

      <div
        className={`relative z-10 max-w-xl text-paper transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] ${
          isHovered && !reduced ? "-translate-y-1.5" : ""
        }`}
      >
        <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(228,190,186,0.4)] bg-[rgba(248,243,232,0.9)] px-3 py-1 backdrop-blur-sm">
          <span className={`size-1.5 rounded-full ${accentDot}`} />
          <span
            className={`font-label text-sm font-medium uppercase tracking-[0.8px] ${accentText}`}
          >
            MAISON {house.number}
          </span>
        </span>

        <h2 className="font-display mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Momo House
          <br />
          <span className="text-amber-soft">{house.shortName}</span>
        </h2>

        <p className="mt-3 flex items-start gap-2 text-sm text-paper/90 sm:text-base">
          <Icon
            src="/icons/icon-pin.svg"
            width={12}
            height={15}
            className="mt-1 shrink-0 brightness-0 invert"
          />
          {house.address} · {house.district}
        </p>

        <p className="mt-2 flex items-center gap-2 font-label text-sm text-open sm:text-base">
          <span className="size-2 rounded-full bg-open" />
          {house.statusLabel}
        </p>

        <p className="mt-4 max-w-md text-sm leading-6 text-paper/80 sm:text-base">
          {house.portalBlurb}
        </p>

        <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-paper/25 pt-4">
          <motion.div
            whileHover={reduced ? undefined : { scale: 1.04, y: -2 }}
            whileTap={reduced ? undefined : { scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 22 }}
          >
            <Link
              href={enterHref}
              className="inline-flex items-center gap-2 rounded-full bg-paper px-6 py-3 font-label text-sm font-bold uppercase text-ink shadow-md"
            >
              ENTRER
              <Icon
                src="/icons/icon-arrow.svg"
                width={14}
                height={11}
                className="h-[11px] w-auto"
              />
            </Link>
          </motion.div>
          <a
            href={house.phoneHref}
            className="rounded-full border border-paper/50 bg-bistro/40 px-5 py-3 font-label text-sm font-medium uppercase text-paper backdrop-blur-sm transition hover:bg-bistro/60"
          >
            APPELER ↗
          </a>
          <Link
            href={`/reservation?maison=${house.id}`}
            className="ml-auto font-label text-sm font-medium uppercase tracking-[0.8px] text-amber-soft underline transition hover:text-amber"
          >
            RÉSERVER ICI
          </Link>
        </div>

        <div className="mt-4 flex justify-between font-label text-xs uppercase tracking-[1.6px] text-paper/60 sm:text-sm">
          <span>{house.tags[0]}</span>
          <span>{house.tags[1]}</span>
        </div>
      </div>
    </article>
  );
}
