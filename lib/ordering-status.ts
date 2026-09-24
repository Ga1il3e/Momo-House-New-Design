import type { House } from "@/lib/house";

export type OrderingStatus = {
  house: House;
  pickup: { open: boolean; reason: string | null };
  delivery: { open: boolean; reason: string | null };
  cashOnPickup: boolean;
  prepMinutes: number;
  takeawayFeeCents: number;
  takeawayDiscountPct: number;
  deliveryFeeCents: number;
  deliveryMinCents: number;
  deliveryPostcodes: string[];
  deliveryEtaMinutes: number;
  pausedUntil: string | null;
};
