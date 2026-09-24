import type { Database } from "@/lib/supabase/database.types";

export type ReservationStatus = Database["public"]["Enums"]["reservation_status"];
export type OrderStatus = Database["public"]["Enums"]["order_status"];
export type FulfillmentType = Database["public"]["Enums"]["fulfillment_type"];
export type PaymentStatus = Database["public"]["Enums"]["payment_status"];

export function reservationLabel(status: ReservationStatus) {
  switch (status) {
    case "held":
      return "Retenue — à confirmer";
    case "confirmed":
      return "Confirmée";
    case "blocked":
      return "Bloquée";
    case "released":
      return "Libérée";
    case "cancelled":
      return "Annulée";
    case "no_show":
      return "No-show";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function reservationTone(status: ReservationStatus) {
  switch (status) {
    case "held":
      return "amber";
    case "confirmed":
      return "green";
    case "blocked":
      return "ink";
    case "released":
      return "muted";
    case "cancelled":
      return "burgundy-outline";
    case "no_show":
      return "red";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function orderLabel(status: OrderStatus, fulfillment: FulfillmentType = "pickup") {
  switch (status) {
    case "pending":
      return "Reçue";
    case "confirmed":
      return "Acceptée";
    case "preparing":
      return "En préparation";
    case "ready":
      return fulfillment === "delivery" ? "Prête (à livrer)" : "Prête (à retirer)";
    case "completed":
      return fulfillment === "delivery" ? "Livrée" : "Retirée";
    case "cancelled":
      return "Annulée";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}

export function fulfillmentLabel(fulfillment: FulfillmentType) {
  switch (fulfillment) {
    case "pickup":
      return "Retrait";
    case "delivery":
      return "Livraison";
    default: {
      const _exhaustive: never = fulfillment;
      return _exhaustive;
    }
  }
}

export function paymentLabel(
  method: "card" | "cash",
  status: PaymentStatus,
) {
  if (method === "card") {
    switch (status) {
      case "paid":
        return "Carte payée";
      case "refunded":
        return "Remboursée";
      case "partially_refunded":
        return "Remboursée partiellement";
      case "failed":
        return "Carte échouée";
      case "pending":
        return "Carte — en attente";
      default: {
        const _exhaustive: never = status;
        return _exhaustive;
      }
    }
  }
  switch (status) {
    case "paid":
      return "Espèces — encaissé";
    case "pending":
      return "Espèces — à encaisser";
    case "failed":
    case "refunded":
    case "partially_refunded":
      return "Espèces";
    default: {
      const _exhaustive: never = status;
      return _exhaustive;
    }
  }
}
