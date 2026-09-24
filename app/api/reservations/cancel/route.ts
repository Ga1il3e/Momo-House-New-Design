import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { frenchError, httpStatusForError } from "@/lib/errors";
import { sendEmail } from "@/lib/email/send";
import { brandedHtml } from "@/lib/email/render";
import { HOUSE_LABEL, isHouse } from "@/lib/house";

const schema = z.object({ token: z.string().min(8) });

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Lien invalide." }, { status: 422 });
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "unconfigured" }, { status: 503 });
  const { data: reservation } = await admin
    .from("reservations")
    .select("*")
    .eq("cancel_token", parsed.data.token)
    .is("deleted_at", null)
    .maybeSingle();
  if (!reservation || !isHouse(reservation.house)) {
    return Response.json({ error: "Réservation introuvable." }, { status: 404 });
  }
  if (reservation.status === "cancelled" || reservation.status === "released") {
    return Response.json({ ok: true, already: true, message: "Cette réservation est déjà annulée." });
  }
  const { error } = await admin.rpc("set_reservation_status", {
    p_reservation_id: reservation.id,
    p_status: "cancelled",
  });
  if (error) return Response.json({ error: frenchError(error) }, { status: httpStatusForError(error) });

  const { data: settings } = await admin.from("settings").select("notify_email").eq("house", reservation.house).maybeSingle();
  const { data: ops } = await admin.from("house_ops").select("contact_email, display_name").eq("house", reservation.house).maybeSingle();
  const to = settings?.notify_email ?? ops?.contact_email;
  if (to) {
    await sendEmail({
      house: reservation.house,
      type: "reservation_cancelled_by_guest_house",
      to,
      subject: `Annulation client — ${reservation.guest_name ?? ""}`,
      html: brandedHtml(
        ops?.display_name ?? HOUSE_LABEL[reservation.house],
        `${reservation.guest_name ?? "Un client"} a annulé la retenue du ${reservation.service_date} à ${reservation.start_time}.`,
      ),
      entity: { type: "reservation", id: reservation.id },
    });
  }
  return Response.json({ ok: true });
}
