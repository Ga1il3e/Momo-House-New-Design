import { redirect } from "next/navigation";
import { blockTable, extendHold, releaseHold } from "@/app/admin/actions";
import { houses, houseList } from "@/lib/houses";
import { formatMinutes, minutesFromTime } from "@/lib/reservations";
import { getStaffClaims } from "@/lib/supabase/staff";
import { createServiceClient } from "@/lib/supabase/server";
import { supabaseConfigured } from "@/lib/supabase/env";

function parisToday() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Paris",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

type Hold = {
  id: string;
  house: "montmartre" | "poissonniere";
  service_date: string;
  start_time: string;
  hold_minutes: number;
  guest_name: string | null;
  guest_phone: string | null;
  guests: number;
  status: "held" | "blocked" | "released";
  note: string | null;
  tables: { number: number; zone: "salle" | "terrasse" } | null;
};

export default async function AdminHome({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; date?: string }>;
}) {
  const staff = await getStaffClaims();
  if (!staff) redirect("/admin/login");
  const params = await searchParams;
  const date = params.date && /^\d{4}-\d{2}-\d{2}$/.test(params.date) ? params.date : parisToday();

  if (!supabaseConfigured()) {
    return <p>La base n&apos;est pas configurée.</p>;
  }

  const supabase = createServiceClient();
  const { data: holds } = await supabase!
    .from("reservations")
    .select("id, house, service_date, start_time, hold_minutes, guest_name, guest_phone, guests, status, note, tables(number, zone)")
    .eq("service_date", date)
    .in("status", ["held", "blocked"])
    .order("start_time", { ascending: true });

  const { data: tables } = await supabase!
    .from("tables")
    .select("id, house, zone, number, seats, active")
    .eq("active", true)
    .order("number", { ascending: true });

  const rows = (holds ?? []) as unknown as Hold[];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
            Service
          </p>
          <h1 className="font-display text-3xl font-extrabold tracking-tight">
            Retenues du jour
          </h1>
        </div>
        <form className="flex items-center gap-2">
          <input
            type="date"
            name="date"
            defaultValue={date}
            className="rounded-xl border border-[rgba(228,190,186,0.5)] bg-white px-3 py-2 text-sm"
          />
          <button type="submit" className="btn-burgundy px-4 py-2 text-xs">
            Voir
          </button>
        </form>
      </div>

      {params.error === "overlap" ? (
        <p className="rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          Cette durée chevauche une autre retenue sur la même table.
        </p>
      ) : null}
      {params.error === "block" ? (
        <p className="rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          Le blocage n&apos;a pas pu être posé. Vérifiez la table et le créneau.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white">
        {rows.length === 0 ? (
          <p className="p-6 text-sm text-ink-muted">Aucune retenue sur cette date.</p>
        ) : (
          <ul className="divide-y divide-[rgba(228,190,186,0.35)]">
            {rows.map((row) => {
              const start = row.start_time.slice(0, 5);
              const startMinutes = minutesFromTime(start) ?? 0;
              const end = formatMinutes(startMinutes + row.hold_minutes);
              return (
                <li key={row.id} className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-display text-lg font-bold">
                      {houses[row.house].shortName} · Table {row.tables?.number ?? "—"}{" "}
                      <span className="text-sm font-medium text-ink-muted">
                        {row.tables?.zone === "terrasse" ? "Terrasse" : "Salle"}
                      </span>
                    </p>
                    <p className="mt-1 text-sm text-ink">
                      {start} – {end} · {row.guests} convives
                      {row.status === "blocked" ? " · blocage" : ""}
                    </p>
                    <p className="text-sm text-ink-muted">
                      {row.guest_name || "Sans nom"} {row.guest_phone ? `· ${row.guest_phone}` : ""}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <form action={extendHold} className="flex items-center gap-2">
                      <input type="hidden" name="id" value={row.id} />
                      <input
                        name="holdMinutes"
                        type="number"
                        min={15}
                        max={1440}
                        defaultValue={row.hold_minutes}
                        className="w-20 rounded-xl border border-[rgba(228,190,186,0.5)] px-2 py-2 text-sm"
                      />
                      <button type="submit" className="rounded-full border border-burgundy px-3 py-2 font-label text-xs font-bold uppercase text-burgundy">
                        Durée
                      </button>
                    </form>
                    <form action={releaseHold}>
                      <input type="hidden" name="id" value={row.id} />
                      <button type="submit" className="rounded-full bg-paper-soft px-3 py-2 font-label text-xs font-bold uppercase text-ink-muted">
                        Libérer
                      </button>
                    </form>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <section className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white p-5 sm:p-7">
        <h2 className="font-display text-2xl font-bold">Bloquer une table</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Pose une retenue sans email. La table se libère à la fin de la durée.
        </p>
        <form action={blockTable} className="mt-5 grid gap-3 sm:grid-cols-2">
          <select name="house" className="rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-3 text-sm">
            {houseList.map((house) => (
              <option key={house.id} value={house.id}>{house.shortName}</option>
            ))}
          </select>
          <select name="tableId" className="rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-3 text-sm">
            {(tables ?? []).map((table) => (
              <option key={table.id} value={table.id}>
                {table.house === "montmartre" ? "Montmartre" : "Poissonnière"} · {table.zone} {table.number} ({table.seats})
              </option>
            ))}
          </select>
          <input required type="date" name="date" defaultValue={date} className="rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-3 text-sm" />
          <input required type="time" name="time" defaultValue="19:30" className="rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-3 text-sm" />
          <input required type="number" name="holdMinutes" min={15} max={1440} defaultValue={90} className="rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-3 text-sm" />
          <input required type="number" name="guests" min={1} max={12} defaultValue={2} className="rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-3 text-sm" />
          <input name="note" placeholder="Note interne" className="rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-3 text-sm sm:col-span-2" />
          <button type="submit" className="btn-burgundy px-5 py-3 text-sm sm:col-span-2">
            Bloquer
          </button>
        </form>
      </section>
    </div>
  );
}
