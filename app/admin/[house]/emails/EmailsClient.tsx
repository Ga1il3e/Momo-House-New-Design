"use client";

import { useState, useTransition } from "react";
import { resendEmail, trashAllEmails, trashEmail } from "@/app/admin/[house]/actions";
import { EMAIL_TYPE_LABEL, type EmailType } from "@/lib/email/templates";
import type { House } from "@/lib/house";

type Log = {
  id: string;
  type: string;
  to_email: string;
  subject: string | null;
  html: string | null;
  status: "queued" | "sent" | "failed" | "skipped";
  provider_id: string | null;
  error: string | null;
  created_at: string;
};

function typeLabel(type: string) {
  return EMAIL_TYPE_LABEL[type as EmailType] ?? type;
}

export function EmailsClient({ house, logs }: { house: House; logs: Log[] }) {
  const [selected, setSelected] = useState<Log | null>(logs[0] ?? null);
  const [pending, start] = useTransition();

  return (
    <div className="grid gap-4 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-2">
        <button type="button" className="text-xs uppercase text-burgundy" onClick={() => start(async () => { await trashAllEmails(house); })}>
          Tout mettre à la corbeille
        </button>
        {logs.map((log) => (
          <button
            key={log.id}
            type="button"
            onClick={() => setSelected(log)}
            className={`block w-full rounded-2xl bg-white px-4 py-3 text-left ${selected?.id === log.id ? "ring-2 ring-burgundy" : ""}`}
          >
            <p className="font-medium">{log.subject}</p>
            <p className="text-xs text-ink-muted">{typeLabel(log.type)} → {log.to_email} · {log.status}</p>
          </button>
        ))}
      </div>
      {selected ? (
        <aside className="rounded-3xl bg-white p-4">
          <p className="font-display font-bold">{selected.subject}</p>
          <p className="mt-1 text-sm">À {selected.to_email}</p>
          <p className="text-xs text-ink-muted">{typeLabel(selected.type)} · {new Date(selected.created_at).toLocaleString("fr-FR")}</p>
          <p className="text-xs">ID Resend : {selected.provider_id ?? "—"}</p>
          {selected.error ? <p className="text-xs text-burgundy">{selected.error}</p> : null}
          <iframe title="Aperçu" sandbox="" srcDoc={selected.html ?? ""} className="mt-3 h-64 w-full rounded-xl border bg-paper" />
          <div className="mt-3 flex gap-2">
            {selected.status === "failed" ? (
              <button type="button" disabled={pending} className="btn-burgundy px-3 py-1 text-xs" onClick={() => start(async () => { await resendEmail(house, selected.id); })}>
                Renvoyer
              </button>
            ) : null}
            <button type="button" className="text-xs uppercase text-burgundy" onClick={() => start(async () => { await trashEmail(house, selected.id); })}>
              Corbeille
            </button>
          </div>
        </aside>
      ) : null}
    </div>
  );
}
