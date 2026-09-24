import { createServiceClient } from "@/lib/supabase/server";
import type { HouseId } from "@/lib/houses";
import {
  tableIsTaken,
  type DiningTable,
  type HouseSettings,
  type ReservationRow,
  type ReservationStatus,
  type TableZone,
} from "@/lib/reservations";

function client() {
  return createServiceClient();
}

export async function getSettings(house: HouseId) {
  const supabase = client();
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("settings")
    .select("*")
    .eq("house", house)
    .single();
  if (error) throw error;
  return data as HouseSettings;
}

export async function listTables(house: HouseId, zone?: TableZone) {
  const supabase = client();
  if (!supabase) return null;
  let query = supabase
    .from("tables")
    .select("*")
    .eq("house", house)
    .order("number", { ascending: true });
  if (zone) query = query.eq("zone", zone);
  const { data, error } = await query;
  if (error) throw error;
  return data as DiningTable[];
}

export async function listActiveHolds(input: {
  house: HouseId;
  date: string;
  zone?: TableZone;
}) {
  const supabase = client();
  if (!supabase) return null;
  const tables = await listTables(input.house, input.zone);
  if (!tables) return null;
  const ids = tables.map((table) => table.id);
  if (ids.length === 0) return [];
  const { data, error } = await supabase
    .from("reservations")
    .select("*")
    .eq("service_date", input.date)
    .in("status", ["held", "blocked", "confirmed"])
    .in("table_id", ids);
  if (error) throw error;
  return data as ReservationRow[];
}

export async function availability(input: {
  house: HouseId;
  date: string;
  time: string;
  zone: TableZone;
  guests: number;
}) {
  const settings = await getSettings(input.house);
  const tables = await listTables(input.house, input.zone);
  const holds = await listActiveHolds(input);
  if (!settings || !tables || !holds) return null;

  const active = tables.filter((table) => table.active);
  return {
    configured: true as const,
    holdMinutes: settings.hold_minutes,
    tables: active.map((table) => {
      const taken = tableIsTaken(
        holds.filter((hold) => hold.table_id === table.id),
        input.time,
        settings.hold_minutes,
      );
      const tooSmall = table.seats < input.guests;
      const state = taken ? "taken" : tooSmall ? "too_small" : "free";
      return {
        id: table.id,
        number: table.number,
        seats: table.seats,
        zone: table.zone,
        state,
      };
    }),
  };
}

export async function placeHold(input: {
  house: HouseId;
  tableId: string;
  date: string;
  time: string;
  holdMinutes: number;
  guests: number;
  name: string;
  phone: string;
  email: string;
  note: string;
  status: Extract<ReservationStatus, "held" | "blocked">;
}) {
  const supabase = client();
  if (!supabase) return null;
  const { data, error } = await supabase.rpc("place_hold", {
    p_house: input.house,
    p_table_id: input.tableId,
    p_date: input.date,
    p_start: input.time,
    p_hold_minutes: input.holdMinutes,
    p_guests: input.guests,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_note: input.note,
    p_status: input.status,
  });
  if (error) {
    const message = error.message ?? "";
    if (message.includes("table_taken")) return { error: "table_taken" as const };
    if (message.includes("too_many_guests")) return { error: "too_many_guests" as const };
    if (message.includes("invalid_table")) return { error: "invalid_table" as const };
    throw error;
  }
  return { reservation: data as ReservationRow };
}

export function isHouseId(value: string | null): value is HouseId {
  return value === "montmartre" || value === "poissonniere";
}

export function isZone(value: string | null): value is TableZone {
  return value === "salle" || value === "terrasse";
}
