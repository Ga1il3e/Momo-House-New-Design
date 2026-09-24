"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { euro } from "@/lib/money";
import type { PublicMenu } from "@/lib/menu";
import type { House } from "@/lib/house";
import type { OrderingStatus } from "@/lib/ordering-status";
import { HOUSE_LABEL } from "@/lib/house";

type CartItem = { dish_id: string; name: string; quantity: number; notes?: string };

function cartKey(house: House) {
  return `mh_cart_${house}`;
}

export function HouseOrderClient({
  house,
  menu,
  status,
}: {
  house: House;
  menu: PublicMenu;
  status: OrderingStatus | null;
}) {
  const [fulfillment, setFulfillment] = useState<"pickup" | "delivery">(
    status?.pickup.open ? "pickup" : "delivery",
  );
  const [cart, setCart] = useState<CartItem[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const raw = localStorage.getItem(cartKey(house));
      return raw ? (JSON.parse(raw) as CartItem[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(cartKey(house), JSON.stringify(cart));
    } catch {
      // ignore
    }
  }, [cart, house]);

  const orderable = useMemo(
    () =>
      menu.categories.flatMap((category) =>
        category.dishes.filter((dish) => dish.available && dish.orderable),
      ),
    [menu],
  );

  const noneOpen = !status?.pickup.open && !status?.delivery.open;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">À emporter</p>
      <h1 className="font-display text-4xl font-extrabold">Commander — {HOUSE_LABEL[house]}</h1>
      {noneOpen ? (
        <p className="mt-6 text-ink-muted">Les commandes en ligne ne sont pas disponibles pour le moment.</p>
      ) : (
        <>
          <div className="mt-4 flex gap-2">
            {status?.pickup.open ? (
              <button type="button" onClick={() => setFulfillment("pickup")} className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${fulfillment === "pickup" ? "bg-burgundy text-paper" : "bg-white"}`}>
                Retrait · {status.prepMinutes} min
              </button>
            ) : null}
            {status?.delivery.open ? (
              <button type="button" onClick={() => setFulfillment("delivery")} className={`rounded-full px-4 py-2 text-xs font-bold uppercase ${fulfillment === "delivery" ? "bg-burgundy text-paper" : "bg-white"}`}>
                Livraison · {status.deliveryEtaMinutes} min
              </button>
            ) : null}
          </div>
          {status?.pausedUntil ? (
            <p className="mt-3 text-sm text-burgundy">La cuisine fait une courte pause. Réessayez dans quelques minutes.</p>
          ) : null}
          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            {orderable.map((dish) => (
              <article key={dish.id} className="rounded-3xl bg-white p-4">
                <p className="font-display font-bold">{dish.name}</p>
                <p className="text-sm text-burgundy">{euro(dish.priceCents)}</p>
                <button
                  type="button"
                  className="mt-2 rounded-full bg-burgundy px-3 py-1 text-xs font-bold uppercase text-paper"
                  onClick={() =>
                    setCart((current) => {
                      const existing = current.find((item) => item.dish_id === dish.id);
                      if (existing) return current.map((item) => item.dish_id === dish.id ? { ...item, quantity: item.quantity + 1 } : item);
                      return [...current, { dish_id: dish.id, name: dish.name, quantity: 1 }];
                    })
                  }
                >
                  Ajouter
                </button>
              </article>
            ))}
          </div>
          <aside className="mt-8 rounded-3xl bg-white p-5">
            <h2 className="font-display text-xl font-bold">Panier</h2>
            {cart.length === 0 ? <p className="text-sm text-ink-muted">Vide</p> : (
              <ul className="mt-2 space-y-2 text-sm">
                {cart.map((item) => (
                  <li key={item.dish_id} className="flex justify-between">
                    <span>{item.quantity} × {item.name}</span>
                    <button type="button" className="text-burgundy" onClick={() => setCart((current) => current.filter((row) => row.dish_id !== item.dish_id))}>Retirer</button>
                  </li>
                ))}
              </ul>
            )}
            {fulfillment === "delivery" && status ? (
              <p className="mt-2 text-xs text-ink-muted">Minimum livraison {euro(status.deliveryMinCents)}</p>
            ) : null}
            <Link
              href={`/${house}/commander/paiement?mode=${fulfillment}`}
              className={`btn-burgundy mt-4 inline-flex px-5 py-2 text-xs ${cart.length === 0 ? "pointer-events-none opacity-40" : ""}`}
            >
              Passer au paiement
            </Link>
          </aside>
        </>
      )}
    </div>
  );
}
