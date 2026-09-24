"use client";

import { useState, useTransition } from "react";
import { bulkTrash, purgeTrash, restoreTrash } from "@/app/admin/[house]/actions";
import { addDays } from "@/lib/time";
import type { House } from "@/lib/house";

type Kind = "reservations" | "orders" | "messages" | "emails";
type Item = { id: string; label: string; deleted_at: string };

export function TrashClient({
  house,
  sections,
}: {
  house: House;
  sections: Record<Kind, Item[]>;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");

  function run(action: () => Promise<{ error?: string }>) {
    start(async () => {
      const result = await action();
      setError(result.error ?? null);
    });
  }

  return (
    <div className="space-y-8">
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      {(
        [
          ["reservations", "Réservations"],
          ["orders", "Commandes"],
          ["messages", "Messages"],
          ["emails", "E-mails"],
        ] as const
      ).map(([kind, title]) => (
        <section key={kind} className="rounded-3xl bg-white p-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="font-display text-xl font-bold">{title}</h2>
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={confirm}
                onChange={(event) => setConfirm(event.target.value)}
                placeholder="SUPPRIMER"
                className="rounded-xl border px-2 py-1 text-xs"
              />
              <button type="button" disabled={pending} className="text-xs uppercase" onClick={() => run(() => bulkTrash(house, kind, "restore", confirm))}>
                Tout restaurer
              </button>
              <button type="button" disabled={pending} className="text-xs uppercase text-burgundy" onClick={() => run(() => bulkTrash(house, kind, "purge", confirm))}>
                Tout supprimer
              </button>
            </div>
          </div>
          <ul className="mt-3 space-y-2">
            {sections[kind].map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-[rgba(228,190,186,0.3)] py-2">
                <div>
                  <p className="text-sm">{item.label}</p>
                  <p className="text-xs text-ink-muted">
                    Suppression définitive le {addDays(item.deleted_at.slice(0, 10), 35)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button type="button" className="text-xs uppercase" onClick={() => run(() => restoreTrash(house, kind, item.id))}>
                    Restaurer
                  </button>
                  <button type="button" className="text-xs uppercase text-burgundy" onClick={() => run(() => purgeTrash(house, kind, item.id))}>
                    Supprimer définitivement
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
