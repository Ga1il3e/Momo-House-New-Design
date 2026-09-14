import Link from "next/link";
import { DualPortalHero } from "@/components/DualPortalHero";
import { DishCard } from "@/components/DishCard";
import { FadeIn } from "@/components/motion/FadeIn";
import { HoverLift } from "@/components/motion/HoverLift";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Icon } from "@/components/Icon";
import { ReservationCta } from "@/components/ReservationCta";
import { houses } from "@/lib/houses";
import { homepageDishes } from "@/lib/menu";

export default function HomePage() {
  return (
    <>
      <DualPortalHero />

      <section
        id="histoire"
        className="mx-auto grid max-w-[1280px] items-center gap-12 px-4 py-20 sm:px-12 lg:grid-cols-12"
      >
        <FadeIn className="lg:col-span-6">
          <div className="overflow-hidden rounded-2xl border-4 border-[#ede8dd] bg-[#e8f4fc] shadow-2xl">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/assets/brand-signature.jpg"
              alt="Momo House — le yak des sommets et les momos à la vapeur"
              width={1024}
              height={517}
              className="h-auto w-full object-contain"
              decoding="async"
            />
          </div>
          <div className="mt-4 rounded-2xl border border-[rgba(228,190,186,0.45)] bg-paper px-5 py-4 shadow-sm">
            <p className="font-label text-xs font-bold uppercase tracking-[1.2px] text-burgundy">
              Signature Maison
            </p>
            <p className="font-display mt-1 text-lg font-extrabold uppercase leading-6 text-ink">
              Le Yak des Sommets
            </p>
            <p className="mt-2 text-sm leading-5 text-ink-muted">
              Porteur de vapeurs fumantes et de recettes transmises de
              génération en génération.
            </p>
          </div>
        </FadeIn>

        <FadeIn className="lg:col-span-6 lg:pl-6" delay={0.1}>
          <span className="inline-flex rounded-full bg-cream-peach px-3 py-1 font-label text-sm font-medium uppercase tracking-[0.8px] text-[#2f1400]">
            🥟 DE KATMANDOU À LA RUE MONTMARTRE
          </span>
          <h2 className="font-display mt-4 text-3xl font-bold tracking-tight sm:text-4xl">
            L&apos;âme de la streetfood himalayenne, l&apos;esprit d&apos;un
            bistrot parisien.
          </h2>
          <p className="mt-4 text-base leading-[26px] text-ink-muted">
            Chez <strong className="text-burgundy">MOMO HOUSE</strong>, chaque
            panier est plié minute selon les{" "}
            <strong className="text-amber-deep">24 plis traditionnels</strong>.
            Farine de meule, bouillon gélifié et achar maison : un savoir-faire
            népalo-tibétain servi dans l&apos;esprit d&apos;un bistrot de
            quartier.
          </p>

          <Stagger className="mt-8 grid gap-4 sm:grid-cols-3" delay={0.15}>
            <StaggerItem>
              <Pillar
                icon="/icons/icon-steam.svg"
                title="Vapeur & Bambou"
                body="Paniers de bambou, buée délicate, bouillon qui éclate à la première bouchée."
              />
            </StaggerItem>
            <StaggerItem>
              <Pillar
                icon="/icons/icon-fry.svg"
                title="Kothey Croustillants"
                body="Saisis sur fonte dorée d'un côté, tendres à la vapeur de l'autre."
              />
            </StaggerItem>
            <StaggerItem>
              <Pillar
                icon="/icons/icon-spice.svg"
                title="Poivre de Timur"
                body="Épices sauvages, achar maison et huile pimentée fumée 48h."
              />
            </StaggerItem>
          </Stagger>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <Link
              href="/poissonniere/carte"
              className="btn-burgundy inline-flex items-center gap-2 px-6 py-3 text-sm"
            >
              DÉCOUVRIR LA CARTE
              <Icon
                src="/icons/icon-arrow.svg"
                width={14}
                height={11}
                className="h-[11px] w-[14px] brightness-0 invert"
              />
            </Link>
            <p className="font-label text-sm uppercase tracking-[0.8px] text-ink-muted">
              100% FRAIS · SANS COMPROMIS
            </p>
          </div>
        </FadeIn>
      </section>

      <section className="border-y border-[rgba(228,190,186,0.2)] bg-paper-soft px-4 py-20 sm:px-12">
        <div className="mx-auto max-w-[1280px]">
          <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-cream-blush px-3 py-1 font-label text-sm font-medium uppercase tracking-[0.8px] text-[#410003]">
              MENU ARTISANAL
            </span>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Les Incontournables de la Maison
            </h2>
            <p className="mt-3 text-ink-muted">
              Servis par portions de 8 ou 10 pièces avec notre achar maison aux
              tomates rôties et graines de sésame noir.
            </p>
          </FadeIn>
          <Stagger className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
            {homepageDishes.map((dish) => (
              <StaggerItem key={dish.id}>
                <DishCard dish={dish} />
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      <section id="maisons" className="px-4 py-20 sm:px-12">
        <div className="mx-auto max-w-[1280px]">
          <FadeIn className="mx-auto mb-14 max-w-2xl text-center">
            <span className="inline-flex rounded-full bg-cream-peach px-3 py-1 font-label text-sm font-medium uppercase tracking-[0.8px] text-[#2f1400]">
              NOS DEUX PORTES À PARIS
            </span>
            <h2 className="font-display mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
              Où nous retrouver ?
            </h2>
            <p className="mt-3 text-ink-muted">
              Deux atmosphères uniques au cœur des 2e et 10e arrondissements.
            </p>
          </FadeIn>

          <Stagger className="grid gap-8 lg:grid-cols-2">
            <StaggerItem>
              <AddressCard houseId="montmartre" />
            </StaggerItem>
            <StaggerItem>
              <AddressCard houseId="poissonniere" />
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      <FadeIn>
        <ReservationCta />
      </FadeIn>
    </>
  );
}

function Pillar({
  icon,
  title,
  body,
}: {
  icon: string;
  title: string;
  body: string;
}) {
  return (
    <HoverLift>
      <div className="h-full rounded-xl border border-[rgba(228,190,186,0.3)] bg-paper-soft p-5">
        <Icon src={icon} width={28} height={28} className="mb-3 h-7 w-7" />
        <h3 className="font-display text-lg font-semibold sm:text-xl">{title}</h3>
        <p className="mt-2 text-sm leading-6 text-ink-muted">{body}</p>
      </div>
    </HoverLift>
  );
}

function AddressCard({ houseId }: { houseId: keyof typeof houses }) {
  const house = houses[houseId];
  const isMontmartre = houseId === "montmartre";

  return (
    <HoverLift lift={-5}>
      <article
        className={`flex h-full flex-col justify-between rounded-3xl border-2 bg-white p-8 shadow-md ${
          isMontmartre
            ? "border-[rgba(152,0,18,0.2)]"
            : "border-[rgba(146,76,0,0.3)]"
        }`}
      >
        <div>
          <div className="flex items-center justify-between gap-3">
            <span
              className={`rounded-full px-3 py-1 font-label text-sm font-bold uppercase tracking-[0.8px] text-white ${
                isMontmartre ? "bg-burgundy-bright" : "bg-amber-deep"
              }`}
            >
              MAISON {house.number} · {house.arrondissement.toUpperCase()}
            </span>
            <span className="flex items-center gap-1.5 font-label text-sm font-bold text-open-text">
              <span className="size-2 rounded-full bg-[#10b981]" />
              {house.hoursNote}
            </span>
          </div>
          <h3 className="font-display mt-4 text-3xl font-extrabold tracking-tight">
            {house.name}
          </h3>
          <p className="mt-2 flex items-center gap-2 text-ink-muted">
            <Icon src="/icons/icon-pin.svg" width={14} height={20} />
            {house.address}
          </p>

          <div className="mt-6 space-y-3 rounded-2xl bg-paper-soft px-5 py-6 text-sm">
            <Row label="Métro :" value={house.metro} />
            <Row label="Horaires :" value={house.hours} />
            <Row label="Ambiance :" value={house.ambiance} />
            <div className="flex justify-between gap-4">
              <span className="font-semibold">Téléphone :</span>
              <a
                href={house.phoneHref}
                className="font-bold text-burgundy hover:underline"
              >
                {house.phone}
              </a>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <a
            href={house.phoneHref}
            className={`flex-1 rounded-full border px-4 py-3 text-center font-label text-sm font-bold uppercase ${
              isMontmartre
                ? "border-burgundy text-burgundy"
                : "border-amber-deep text-amber-deep"
            }`}
          >
            APPELER LA MAISON
          </a>
          <Link
            href={`/reservation?maison=${houseId}`}
            className={`flex-1 rounded-full px-4 py-3 text-center font-label text-sm font-bold uppercase text-white shadow-[0_3px_0_#7a0e13] ${
              isMontmartre
                ? "bg-burgundy"
                : "bg-amber-deep shadow-[0_3px_0_#6a3500]"
            }`}
          >
            RÉSERVER TABLE
          </Link>
        </div>
      </article>
    </HoverLift>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <span className="shrink-0 font-semibold">{label}</span>
      <span className="text-right text-ink-muted">{value}</span>
    </div>
  );
}
