import { NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isHouse } from "@/lib/house";
import { frenchError, httpStatusForError } from "@/lib/errors";

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const house = params.get("maison") ?? params.get("house");
  const date = params.get("date") ?? "";
  const guests = Number(params.get("couverts") ?? params.get("guests") ?? "2");
  if (!isHouse(house) || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return Response.json({ error: "Requête invalide." }, { status: 400 });
  }
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "unconfigured" }, { status: 503 });
  const { data, error } = await admin.rpc("get_availability", {
    p_house: house,
    p_date: date,
    p_guests: Number.isFinite(guests) ? guests : 2,
  });
  if (error) {
    return Response.json({ error: frenchError(error) }, { status: httpStatusForError(error) });
  }
  return Response.json(data ?? {}, { headers: { "Cache-Control": "no-store" } });
}
