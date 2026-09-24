import { NextRequest } from "next/server";
import { supabaseConfigured } from "@/lib/supabase/env";
import { availability, isHouseId, isZone } from "@/lib/reservation-store";

export async function GET(request: NextRequest) {
  if (!supabaseConfigured()) {
    return Response.json({ configured: false, tables: [], holdMinutes: 90 });
  }

  const params = request.nextUrl.searchParams;
  const house = params.get("house");
  const zone = params.get("zone");
  const date = params.get("date") ?? "";
  const time = params.get("time") ?? "";
  const guests = Number(params.get("guests") ?? "1");

  if (!isHouseId(house) || !isZone(zone) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "invalid_query" }, { status: 400 });
  }
  if (!/^\d{2}:\d{2}$/.test(time) || !Number.isFinite(guests) || guests < 1) {
    return Response.json({ error: "invalid_query" }, { status: 400 });
  }

  const result = await availability({ house, zone, date, time, guests });
  if (!result) {
    return Response.json({ configured: false, tables: [], holdMinutes: 90 });
  }
  return Response.json(result);
}
