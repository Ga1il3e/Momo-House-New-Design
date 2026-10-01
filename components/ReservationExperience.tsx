"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FadeIn } from "@/components/motion/FadeIn";
import { HoverLift } from "@/components/motion/HoverLift";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import { houses, houseList, type HouseId } from "@/lib/houses";

function isHouseId(value: string | null): value is HouseId {
  return value === "montmartre" || value === "poissonniere";
}

export function ReservationExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("maison");
  const houseId: HouseId = isHouseId(initial) ? initial : "montmartre";
  const house = houses[houseId];

  function selectHouse(id: HouseId) {
    router.replace(`/reservation?maison=${id}`, { scroll: false });
  }

  return (
    <div>
      <section className="relative overflow-hidden bg-bistro text-paper">
        <div className="absolute inset-0 opacity-40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/assets/brand-signature.jpg"
            alt=""
            className="h-full w-full object-cover object-[center_35%] opacity-50 mix-blend-luminosity"
            aria-hidden
          />
          <div className="absolute inset-0 bg-gradient-to-r from-bistro via-bistro/85 to-burgundy-deep/80" />
        </div>
        <div className="relative mx-auto max-w-[1280px] px-4 py-16 sm:px-12 sm:py-20">
          <Stagger delay={0.05} stagger={0.13}>
            <StaggerItem>
              <p className="font-label text-sm font-bold uppercase tracking-[2px] text-amber-soft">
                Réservation · Deux maisons parisiennes
              </p>
            </StaggerItem>
            <StaggerItem>
              <h1 className="font-display mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Réservez votre table
                <span className="text-amber-soft"> en ligne</span>
              </h1>
            </StaggerItem>
            <StaggerItem>
              <p className="mt-4 max-w-xl text-base leading-7 text-paper/75 sm:text-lg">
                Choisissez Montmartre ou Poissonnière. Le module de réservation
                s&apos;ouvre ici — ou appelez la maison pour confirmer.
              </p>
            </StaggerItem>
          </Stagger>
        </div>
      </section>

      <section className="relative -mt-8 px-4 pb-28 sm:px-12 lg:pb-20">
        <div className="mx-auto max-w-[1100px] space-y-8">
          <FadeIn>
            <div className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-paper p-4 shadow-xl sm:p-6">
              <div className="mb-4">
                <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
                  Maison
                </p>
                <h2 className="font-display text-2xl font-bold tracking-tight">
                  Où venez-vous ?
                </h2>
              </div>
              <Stagger className="grid gap-4 md:grid-cols-2" stagger={0.16} whenInView={false}>
                {houseList.map((item) => {
                  const selected = houseId === item.id;
                  return (
                    <StaggerItem key={item.id} className="w-full">
                      <HoverLift className="w-full">
                        <button
                          type="button"
                          onClick={() => selectHouse(item.id)}
                          className={`group relative w-full overflow-hidden rounded-2xl text-left transition ${
                            selected
                              ? "ring-2 ring-burgundy ring-offset-2 ring-offset-paper"
                              : "ring-1 ring-[rgba(228,190,186,0.5)] hover:ring-burgundy/40"
                          }`}
                        >
                          <div className="relative h-48 overflow-hidden bg-bistro sm:h-56">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.facadeImage}
                              alt={`Façade ${item.name}`}
                              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-bistro via-bistro/40 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-5 text-paper">
                              <p className="font-display text-2xl font-bold">{item.shortName}</p>
                              <p className="mt-1 text-sm text-paper/80">
                                {item.district} · {item.arrondissement}
                              </p>
                              <p className="mt-2 text-xs text-paper/70">{item.phone}</p>
                            </div>
                          </div>
                        </button>
                      </HoverLift>
                    </StaggerItem>
                  );
                })}
              </Stagger>
            </div>
          </FadeIn>

          <FadeIn delay={0.08}>
            <div className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white p-6 shadow-xl sm:p-8">
              <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
                Maison {house.shortName}
              </p>
              <h2 className="font-display mt-2 text-3xl font-bold tracking-tight">
                Réserver en ligne
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-ink-muted sm:text-base">
                {house.address}. {house.hoursNote} · {house.hours}. Le module
                s&apos;ouvre tout seul ; vous pouvez aussi l&apos;ouvrir
                maintenant, ou appeler pour confirmer.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  data-zc-action="open"
                  className="btn-burgundy inline-flex items-center justify-center px-6 py-3.5 text-sm"
                >
                  Ouvrir la réservation
                </button>
                <a
                  href={house.phoneHref}
                  className="inline-flex items-center justify-center rounded-full border border-burgundy px-5 py-2.5 font-label text-sm font-medium uppercase text-burgundy"
                >
                  Appeler {house.phone}
                </a>
                <Link
                  href={house.enterHref}
                  className="inline-flex items-center justify-center rounded-full bg-paper-soft px-5 py-2.5 font-label text-sm font-medium uppercase text-ink-muted"
                >
                  Voir la maison
                </Link>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
