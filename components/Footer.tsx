"use client";

import Link from "next/link";
import { Icon } from "@/components/Icon";
import { FadeIn } from "@/components/motion/FadeIn";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { houses, type House } from "@/lib/houses";

const quickNav = [
  { href: "/", label: "Accueil" },
  { href: "/#maisons", label: "La Carte — choisir une maison" },
  { href: "/#maisons", label: "Plan d'accès & Itinéraires" },
  { href: "/#histoire", label: "Secrets de fabrication des Momos" },
  { href: "/reservation", label: "Réservation en ligne" },
];

export function Footer() {
  return (
    <footer className="bg-footer text-paper">
      <div className="mx-auto max-w-[1280px] px-4 py-14 sm:px-12 sm:py-16">
        <Stagger
          className="grid gap-12 md:grid-cols-2 lg:grid-cols-3 lg:gap-10"
          stagger={0.1}
        >
          <StaggerItem>
            <HouseColumn
              house={houses.montmartre}
              hoursLabel="Midi & soir · 7j/7 :"
              hoursDetail={houses.montmartre.hours}
              hoursNote="Salle boisée & terrasse de quartier"
            />
          </StaggerItem>
          <StaggerItem>
            <HouseColumn
              house={houses.poissonniere}
              hoursLabel="7j/7 sans interruption :"
              hoursDetail="12h00 – 22h30"
              hoursNote="Service continu · Grande terrasse"
              hoursNoteAccent
            />
          </StaggerItem>
          <StaggerItem>
            <div>
              <h4 className="font-display text-lg font-semibold tracking-tight">
                Navigation Rapide
              </h4>
              <ul className="mt-5 space-y-3">
                {quickNav.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-paper/75 transition hover:text-amber-soft"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="mt-8 inline-flex items-center rounded-full border border-open/40 bg-open/10 px-3.5 py-1.5">
                <span className="font-label text-[11px] font-bold uppercase tracking-wide text-open">
                  Viandes certifiées 100% Halal
                </span>
              </div>
            </div>
          </StaggerItem>
        </Stagger>
      </div>

      <FadeIn>
        <div className="border-t border-white/10">
          <div className="mx-auto flex max-w-[1280px] flex-col gap-3 px-4 py-5 text-xs text-paper/50 sm:flex-row sm:items-center sm:justify-between sm:px-12">
            <p>
              © {new Date().getFullYear()} Momo House Paris. Artisans du goût
              népalais & tibétain au cœur de Paris.
            </p>
            <div className="flex flex-wrap gap-4 font-label uppercase tracking-wide">
              <Link href="/contact" className="transition hover:text-amber-soft">
                Contact
              </Link>
              <Link
                href="/mentions-legales"
                className="transition hover:text-amber-soft"
              >
                Mentions légales
              </Link>
              <Link
                href="/confidentialite"
                className="transition hover:text-amber-soft"
              >
                Confidentialité
              </Link>
            </div>
          </div>
        </div>
      </FadeIn>
    </footer>
  );
}

function HouseColumn({
  house,
  hoursLabel,
  hoursDetail,
  hoursNote,
  hoursNoteAccent = false,
}: {
  house: House;
  hoursLabel: string;
  hoursDetail: string;
  hoursNote: string;
  hoursNoteAccent?: boolean;
}) {
  return (
    <div>
      <div className="flex items-start gap-2.5">
        <Icon
          src="/icons/icon-pin.svg"
          width={14}
          height={18}
          className="mt-1 h-[18px] w-3.5 shrink-0"
        />
        <h4 className="font-display text-lg font-semibold tracking-tight">
          {house.name}
        </h4>
      </div>

      <div className="mt-4 space-y-1 pl-[26px]">
        <p className="text-sm text-paper/90">{house.address}</p>
        <p className="text-sm text-paper/55">Métro {house.metro}</p>
      </div>

      <a
        href={house.phoneHref}
        className="mt-4 flex items-center gap-2.5 pl-[26px] text-sm font-medium text-paper transition hover:text-amber-soft"
      >
        <Icon
          src="/icons/icon-phone.svg"
          width={14}
          height={14}
          className="h-3.5 w-3.5 shrink-0"
        />
        {house.phone}
      </a>

      <div className="mt-5 space-y-1 pl-[26px] text-sm">
        <p className="font-semibold text-paper">{hoursLabel}</p>
        <p className="text-paper/85">{hoursDetail}</p>
        <p className={hoursNoteAccent ? "text-open" : "text-paper/50"}>
          {hoursNote}
        </p>
      </div>

      <Link
        href={`/reservation?maison=${house.id}`}
        className="mt-6 inline-flex items-center gap-1.5 pl-[26px] font-label text-sm font-bold tracking-wide text-amber-soft transition hover:text-amber"
      >
        Réserver à {house.shortName}
        <span aria-hidden className="text-base leading-none">
          →
        </span>
      </Link>
    </div>
  );
}
