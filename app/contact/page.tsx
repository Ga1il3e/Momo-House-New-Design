import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";
import { HoverLift } from "@/components/motion/HoverLift";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { Icon } from "@/components/Icon";
import { houseList } from "@/lib/houses";

export const metadata: Metadata = {
  title: "Contact & Presse",
};

export default function ContactPage() {
  return (
    <div className="mx-auto max-w-[1100px] px-4 py-16 sm:px-12 sm:py-20">
      <Stagger delay={0.05} stagger={0.13}>
        <StaggerItem>
        <p className="font-label text-sm font-bold uppercase tracking-[2px] text-burgundy">
          Contact & Presse
        </p>
        </StaggerItem>
        <StaggerItem>
        <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
          Deux maisons, une équipe
        </h1>
        </StaggerItem>
        <StaggerItem>
        <p className="mt-4 max-w-2xl text-base leading-7 text-ink-muted">
          Pour les demandes presse, partenariats ou privatisation, écrivez-nous
          ou appelez directement la maison de votre choix.
        </p>
        </StaggerItem>
        <StaggerItem>
        <a
          href="mailto:contact@momohouse.fr"
          className="btn-burgundy mt-6 inline-flex items-center gap-2 px-6 py-3 text-sm"
        >
          contact@momohouse.fr
        </a>
        </StaggerItem>
      </Stagger>

      <Stagger className="mt-12 grid gap-6 md:grid-cols-2">
        {houseList.map((house) => (
          <StaggerItem key={house.id} className="h-full">
            <HoverLift className="h-full">
            <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white shadow-sm">
              <div className="relative h-44 overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={house.facadeImage}
                  alt={house.name}
                  className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bistro/85 via-bistro/25 to-transparent" />
                <div className="absolute bottom-4 left-5 right-5 text-paper">
                  <p className="font-label text-[10px] font-bold uppercase tracking-[1.5px] text-amber-soft">
                    Maison {house.number} · {house.arrondissement}
                  </p>
                  <h2 className="font-display text-2xl font-bold">
                    {house.shortName}
                  </h2>
                </div>
              </div>

              <div className="flex flex-1 flex-col gap-4 p-6">
                <p className="flex items-start gap-2.5 text-sm leading-6 text-ink">
                  <Icon
                    src="/icons/icon-pin.svg"
                    width={14}
                    height={18}
                    className="mt-0.5 h-[18px] w-3.5 shrink-0"
                  />
                  <span>
                    {house.address}
                    <span className="mt-1 block text-ink-muted">
                      Métro {house.metro}
                    </span>
                  </span>
                </p>

                <a
                  href={house.phoneHref}
                  className="flex items-center gap-2.5 text-sm font-medium text-burgundy transition hover:underline"
                >
                  <Icon
                    src="/icons/icon-phone.svg"
                    width={14}
                    height={14}
                    className="h-3.5 w-3.5 shrink-0"
                  />
                  {house.phone}
                </a>

                <p className="text-sm text-ink-muted">
                  <span className="font-semibold text-ink">Horaires :</span>{" "}
                  {house.hours}
                </p>

                <div className="mt-auto flex flex-col gap-3 pt-2 sm:flex-row">
                  <a
                    href={house.mapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 rounded-full border border-burgundy px-4 py-3 text-center font-label text-sm font-bold uppercase tracking-wide text-burgundy transition hover:bg-burgundy hover:text-paper"
                  >
                    Itinéraire
                  </a>
                  <Link
                    href={house.enterHref}
                    className="btn-burgundy flex-1 px-4 py-3 text-center text-sm"
                  >
                    Voir la maison
                  </Link>
                </div>
              </div>
            </article>
            </HoverLift>
          </StaggerItem>
        ))}
      </Stagger>

      <FadeIn delay={0.2} className="mt-12 text-center">
        <p className="text-sm text-ink-muted">
          Email général :{" "}
          <a
            href="mailto:contact@momohouse.fr"
            className="font-medium text-burgundy underline"
          >
            contact@momohouse.fr
          </a>
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex font-label text-sm font-bold uppercase tracking-wide text-ink-muted transition hover:text-burgundy"
        >
          ← Retour à l&apos;accueil
        </Link>
      </FadeIn>
    </div>
  );
}
