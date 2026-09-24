"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { euro } from "@/lib/money";
import { fulfillmentLabel, orderLabel, type FulfillmentType, type OrderStatus } from "@/lib/status";
import { HOUSE_LABEL, isHouse } from "@/lib/house";

type PublicOrder = {
  house: string;
  order_number: string;
  status: OrderStatus;
  fulfillment: FulfillmentType;
  total_cents: number;
  payment_method: "card" | "cash";
  payment_status: string;
  customer_name: string;
  stripe_payment_label: string | null;
  items: { dish_name: string; quantity: number; line_total_cents: number }[];
};

export default function CommandePage() {
  const { token } = useParams<{ token: string }>();
  const [order, setOrder] = useState<PublicOrder | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      const response = await fetch(`/api/orders/${token}`);
      const data = await response.json();
      if (!response.ok) {
        if (!cancelled) setError(data.error ?? "Commande introuvable.");
        return;
      }
      if (!cancelled) setOrder(data);
    }
    load();
    const timer = setInterval(load, 20000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [token]);

  async function cancel() {
    const response = await fetch(`/api/orders/${token}`, { method: "POST" });
    const data = await response.json();
    if (!response.ok) setError(data.error ?? "Annulation impossible.");
    else {
      const refresh = await fetch(`/api/orders/${token}`);
      setOrder(await refresh.json());
    }
  }

  if (error) return <p className="px-4 py-16 text-center text-burgundy">{error}</p>;
  if (!order) return <p className="px-4 py-16 text-center">Chargement…</p>;
  const house = isHouse(order.house) ? order.house : "montmartre";

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      <p className="font-label text-xs font-bold uppercase text-burgundy">{HOUSE_LABEL[house]}</p>
      <h1 className="font-display text-3xl font-extrabold">{order.order_number}</h1>
      <p className="mt-2">{orderLabel(order.status, order.fulfillment)} · {fulfillmentLabel(order.fulfillment)}</p>
      <ul className="mt-6 space-y-2 text-sm">
        {order.items.map((item) => (
          <li key={item.dish_name} className="flex justify-between">
            <span>{item.quantity} × {item.dish_name}</span>
            <span>{euro(item.line_total_cents)}</span>
          </li>
        ))}
      </ul>
      <p className="mt-4 font-bold">Total {euro(order.total_cents)}</p>
      <p className="text-sm text-ink-muted">{order.stripe_payment_label ?? (order.payment_method === "cash" ? "Espèces au retrait" : "Carte")}</p>
      {order.status === "pending" ? (
        <button type="button" className="mt-6 rounded-full border border-burgundy px-4 py-2 text-xs font-bold uppercase text-burgundy" onClick={cancel}>
          Annuler ma commande
        </button>
      ) : null}
    </div>
  );
}
