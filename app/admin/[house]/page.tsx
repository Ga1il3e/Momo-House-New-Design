import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { addMinutes, formatTime, parisToday } from "@/lib/time";
import { StatusPill } from "@/components/admin/StatusPill";
import { EmptyState } from "@/components/admin/EmptyState";
import { DataTable } from "@/components/admin/DataTable";
import { HoldActions } from "@/components/admin/HoldActions";
import { StaffHoldDialogs } from "@/components/admin/StaffHoldDialogs";
import type { ReservationStatus } from "@/lib/status";

export default async function RetenuesPage({
  params,
  searchParams,
}: {
  params: Promise<{ house: string }>;
  searchParams: Promise<{ date?: string; zone?: string }>;
}) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house } = await requireHouseAccess(raw);
  const query = await searchParams;
  const date = query.date && /^\d{4}-\d{2}-\d{2}$/.test(query.date) ? query.date : parisToday();
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;

  const board = supabase
    .from("admin_service_board")
    .select("*")
    .eq("house", house)
    .eq("service_date", date)
    .order("start_time", { ascending: true });
  const dash = supabase.from("admin_dashboard_today").select("*").eq("house", house).maybeSingle();
  const tables = supabase.from("tables").select("*").eq("house", house).eq("active", true).order("number");
  const [{ data: rows }, { data: today }, { data: floor }] = await Promise.all([board, dash, tables]);
  const list = (rows ?? []).filter((row) => !query.zone || row.zone === query.zone);

  const counters = [
    ["À confirmer", today?.held ?? 0],
    ["Confirmées", today?.confirmed ?? 0],
    ["Bloquées", today?.blocked ?? 0],
    ["Couverts attendus", today?.covers_expected ?? 0],
    ["No-shows", today?.no_show ?? 0],
    ["Libérées", today?.released ?? 0],
    ["Annulées", today?.cancelled ?? 0],
  ] as const;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Service</p>
          <h1 className="font-display text-3xl font-extrabold">Retenues</h1>
        </div>
        <form className="flex flex-wrap items-center gap-2">
          <input type="date" name="date" defaultValue={date} className="rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-2 text-sm" />
          <select name="zone" defaultValue={query.zone ?? ""} className="rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-2 text-sm">
            <option value="">Toutes</option>
            <option value="salle">Salle</option>
            <option value="terrasse">Terrasse</option>
          </select>
          <button className="btn-burgundy px-4 py-2 text-xs">Voir</button>
          <Link href={`?date=${parisToday()}`} className="rounded-full border border-burgundy px-3 py-2 font-label text-xs font-bold uppercase text-burgundy">
            Aujourd’hui
          </Link>
        </form>
      </header>
      <div className="grid gap-3 sm:grid-cols-4">
        {counters.map(([label, value]) => (
          <div key={label} className="rounded-2xl bg-white px-4 py-3">
            <p className="font-label text-[10px] uppercase text-ink-muted">{label}</p>
            <p className="font-display text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>
      <StaffHoldDialogs house={house} tables={floor ?? []} defaultDate={date} />
      {list.length === 0 ? (
        <EmptyState title="Aucune retenue ce jour-là." />
      ) : (
        <DataTable headers={["Table", "Zone", "Créneau", "Couverts", "Nom", "Téléphone", "E-mail", "Statut", "Note", "Actions"]}>
          {list.map((row) => (
            <tr key={row.id}>
              <td className="px-4 py-3 font-medium">{row.zone === "terrasse" ? "Terrasse" : "Salle"} {row.table_number}</td>
              <td className="px-4 py-3 capitalize">{row.zone}</td>
              <td className="px-4 py-3 tabular-nums">
                {formatTime(row.start_time ?? "")}–{addMinutes(row.start_time ?? "00:00", row.hold_minutes ?? 90)}
              </td>
              <td className="px-4 py-3">{row.guests}</td>
              <td className="px-4 py-3">{row.guest_name ?? "—"}</td>
              <td className="px-4 py-3">{row.guest_phone ? <a href={`tel:${row.guest_phone}`}>{row.guest_phone}</a> : "—"}</td>
              <td className="px-4 py-3">{row.guest_email ? <a href={`mailto:${row.guest_email}`}>{row.guest_email}</a> : "—"}</td>
              <td className="px-4 py-3"><StatusPill status={(row.status ?? "held") as ReservationStatus} /></td>
              <td className="px-4 py-3 text-ink-muted">{row.note ?? ""}</td>
              <td className="px-4 py-3">
                <HoldActions
                  house={house}
                  id={row.id!}
                  status={(row.status ?? "held") as ReservationStatus}
                  holdMinutes={row.hold_minutes ?? 90}
                  tables={floor ?? []}
                />
              </td>
            </tr>
          ))}
        </DataTable>
      )}
    </div>
  );
}
