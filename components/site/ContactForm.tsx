"use client";

import { useSearchParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { HOUSE_LABEL, HOUSES, isHouse } from "@/lib/house";

export function ContactForm() {
  const params = useSearchParams();
  const initial = params.get("maison");
  const [house, setHouse] = useState(isHouse(initial) ? initial : "");
  const [startedAt] = useState(() => Date.now());
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const data = new FormData(event.currentTarget);
    const response = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        house: data.get("house"),
        name: data.get("name"),
        email: data.get("email"),
        phone: data.get("phone"),
        subject: data.get("subject"),
        message: data.get("message"),
        website: data.get("website"),
        startedAt,
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Envoi impossible.");
      return;
    }
    setStatus("Message envoyé. Nous vous répondons dès que possible.");
    event.currentTarget.reset();
  }

  return (
    <form onSubmit={onSubmit} className="mt-10 space-y-4 rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white p-6">
      <label className="block text-sm">
        Maison
        <select name="house" required value={house} onChange={(event) => setHouse(event.target.value)} className="mt-1 w-full rounded-xl border px-3 py-2">
          <option value="">Choisir une maison</option>
          {HOUSES.map((id) => (
            <option key={id} value={id}>{HOUSE_LABEL[id]}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">Nom<input name="name" required className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      <label className="block text-sm">E-mail<input name="email" type="email" required className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      <label className="block text-sm">Téléphone<input name="phone" className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      <label className="block text-sm">Sujet<input name="subject" className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      <label className="block text-sm">Message<textarea name="message" required minLength={10} rows={5} className="mt-1 w-full rounded-xl border px-3 py-2" /></label>
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" />
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      {status ? <p className="text-sm">{status}</p> : null}
      <button className="btn-burgundy px-6 py-3 text-sm">Envoyer</button>
    </form>
  );
}
