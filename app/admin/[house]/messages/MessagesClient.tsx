"use client";

import { useTransition } from "react";
import { markMessage, trashMessage } from "@/app/admin/[house]/actions";
import type { House } from "@/lib/house";

type Message = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  subject: string | null;
  message: string;
  status: string;
  created_at: string;
};

export function MessagesClient({
  house,
  userId,
  messages,
}: {
  house: House;
  userId: string;
  messages: Message[];
}) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-3">
      {messages.map((row) => (
        <article key={row.id} className="rounded-3xl bg-white p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="font-display font-bold">{row.name}</p>
              <p className="text-sm text-ink-muted">{row.subject ?? "Sans objet"} · {new Date(row.created_at).toLocaleString("fr-FR")}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {row.status === "new" ? (
                <button type="button" disabled={pending} className="rounded-full bg-paper-soft px-3 py-1 text-xs font-bold uppercase" onClick={() => start(async () => { await markMessage(house, row.id, "read", userId); })}>
                  Marquer lu
                </button>
              ) : null}
              <a className="rounded-full border px-3 py-1 text-xs font-bold uppercase text-burgundy" href={`mailto:${row.email}?subject=${encodeURIComponent(`Re: ${row.subject ?? ""}`)}`}>
                Répondre
              </a>
              {row.phone ? (
                <a className="rounded-full border px-3 py-1 text-xs font-bold uppercase" href={`tel:${row.phone}`}>
                  Appeler
                </a>
              ) : null}
              <button type="button" className="rounded-full px-3 py-1 text-xs uppercase" onClick={() => start(async () => { await markMessage(house, row.id, "archived", userId); })}>
                Archiver
              </button>
              <button type="button" className="rounded-full px-3 py-1 text-xs uppercase text-burgundy" onClick={() => start(async () => { await trashMessage(house, row.id); })}>
                Corbeille
              </button>
            </div>
          </div>
          <p className="mt-3 whitespace-pre-wrap text-sm">{row.message}</p>
          <p className="mt-2 text-xs text-ink-muted">{row.email}{row.phone ? ` · ${row.phone}` : ""}</p>
        </article>
      ))}
    </div>
  );
}
