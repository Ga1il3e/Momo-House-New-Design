"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { DatePicker } from "@/components/DatePicker";
import { Icon } from "@/components/Icon";
import { FadeIn } from "@/components/motion/FadeIn";
import {
  easeOut,
  usePrefersReducedMotion,
} from "@/components/motion/usePrefersReducedMotion";
import { houses, houseList, type HouseId } from "@/lib/houses";

const TIMES = ["12:00", "12:30", "13:00", "13:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

function isHouseId(value: string | null): value is HouseId {
  return value === "montmartre" || value === "poissonniere";
}

export function ReservationExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("maison");
  const reduced = usePrefersReducedMotion();

  const [houseId, setHouseId] = useState<HouseId>(
    isHouseId(initial) ? initial : "poissonniere",
  );
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:30");
  const [guests, setGuests] = useState(2);
  const [space, setSpace] = useState<"salle" | "terrasse">("salle");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [minDate, setMinDate] = useState("");

  useEffect(() => {
    if (isHouseId(initial)) setHouseId(initial);
  }, [initial]);

  useEffect(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    setMinDate(`${y}-${m}-${d}`);
  }, []);

  function selectHouse(id: HouseId) {
    setHouseId(id);
    router.replace(`/reservation?maison=${id}`, { scroll: false });
  }

  const house = houses[houseId];

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date) return;
    setSubmitted(true);
  }

  function reset() {
    setSubmitted(false);
    setName("");
    setPhone("");
    setEmail("");
    setNote("");
  }

  return (
    <AnimatePresence mode="wait">
      {submitted ? (
        <motion.section
          key="success"
          className="relative overflow-hidden px-4 py-20 sm:px-12"
          initial={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.96 }
          }
          animate={
            reduced
              ? { opacity: 1 }
              : { opacity: 1, scale: 1 }
          }
          exit={
            reduced
              ? { opacity: 0 }
              : { opacity: 0, scale: 0.98 }
          }
          transition={{
            duration: reduced ? 0.01 : 0.4,
            ease: easeOut,
          }}
        >
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(152,0,18,0.12),_transparent_55%)]" />
          <div className="relative mx-auto max-w-2xl text-center">
            <motion.div
              className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-burgundy text-2xl text-white shadow-[0_6px_0_var(--burgundy-press)]"
              initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.5 }}
              animate={reduced ? { opacity: 1 } : { opacity: 1, scale: 1 }}
              transition={
                reduced
                  ? { duration: 0.01 }
                  : { type: "spring", stiffness: 420, damping: 18, delay: 0.12 }
              }
            >
              ✓
            </motion.div>
            <p className="font-label text-sm font-bold uppercase tracking-[2px] text-burgundy">
              Demande locale enregistrée
            </p>
            <h1 className="font-display mt-3 text-4xl font-extrabold tracking-tight sm:text-5xl">
              Appelez pour confirmer
              <br />
              <span className="text-burgundy">Maison {house.shortName}</span>
            </h1>
            <p className="mx-auto mt-4 max-w-md text-base leading-7 text-ink-muted">
              Votre demande pour <strong>{name || "votre table"}</strong>
              {date ? ` · ${formatDateFr(date)}` : ""} à {time} · {guests}{" "}
              {guests > 1 ? "convives" : "convive"} · {space} est enregistrée
              localement. Ce n&apos;est pas une réservation confirmée — appelez
              la maison pour finaliser.
            </p>

            <div className="mx-auto mt-8 overflow-hidden rounded-2xl border border-[rgba(228,190,186,0.4)] bg-white text-left shadow-lg">
              <div className="relative h-40">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={house.facadeImage}
                  alt={house.name}
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-bistro/90 to-transparent" />
                <div className="absolute bottom-4 left-4 text-paper">
                  <p className="font-display text-xl font-bold">{house.name}</p>
                  <p className="text-sm text-paper/80">{house.address}</p>
                </div>
              </div>
              <div className="flex flex-col gap-3 p-5 sm:flex-row sm:flex-wrap">
                <a
                  href={house.phoneHref}
                  className="btn-burgundy inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm"
                >
                  Appeler {house.phone}
                </a>
                <Link
                  href={house.enterHref}
                  className="inline-flex items-center justify-center rounded-full border border-burgundy px-5 py-2.5 font-label text-sm font-medium uppercase text-burgundy"
                >
                  Voir la maison
                </Link>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center justify-center rounded-full bg-paper-soft px-5 py-2.5 font-label text-sm font-medium uppercase text-ink-muted"
                >
                  Nouvelle demande
                </button>
              </div>
            </div>
          </div>
        </motion.section>
      ) : (
        <motion.div
          key="form"
          initial={reduced ? { opacity: 0 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={reduced ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: reduced ? 0.01 : 0.28, ease: easeOut }}
        >
          {/* Hero */}
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
              <p className="font-label text-sm font-bold uppercase tracking-[2px] text-amber-soft">
                Réservation · Deux maisons parisiennes
              </p>
              <h1 className="font-display mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                Choisissez votre table
                <span className="text-amber-soft"> himalayenne</span>
              </h1>
              <p className="mt-4 max-w-xl text-base leading-7 text-paper/75 sm:text-lg">
                Montmartre ou Poissonnière — même cuisine pliée minute, deux
                atmosphères. Sélectionnez la maison, puis glissez votre créneau.
              </p>
            </div>
          </section>

          <section className="relative -mt-8 px-4 pb-28 sm:px-12 lg:pb-20">
            <form
              onSubmit={handleSubmit}
              className="mx-auto max-w-[1100px] space-y-8"
            >
              {/* House picker */}
              <FadeIn>
                <div className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-paper p-4 shadow-xl sm:p-6">
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
                        Étape 1
                      </p>
                      <h2 className="font-display text-2xl font-bold tracking-tight">
                        Quelle maison ?
                      </h2>
                    </div>
                    <p className="hidden font-label text-xs uppercase tracking-wide text-ink-muted sm:block">
                      Montmartre | Poissonnière
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    {houseList.map((h) => {
                      const selected = houseId === h.id;
                      return (
                        <motion.button
                          key={h.id}
                          type="button"
                          onClick={() => selectHouse(h.id)}
                          animate={
                            reduced
                              ? undefined
                              : { scale: selected ? 1.01 : 1 }
                          }
                          transition={
                            reduced
                              ? { duration: 0.01 }
                              : { type: "spring", stiffness: 380, damping: 24 }
                          }
                          className={`group relative overflow-hidden rounded-2xl text-left transition ${
                            selected
                              ? "ring-2 ring-burgundy ring-offset-2 ring-offset-paper"
                              : "ring-1 ring-[rgba(228,190,186,0.5)] hover:ring-burgundy/40"
                          }`}
                        >
                          <div className="relative h-48 sm:h-56">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={h.facadeImage}
                              alt=""
                              className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-bistro via-bistro/40 to-transparent" />
                            <div className="absolute left-4 top-4">
                              <span
                                className={`rounded-full px-3 py-1 font-label text-[10px] font-bold uppercase tracking-wide ${
                                  selected
                                    ? "bg-burgundy text-paper"
                                    : "bg-paper/90 text-ink"
                                }`}
                              >
                                Maison {h.number}
                              </span>
                            </div>
                            <div className="absolute bottom-0 left-0 right-0 p-5 text-paper">
                              <p className="font-display text-2xl font-bold">
                                {h.shortName}
                              </p>
                              <p className="mt-1 text-sm text-paper/80">
                                {h.district} · {h.arrondissement}
                              </p>
                              <p className="mt-2 line-clamp-2 text-xs leading-5 text-paper/70">
                                {h.ambiance}
                              </p>
                            </div>
                            <AnimatePresence>
                              {selected && (
                                <motion.span
                                  key="check"
                                  className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full bg-amber text-sm font-bold text-ink shadow"
                                  initial={
                                    reduced
                                      ? { opacity: 0 }
                                      : { opacity: 0, scale: 0.4 }
                                  }
                                  animate={
                                    reduced
                                      ? { opacity: 1 }
                                      : { opacity: 1, scale: 1 }
                                  }
                                  exit={
                                    reduced
                                      ? { opacity: 0 }
                                      : { opacity: 0, scale: 0.6 }
                                  }
                                  transition={
                                    reduced
                                      ? { duration: 0.01 }
                                      : {
                                          type: "spring",
                                          stiffness: 480,
                                          damping: 16,
                                        }
                                  }
                                >
                                  ✓
                                </motion.span>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </FadeIn>

              {/* Details panel */}
              <div className="grid gap-6 lg:grid-cols-12">
                <div className="space-y-6 lg:col-span-7">
                  <FadeIn>
                    <div className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white p-5 shadow-sm sm:p-7">
                      <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
                        Étape 2
                      </p>
                      <h2 className="font-display mt-1 text-2xl font-bold">
                        Quand & combien ?
                      </h2>

                      <div className="mt-6 grid gap-6 lg:grid-cols-2">
                        <div>
                          <p className="font-label mb-2 text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
                            Date
                          </p>
                          <DatePicker
                            value={date}
                            onChange={setDate}
                            minDate={minDate}
                            required
                          />
                        </div>

                        <div className="flex flex-col gap-5">
                          <div>
                            <p className="font-label mb-2 text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
                              Créneau
                            </p>
                            <div className="grid grid-cols-3 gap-2">
                              {TIMES.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setTime(t)}
                                  className={`min-h-11 rounded-xl px-3 py-3 font-label text-sm font-bold transition ${
                                    time === t
                                      ? "bg-burgundy text-white shadow-[0_2px_0_var(--burgundy-press)]"
                                      : "bg-paper-soft text-ink-muted hover:bg-paper-muted"
                                  }`}
                                >
                                  {t}
                                </button>
                              ))}
                            </div>
                            <p className="mt-2 text-xs leading-5 text-ink-muted">
                              Horaires {house.shortName} : {house.hours}
                            </p>
                          </div>

                          <div>
                            <p className="font-label mb-2 text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
                              Convives
                            </p>
                            <div className="flex items-center gap-3 rounded-2xl border border-[rgba(228,190,186,0.5)] bg-paper-soft px-4 py-3">
                              <button
                                type="button"
                                aria-label="Moins"
                                onClick={() => setGuests((g) => Math.max(1, g - 1))}
                                className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-display text-xl text-burgundy shadow-sm"
                              >
                                −
                              </button>
                              <div className="min-w-[5rem] flex-1 text-center">
                                <span className="font-display text-2xl font-bold">
                                  {guests}
                                </span>
                                <p className="font-label text-[10px] uppercase tracking-wide text-ink-muted">
                                  {guests > 1 ? "convives" : "convive"}
                                </p>
                              </div>
                              <button
                                type="button"
                                aria-label="Plus"
                                onClick={() => setGuests((g) => Math.min(12, g + 1))}
                                className="flex h-11 w-11 items-center justify-center rounded-full bg-white font-display text-xl text-burgundy shadow-sm"
                              >
                                +
                              </button>
                            </div>
                          </div>

                          <div>
                            <p className="font-label mb-2 text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
                              Espace
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {(
                                [
                                  ["salle", "Salle", "Tables & lanternes"],
                                  ["terrasse", "Terrasse", "Plein air"],
                                ] as const
                              ).map(([value, label, hint]) => (
                                <button
                                  key={value}
                                  type="button"
                                  onClick={() => setSpace(value)}
                                  className={`min-h-11 rounded-2xl px-4 py-4 text-left transition ${
                                    space === value
                                      ? "bg-burgundy text-white shadow-[0_3px_0_var(--burgundy-press)]"
                                      : "border border-[rgba(228,190,186,0.5)] bg-paper-soft text-ink hover:border-burgundy/40"
                                  }`}
                                >
                                  <span className="font-label text-sm font-bold uppercase tracking-wide">
                                    {label}
                                  </span>
                                  <span
                                    className={`mt-1 block text-xs ${
                                      space === value
                                        ? "text-white/70"
                                        : "text-ink-muted"
                                    }`}
                                  >
                                    {hint}
                                  </span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </FadeIn>

                  <FadeIn>
                    <div className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white p-5 shadow-sm sm:p-7">
                      <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
                        Étape 3
                      </p>
                      <h2 className="font-display mt-1 text-2xl font-bold">
                        Vos coordonnées
                      </h2>
                      <div className="mt-6 grid gap-4 sm:grid-cols-2">
                        <label className="block sm:col-span-2">
                          <span className="font-label mb-2 block text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
                            Nom complet
                          </span>
                          <input
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Camille Dupont"
                            className="w-full rounded-xl border border-[rgba(228,190,186,0.5)] bg-paper-soft px-4 py-3.5 text-sm outline-none focus:border-burgundy"
                          />
                        </label>
                        <label className="block">
                          <span className="font-label mb-2 block text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
                            Téléphone
                          </span>
                          <input
                            required
                            type="tel"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            placeholder="06 12 34 56 78"
                            className="w-full rounded-xl border border-[rgba(228,190,186,0.5)] bg-paper-soft px-4 py-3.5 text-sm outline-none focus:border-burgundy"
                          />
                        </label>
                        <label className="block">
                          <span className="font-label mb-2 block text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
                            Email
                          </span>
                          <input
                            required
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="vous@email.fr"
                            className="w-full rounded-xl border border-[rgba(228,190,186,0.5)] bg-paper-soft px-4 py-3.5 text-sm outline-none focus:border-burgundy"
                          />
                        </label>
                        <label className="block sm:col-span-2">
                          <span className="font-label mb-2 block text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
                            Note (optionnel)
                          </span>
                          <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            rows={3}
                            placeholder="Anniversaire, allergie, poussette…"
                            className="w-full resize-none rounded-xl border border-[rgba(228,190,186,0.5)] bg-paper-soft px-4 py-3.5 text-sm outline-none focus:border-burgundy"
                          />
                        </label>
                      </div>
                    </div>
                  </FadeIn>
                </div>

                {/* Sticky summary */}
                <aside className="lg:col-span-5">
                  <div className="sticky top-28 overflow-hidden rounded-3xl bg-burgundy text-white shadow-xl">
                    <div className="relative h-36">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={house.facadeImage}
                        alt=""
                        className="absolute inset-0 h-full w-full object-cover opacity-60"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-burgundy to-burgundy/20" />
                      <div className="absolute bottom-4 left-5 right-5">
                        <p className="font-label text-[10px] font-bold uppercase tracking-[1.5px] text-amber-soft">
                          Récapitulatif
                        </p>
                        <p className="font-display text-2xl font-bold">
                          Maison {house.shortName}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-4 px-5 py-6">
                      <SummaryRow label="Adresse" value={house.address} />
                      <SummaryRow label="Horaires" value={house.hours} />
                      <SummaryRow
                        label="Date"
                        value={date ? formatDateFr(date) : "À choisir"}
                      />
                      <SummaryRow label="Heure" value={time} />
                      <SummaryRow
                        label="Convives"
                        value={`${guests} ${guests > 1 ? "personnes" : "personne"}`}
                      />
                      <SummaryRow
                        label="Espace"
                        value={space === "terrasse" ? "Terrasse" : "Salle"}
                      />

                      <button
                        type="submit"
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-paper px-5 py-4 font-label text-sm font-bold uppercase tracking-wide text-burgundy shadow-md transition hover:bg-amber-soft"
                      >
                        Confirmer la demande
                        <Icon
                          src="/icons/icon-arrow.svg"
                          width={14}
                          height={11}
                          className="h-[11px] w-[14px]"
                        />
                      </button>
                      <p className="text-center text-xs leading-5 text-white/70">
                        Démo locale — aucune réservation réelle n&apos;est créée.
                        Pour confirmer :{" "}
                        <a href={house.phoneHref} className="underline">
                          {house.phone}
                        </a>
                      </p>
                    </div>
                  </div>
                </aside>
              </div>

              {/* Sticky mobile bottom bar */}
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(228,190,186,0.45)] bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
                <div className="mx-auto flex max-w-[1100px] gap-3">
                  <button
                    type="submit"
                    className="btn-burgundy min-h-11 flex-1 px-4 py-3 text-sm"
                  >
                    Confirmer
                  </button>
                  <a
                    href={house.phoneHref}
                    className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-burgundy px-4 py-3 font-label text-sm font-bold uppercase tracking-wide text-burgundy"
                  >
                    Appeler
                  </a>
                </div>
              </div>
            </form>
          </section>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-white/15 pb-3 last:border-0">
      <span className="font-label text-[10px] font-bold uppercase tracking-wide text-white/55">
        {label}
      </span>
      <span className="max-w-[60%] text-right text-sm font-medium leading-5">
        {value}
      </span>
    </div>
  );
}

const MONTHS_FR = [
  "janvier",
  "février",
  "mars",
  "avril",
  "mai",
  "juin",
  "juillet",
  "août",
  "septembre",
  "octobre",
  "novembre",
  "décembre",
];

const WEEKDAYS_FR = [
  "dimanche",
  "lundi",
  "mardi",
  "mercredi",
  "jeudi",
  "vendredi",
  "samedi",
];

function formatDateFr(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS_FR[date.getDay()]} ${d} ${MONTHS_FR[m - 1]}`;
}
