"use client";

import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { euro } from "@/lib/money";
import { getPublishableKey } from "@/lib/stripe-public";
import type { House } from "@/lib/house";
import type { OrderingStatus } from "@/lib/ordering-status";

type Quote = {
  lines?: { dish_name: string; quantity: number; line_total_cents: number }[];
  subtotal_cents?: number;
  discount_cents?: number;
  fee_cents?: number;
  total_cents?: number;
};

const stripePromiseCache = new Map<string, Promise<Stripe | null>>();

function stripeFor(house: House) {
  const key = getPublishableKey(house);
  if (!key) return null;
  if (!stripePromiseCache.has(key)) stripePromiseCache.set(key, loadStripe(key));
  return stripePromiseCache.get(key)!;
}

export function CheckoutClient({ house, status }: { house: House; status: OrderingStatus | null }) {
  const params = useSearchParams();
  const fulfillment = params.get("mode") === "delivery" ? "delivery" : "pickup";
  const [items] = useState<{ dish_id: string; quantity: number }[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(`mh_cart_${house}`);
      return raw ? (JSON.parse(raw) as { dish_id: string; quantity: number }[]) : [];
    } catch {
      return [];
    }
  });
  const [quote, setQuote] = useState<Quote | null>(null);
  const [quoteError, setQuoteError] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    if (!items.length) return;
    fetch(`/api/checkout/${house}/quote`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fulfillment, items, payment_method: "card" }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.error) setQuoteError(data.error);
        else setQuote(data as Quote);
      });
  }, [house, fulfillment, items]);

  const stripePromise = useMemo(() => stripeFor(house), [house]);

  return (
    <div className="mx-auto max-w-xl px-4 py-12">
      <h1 className="font-display text-3xl font-extrabold">Paiement</h1>
      {quoteError ? <p className="mt-4 text-burgundy">{quoteError}</p> : null}
      {quote ? (
        <ul className="mt-4 space-y-1 text-sm">
          {(quote.lines ?? []).map((line) => (
            <li key={line.dish_name} className="flex justify-between">
              <span>{line.quantity} × {line.dish_name}</span>
              <span>{euro(line.line_total_cents)}</span>
            </li>
          ))}
          <li className="flex justify-between text-ink-muted">Sous-total <span>{euro(quote.subtotal_cents ?? 0)}</span></li>
          {(quote.discount_cents ?? 0) > 0 ? <li className="flex justify-between">Remise à emporter <span>-{euro(quote.discount_cents ?? 0)}</span></li> : null}
          <li className="flex justify-between">Frais <span>{euro(quote.fee_cents ?? 0)}</span></li>
          <li className="flex justify-between font-bold">Total <span>{euro(quote.total_cents ?? 0)}</span></li>
        </ul>
      ) : null}
      <CheckoutForm
        house={house}
        fulfillment={fulfillment}
        items={items}
        status={status}
        stripePromise={stripePromise}
        clientSecret={clientSecret}
        setClientSecret={setClientSecret}
        paymentIntentId={paymentIntentId}
        setPaymentIntentId={setPaymentIntentId}
      />
    </div>
  );
}

function CheckoutForm({
  house,
  fulfillment,
  items,
  status,
  stripePromise,
  clientSecret,
  setClientSecret,
  paymentIntentId,
  setPaymentIntentId,
}: {
  house: House;
  fulfillment: "pickup" | "delivery";
  items: { dish_id: string; quantity: number }[];
  status: OrderingStatus | null;
  stripePromise: Promise<Stripe | null> | null;
  clientSecret: string | null;
  setClientSecret: (value: string | null) => void;
  paymentIntentId: string | null;
  setPaymentIntentId: (value: string | null) => void;
}) {
  const [method, setMethod] = useState<"card" | "cash">("card");
  const [error, setError] = useState("");
  const router = useRouter();

  async function startCard(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = Object.fromEntries(new FormData(event.currentTarget).entries());
    if (method === "cash") {
      const response = await fetch(`/api/checkout/${house}/cash`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fulfillment: "pickup",
          items,
          customer: {
            name: data.name,
            phone: data.phone,
            email: data.email,
            note: data.note,
            requested_time: data.asap === "on" ? undefined : data.requested_time,
          },
        }),
      });
      const json = await response.json();
      if (!response.ok) {
        setError(json.error ?? "Commande impossible.");
        return;
      }
      router.push(`/commande/${json.token}`);
      return;
    }
    const response = await fetch(`/api/checkout/${house}/intent`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fulfillment,
        items,
        customer: {
          name: data.name,
          phone: data.phone,
          email: data.email,
          note: data.note,
          requested_time: data.asap === "on" ? undefined : data.requested_time,
          delivery_address: fulfillment === "delivery" ? {
            line1: data.line1,
            line2: data.line2,
            postcode: data.postcode,
            city: data.city,
            instructions: data.instructions,
          } : undefined,
        },
      }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Paiement impossible.");
      return;
    }
    setClientSecret(json.clientSecret);
    setPaymentIntentId(json.paymentIntentId);
  }

  return (
    <form className="mt-6 space-y-3" onSubmit={startCard}>
      <input name="name" required placeholder="Nom" className="w-full rounded-xl border px-3 py-2" />
      <input name="phone" required placeholder="Téléphone" className="w-full rounded-xl border px-3 py-2" />
      <input name="email" type="email" required placeholder="E-mail" className="w-full rounded-xl border px-3 py-2" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="asap" defaultChecked /> Dès que possible</label>
      <input name="requested_time" type="datetime-local" className="w-full rounded-xl border px-3 py-2" />
      <textarea name="note" placeholder="Note" className="w-full rounded-xl border px-3 py-2" />
      {fulfillment === "delivery" ? (
        <>
          <input name="line1" required placeholder="Adresse" className="w-full rounded-xl border px-3 py-2" />
          <input name="line2" placeholder="Complément" className="w-full rounded-xl border px-3 py-2" />
          <input name="postcode" required placeholder="Code postal" className="w-full rounded-xl border px-3 py-2" />
          <input name="city" required placeholder="Ville" className="w-full rounded-xl border px-3 py-2" />
          <input name="instructions" placeholder="Instructions" className="w-full rounded-xl border px-3 py-2" />
        </>
      ) : null}
      <div className="flex gap-2">
        <button type="button" onClick={() => setMethod("card")} className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${method === "card" ? "bg-burgundy text-paper" : "bg-white"}`}>Carte</button>
        {fulfillment === "pickup" && status?.cashOnPickup ? (
          <button type="button" onClick={() => setMethod("cash")} className={`rounded-full px-3 py-1 text-xs font-bold uppercase ${method === "cash" ? "bg-burgundy text-paper" : "bg-white"}`}>Espèces au retrait</button>
        ) : fulfillment === "delivery" ? (
          <p className="text-xs text-ink-muted">Non disponible pour la livraison (carte en ligne uniquement).</p>
        ) : null}
      </div>
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      {!clientSecret ? <button className="btn-burgundy px-5 py-2 text-xs">{method === "cash" ? "Commander" : "Payer par carte"}</button> : null}
      {clientSecret && stripePromise ? (
        <Elements stripe={stripePromise} options={{ clientSecret }}>
          <StripePay house={house} paymentIntentId={paymentIntentId} />
        </Elements>
      ) : null}
    </form>
  );
}

function StripePay({ house, paymentIntentId }: { house: House; paymentIntentId: string | null }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [error, setError] = useState("");

  async function confirm() {
    if (!stripe || !elements || !paymentIntentId) return;
    const result = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: `${window.location.origin}/${house}/commander/paiement?retour=1` },
      redirect: "if_required",
    });
    if (result.error) {
      setError(result.error.message ?? "Paiement refusé.");
      return;
    }
    const response = await fetch(`/api/checkout/${house}/confirm`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentIntentId }),
    });
    const json = await response.json();
    if (!response.ok) {
      setError(json.error ?? "Finalisation impossible.");
      return;
    }
    router.push(`/commande/${json.token}`);
  }

  return (
    <div className="space-y-3">
      <PaymentElement />
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      <button type="button" className="btn-burgundy px-5 py-2 text-xs" onClick={confirm}>
        Confirmer le paiement
      </button>
    </div>
  );
}
