import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { addDays, parisToday } from "@/lib/time";
import { euro } from "@/lib/money";

type DayRow = { day: string; revenue_cents: number; orders: number; covers: number };
type Summary = {
  orders?: { count?: number; revenue_cents?: number; avg_basket_cents?: number };
  reservations?: { covers?: number; confirm_rate?: number | null; no_show?: number; cancelled?: number };
  by_day?: DayRow[];
  top_dishes?: { dish_name: string; qty: number; revenue_cents: number }[];
  busiest_slots?: { slot: string; bookings: number; guests: number }[];
};

function rangeFor(preset: string) {
  const today = parisToday();
  const [y, m] = today.split("-").map(Number);
  switch (preset) {
    case "30":
      return { from: addDays(today, -29), to: today };
    case "month":
      return { from: `${y}-${String(m).padStart(2, "0")}-01`, to: today };
    case "last": {
      const last = new Date(y, m - 2, 1);
      const lastEnd = new Date(y, m - 1, 0);
      const fmt = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      return { from: fmt(last), to: fmt(lastEnd) };
    }
    case "7":
    default:
      return { from: addDays(today, -6), to: today };
  }
}

function Bars({ rows, value }: { rows: DayRow[]; value: (row: DayRow) => number }) {
  const max = Math.max(1, ...rows.map(value));
  return (
    <svg viewBox={`0 0 ${Math.max(rows.length, 1) * 28} 120`} className="h-32 w-full">
      {rows.map((row, index) => {
        const height = (value(row) / max) * 100;
        return (
          <g key={row.day}>
            <rect x={index * 28 + 4} y={110 - height} width={18} height={height} fill="#980012" rx={3} />
            <text x={index * 28 + 13} y={120} textAnchor="middle" fontSize="7" fill="#6b6656">
              {row.day.slice(8)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

export default async function RapportsPage({
  params,
  searchParams,
}: {
  params: Promise<{ house: string }>;
  searchParams: Promise<{ periode?: string; from?: string; to?: string }>;
}) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house } = await requireHouseAccess(raw);
  const query = await searchParams;
  const preset = query.periode ?? "7";
  const range =
    query.from && query.to
      ? { from: query.from, to: query.to }
      : rangeFor(preset);
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const { data } = await supabase.rpc("report_summary", {
    p_house: house,
    p_from: range.from,
    p_to: range.to,
  });
  const summary = (data ?? {}) as Summary;
  const kpis = [
    ["Chiffre d’affaires", euro(summary.orders?.revenue_cents ?? 0)],
    ["Commandes", String(summary.orders?.count ?? 0)],
    ["Panier moyen", euro(summary.orders?.avg_basket_cents ?? 0)],
    ["Couverts confirmés", String(summary.reservations?.covers ?? 0)],
    ["Taux de confirmation", summary.reservations?.confirm_rate != null ? `${summary.reservations.confirm_rate} %` : "—"],
    ["No-shows", String(summary.reservations?.no_show ?? 0)],
    ["Annulations", String(summary.reservations?.cancelled ?? 0)],
  ] as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Activité</p>
          <h1 className="font-display text-3xl font-extrabold">Rapports</h1>
        </div>
        <Link href={`/admin/${house}/rapports/mensuel`} className="rounded-full border border-burgundy px-4 py-2 font-label text-xs font-bold uppercase text-burgundy">
          Mensuel
        </Link>
      </header>
      <form className="flex flex-wrap gap-2">
        {[
          ["7", "7 derniers jours"],
          ["30", "30 derniers jours"],
          ["month", "Ce mois"],
          ["last", "Mois dernier"],
        ].map(([value, label]) => (
          <button key={value} name="periode" value={value} className={`rounded-full px-3 py-2 text-xs font-bold uppercase ${preset === value ? "bg-burgundy text-paper" : "bg-white"}`}>
            {label}
          </button>
        ))}
      </form>
      <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {kpis.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3">
            <p className="font-label text-[10px] uppercase text-ink-muted">{label}</p>
            <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-3xl bg-white p-4">
          <h2 className="font-display font-bold">Chiffre d’affaires par jour</h2>
          <Bars rows={summary.by_day ?? []} value={(row) => row.revenue_cents} />
        </section>
        <section className="rounded-3xl bg-white p-4">
          <h2 className="font-display font-bold">Couverts par jour</h2>
          <Bars rows={summary.by_day ?? []} value={(row) => row.covers} />
        </section>
      </div>
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display font-bold">Plats les plus vendus</h2>
        <ul className="mt-2 text-sm">
          {(summary.top_dishes ?? []).map((dish) => (
            <li key={dish.dish_name} className="flex justify-between border-b border-[rgba(228,190,186,0.3)] py-2">
              <span>{dish.dish_name}</span>
              <span className="tabular-nums">{dish.qty} · {euro(dish.revenue_cents)}</span>
            </li>
          ))}
        </ul>
      </section>
      <section className="rounded-3xl bg-white p-4">
        <h2 className="font-display font-bold">Créneaux les plus demandés</h2>
        <ul className="mt-2 text-sm">
          {(summary.busiest_slots ?? []).map((slot) => (
            <li key={slot.slot} className="flex justify-between py-1">
              <span>{slot.slot}</span>
              <span>{slot.bookings} retenues</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
