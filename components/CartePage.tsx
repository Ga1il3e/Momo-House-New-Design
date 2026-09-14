"use client";

import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { ReservationCta } from "@/components/ReservationCta";
import { houses, type HouseId } from "@/lib/houses";
import { cartes } from "@/lib/menu";

const chips = [
  "TOUS LES MOMOS",
  "KOTHEY POÊLÉS",
  "VAPEUR BAMBOU",
  "OPTIONS VÉGÉTARIENNES",
  "SOUPES & PLATS CHAUDS",
  "BOISSONS & DOUCEURS",
];

export function CartePage({ houseId }: { houseId: HouseId }) {
  const house = houses[houseId];
  const carte = cartes[houseId];
  const other = houses[houseId === "montmartre" ? "poissonniere" : "montmartre"];

  return (
    <>
      <div className="mx-auto max-w-[1280px] space-y-12 px-4 py-10 sm:px-12">
        {/* Hero poster */}
        <FadeIn>
          <section className="overflow-hidden rounded-xl border border-[rgba(227,190,186,0.4)] bg-paper-soft p-6 shadow-sm sm:p-12">
            <div className="grid gap-8 lg:grid-cols-12 lg:items-center">
              <div className="lg:col-span-8">
                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-burgundy-bright px-3 py-1 font-label text-[10px] font-bold uppercase tracking-wide text-paper shadow-sm">
                    ÉDITION BISTROT 2024
                  </span>
                  <span className="font-label text-xs uppercase tracking-wide text-ink-muted">
                    {carte.heroNote}
                  </span>
                </div>
                <h1 className="font-display text-4xl font-extrabold tracking-tight sm:text-5xl">
                  La Carte des Saveurs
                  <br />
                  Himalayennes
                </h1>
                <p className="mt-4 max-w-xl text-base leading-7 text-ink-muted">
                  Maison {house.shortName} — momos pliés minute selon les 24 plis
                  traditionnels, sauces achar maison et streetfood des plateaux.
                </p>
                <div className="mt-6 flex flex-wrap gap-2">
                  {chips.map((chip, i) => (
                    <span
                      key={chip}
                      className={`rounded-full px-3 py-2 font-label text-xs font-bold uppercase tracking-wide ${
                        i === 0
                          ? "bg-burgundy text-white"
                          : "border border-[rgba(228,190,186,0.5)] bg-white text-ink-muted"
                      }`}
                    >
                      {chip}
                    </span>
                  ))}
                </div>
              </div>

              <div className="lg:col-span-4">
                <div className="rounded-2xl border border-[rgba(228,190,186,0.4)] bg-white p-5 shadow-sm">
                  <p className="font-label text-[10px] font-bold uppercase tracking-wide text-burgundy">
                    TABLE D&apos;ARTISANS
                  </p>
                  <p className="font-display mt-2 text-2xl font-bold leading-8">
                    MENU
                    <br />
                    DÉGUSTATION
                  </p>
                  <p className="mt-2 font-display text-xl font-bold text-amber-deep">
                    14,50 €
                  </p>
                  <p className="mt-3 text-sm leading-[18px] text-ink-muted">
                    « Le Panier des 5 Sommets — 10 pièces mixtes confectionnées à
                    la commande dans nos paniers de saule et bambou brut. »
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-paper-soft px-2 py-1 font-label text-[10px] font-bold uppercase">
                      24 PLIS VÉRIFIÉS
                    </span>
                    <span className="rounded-full bg-paper-soft px-2 py-1 font-label text-[10px] font-bold uppercase">
                      3 ACHAR INCLUS
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* Art du momo */}
        <FadeIn>
          <section className="rounded-xl border border-[rgba(227,190,186,0.4)] bg-white p-6 sm:p-10">
            <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
              LE RITUEL DE PRÉPARATION
            </p>
            <h2 className="font-display mt-2 text-3xl font-bold tracking-tight">
              L&apos;Art Ancestral des 24 Plis
            </h2>
            <Stagger className="mt-8 grid gap-4 md:grid-cols-3">
              {[
                {
                  n: "01",
                  title: "PÂTE FINE BIO",
                  body: "Farine de meule locale, souplesse élastique inégalée.",
                },
                {
                  n: "02",
                  title: "CŒUR BOUILLON",
                  body: "Gélifié naturellement, il éclate au premier coup de dent.",
                },
                {
                  n: "03",
                  title: "VAPEUR OU FONTE",
                  body: "Bambou tendre ou fond croustillant kothey à la demande.",
                },
              ].map((step) => (
                <StaggerItem key={step.n}>
                  <div className="rounded-2xl border border-[rgba(228,190,186,0.35)] bg-paper-soft p-5">
                    <p className="font-display text-2xl font-bold text-burgundy">
                      {step.n}
                    </p>
                    <p className="font-label mt-2 text-sm font-bold uppercase tracking-wide">
                      {step.title}
                    </p>
                    <p className="mt-2 text-sm leading-[18px] text-ink-muted">
                      {step.body}
                    </p>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>
          </section>
        </FadeIn>

        {/* Signatures + cooking + sauces */}
        <FadeIn>
          <section className="grid gap-6 lg:grid-cols-12">
            <div className="rounded-xl border border-[rgba(227,190,186,0.4)] bg-white p-6 lg:col-span-8">
              <div className="mb-6 flex flex-wrap items-end justify-between gap-3 border-b border-paper-muted pb-4">
                <div>
                  <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
                    SPÉCIALITÉ MAISON
                  </p>
                  <h2 className="font-display text-2xl font-semibold">
                    Nos Momos Signatures
                  </h2>
                  <p className="text-sm text-ink-muted">
                    Servis par paniers de 8 ou 10 pièces fraîches
                  </p>
                </div>
                <p className="font-label text-xs font-bold uppercase text-ink-muted">
                  8 PIÈCES / 10 PIÈCES
                </p>
              </div>

              <Stagger className="space-y-5">
                {carte.signatures.map((item) => (
                  <StaggerItem
                    key={item.id}
                    className="flex gap-4 border-b border-dashed border-paper-muted pb-5 last:border-0 last:pb-0"
                  >
                    <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-paper-muted sm:h-28 sm:w-28">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        decoding="async"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-semibold sm:text-xl">
                            {item.name}
                          </h3>
                          {item.badge ? (
                            <span className="rounded-full bg-cream-blush px-2 py-0.5 font-label text-[10px] font-bold uppercase text-[#410003]">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        <p className="font-display font-bold text-amber-deep">
                          {item.price}
                        </p>
                      </div>
                      <p className="mt-1 text-sm leading-5 text-ink-muted">
                        {item.description}
                      </p>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            </div>

            <div className="space-y-6 lg:col-span-4">
              <div className="rounded-xl border border-[rgba(227,190,186,0.4)] bg-white p-6">
                <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
                  ÉTAPE 2
                </p>
                <h3 className="font-display mt-1 text-xl font-semibold">
                  Mode de Cuisson
                </h3>
                <p className="mt-1 text-sm text-ink-muted">
                  Sélectionnez la texture de vos rêves
                </p>
                <ul className="mt-5 space-y-4">
                  {carte.cooking.map((c) => (
                    <li
                      key={c.id}
                      className="rounded-xl border border-[rgba(228,190,186,0.35)] bg-paper-soft p-4"
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <p className="font-display font-semibold">{c.name}</p>
                        <p className="font-label text-xs font-bold uppercase text-burgundy">
                          {c.price}
                        </p>
                      </div>
                      <p className="mt-1 text-sm leading-[18px] text-ink-muted">
                        {c.description}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[rgba(227,190,186,0.4)] bg-white p-6">
                <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
                  CONDIMENTS SECRETS
                </p>
                <h3 className="font-display mt-1 text-xl font-semibold">
                  Sauces & Dips Achar
                </h3>
                <p className="mt-2 text-sm text-ink-muted">
                  Nos marinades pilées au mortier selon les recettes de Pokhara.
                </p>
                <ul className="mt-4 space-y-3">
                  {carte.sauces.map((s) => (
                    <li
                      key={s.id}
                      className="flex items-start justify-between gap-3 border-b border-dashed border-paper-muted pb-3 last:border-0"
                    >
                      <div>
                        <p className="font-semibold text-sm">{s.name}</p>
                        <p className="text-xs leading-[18px] text-ink-muted">
                          {s.description}
                        </p>
                      </div>
                      <p className="shrink-0 font-label text-xs font-bold uppercase text-burgundy">
                        {s.price}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        </FadeIn>

        {/* Hot + drinks */}
        <FadeIn>
          <section className="grid gap-6 lg:grid-cols-12">
            <div className="rounded-xl border border-[rgba(227,190,186,0.4)] bg-white p-6 lg:col-span-7">
              <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
                AU-DELÀ DU PANIER
              </p>
              <h2 className="font-display mt-1 text-2xl font-semibold">
                Spécialités Chaudes & Street Food
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Les grands classiques réconfortants des plateaux tibétains
              </p>
              <ul className="mt-6 space-y-4">
                {carte.hot.map((item) => (
                  <li key={item.id} className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-paper-muted">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={item.image}
                        alt={item.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        decoding="async"
                      />
                    </div>
                    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-display text-lg font-semibold">
                            {item.name}
                          </h3>
                          {item.badge ? (
                            <span className="rounded-full bg-cream-blush px-2 py-0.5 font-label text-[10px] font-bold uppercase text-[#410003]">
                              {item.badge}
                            </span>
                          ) : null}
                        </div>
                        {item.note ? (
                          <p className="mt-1 text-sm text-ink-muted">{item.note}</p>
                        ) : null}
                      </div>
                      <p className="font-display shrink-0 font-bold text-amber-deep">
                        {item.price}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-[rgba(227,190,186,0.4)] bg-white p-6 lg:col-span-5">
              <p className="font-label text-xs font-bold uppercase tracking-wide text-burgundy">
                POUR ACCOMPAGNER
              </p>
              <h2 className="font-display mt-1 text-2xl font-semibold">
                Boissons & Douceurs
              </h2>
              <p className="mt-1 text-sm text-ink-muted">
                Thés d&apos;altitude, bières de Katmandou et desserts
              </p>
              <ul className="mt-6 space-y-4">
                {carte.drinks.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-start justify-between gap-3 border-b border-dashed border-paper-muted pb-3 last:border-0"
                  >
                    <div>
                      <p className="font-display font-semibold">{d.name}</p>
                      <p className="mt-1 text-sm leading-[18px] text-ink-muted">
                        {d.description}
                      </p>
                    </div>
                    <p className="font-display shrink-0 font-bold text-amber-deep">
                      {d.price}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </FadeIn>

        {/* Houses accordion-style cards */}
        <FadeIn>
          <section className="rounded-xl border border-[rgba(227,190,186,0.4)] bg-paper-soft p-6 sm:p-10">
            <p className="text-center font-label text-xs font-bold uppercase tracking-wide text-burgundy">
              TABLES CONVIVIALES & COMPTOIRS ZINC
            </p>
            <h2 className="font-display mx-auto mt-2 max-w-3xl text-center text-2xl font-bold">
              Deux adresses parisiennes ouvertes 7j/7 pour savourer le bouillon
              sur le pouce ou partager un festin himalayen entre amis.
            </h2>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {[house, other].map((h) => (
                <div
                  key={h.id}
                  className="rounded-2xl border border-[rgba(228,190,186,0.4)] bg-white p-6 shadow-sm"
                >
                  <span className="rounded-full bg-burgundy px-2 py-1 font-label text-[10px] font-bold uppercase text-paper">
                    {h.arrondissement.toUpperCase()}
                  </span>
                  <h3 className="font-display mt-3 text-2xl font-bold">
                    Maison {h.shortName}
                  </h3>
                  <p className="mt-2 text-sm text-ink-muted">{h.address}</p>
                  <p className="mt-1 text-sm text-ink-muted">{h.metro}</p>
                  <div className="mt-4 flex gap-2">
                    <a
                      href={h.phoneHref}
                      className="rounded-full border border-burgundy px-4 py-2 font-label text-xs font-bold uppercase text-burgundy"
                    >
                      APPELER
                    </a>
                    <Link
                      href={`/reservation?maison=${h.id}`}
                      className="btn-burgundy px-4 py-2 text-xs"
                    >
                      RÉSERVER
                    </Link>
                  </div>
                </div>
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
