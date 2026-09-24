import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { HOUSE_LABEL, isHouse } from "@/lib/house";
import { frenchError, httpStatusForError } from "@/lib/errors";
import { sendEmail } from "@/lib/email/send";
import { DEFAULT_TEMPLATES } from "@/lib/email/templates";
import { fillAndRender } from "@/lib/email/render";
import { addMinutes, formatDateFr, formatTime } from "@/lib/time";

const schema = z.object({
  house: z.enum(["montmartre", "poissonniere"]),
  table_id: z.string().uuid(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  start: z.string().regex(/^\d{2}:\d{2}(?::\d{2})?$/),
  guests: z.number().int().min(1).max(20),
  name: z.string().trim().min(2),
  phone: z.string().trim().min(8),
  email: z.string().trim().email().optional().or(z.literal("")),
  note: z.string().trim().max(300).optional().default(""),
  website: z.string().max(0).optional().default(""),
  startedAt: z.number(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse({
    ...body,
    house: body?.house ?? body?.maison,
    table_id: body?.table_id ?? body?.tableId,
    start: body?.start ?? body?.time,
    guests: Number(body?.guests),
    startedAt: Number(body?.startedAt),
    website: body?.website ?? "",
  });
  if (!parsed.success) {
    return Response.json({ error: "Vérifiez les informations saisies." }, { status: 422 });
  }
  const input = parsed.data;
  if (input.website) return Response.json({ ok: true }, { status: 200 });
  if (Date.now() - input.startedAt < 3000) {
    return Response.json({ error: "Réessayez dans un instant." }, { status: 422 });
  }
  if (!isHouse(input.house)) {
    return Response.json({ error: "Maison inconnue." }, { status: 400 });
  }

  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "unconfigured" }, { status: 503 });

  const { data, error } = await admin.rpc("place_hold", {
    p_house: input.house,
    p_table_id: input.table_id,
    p_date: input.date,
    p_start: input.start.length === 5 ? `${input.start}:00` : input.start,
    p_hold_minutes: null as unknown as number,
    p_guests: input.guests,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email ?? "",
    p_note: input.note ?? "",
    p_status: "held",
  });
  if (error) {
    return Response.json({ error: frenchError(error) }, { status: httpStatusForError(error) });
  }

  const { data: settings } = await admin.from("settings").select("*").eq("house", input.house).maybeSingle();
  const { data: ops } = await admin.from("house_ops").select("*").eq("house", input.house).maybeSingle();
  const { data: table } = await admin.from("tables").select("number, zone").eq("id", input.table_id).eq("house", input.house).maybeSingle();
  const fields = {
    house: ops?.display_name ?? HOUSE_LABEL[input.house],
    table: table ? `${table.zone} ${table.number}` : "",
    zone: table?.zone ?? "",
    date: formatDateFr(input.date),
    start: formatTime(input.start),
    end: addMinutes(input.start, data?.hold_minutes ?? settings?.hold_minutes ?? 90),
    guests: String(input.guests),
    name: input.name,
    phone: input.phone,
    email: input.email ?? "",
    note: input.note ?? "",
    housePhone: ops?.phone ?? "",
    cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/reservation/annuler?token=${data?.cancel_token ?? ""}`,
  };

  let emailSent = false;
  if (input.email) {
    const guest = fillAndRender(
      fields.house,
      settings?.guest_email_body ?? DEFAULT_TEMPLATES.hold_guest.body,
      fields,
    );
    const sent = await sendEmail({
      house: input.house,
      type: "reservation_hold_guest",
      to: input.email,
      subject: fillAndRender(fields.house, settings?.guest_email_subject ?? DEFAULT_TEMPLATES.hold_guest.subject, fields).plain,
      html: guest.html,
      entity: { type: "reservation", id: data?.id },
    });
    emailSent = sent.sent;
  }
  const houseTo = settings?.notify_email ?? ops?.contact_email;
  if (houseTo) {
    const houseMail = fillAndRender(
      fields.house,
      settings?.house_email_body ?? DEFAULT_TEMPLATES.hold_house.body,
      fields,
    );
    await sendEmail({
      house: input.house,
      type: "reservation_hold_house",
      to: houseTo,
      subject: fillAndRender(fields.house, settings?.house_email_subject ?? DEFAULT_TEMPLATES.hold_house.subject, fields).plain,
      html: houseMail.html,
      entity: { type: "reservation", id: data?.id },
    });
  }

  return Response.json({
    ok: true,
    reservationId: data?.id,
    emailSent,
    tableNumber: table?.number,
    zone: table?.zone,
    holdMinutes: data?.hold_minutes ?? settings?.hold_minutes ?? 90,
    end: fields.end,
    housePhone: ops?.phone ?? "",
  });
}
