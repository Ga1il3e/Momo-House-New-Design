"use client";

import { useState, useTransition } from "react";
import {
  changeHoldMinutes,
  confirmHold,
  moveHoldTable,
  setHoldStatus,
  trashReservation,
} from "@/app/admin/[house]/actions";
import type { House } from "@/lib/house";
import type { ReservationStatus } from "@/lib/status";

const DURATIONS = [60, 75, 90, 105, 120, 150, 180];

export function HoldActions({
  house,
  id,
  status,
  holdMinutes,
  tables,
}: {
  house: House;
  id: string;
  status: ReservationStatus;
  holdMinutes: number;
  tables: { id: string; zone: string; number: number }[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [emailNote, setEmailNote] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string; emailSent?: boolean; ok?: boolean }>) {
    start(async () => {
      const result = await action();
      setError(result.error ?? null);
      if (result.emailSent === false) setEmailNote("E-mail non envoyé");
      if (result.emailSent) setEmailNote("E-mail envoyé");
    });
  }

  return (
    <div className="flex flex-wrap gap-1">
      {status === "held" ? (
        <button type="button" disabled={pending} className="rounded-full bg-burgundy px-2 py-1 text-[11px] font-bold uppercase text-paper" onClick={() => run(() => confirmHold(house, id))}>
          Confirmer (appel fait)
        </button>
      ) : null}
      {status === "held" || status === "confirmed" ? (
        <>
          <button type="button" className="rounded-full bg-paper-soft px-2 py-1 text-[11px] font-bold uppercase" onClick={() => run(() => setHoldStatus(house, id, "released"))}>
            Libérer
          </button>
          <button type="button" className="rounded-full border border-burgundy px-2 py-1 text-[11px] font-bold uppercase text-burgundy" onClick={() => { if (confirm("Annuler cette retenue ?")) run(() => setHoldStatus(house, id, "cancelled")); }}>
            Annuler
          </button>
          <button type="button" className="rounded-full px-2 py-1 text-[11px] font-bold uppercase text-burgundy" onClick={() => run(() => setHoldStatus(house, id, "no_show"))}>
            No-show
          </button>
        </>
      ) : null}
      {status === "blocked" ? (
        <button type="button" className="rounded-full bg-paper-soft px-2 py-1 text-[11px] font-bold uppercase" onClick={() => run(() => setHoldStatus(house, id, "released"))}>
          Débloquer
        </button>
      ) : null}
      {status === "held" || status === "confirmed" || status === "blocked" ? (
        <>
          <select defaultValue={holdMinutes} className="rounded-full border px-2 py-1 text-[11px]" onChange={(event) => run(() => changeHoldMinutes(house, id, Number(event.target.value)))}>
            {DURATIONS.map((mins) => (
              <option key={mins} value={mins}>{mins} min</option>
            ))}
          </select>
          <select defaultValue="" className="rounded-full border px-2 py-1 text-[11px]" onChange={(event) => event.target.value && run(() => moveHoldTable(house, id, event.target.value))}>
            <option value="">Changer de table</option>
            {tables.map((table) => (
              <option key={table.id} value={table.id}>{table.zone} {table.number}</option>
            ))}
          </select>
        </>
      ) : (
        <button type="button" className="rounded-full px-2 py-1 text-[11px] uppercase text-ink-muted" onClick={() => run(() => trashReservation(house, id))}>
          Mettre à la corbeille
        </button>
      )}
      {error ? <p className="w-full text-[11px] text-burgundy">{error}</p> : null}
      {emailNote ? <p className="w-full text-[11px] text-ink-muted">{emailNote}</p> : null}
    </div>
  );
}
