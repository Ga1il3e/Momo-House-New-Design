"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { FadeIn } from "@/components/motion/FadeIn";
import type { HouseId } from "@/lib/houses";
import { houses } from "@/lib/houses";

type ReservationCtaProps = {
  houseId?: HouseId;
  title?: string;
  subtitle?: string;
};

export function ReservationCta({
  houseId,
  title = "Réserver une table chez Momo House",
  subtitle = "Choisissez Montmartre ou Poissonnière, votre créneau et le nombre de convives.",
}: ReservationCtaProps) {
  const href = houseId
    ? `/reservation?maison=${houseId}`
    : "/reservation";
  const phone = houseId ? houses[houseId].phone : null;
  const phoneHref = houseId ? houses[houseId].phoneHref : null;

  return (
    <section
      id="reservation"
      className="relative overflow-hidden bg-burgundy px-4 py-16 text-center text-white sm:px-12"
    >
      <div className="pointer-events-none absolute -right-16 top-0 h-56 w-56 rounded-full bg-amber/20 blur-3xl" />
      <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-black/20 blur-2xl" />
      <FadeIn className="relative mx-auto max-w-3xl">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
          <Icon
            src="/icons/icon-calendar.svg"
            width={24}
            height={24}
            className="h-6 w-6 brightness-0 invert"
          />
        </div>
        <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {title}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-white/80 sm:text-base">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Link
            href={href}
            className="inline-flex items-center gap-2 rounded-full bg-paper px-7 py-3.5 font-label text-sm font-bold uppercase tracking-wide text-burgundy shadow-md transition hover:bg-amber-soft"
          >
            Ouvrir la réservation
            <Icon
              src="/icons/icon-arrow.svg"
              width={14}
              height={11}
              className="h-[11px] w-[14px]"
            />
          </Link>
          {phone && phoneHref ? (
            <a
              href={phoneHref}
              className="rounded-full border border-white/40 px-6 py-3.5 font-label text-sm font-medium uppercase tracking-wide text-white"
            >
              Appeler {phone}
            </a>
          ) : (
            <p className="font-label text-xs uppercase tracking-[1.5px] text-white/65">
              Montmartre | Poissonnière
            </p>
          )}
        </div>
      </FadeIn>
    </section>
  );
}
