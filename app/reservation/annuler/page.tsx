"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function CancelForm() {
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const [status, setStatus] = useState<"idle" | "done" | "already" | "error">("idle");
  const [message, setMessage] = useState("");

  async function cancel() {
    const response = await fetch("/api/reservations/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    const data = await response.json();
    if (!response.ok) {
      setStatus("error");
      setMessage(data.error ?? "Impossible d’annuler.");
      return;
    }
    setStatus(data.already ? "already" : "done");
    setMessage(data.message ?? "Votre réservation a été annulée.");
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-20 text-center">
      <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Réservation</p>
      <h1 className="font-display mt-2 text-4xl font-extrabold">Annuler ma réservation ?</h1>
      {status === "idle" ? (
        <>
          <p className="mt-4 text-ink-muted">La table sera libérée. Cette action est définitive.</p>
          <button type="button" className="btn-burgundy mt-6 px-6 py-3 text-sm" onClick={cancel} disabled={!token}>
            Oui, annuler
          </button>
        </>
      ) : (
        <p className={`mt-6 ${status === "error" ? "text-burgundy" : "text-ink"}`}>{message}</p>
      )}
    </div>
  );
}

export default function AnnulerPage() {
  return (
    <Suspense fallback={<p className="p-10 text-center">Chargement…</p>}>
      <CancelForm />
    </Suspense>
  );
}
