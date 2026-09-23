"use client";

import Image from "next/image";
import Link from "next/link";
import { LayoutGroup, motion } from "motion/react";
import { useEffect, useState } from "react";
import { FadeIn } from "@/components/motion/FadeIn";
import { DishStage, FloatingPlate } from "@/components/motion/DishStage";
import { HoverLift } from "@/components/motion/HoverLift";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { usePrefersReducedMotion } from "@/components/motion/usePrefersReducedMotion";
import { ReservationCta } from "@/components/ReservationCta";
import { houses, type HouseId } from "@/lib/houses";
import { cartes } from "@/lib/menu";

const sections = [
  { id: "signatures", label: "Momos" },
  { id: "cuisson", label: "Cuisson" },
  { id: "sauces", label: "Sauces" },
  { id: "chauds", label: "Chauds" },
  { id: "boissons", label: "Boissons" },
] as const;

type SectionId = (typeof sections)[number]["id"];

export function CartePage({ houseId }: { houseId: HouseId }) {
  const house = houses[houseId];
  const carte = cartes[houseId];
  const other = houses[houseId === "montmartre" ? "poissonniere" : "montmartre"];
  const [active, setActive] = useState<SectionId>("signatures");
  const reduced = usePrefersReducedMotion();

  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach((section) => {
      const el = document.getElementById(section.id);
      if (!el) return;
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry?.isIntersecting) setActive(section.id);
        },
        { rootMargin: "-35% 0px -50% 0px", threshold: 0.1 },
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  function scrollToSection(id: SectionId) {
    setActive(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const heroPlate = carte.signatures[0]?.image ?? "/assets/momo-3d.png";

  return (
    <>
      {/* Depth hero */}
      <section className="relative overflow-hidden bg-bistro text-paper">
        <div className="absolute inset-0">
          <Image
            src="/assets/carte-hero.png"
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover opacity-45 mix-blend-luminosity"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bistro via-bistro/85 to-burgundy-deep/70" />
        </div>
        <div className="relative mx-auto grid max-w-[1280px] items-center gap-8 px-4 py-14 sm:px-12 lg:grid-cols-12 lg:py-20">
          <FadeIn className="lg:col-span-7">
            <p className="font-label text-xs font-bold uppercase tracking-[2px] text-amber-soft">
              Maison {house.shortName} · {carte.heroNote}
            </p>
            <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
              La Carte des Saveurs
              <br />
              <span className="text-amber-soft">Himalayennes</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-paper/75">
              Momos pliés minute selon les 24 plis traditionnels, sauces achar
              maison et streetfood des plateaux — servis dans l&apos;esprit
              d&apos;un bistrot parisien.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#signatures" className="btn-burgundy px-6 py-3 text-sm">
                Voir les momos
              </a>
              <Link
                href={`/reservation?maison=${houseId}`}
                className="rounded-full border border-paper/40 px-6 py-3 font-label text-sm font-medium uppercase text-paper"
              >
                Réserver
              </Link>
            </div>
          </FadeIn>
          <FadeIn delay={0.12} className="lg:col-span-5">
            <div className="relative mx-auto flex h-64 max-w-sm items-center justify-center sm:h-80">
              <FloatingPlate
                src={heroPlate}
                alt={carte.signatures[0]?.name ?? "Momo signature"}
                className="h-full w-full"
                priority
              />
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Sticky category rail */}
      <div className="sticky top-[57px] z-30 border-b border-[rgba(228,190,186,0.35)] bg-paper/95 backdrop-blur-md sm:top-[68px]">
        <LayoutGroup>
          <div className="mx-auto flex max-w-[1280px] gap-2 overflow-x-auto px-4 py-3 sm:px-12">
            {sections.map((s) => {
              const isActive = active === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => scrollToSection(s.id)}
                  className={`relative min-h-11 shrink-0 rounded-full px-4 py-2.5 font-label text-xs font-bold uppercase tracking-wide transition ${
                    isActive
                      ? "text-white"
                      : "bg-paper-soft text-ink-muted hover:bg-paper-muted"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="carte-filter"
                      className="absolute inset-0 rounded-full bg-burgundy shadow-[0_2px_0_var(--burgundy-press)]"
                      transition={
                        reduced
                          ? { duration: 0.01 }
                          : { type: "spring", stiffness: 420, damping: 32 }
                      }
                    />
                  )}
                  <span className="relative z-10">{s.label}</span>
                </button>
              );
            })}
          </div>
        </LayoutGroup>
      </div>

      <div className="mx-auto max-w-[1280px] space-y-16 px-4 py-12 sm:px-12 sm:py-16">
        {/* Signatures */}
        <section id="signatures" className="scroll-mt-36">
          <FadeIn>
            <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
              Spécialité maison
            </p>
            <h2 className="font-display mt-1 text-3xl font-bold tracking-tight sm:text-4xl">
              Nos Momos Signatures
            </h2>
            <p className="mt-2 text-sm text-ink-muted">
              Servis par paniers de 8 ou 10 pièces fraîches
            </p>
          </FadeIn>

          <Stagger className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3" stagger={0.06}>
            {carte.signatures.map((item) => (
              <StaggerItem key={item.id} className="h-full">
                <HoverLift className="h-full">
                <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-[rgba(228,190,186,0.4)] bg-white shadow-sm">
                  <DishStage size="lg" className="rounded-none rounded-t-3xl">
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={360}
                      height={360}
                      sizes="(max-width: 640px) 70vw, (max-width: 1024px) 40vw, 280px"
                      className="relative z-10 h-full w-auto max-w-[85%] object-contain drop-shadow-[0_16px_24px_rgba(29,28,21,0.25)]"
                    />
                  </DishStage>
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-display text-xl font-semibold">
                          {item.name}
                        </h3>
                        {item.badge ? (
                          <span className="mt-1 inline-block rounded-full bg-cream-blush px-2 py-0.5 font-label text-[10px] font-bold uppercase text-[#410003]">
                            {item.badge}
                          </span>
                        ) : null}
                      </div>
                      <p className="font-display text-lg font-bold text-amber-deep">
                        {item.price}
                      </p>
                    </div>
                    <p className="mt-2 flex-1 text-sm leading-6 text-ink-muted">
                      {item.description}
                    </p>
                  </div>
                </article>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Cooking + sauces */}
        <section className="grid gap-6 lg:grid-cols-12">
          <div id="cuisson" className="scroll-mt-36 lg:col-span-5">
            <FadeIn className="rounded-3xl border border-[rgba(227,190,186,0.4)] bg-white p-6 sm:p-8">
            <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
              Étape 2
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold">
              Mode de Cuisson
            </h2>
            <Stagger className="mt-5 space-y-4" stagger={0.05}>
              {carte.cooking.map((c) => (
                <StaggerItem key={c.id}>
                  <HoverLift>
                <div
                  className="rounded-2xl border border-[rgba(228,190,186,0.35)] bg-paper-soft p-4"
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <p className="font-display font-semibold">{c.name}</p>
                    <p className="font-label text-xs font-bold uppercase text-burgundy">
                      {c.price}
                    </p>
                  </div>
                  <p className="mt-1 text-sm text-ink-muted">{c.description}</p>
                </div>
                  </HoverLift>
                </StaggerItem>
              ))}
            </Stagger>
            </FadeIn>
          </div>

          <div id="sauces" className="scroll-mt-36 lg:col-span-7">
            <FadeIn delay={0.08} className="rounded-3xl border border-[rgba(227,190,186,0.4)] bg-white p-6 sm:p-8">
            <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
              Condiments secrets
            </p>
            <h2 className="font-display mt-1 text-2xl font-semibold">
              Sauces & Dips Achar
            </h2>
            <Stagger className="mt-5 grid gap-3 sm:grid-cols-2" stagger={0.05}>
              {carte.sauces.map((s) => (
                <StaggerItem key={s.id}>
                  <HoverLift>
                <div
                  className="rounded-2xl border border-dashed border-paper-muted bg-paper-soft p-4"
                >
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold">{s.name}</p>
                    <p className="shrink-0 font-label text-xs font-bold uppercase text-burgundy">
                      {s.price}
                    </p>
                  </div>
                  <p className="mt-1 text-xs leading-5 text-ink-muted">
                    {s.description}
                  </p>
                </div>
                  </HoverLift>
                </StaggerItem>
              ))}
            </Stagger>
            </FadeIn>
          </div>
        </section>

        {/* Hot */}
        <section id="chauds" className="scroll-mt-36">
          <FadeIn>
            <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
              Au-delà du panier
            </p>
            <h2 className="font-display mt-1 text-3xl font-bold">
              Spécialités Chaudes & Street Food
            </h2>
          </FadeIn>
          <Stagger className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {carte.hot.map((item) => (
              <StaggerItem key={item.id} className="h-full">
                <HoverLift className="h-full">
                <article className="h-full overflow-hidden rounded-3xl border border-[rgba(228,190,186,0.4)] bg-white shadow-sm">
                  <DishStage>
                    <Image
                      src={item.image}
                      alt={item.name}
                      width={320}
                      height={320}
                      sizes="(max-width: 640px) 60vw, (max-width: 1024px) 35vw, 240px"
                      className="relative z-10 h-full w-auto max-w-[80%] object-contain drop-shadow-[0_14px_22px_rgba(29,28,21,0.22)]"
                    />
                  </DishStage>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-display text-lg font-semibold">
                        {item.name}
                      </h3>
                      <p className="font-display font-bold text-amber-deep">
                        {item.price}
                      </p>
                    </div>
                    {item.badge ? (
                      <span className="mt-1 inline-block rounded-full bg-cream-blush px-2 py-0.5 font-label text-[10px] font-bold uppercase text-[#410003]">
                        {item.badge}
                      </span>
                    ) : null}
                    {item.note ? (
                      <p className="mt-2 text-sm text-ink-muted">{item.note}</p>
                    ) : null}
                  </div>
                </article>
                </HoverLift>
              </StaggerItem>
            ))}
          </Stagger>
        </section>

        {/* Drinks */}
        <section id="boissons" className="scroll-mt-36">
          <FadeIn className="rounded-3xl border border-[rgba(227,190,186,0.4)] bg-paper-soft p-6 sm:p-10">
            <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
              Pour accompagner
            </p>
            <h2 className="font-display mt-1 text-3xl font-bold">
              Boissons & Douceurs
            </h2>
            <Stagger className="mt-8 grid gap-4 sm:grid-cols-2" stagger={0.05}>
              {carte.drinks.map((d) => (
                <StaggerItem key={d.id}>
                  <HoverLift>
                <div
                  className="flex items-start justify-between gap-3 rounded-2xl border border-[rgba(228,190,186,0.35)] bg-white p-5"
                >
                  <div>
                    <p className="font-display font-semibold">{d.name}</p>
                    <p className="mt-1 text-sm text-ink-muted">{d.description}</p>
                  </div>
                  <p className="font-display shrink-0 font-bold text-amber-deep">
                    {d.price}
                  </p>
                </div>
                  </HoverLift>
                </StaggerItem>
              ))}
            </Stagger>
          </FadeIn>
        </section>

        {/* Houses */}
        <FadeIn>
          <section className="rounded-3xl border border-[rgba(227,190,186,0.4)] bg-white p-6 sm:p-10">
            <h2 className="font-display text-center text-2xl font-bold">
              Deux adresses pour savourer le bouillon
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[house, other].map((h) => (
                <HoverLift key={h.id}>
                <div
                  className="rounded-2xl border border-[rgba(228,190,186,0.4)] bg-paper-soft p-6"
                >
                  <span className="rounded-full bg-burgundy px-2 py-1 font-label text-[10px] font-bold uppercase text-paper">
                    {h.arrondissement.toUpperCase()}
                  </span>
                  <h3 className="font-display mt-3 text-2xl font-bold">
                    Maison {h.shortName}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">{h.address}</p>
                  <p className="mt-1 text-sm text-ink-muted">{h.metro}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <a
                      href={h.phoneHref}
                      className="min-h-11 rounded-full border border-burgundy px-4 py-2.5 font-label text-xs font-bold uppercase text-burgundy"
                    >
                      Appeler
                    </a>
                    <Link
                      href={`/reservation?maison=${h.id}`}
                      className="btn-burgundy min-h-11 px-4 py-2.5 text-xs"
                    >
                      Réserver
                    </Link>
                    <Link
                      href={h.carteHref}
                      className="min-h-11 rounded-full bg-white px-4 py-2.5 font-label text-xs font-bold uppercase text-ink-muted"
                    >
                      La carte
                    </Link>
                  </div>
                </div>
                </HoverLift>
              ))}
            </div>
          </section>
        </FadeIn>
      </div>

      <ReservationCta
        houseId={houseId}
        title={`Réserver à ${house.shortName}`}
        subtitle="Choisissez la date, l'heure et le nombre de convives sur la page de réservation."
      />
    </>
  );
}
