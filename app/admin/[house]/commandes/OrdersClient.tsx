"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  cancelOrder,
  markCashPaid,
  pauseOrdering,
  refundOrder,
  updateOrderStatus,
} from "@/app/admin/[house]/actions";
import { printHtml } from "@/components/admin/PrintFrame";
import { euro } from "@/lib/money";
import { fulfillmentLabel, orderLabel, paymentLabel, type FulfillmentType, type OrderStatus, type PaymentStatus } from "@/lib/status";
import type { House } from "@/lib/house";

type OrderRow = {
  id: string;
  order_number: string;
  created_at: string;
  requested_time: string | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string;
  fulfillment: FulfillmentType;
  payment_method: "card" | "cash";
  payment_status: PaymentStatus;
  status: OrderStatus;
  total_cents: number;
  needs_review: boolean;
  stripe_payment_label: string | null;
  customer_note: string | null;
};

const NEXT: Record<OrderStatus, OrderStatus | null> = {
  pending: "confirmed",
  confirmed: "preparing",
  preparing: "ready",
  ready: "completed",
  completed: null,
  cancelled: null,
};

function nextLabel(status: OrderStatus, fulfillment: FulfillmentType) {
  switch (status) {
    case "pending":
      return "Accepter";
    case "confirmed":
      return "En préparation";
    case "preparing":
      return "Prête";
    case "ready":
      return fulfillment === "delivery" ? "Livrée" : "Retirée";
    case "completed":
    case "cancelled":
      return null;
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function OrdersClient({
  house,
  pausedUntil,
  columns,
  completed,
  cancelled,
}: {
  house: House;
  pausedUntil: string | null;
  columns: Record<"pending" | "confirmed" | "preparing" | "ready", OrderRow[]>;
  completed: OrderRow[];
  cancelled: OrderRow[];
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string }>) {
    start(async () => {
      const result = await action();
      if (result.error) {
        setError(result.error);
        toast.error(result.error);
      } else {
        setError(null);
      }
    });
  }

  function card(order: OrderRow) {
    const next = NEXT[order.status];
    const label = nextLabel(order.status, order.fulfillment);
    return (
      <article key={order.id} className="rounded-2xl border border-[rgba(228,190,186,0.4)] bg-white p-3">
        <p className="font-display font-bold">{order.order_number}</p>
        <p className="text-xs text-ink-muted tabular-nums">
          {new Date(order.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          {" · "}
          {order.requested_time
            ? new Date(order.requested_time).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })
            : "Dès que possible"}
        </p>
        <p className="mt-1 text-sm">{order.customer_name}</p>
        <p className="text-xs">{fulfillmentLabel(order.fulfillment)} · {euro(order.total_cents)}</p>
        <p className="text-xs">{paymentLabel(order.payment_method, order.payment_status)}</p>
        {order.needs_review ? <p className="text-xs font-bold text-burgundy">Montant à vérifier</p> : null}
        <div className="mt-2 flex flex-wrap gap-1">
          {next && label ? (
            <button type="button" disabled={pending} className="rounded-full bg-burgundy px-2 py-1 text-[11px] font-bold uppercase text-paper" onClick={() => run(() => updateOrderStatus(house, order.id, next))}>
              {label}
            </button>
          ) : null}
          {order.payment_method === "cash" ? (
            <button type="button" disabled={pending} className="rounded-full bg-paper-soft px-2 py-1 text-[11px] font-bold uppercase" onClick={() => run(() => markCashPaid(house, order.id, order.payment_status !== "paid"))}>
              {order.payment_status === "paid" ? "Annuler l’encaissement" : "Encaisser"}
            </button>
          ) : null}
          {order.status !== "cancelled" && order.status !== "completed" ? (
            order.payment_method === "card" && order.payment_status === "paid" ? (
              <button
                type="button"
                className="rounded-full border border-burgundy px-2 py-1 text-[11px] font-bold uppercase text-burgundy"
                onClick={() => {
                  const reason = window.prompt("Motif du remboursement ?") ?? "";
                  if (reason) run(() => refundOrder(house, order.id, reason));
                }}
              >
                Annuler et rembourser
              </button>
            ) : (
              <button
                type="button"
                className="rounded-full border px-2 py-1 text-[11px] uppercase"
                onClick={() => {
                  const reason = window.prompt("Motif d’annulation ?") ?? "";
                  if (reason) run(() => cancelOrder(house, order.id, reason));
                }}
              >
                Annuler
              </button>
            )
          ) : null}
          <button
            type="button"
            className="rounded-full px-2 py-1 text-[11px] uppercase text-ink-muted"
            onClick={() =>
              printHtml(`<html><body style="font-family:sans-serif;width:80mm"><h1>${order.order_number}</h1><p>${fulfillmentLabel(order.fulfillment)}</p><p>${order.customer_name}</p><p>${order.customer_note ?? ""}</p></body></html>`)
            }
          >
            Imprimer
          </button>
        </div>
      </article>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="btn-burgundy px-4 py-2 text-xs" onClick={() => run(() => pauseOrdering(house, 30))}>
          Pause 30 min
        </button>
        <button type="button" className="rounded-full border border-burgundy px-4 py-2 font-label text-xs font-bold uppercase text-burgundy" onClick={() => run(() => pauseOrdering(house, null))}>
          Reprendre
        </button>
        {pausedUntil ? (
          <p className="text-sm text-ink-muted">
            Pause jusqu’à {new Date(pausedUntil).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </p>
        ) : null}
      </div>
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      <div className="grid gap-3 lg:grid-cols-4">
        {(["pending", "confirmed", "preparing", "ready"] as const).map((key) => (
          <section key={key} className="rounded-3xl bg-paper-soft p-3">
            <h2 className="font-label text-xs font-bold uppercase text-ink-muted">
              {orderLabel(key)} · {columns[key].length}
            </h2>
            <div className="mt-2 space-y-2">{columns[key].map(card)}</div>
          </section>
        ))}
      </div>
      <details>
        <summary className="cursor-pointer font-display font-bold">Terminées aujourd’hui ({completed.length})</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">{completed.map(card)}</div>
      </details>
      <details>
        <summary className="cursor-pointer font-display font-bold">Annulées aujourd’hui ({cancelled.length})</summary>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">{cancelled.map(card)}</div>
      </details>
    </div>
  );
}
