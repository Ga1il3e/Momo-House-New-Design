import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { addDays, parisToday } from "@/lib/time";
import { EmptyState } from "@/components/admin/EmptyState";
import type { ReservationStatus } from "@/lib/status";
import { ReservationsClient } from "./ReservationsClient";

const STATUSES: ReservationStatus[] = ["held", "confirmed", "blocked", "released", "cancelled", "no_show"];

function periodRange(preset: string | undefined, fromQ?: string, toQ?: string) {
  const today = parisToday();
  if (fromQ && toQ && /^\d{4}-\d{2}-\d{2}$/.test(fromQ) && /^\d{4}-\d{2}-\d{2}$/.test(toQ)) {
    return { from: fromQ, to: toQ };
  }
  switch (preset) {
    case "today":
      return { from: today, to: today };
    case "7":
      return { from: today, to: addDays(today, 7) };
    case "past":
      return { from: addDays(today, -90), to: addDays(today, -1) };
    case "30":
    default:
      return { from: today, to: addDays(today, 30) };
  }
}

export default async function ReservationsPage({
  params,
  searchParams,
}: {
  params: Promise<{ house: string }>;
  searchParams: Promise<{ periode?: string; statut?: string; q?: string; from?: string; to?: string; page?: string }>;
}) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house } = await requireHouseAccess(raw);
  const query = await searchParams;
  const { from, to } = periodRange(query.periode, query.from, query.to);
  const page = Math.max(1, Number(query.page ?? "1") || 1);
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;

  let request = supabase
    .from("admin_service_board")
    .select("*")
    .eq("house", house)
    .gte("service_date", from)
    .lte("service_date", to)
    .order("service_date")
    .order("start_time")
    .range((page - 1) * 50, page * 50 - 1);
  if (query.statut && STATUSES.includes(query.statut as ReservationStatus)) {
    request = request.eq("status", query.statut as ReservationStatus);
  }
  const [{ data: rows }, { data: tables }] = await Promise.all([
    request,
    supabase.from("tables").select("id, zone, number").eq("house", house).eq("active", true),
  ]);
  const needle = (query.q ?? "").trim().toLowerCase();
  const list = (rows ?? []).filter((row) => {
    if (!needle) return true;
    return [row.guest_name, row.guest_phone, row.guest_email].some((value) =>
      (value ?? "").toLowerCase().includes(needle),
    );
  });

  return (
    <div className="space-y-6">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Planning</p>
        <h1 className="font-display text-3xl font-extrabold">Réservations</h1>
      </header>
      <form className="flex flex-wrap items-end gap-2 rounded-3xl bg-white p-4">
        <label className="text-sm">
          Période
          <select name="periode" defaultValue={query.periode ?? "30"} className="mt-1 block rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-2">
            <option value="today">Aujourd’hui</option>
            <option value="7">7 jours</option>
            <option value="30">30 jours</option>
            <option value="past">Passées</option>
          </select>
        </label>
        <label className="text-sm">
          Statut
          <select name="statut" defaultValue={query.statut ?? ""} className="mt-1 block rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-2">
            <option value="">Tous</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          Recherche
          <input name="q" defaultValue={query.q ?? ""} placeholder="Nom, téléphone, e-mail" className="mt-1 block rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-2" />
        </label>
        <button className="btn-burgundy px-4 py-2 text-xs">Filtrer</button>
      </form>
      {list.length === 0 ? (
        <EmptyState title="Aucune réservation sur cette période." />
      ) : (
        <ReservationsClient
          house={house}
          from={from}
          to={to}
          tables={tables ?? []}
          rows={list.map((row) => ({
            id: row.id!,
            service_date: row.service_date ?? "",
            start_time: row.start_time ?? "",
            hold_minutes: row.hold_minutes ?? 90,
            guests: row.guests ?? 0,
            guest_name: row.guest_name,
            guest_phone: row.guest_phone,
            guest_email: row.guest_email,
            note: row.note,
            status: (row.status ?? "held") as ReservationStatus,
            zone: row.zone,
            table_number: row.table_number,
          }))}
        />
      )}
    </div>
  );
}
