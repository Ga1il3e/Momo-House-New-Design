"use client";

import Link from "next/link";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useMemo, useState } from "react";
import { DishCard } from "@/components/DishCard";
import { Icon } from "@/components/Icon";
import { FadeIn } from "@/components/motion/FadeIn";
import { HoverLift } from "@/components/motion/HoverLift";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import {
  easeOut,
  usePrefersReducedMotion,
} from "@/components/motion/usePrefersReducedMotion";
import { ReservationCta } from "@/components/ReservationCta";
import { houses } from "@/lib/houses";
import { montmartreSpecialties } from "@/lib/menu";

const filters = [
  { id: "all", label: "TOUS NOS PLATS" },
  { id: "momo", label: "KOTHEY POÊLÉS" },
  { id: "accompagnements", label: "VAPEUR BAMBOU" },
  { id: "boissons", label: "BOISSONS & DESSERTS" },
] as const;

export default function MontmartrePage() {
  const house = houses.montmartre;
  const reduced = usePrefersReducedMotion();
  const [filter, setFilter] = useState<(typeof filters)[number]["id"]>("all");

  const dishes = useMemo(() => {
    if (filter === "all") return montmartreSpecialties;
    if (filter === "momo") {
      return montmartreSpecialties.filter((d) => d.category === "momo");
    }
    if (filter === "accompagnements") {
      return montmartreSpecialties.filter(
        (d) => d.category === "accompagnements" || d.category === "momo",
      );
    }
    return montmartreSpecialties.filter((d) => d.category === "boissons");
  }, [filter]);

  return (
    <>
      {/* Hero */}
      <section className="mx-auto grid max-w-[1280px] items-center gap-10 px-4 py-12 sm:px-12 lg:grid-cols-2">
        <FadeIn>
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-burgundy px-3 py-1 font-label text-xs font-bold uppercase tracking-wide text-paper">
              MAISON 01 • PARIS 2E
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-[rgba(228,190,186,0.5)] bg-paper-soft px-3 py-1 font-label text-xs">
              <span className="size-2 rounded-full bg-open" />
              Ouvert · 11h45 – 15h00 & 18h30 – 22h30
            </span>
          </div>

          <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
            Momo House
            <br />
            <span className="text-burgundy">Montmartre</span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
            L&apos;esprit d&apos;un bistrot du Sentier, la vapeur des sommets —
            salle chaleureuse boisée, drapeaux de prière et momos pliés minute
            au cœur du 2e.
          </p>

          <p className="mt-4 flex items-start gap-2 text-sm text-ink-muted">
            <Icon
              src="/icons/icon-pin.svg"
              width={12}
              height={15}
              className="mt-0.5"
            />
            {house.address} · Métro Sentier (L3) · Bourse (L3)
          </p>

          <div className="mt-5 rounded-2xl border border-[rgba(228,190,186,0.4)] bg-paper-soft p-4">
            <p className="font-label text-sm font-bold uppercase tracking-wide text-burgundy">
              SALLE BOISÉE & TERRASSE
            </p>
            <p className="mt-1 text-sm text-ink-muted">
              Ambiance cozy sous guirlandes et lanternes népalaises
            </p>
            <span className="mt-2 inline-block rounded-full bg-burgundy/10 px-2 py-1 font-label text-[10px] font-bold uppercase text-burgundy">
              7J / 7 · MIDI & SOIR
            </span>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/reservation?maison=montmartre"
              className="btn-burgundy inline-flex px-6 py-3 text-sm"
            >
              RÉSERVER EN SALLE OU EN TERRASSE
            </Link>
            <a
              href={house.phoneHref}
              className="rounded-full border border-burgundy bg-white px-6 py-3 font-label text-sm font-medium uppercase text-burgundy"
            >
              APPELER : {house.phone}
            </a>
          </div>
        </FadeIn>

        <FadeIn delay={0.1}>
          <div className="relative overflow-hidden rounded-3xl shadow-xl">
            <div className="relative aspect-[4/5] sm:aspect-[5/6]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/assets/montmartre-facade.png"
                alt="Façade Momo House Montmartre"
                className="absolute inset-0 h-full w-full object-cover"
                decoding="async"
              />
            </div>
            <div className="absolute bottom-4 left-4 rounded-xl bg-bistro/90 px-4 py-3 text-paper backdrop-blur-sm">
              <p className="font-display text-2xl font-bold">#2e</p>
              <p className="font-label text-xs uppercase tracking-wide text-paper/80">
                Street food népalaise & tibétaine
              </p>
            </div>
          </div>
        </FadeIn>
      </section>

      {/* Esprit */}
      <section className="bg-paper-soft px-4 py-16 sm:px-12">
        <FadeIn className="mx-auto max-w-3xl text-center">
          <h2 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            L&apos;âme du Sentier,
            <br />
            la chaleur des plateaux
          </h2>
          <p className="mt-4 text-base leading-7 text-ink-muted">
            Sous les guirlandes et les lanternes népalaises, la Maison
            Montmartre accueille les flâneurs du 2e. On s&apos;installe autour
            des tables de bois, on regarde les artisans plier les 24 plis, on
            partage le bouillon fumant.
          </p>
        </FadeIn>

        <Stagger className="mx-auto mt-12 grid max-w-[1280px] gap-6 md:grid-cols-3">
          <StaggerItem>
            <HoverLift>
              <FeatureCard
                eyebrow="ATMOSPHÈRE INTÉRIEURE"
                title="Salle Boisée & Lanternes"
                body="Drapeaux de prière, boiseries chaleureuses et lumière douce des lanternes — une table d'artisans au rythme du quartier Sentier."
                badge="COZY BISTROT"
              />
            </HoverLift>
          </StaggerItem>
          <StaggerItem>
            <HoverLift>
              <FeatureCard
                eyebrow="DEUX SERVICES"
                title="Midi & Soir 7j/7"
                body="Service de 11h45 à 15h00 et de 18h30 à 22h30. Le moment idéal pour un déjeuner d'affaires ou un dîner himalayen entre amis."
                badge="11H45 — 22H30"
              />
            </HoverLift>
          </StaggerItem>
          <StaggerItem>
            <HoverLift>
              <FeatureCard
                eyebrow="OUVERT SUR LA RUE"
                title="Terrasse de Quartier"
                body="Quelques places dehors pour savourer vos paniers au fil de la Rue Montmartre, bière Everest à la main."
                badge="TERRASSE CONVIVIALE"
              />
            </HoverLift>
          </StaggerItem>
        </Stagger>
      </section>

      {/* Carte preview */}
      <section className="px-4 py-16 sm:px-12">
        <div className="mx-auto max-w-[1280px]">
          <FadeIn className="mb-8 max-w-3xl">
            <span className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
              FAITS MAIN CHAQUE MATIN
            </span>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              La Carte Spécialités de Montmartre
            </h2>
            <p className="mt-3 text-ink-muted">
              Pliés à la main à l&apos;aube, servis avec nos sauces maison
              Achar aux tomates rôties et sésame noir.
            </p>
          </FadeIn>

          <LayoutGroup>
            <div className="mb-8 flex flex-wrap gap-2">
              {filters.map((f) => {
                const active = filter === f.id;
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFilter(f.id)}
                    className={`relative rounded-full px-4 py-2 font-label text-xs font-bold uppercase tracking-wide transition ${
                      active
                        ? "text-white"
                        : "bg-paper-soft text-ink-muted hover:bg-paper-muted"
                    }`}
                  >
                    {active && (
                      <motion.span
                        layoutId="mont-filter"
                        className="absolute inset-0 rounded-full bg-burgundy"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 32,
                        }}
                      />
                    )}
                    <span className="relative z-10">{f.label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <motion.div layout className="grid gap-6 md:grid-cols-2">
            <AnimatePresence mode="popLayout">
              {dishes.map((dish) => (
                <motion.div
                  key={dish.id}
                  layout
                  initial={reduced ? false : { opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={reduced ? undefined : { opacity: 0, scale: 0.96 }}
                  transition={{
                    duration: reduced ? 0.01 : 0.35,
                    ease: easeOut,
                  }}
                >
                  <DishCard dish={dish} />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          <FadeIn className="mt-10 text-center">
            <Link
              href="/montmartre/carte"
              className="btn-burgundy inline-flex px-6 py-3 text-sm"
            >
              VOIR LA CARTE COMPLÈTE
            </Link>
          </FadeIn>
        </div>
      </section>

      <ReservationCta
        houseId="montmartre"
        title="Réserver à Montmartre"
        subtitle="Salle boisée ou terrasse de quartier — ouvrez la page de réservation pour votre créneau."
      />

      {/* Practical info */}
      <section className="px-4 py-16 sm:px-12">
        <div className="mx-auto grid max-w-[1280px] gap-6 lg:grid-cols-2">
          <FadeIn>
            <div className="rounded-3xl border border-[rgba(228,190,186,0.4)] bg-white p-8 shadow-sm">
              <h3 className="font-display text-2xl font-bold">
                Momo House Montmartre
              </h3>
              <ul className="mt-6 space-y-4 text-sm text-ink-muted">
                <li>
                  <strong className="text-ink">Adresse :</strong> {house.address}
                </li>
                <li>
                  <strong className="text-ink">Métro :</strong> {house.metro}
                </li>
                <li>
                  <strong className="text-ink">Horaires :</strong> {house.hours}
                </li>
                <li>
                  <strong className="text-ink">Capacité :</strong> Salle boisée ·
                  Terrasse de quartier
                </li>
              </ul>
              <div className="mt-8 flex flex-wrap gap-3">
                <a
                  href="https://maps.google.com/?q=85+Rue+Montmartre+75002+Paris"
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full border border-burgundy px-5 py-2.5 font-label text-sm font-bold uppercase text-burgundy"
                >
                  ITINÉRAIRE
                </a>
                <a
                  href={house.phoneHref}
                  className="btn-burgundy px-5 py-2.5 text-sm"
                >
                  APPELER
                </a>
              </div>
            </div>
          </FadeIn>

          <div className="space-y-4">
            <FadeIn delay={0.08}>
              <div className="relative overflow-hidden rounded-3xl border border-[rgba(228,190,186,0.4)] bg-paper-muted">
                <div className="relative aspect-[16/10]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/assets/map-placeholder.png"
                    alt="Plan d'accès Montmartre"
                    className="absolute inset-0 h-full w-full object-cover"
                    decoding="async"
                  />
                </div>
              </div>
            </FadeIn>
            <FadeIn delay={0.12}>
              <HoverLift>
                <Link
                  href="/poissonniere"
                  className="flex items-center justify-between rounded-2xl border border-[rgba(228,190,186,0.4)] bg-white px-5 py-4 shadow-sm transition hover:border-burgundy/40"
                >
                  <div>
                    <p className="font-label text-xs font-bold uppercase tracking-wide text-ink-muted">
                      AUSSI À PARIS
                    </p>
                    <p className="font-display text-lg font-semibold">
                      Momo House Poissonnière
                    </p>
                  </div>
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-burgundy text-xl text-white">
                    +
                  </span>
                </Link>
              </HoverLift>
            </FadeIn>
          </div>
        </div>
      </section>
    </>
  );
}

function FeatureCard({
  eyebrow,
  title,
  body,
  badge,
}: {
  eyebrow: string;
  title: string;
  body: string;
  badge: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-2xl border border-[rgba(228,190,186,0.35)] bg-white p-6 shadow-sm">
      <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
        {eyebrow}
      </p>
      <h3 className="font-display mt-2 text-xl font-semibold">{title}</h3>
      <p className="mt-3 text-sm leading-[22px] text-ink-muted">{body}</p>
      <span className="mt-5 inline-block rounded-full bg-paper-soft px-3 py-1 font-label text-[10px] font-bold uppercase tracking-wide text-ink">
        {badge}
      </span>
    </article>
  );
}
