import { houses } from "@/lib/houses";
import { buildEmailFields, sendHoldEmails } from "@/lib/email";
import { formatMinutes, minutesFromTime } from "@/lib/reservations";
import {
  getSettings,
  isHouseId,
  isZone,
  listTables,
  placeHold,
} from "@/lib/reservation-store";
import { supabaseConfigured } from "@/lib/supabase/env";

const MONTHS_FR = [
  "janvier", "février", "mars", "avril", "mai", "juin",
  "juillet", "août", "septembre", "octobre", "novembre", "décembre",
];
const WEEKDAYS_FR = [
  "dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi",
];

function formatDateFr(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return iso;
  const date = new Date(y, m - 1, d);
  return `${WEEKDAYS_FR[date.getDay()]} ${d} ${MONTHS_FR[m - 1]}`;
}

export async function POST(request: Request) {
  if (!supabaseConfigured()) {
    return Response.json({ error: "unconfigured" }, { status: 503 });
  }

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const house = typeof body.house === "string" ? body.house : null;
  const zone = typeof body.zone === "string" ? body.zone : null;
  const tableId = typeof body.tableId === "string" ? body.tableId : "";
  const date = typeof body.date === "string" ? body.date : "";
  const time = typeof body.time === "string" ? body.time : "";
  const guests = Number(body.guests);
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const note = typeof body.note === "string" ? body.note.trim() : "";

  if (!isHouseId(house) || !isZone(zone) || !tableId || !name || !phone || !email) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }
  if (!Number.isInteger(guests) || guests < 1 || guests > 12) {
    return Response.json({ error: "invalid_body" }, { status: 400 });
  }

  const settings = await getSettings(house);
  const tables = await listTables(house, zone);
  if (!settings || !tables) {
    return Response.json({ error: "unconfigured" }, { status: 503 });
  }
  const table = tables.find((item) => item.id === tableId && item.active);
  if (!table) {
    return Response.json({ error: "invalid_table" }, { status: 400 });
  }

  const placed = await placeHold({
    house,
    tableId,
    date,
    time,
    holdMinutes: settings.hold_minutes,
    guests,
    name,
    phone,
    email,
    note,
    status: "held",
  });
  if (!placed) {
    return Response.json({ error: "unconfigured" }, { status: 503 });
  }
  if ("error" in placed) {
    const status = placed.error === "table_taken" ? 409 : 400;
    return Response.json({ error: placed.error }, { status });
  }

  const start = minutesFromTime(time) ?? 0;
  const end = formatMinutes(start + settings.hold_minutes);
  const fields = buildEmailFields({
    house,
    tableNumber: table.number,
    zone,
    dateLabel: formatDateFr(date),
    start: time,
    holdMinutes: settings.hold_minutes,
    guests,
    name,
    phone,
    email,
    note,
  });
  const mail = await sendHoldEmails({
    settings,
    fields,
    guestEmail: email,
    house,
  });

  return Response.json({
    id: placed.reservation.id,
    tableNumber: table.number,
    zone,
    holdMinutes: settings.hold_minutes,
    end,
    emailSent: mail.sent,
    houseName: houses[house].name,
    phone: houses[house].phone,
  });
}
