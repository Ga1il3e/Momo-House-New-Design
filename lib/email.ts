import { Resend } from "resend";
import { houses, type HouseId } from "@/lib/houses";
import {
  fillTemplate,
  formatMinutes,
  minutesFromTime,
  type EmailFields,
  type HouseSettings,
  type TableZone,
} from "@/lib/reservations";

export function houseNotifyAddress(house: HouseId) {
  if (house === "montmartre") return process.env.MONTMARTRE_NOTIFY_EMAIL ?? "";
  return process.env.POISSONNIERE_NOTIFY_EMAIL ?? "";
}

export function buildEmailFields(input: {
  house: HouseId;
  tableNumber: number;
  zone: TableZone;
  dateLabel: string;
  start: string;
  holdMinutes: number;
  guests: number;
  name: string;
  phone: string;
  email: string;
  note: string;
}): EmailFields {
  const startMinutes = minutesFromTime(input.start) ?? 0;
  return {
    house: houses[input.house].name,
    table: String(input.tableNumber),
    zone: input.zone === "terrasse" ? "Terrasse" : "Salle",
    date: input.dateLabel,
    start: input.start.slice(0, 5),
    end: formatMinutes(startMinutes + input.holdMinutes),
    guests: String(input.guests),
    name: input.name || "—",
    phone: input.phone || "—",
    email: input.email || "—",
    note: input.note || "—",
    housePhone: houses[input.house].phone,
  };
}

export async function sendHoldEmails(input: {
  settings: HouseSettings;
  fields: EmailFields;
  guestEmail: string;
  house: HouseId;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESERVATION_FROM_EMAIL;
  if (!apiKey || !from) return { sent: false as const };

  const resend = new Resend(apiKey);
  const guestSubject = fillTemplate(input.settings.guest_email_subject, input.fields);
  const guestBody = fillTemplate(input.settings.guest_email_body, input.fields);
  const houseSubject = fillTemplate(input.settings.house_email_subject, input.fields);
  const houseBody = fillTemplate(input.settings.house_email_body, input.fields);
  const notify = houseNotifyAddress(input.house);

  const sends = [
    resend.emails.send({
      from,
      to: input.guestEmail,
      subject: guestSubject,
      text: guestBody,
    }),
  ];
  if (notify) {
    sends.push(
      resend.emails.send({
        from,
        to: notify,
        subject: houseSubject,
        text: houseBody,
      }),
    );
  }

  const results = await Promise.all(sends);
  const failed = results.some((result) => result.error);
  return { sent: !failed as boolean };
}
