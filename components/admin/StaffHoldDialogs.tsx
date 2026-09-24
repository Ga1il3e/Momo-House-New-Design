"use client";

import { useState, useTransition } from "react";
import { placeStaffHold } from "@/app/admin/[house]/actions";
import type { House } from "@/lib/house";

export function StaffHoldDialogs({
  house,
  tables,
  defaultDate,
}: {
  house: House;
  tables: { id: string; zone: string; number: number; seats: number }[];
  defaultDate: string;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function submit(status: "held" | "blocked", form: HTMLFormElement) {
    const data = new FormData(form);
    start(async () => {
      const result = await placeStaffHold(house, {
        tableId: String(data.get("tableId")),
        date: String(data.get("date")),
        time: String(data.get("time")),
        holdMinutes: Number(data.get("holdMinutes")),
        guests: Number(data.get("guests") ?? 2),
        name: String(data.get("name") ?? ""),
        phone: String(data.get("phone") ?? ""),
        email: String(data.get("email") ?? ""),
        note: String(data.get("note") ?? ""),
        status,
        confirmNow: data.get("confirmNow") === "on",
      });
      setError(result.error ?? null);
      if (!result.error) form.reset();
    });
  }

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <form className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white p-5" onSubmit={(event) => { event.preventDefault(); submit("held", event.currentTarget); }}>
        <h2 className="font-display text-xl font-bold">Nouvelle réservation (téléphone)</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select name="tableId" required className="rounded-xl border px-3 py-2 text-sm">
            {tables.map((table) => <option key={table.id} value={table.id}>{table.zone} {table.number} ({table.seats})</option>)}
          </select>
          <input name="date" type="date" defaultValue={defaultDate} className="rounded-xl border px-3 py-2 text-sm" />
          <input name="time" type="time" defaultValue="19:30" className="rounded-xl border px-3 py-2 text-sm" />
          <input name="holdMinutes" type="number" defaultValue={90} min={15} className="rounded-xl border px-3 py-2 text-sm" />
          <input name="guests" type="number" defaultValue={2} min={1} className="rounded-xl border px-3 py-2 text-sm" />
          <input name="name" placeholder="Nom" className="rounded-xl border px-3 py-2 text-sm" />
          <input name="phone" placeholder="Téléphone" className="rounded-xl border px-3 py-2 text-sm" />
          <input name="email" placeholder="E-mail" className="rounded-xl border px-3 py-2 text-sm" />
          <input name="note" placeholder="Note" className="rounded-xl border px-3 py-2 text-sm sm:col-span-2" />
          <label className="flex items-center gap-2 text-sm sm:col-span-2">
            <input type="checkbox" name="confirmNow" /> Confirmer tout de suite
          </label>
        </div>
        <button disabled={pending} className="btn-burgundy mt-3 px-4 py-2 text-xs">Enregistrer</button>
      </form>
      <form className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white p-5" onSubmit={(event) => { event.preventDefault(); submit("blocked", event.currentTarget); }}>
        <h2 className="font-display text-xl font-bold">Bloquer une table</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <select name="tableId" required className="rounded-xl border px-3 py-2 text-sm">
            {tables.map((table) => <option key={table.id} value={table.id}>{table.zone} {table.number}</option>)}
          </select>
          <input name="date" type="date" defaultValue={defaultDate} className="rounded-xl border px-3 py-2 text-sm" />
          <input name="time" type="time" defaultValue="19:30" className="rounded-xl border px-3 py-2 text-sm" />
          <input name="holdMinutes" type="number" defaultValue={90} min={15} className="rounded-xl border px-3 py-2 text-sm" />
          <input name="note" placeholder="Note" className="rounded-xl border px-3 py-2 text-sm sm:col-span-2" />
        </div>
        <button disabled={pending} className="btn-burgundy mt-3 px-4 py-2 text-xs">Bloquer</button>
      </form>
      {error ? <p className="text-sm text-burgundy lg:col-span-2">{error}</p> : null}
    </div>
  );
}
