import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { isHouse, type House } from "@/lib/house";
import { houses, type House as VisualHouse } from "@/lib/houses";
import type { OrderingStatus } from "@/lib/ordering-status";
import { addDays, parisToday } from "@/lib/time";

export type { OrderingStatus } from "@/lib/ordering-status";

export type HouseClosure = {
  id: string;
  startsOn: string;
  endsOn: string;
  reason: string | null;
  scope: "all" | "reservations" | "orders";
};

export type HouseOps = {
  house: House;
  phone: string;
  phoneHref: string;
  hoursLabel: string;
  hoursNote: string;
  addressLine: string | null;
  city: string | null;
  postalCode: string | null;
  contactEmail: string | null;
  displayName: string | null;
  emailFromName: string | null;
  continuous: boolean;
  closedWeekdays: number[];
  closures: HouseClosure[];
};

function publicClient() {
  const admin = createAdminClient();
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadHouseOps(house: House): Promise<HouseOps | null> {
  if (!isHouse(house)) return null;
  const supabase = publicClient();
  if (!supabase) return null;
  const today = parisToday();
  const soon = addDays(today, 7);
  const opsQuery = supabase.from("house_ops").select("*").eq("house", house).maybeSingle();
  const closuresQuery = supabase
    .from("house_closures")
    .select("id, starts_on, ends_on, reason, scope")
    .eq("house", house)
    .lte("starts_on", soon)
    .gte("ends_on", today)
    .order("starts_on");
  const [{ data: ops }, { data: closures }] = await Promise.all([opsQuery, closuresQuery]);
  if (!ops) return null;
  return {
    house,
    phone: ops.phone,
    phoneHref: ops.phone_href,
    hoursLabel: ops.hours_label,
    hoursNote: ops.hours_note,
    addressLine: ops.address_line,
    city: ops.city,
    postalCode: ops.postal_code,
    contactEmail: ops.contact_email,
    displayName: ops.display_name,
    emailFromName: ops.email_from_name,
    continuous: ops.continuous,
    closedWeekdays: ops.closed_weekdays ?? [],
    closures: (closures ?? []).map((row) => ({
      id: row.id,
      startsOn: row.starts_on,
      endsOn: row.ends_on,
      reason: row.reason,
      scope: row.scope,
    })),
  };
}

export function getHouseOps(house: House) {
  return unstable_cache(() => loadHouseOps(house), ["house-ops", house], {
    tags: [`house:${house}`],
  })();
}

export async function houseWithOps(house: House): Promise<VisualHouse> {
  const visual = houses[house];
  const ops = await getHouseOps(house);
  if (!ops) return visual;
  return {
    ...visual,
    phone: ops.phone || visual.phone,
    phoneHref: ops.phoneHref || visual.phoneHref,
    hours: ops.hoursLabel || visual.hours,
    hoursNote: ops.hoursNote || visual.hoursNote,
    address: ops.addressLine
      ? `${ops.addressLine}${ops.postalCode || ops.city ? `, ${[ops.postalCode, ops.city].filter(Boolean).join(" ")}` : ""}`
      : visual.address,
  };
}

export async function getOrderingStatus(house: House): Promise<OrderingStatus | null> {
  const supabase = publicClient();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("get_ordering_status", { p_house: house });
  if (error || !data || typeof data !== "object") return null;
  const row = data as Record<string, unknown>;
  const pickup = (row.pickup ?? {}) as { open?: boolean; reason?: string | null };
  const delivery = (row.delivery ?? {}) as { open?: boolean; reason?: string | null };
  return {
    house,
    pickup: { open: Boolean(pickup.open), reason: pickup.reason ?? null },
    delivery: { open: Boolean(delivery.open), reason: delivery.reason ?? null },
    cashOnPickup: Boolean(row.cash_on_pickup),
    prepMinutes: Number(row.prep_minutes ?? 20),
    takeawayFeeCents: Number(row.takeaway_fee_cents ?? 0),
    takeawayDiscountPct: Number(row.takeaway_discount_pct ?? 0),
    deliveryFeeCents: Number(row.delivery_fee_cents ?? 0),
    deliveryMinCents: Number(row.delivery_min_cents ?? 0),
    deliveryPostcodes: Array.isArray(row.delivery_postcodes)
      ? (row.delivery_postcodes as string[])
      : [],
    deliveryEtaMinutes: Number(row.delivery_eta_minutes ?? 40),
    pausedUntil: typeof row.paused_until === "string" ? row.paused_until : null,
  };
}
