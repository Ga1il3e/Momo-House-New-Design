import type { HouseId } from "@/lib/houses";

export type TableZone = "salle" | "terrasse";
export type ReservationStatus = "held" | "released" | "blocked" | "confirmed" | "cancelled" | "no_show";

export type DiningTable = {
  id: string;
  house: HouseId;
  zone: TableZone;
  number: number;
  seats: number;
  active: boolean;
};

export type ReservationRow = {
  id: string;
  house: HouseId;
  table_id: string;
  service_date: string;
  start_time: string;
  hold_minutes: number;
  guest_name: string | null;
  guest_phone: string | null;
  guest_email: string | null;
  note: string | null;
  guests: number;
  status: ReservationStatus;
  created_at: string;
};

export type HouseSettings = {
  house: HouseId;
  hold_minutes: number;
  guest_email_subject: string;
  guest_email_body: string;
  house_email_subject: string;
  house_email_body: string;
};

export function minutesFromTime(value: string) {
  const [hour, minute] = value.slice(0, 5).split(":").map(Number);
  if (!Number.isFinite(hour) || !Number.isFinite(minute)) return null;
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) return null;
  return hour * 60 + minute;
}

export function formatMinutes(total: number) {
  const wrapped = ((total % (24 * 60)) + 24 * 60) % (24 * 60);
  const hour = Math.floor(wrapped / 60);
  const minute = wrapped % 60;
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

export function windowsOverlap(
  startA: number,
  minutesA: number,
  startB: number,
  minutesB: number,
) {
  return startA < startB + minutesB && startB < startA + minutesA;
}

export function tableIsTaken(
  holds: { start_time: string; hold_minutes: number; status: ReservationStatus }[],
  startTime: string,
  holdMinutes: number,
) {
  const start = minutesFromTime(startTime);
  if (start === null) return true;
  return holds.some((hold) => {
    if (hold.status === "released") return false;
    const existing = minutesFromTime(hold.start_time);
    if (existing === null) return false;
    return windowsOverlap(existing, hold.hold_minutes, start, holdMinutes);
  });
}

export type EmailFields = {
  house: string;
  table: string;
  zone: string;
  date: string;
  start: string;
  end: string;
  guests: string;
  name: string;
  phone: string;
  email: string;
  note: string;
  housePhone: string;
};

export function fillTemplate(template: string, fields: EmailFields) {
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    if (key in fields) return fields[key as keyof EmailFields];
    return match;
  });
}
