"use client";

import { HoldActions } from "@/components/admin/HoldActions";
import { StatusPill } from "@/components/admin/StatusPill";
import { addMinutes, formatDateFr, formatTime } from "@/lib/time";
import type { House } from "@/lib/house";
import type { ReservationStatus } from "@/lib/status";

type Row = {
  id: string;
  service_date: string;
  start_time: string;
  hold_minutes: number;
  guests: number;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  note: string | null;
  status: ReservationStatus;
  zone: string | null;
  table_number: number | null;
};

export function ReservationsClient({
  house,
  from,
  to,
  rows,
  tables,
}: {
  house: House;
  from: string;
  to: string;
  rows: Row[];
  tables: { id: string; zone: string; number: number }[];
}) {
  function exportCsv() {
    const headers = ["Date", "Heure", "Fin", "Table", "Zone", "Couverts", "Nom", "Téléphone", "E-mail", "Statut", "Note"];
    const lines = rows.map((row) =>
      [
        row.service_date,
        formatTime(row.start_time),
        addMinutes(row.start_time, row.hold_minutes),
        row.table_number ?? "",
        row.zone ?? "",
        row.guests,
        row.guest_name ?? "",
        row.guest_phone ?? "",
        row.guest_email ?? "",
        row.status,
        (row.note ?? "").replace(/;/g, ","),
      ].join(";"),
    );
    const csv = `\uFEFF${headers.join(";")}\n${lines.join("\n")}`;
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `reservations-${house}-${from}-${to}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      <button type="button" className="rounded-full border border-burgundy px-4 py-2 font-label text-xs font-bold uppercase text-burgundy" onClick={exportCsv}>
        Exporter CSV
      </button>
      <div className="overflow-x-auto rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="sticky top-0 bg-paper-soft font-label text-[11px] uppercase tracking-wide text-ink-muted">
            <tr>
              {["Date", "Créneau", "Table", "Couverts", "Nom", "Téléphone", "Statut", "Actions"].map((header) => (
                <th key={header} className="px-4 py-3 font-bold">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[rgba(228,190,186,0.35)]">
            {rows.map((row) => (
              <tr key={row.id}>
                <td className="px-4 py-3">{formatDateFr(row.service_date)}</td>
                <td className="px-4 py-3 tabular-nums">
                  {formatTime(row.start_time)}–{addMinutes(row.start_time, row.hold_minutes)}
                </td>
                <td className="px-4 py-3">{row.zone} {row.table_number}</td>
                <td className="px-4 py-3">{row.guests}</td>
                <td className="px-4 py-3">
                  <p>{row.guest_name}</p>
                  {row.guest_email ? <a className="text-burgundy" href={`mailto:${row.guest_email}`}>{row.guest_email}</a> : null}
                </td>
                <td className="px-4 py-3">{row.guest_phone ? <a href={`tel:${row.guest_phone}`}>{row.guest_phone}</a> : "—"}</td>
                <td className="px-4 py-3"><StatusPill status={row.status} /></td>
                <td className="px-4 py-3">
                  <HoldActions house={house} id={row.id} status={row.status} holdMinutes={row.hold_minutes} tables={tables} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
