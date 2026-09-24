"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useEffect, useState, type FormEvent } from "react";
import { DatePicker } from "@/components/DatePicker";
import { Icon } from "@/components/Icon";
import { FadeIn } from "@/components/motion/FadeIn";
import { HoverLift } from "@/components/motion/HoverLift";
import { Stagger, StaggerItem } from "@/components/motion/Stagger";
import {
  easeOut,
  usePrefersReducedMotion,
} from "@/components/motion/usePrefersReducedMotion";
import { houses, houseList, type HouseId } from "@/lib/houses";

const FALLBACK_TIMES = ["12:00", "12:30", "13:00", "13:30", "19:00", "19:30", "20:00", "20:30", "21:00"];

type TableState = "free" | "taken" | "too_small";
type TableOption = {
  id: string;
  number: number;
  seats: number;
  zone: "salle" | "terrasse";
  state: TableState;
};
type HoldResult = {
  tableNumber: number;
  end: string;
  holdMinutes: number;
  emailSent: boolean;
};

function isHouseId(value: string | null): value is HouseId {
  return value === "montmartre" || value === "poissonniere";
}

export function ReservationExperience() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initial = searchParams.get("maison");
  const reduced = usePrefersReducedMotion();

  const queryHouse = isHouseId(initial) ? initial : "poissonniere";
  const [houseId, setHouseId] = useState<HouseId>(queryHouse);
  const [trackedQuery, setTrackedQuery] = useState(initial);
  if (initial !== trackedQuery) {
    setTrackedQuery(initial);
    if (isHouseId(initial)) setHouseId(initial);
  }
  const [date, setDate] = useState("");
  const [time, setTime] = useState("19:30");
  const [guests, setGuests] = useState(2);
  const [space, setSpace] = useState<"salle" | "terrasse">("salle");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const minDate = new Date().toLocaleDateString("en-CA", {
    timeZone: "Europe/Paris",
  });
  const [tables, setTables] = useState<TableOption[]>([]);
  const [tableId, setTableId] = useState("");
  const [holdMinutes, setHoldMinutes] = useState(90);
  const [availabilityReady, setAvailabilityReady] = useState(false);
  const [availabilityClosed, setAvailabilityClosed] = useState(false);
  const [reservationsEnabled, setReservationsEnabled] = useState(true);
  const [slots, setSlots] = useState<string[]>(FALLBACK_TIMES);
  const [startedAt] = useState(() => Date.now());
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [hold, setHold] = useState<HoldResult | null>(null);

  function selectHouse(id: HouseId) {
    setHouseId(id);
    setTableId("");
    router.replace(`/reservation?maison=${id}`, { scroll: false });
  }

  useEffect(() => {
    if (!date) return;
    const controller = new AbortController();
    const params = new URLSearchParams({
      maison: houseId,
      date,
      couverts: String(guests),
    });
    fetch(`/api/availability?${params}`, { signal: controller.signal })
      .then((response) => response.json())
      .then((data: {
        enabled?: boolean;
        closed?: boolean;
        hold_minutes?: number;
        slots?: { time: string; past?: boolean; tables?: { id: string; zone: "salle" | "terrasse"; number: number; seats: number; free?: boolean; fits?: boolean }[] }[];
      }) => {
        setReservationsEnabled(data.enabled !== false);
        setAvailabilityClosed(Boolean(data.closed));
        setHoldMinutes(data.hold_minutes ?? 90);
        const slotTimes = (data.slots ?? []).map((slot) => String(slot.time).slice(0, 5));
        setSlots(slotTimes.length ? slotTimes : FALLBACK_TIMES);
        const currentSlot = (data.slots ?? []).find((slot) => String(slot.time).slice(0, 5) === time);
        const next: TableOption[] = (currentSlot?.tables ?? [])
          .filter((table) => table.zone === space)
          .map((table) => ({
            id: table.id,
            number: table.number,
            seats: table.seats,
            zone: table.zone,
            state: !table.free ? "taken" : table.fits === false ? "too_small" : "free",
          }));
        setTables(next);
        setAvailabilityReady(true);
        setTableId((current) =>
          next.some((table) => table.id === current && table.state === "free")
            ? current
            : "",
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setAvailabilityReady(false);
        setTables([]);
      });
    return () => controller.abort();
  }, [houseId, space, date, time, guests]);

  const house = houses[houseId];

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!date || !tableId) {
      setFormError("Choisissez une table libre.");
      return;
    }
    setSubmitting(true);
    setFormError("");
    try {
      const response = await fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          house: houseId,
          table_id: tableId,
          date,
          start: time,
          guests,
          name,
          phone,
          email,
          note,
          website: "",
          startedAt,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setFormError(typeof data.error === "string" ? data.error : "La demande n'a pas pu être enregistrée.");
        return;
      }
      setHold({
        tableNumber: data.tableNumber,
        end: data.end,
        holdMinutes: data.holdMinutes,
        emailSent: data.emailSent,
      });
      setSubmitted(true);
    } catch {
      setFormError("La demande n'a pas pu être enregistrée.");
    } finally {
      setSubmitting(false);
    }
  }

  function reset() {
    setSubmitted(false);
    setHold(null);
    setTableId("");
    setName("");
    setPhone("");
    setEmail("");
    setNote("");
  }

  const selectedTable = tables.find((table) => table.id === tableId);
  const endLabel = endTimeLabel(time, hold?.holdMinutes ?? holdMinutes);

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
              La table{" "}
              <strong>{hold ? hold.tableNumber : "choisie"}</strong> est retenue
              pour <strong>{name || "vous"}</strong>
              {date ? ` · ${formatDateFr(date)}` : ""} de {time} à{" "}
              {hold?.end ?? endLabel} · {guests}{" "}
              {guests > 1 ? "convives" : "convive"} · {space}. Ce n&apos;est pas
              une visite confirmée — appelez la maison pour finaliser.
              {hold && !hold.emailSent
                ? " L'email de retenue n'a pas pu être envoyé."
                : " Un email reprend ce créneau."}
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
              <Stagger className="flex flex-col gap-3 p-5 sm:flex-row sm:flex-wrap">
                <StaggerItem>
                <a
                  href={house.phoneHref}
                  className="btn-burgundy inline-flex items-center justify-center gap-2 px-6 py-3.5 text-sm"
                >
                  Appeler {house.phone}
                </a>
                </StaggerItem>
                <StaggerItem>
                <Link
                  href={house.enterHref}
                  className="inline-flex items-center justify-center rounded-full border border-burgundy px-5 py-2.5 font-label text-sm font-medium uppercase text-burgundy"
                >
                  Voir la maison
                </Link>
                </StaggerItem>
                <StaggerItem>
                <button
                  type="button"
                  onClick={reset}
                  className="inline-flex items-center justify-center rounded-full bg-paper-soft px-5 py-2.5 font-label text-sm font-medium uppercase text-ink-muted"
                >
                  Nouvelle demande
                </button>
                </StaggerItem>
              </Stagger>
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
              <Stagger delay={0.05} stagger={0.13}>
                <StaggerItem>
                <p className="font-label text-sm font-bold uppercase tracking-[2px] text-amber-soft">
                  Réservation · Deux maisons parisiennes
                </p>
                </StaggerItem>
                <StaggerItem>
                <h1 className="font-display mt-3 max-w-2xl text-4xl font-extrabold tracking-tight sm:text-5xl lg:text-6xl">
                  Choisissez votre table
                  <span className="text-amber-soft"> himalayenne</span>
                </h1>
                </StaggerItem>
                <StaggerItem>
                <p className="mt-4 max-w-xl text-base leading-7 text-paper/75 sm:text-lg">
                  Montmartre ou Poissonnière — même cuisine pliée minute, deux
                  atmosphères. Sélectionnez la maison, puis glissez votre créneau.
                </p>
                </StaggerItem>
              </Stagger>
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

                  <Stagger className="grid gap-4 md:grid-cols-2" stagger={0.16}>
                    {houseList.map((h) => {
                      const selected = houseId === h.id;
                      return (
                        <StaggerItem key={h.id}>
                        <HoverLift>
                        <motion.button
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
                        </HoverLift>
                        </StaggerItem>
                      );
                    })}
                  </Stagger>
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
                            <LayoutGroup>
                            <div className="grid grid-cols-3 gap-2">
                              {slots.map((t) => (
                                <button
                                  key={t}
                                  type="button"
                                  onClick={() => setTime(t)}
                                  className={`relative min-h-11 rounded-xl px-3 py-3 font-label text-sm font-bold transition ${
                                    time === t
                                      ? "text-white"
                                      : "bg-paper-soft text-ink-muted hover:bg-paper-muted"
                                  }`}
                                >
                                  {time === t && (
                                    <motion.span
                                      layoutId="res-time"
                                      className="absolute inset-0 rounded-xl bg-burgundy shadow-[0_2px_0_var(--burgundy-press)]"
                                      transition={
                                        reduced
                                          ? { duration: 0.01 }
                                          : { type: "spring", stiffness: 420, damping: 32 }
                                      }
                                    />
                                  )}
                                  <span className="relative z-10">{t}</span>
                                </button>
                              ))}
                            </div>
                            </LayoutGroup>
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
                            <LayoutGroup>
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
                                  className={`relative min-h-11 rounded-2xl px-4 py-4 text-left transition ${
                                    space === value
                                      ? "text-white"
                                      : "border border-[rgba(228,190,186,0.5)] bg-paper-soft text-ink hover:border-burgundy/40"
                                  }`}
                                >
                                  {space === value && (
                                    <motion.span
                                      layoutId="res-space"
                                      className="absolute inset-0 rounded-2xl bg-burgundy shadow-[0_3px_0_var(--burgundy-press)]"
                                      transition={
                                        reduced
                                          ? { duration: 0.01 }
                                          : { type: "spring", stiffness: 420, damping: 32 }
                                      }
                                    />
                                  )}
                                  <span className="relative z-10 font-label text-sm font-bold uppercase tracking-wide">
                                    {label}
                                  </span>
                                  <span
                                    className={`relative z-10 mt-1 block text-xs ${
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
                            </LayoutGroup>
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
                        Quelle table ?
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-ink-muted">
                        Les tables déjà prises restent visibles. Une retenue dure{" "}
                        {holdMinutes} minutes à partir de {time}, puis la table
                        se libère.
                      </p>
                      {!reservationsEnabled ? (
                        <p className="mt-5 text-sm text-ink-muted">
                          Les réservations en ligne ne sont pas disponibles pour le moment. Appelez le {house.phone}.
                        </p>
                      ) : availabilityClosed ? (
                        <p className="mt-5 text-sm text-ink-muted">
                          Fermé ce jour-là.
                        </p>
                      ) : !date ? (
                        <p className="mt-5 text-sm text-ink-muted">
                          Choisissez d&apos;abord une date.
                        </p>
                      ) : !availabilityReady ? (
                        <p className="mt-5 text-sm text-ink-muted">
                          Les tables ne sont pas disponibles pour le moment.
                        </p>
                      ) : tables.length === 0 ? (
                        <p className="mt-5 text-sm text-ink-muted">
                          Aucune table active dans cet espace.
                        </p>
                      ) : (
                        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {tables.map((table) => {
                            const selected = tableId === table.id;
                            const disabled = table.state !== "free";
                            return (
                              <button
                                key={table.id}
                                type="button"
                                disabled={disabled}
                                onClick={() => setTableId(table.id)}
                                className={`rounded-2xl px-3 py-4 text-left ${
                                  selected
                                    ? "bg-burgundy text-white shadow-[0_3px_0_var(--burgundy-press)]"
                                    : disabled
                                      ? "cursor-not-allowed bg-paper-muted text-ink-muted"
                                      : "border border-[rgba(228,190,186,0.5)] bg-paper-soft text-ink hover:border-burgundy/40"
                                }`}
                              >
                                <span className="font-display text-lg font-bold">
                                  {table.number}
                                </span>
                                <span className="mt-1 block text-xs">
                                  {table.seats} pl. ·{" "}
                                  {table.state === "taken"
                                    ? "prise"
                                    : table.state === "too_small"
                                      ? "trop petite"
                                      : "libre"}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </FadeIn>

                  <FadeIn>
                    <div className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white p-5 shadow-sm sm:p-7">
                      <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
                        Étape 4
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
                  <FadeIn delay={0.1}>
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
                      <SummaryRow
                        label="Table"
                        value={
                          selectedTable
                            ? `N° ${selectedTable.number} · jusqu'à ${endLabel}`
                            : "À choisir"
                        }
                      />

                      {formError ? (
                        <p className="text-sm leading-5 text-amber-soft">{formError}</p>
                      ) : null}
                      <button
                        type="submit"
                        disabled={submitting || !tableId}
                        className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-paper px-5 py-4 font-label text-sm font-bold uppercase tracking-wide text-burgundy shadow-md transition hover:bg-amber-soft disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {submitting ? "Retenue…" : "Retenir la table"}
                        <Icon
                          src="/icons/icon-arrow.svg"
                          width={14}
                          height={11}
                          className="h-[11px] w-[14px]"
                        />
                      </button>
                      <p className="text-center text-xs leading-5 text-white/70">
                        La table est retenue pour ce créneau seulement. Pour confirmer
                        la visite :{" "}
                        <a href={house.phoneHref} className="underline">
                          {house.phone}
                        </a>
                      </p>
                    </div>
                  </div>
                  </FadeIn>
                </aside>
              </div>

              {/* Sticky mobile bottom bar */}
              <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[rgba(228,190,186,0.45)] bg-paper/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-md lg:hidden">
                <div className="mx-auto flex max-w-[1100px] gap-3">
                  <button
                    type="submit"
                    disabled={submitting || !tableId}
                    className="btn-burgundy min-h-11 flex-1 px-4 py-3 text-sm disabled:opacity-60"
                  >
                    {submitting ? "…" : "Retenir"}
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

function endTimeLabel(start: string, minutes: number) {
  const [hour, minute] = start.split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return start;
  const total = hour * 60 + minute + minutes;
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  return `${String(Math.floor(wrapped / 60)).padStart(2, "0")}:${String(wrapped % 60).padStart(2, "0")}`;
}

function formatDateFr(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS_FR[date.getDay()]} ${d} ${MONTHS_FR[m - 1]}`;
}
