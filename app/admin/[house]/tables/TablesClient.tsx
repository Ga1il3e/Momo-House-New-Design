"use client";

import { useState, useTransition } from "react";
import { addTable, setTableActive, updateTable } from "@/app/admin/[house]/actions";
import type { House } from "@/lib/house";

type TableRow = {
  id: string;
  zone: "salle" | "terrasse";
  number: number;
  seats: number;
  active: boolean;
};

export function TablesClient({ house, tables }: { house: House; tables: TableRow[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string }>) {
    start(async () => {
      const result = await action();
      setError(result.error ?? null);
    });
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      <form
        className="flex flex-wrap items-end gap-2 rounded-3xl bg-white p-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          run(() =>
            addTable(house, {
              zone: data.get("zone") === "terrasse" ? "terrasse" : "salle",
              number: Number(data.get("number")),
              seats: Number(data.get("seats")),
            }),
          );
        }}
      >
        <p className="w-full font-display font-bold">Ajouter une table</p>
        <label className="text-sm">
          Zone
          <select name="zone" className="mt-1 block rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-2">
            <option value="salle">Salle</option>
            <option value="terrasse">Terrasse</option>
          </select>
        </label>
        <label className="text-sm">
          Numéro
          <input name="number" type="number" min={1} required className="mt-1 block w-24 rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-2" />
        </label>
        <label className="text-sm">
          Places
          <input name="seats" type="number" min={1} defaultValue={2} required className="mt-1 block w-24 rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-2" />
        </label>
        <button disabled={pending} className="btn-burgundy px-4 py-2 text-xs">Ajouter</button>
      </form>
      {(["salle", "terrasse"] as const).map((zone) => (
        <section key={zone}>
          <h2 className="font-display text-2xl font-bold">{zone === "salle" ? "Salle" : "Terrasse"}</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {tables.filter((table) => table.zone === zone).map((table) => (
              <article key={table.id} className="rounded-3xl bg-white p-4">
                <p className="font-display text-xl font-bold">Table {table.number}</p>
                <form
                  className="mt-3 space-y-2"
                  onSubmit={(event) => {
                    event.preventDefault();
                    const data = new FormData(event.currentTarget);
                    run(() =>
                      updateTable(house, table.id, {
                        number: Number(data.get("number")),
                        seats: Number(data.get("seats")),
                      }),
                    );
                  }}
                >
                  <label className="block text-sm">
                    Numéro
                    <input name="number" type="number" defaultValue={table.number} className="mt-1 w-full rounded-xl border px-3 py-2" />
                  </label>
                  <label className="block text-sm">
                    Places
                    <input name="seats" type="number" defaultValue={table.seats} className="mt-1 w-full rounded-xl border px-3 py-2" />
                  </label>
                  <button disabled={pending} className="rounded-full bg-paper-soft px-3 py-2 text-xs font-bold uppercase">Enregistrer</button>
                </form>
                <button
                  type="button"
                  disabled={pending}
                  className="mt-2 text-xs font-bold uppercase text-burgundy"
                  onClick={() => run(() => setTableActive(house, table.id, !table.active))}
                >
                  {table.active ? "Désactiver" : "Réactiver"}
                </button>
                {!table.active ? <p className="mt-1 text-xs text-ink-muted">Inactive</p> : null}
              </article>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
