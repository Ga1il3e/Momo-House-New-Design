import { z } from "zod";
import { isHouse, HOUSE_LABEL } from "@/lib/house";
import { createAdminClient } from "@/lib/supabase/admin";
import { frenchError, httpStatusForError } from "@/lib/errors";
import { sendEmail } from "@/lib/email/send";
import { brandedHtml } from "@/lib/email/render";
import { euro } from "@/lib/money";

const schema = z.object({
  fulfillment: z.literal("pickup"),
  items: z.array(z.object({
    dish_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(50),
    notes: z.string().max(200).optional(),
  })).min(1),
  customer: z.object({
    name: z.string().min(2),
    phone: z.string().min(8),
    email: z.string().email(),
    note: z.string().max(500).optional(),
    requested_time: z.string().optional(),
  }),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ house: string }> },
) {
  const { house } = await params;
  if (!isHouse(house)) return Response.json({ error: "Maison inconnue." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Informations invalides." }, { status: 422 });
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "unconfigured" }, { status: 503 });
  const { data: quote, error } = await admin.rpc("checkout_quote", {
    p_house: house,
    p_fulfillment: "pickup",
    p_items: parsed.data.items,
    p_payment_method: "cash",
  });
  if (error) return Response.json({ error: frenchError(error) }, { status: httpStatusForError(error) });
  const { data: created, error: createError } = await admin.rpc("checkout_create_order", {
    p_house: house,
    p_quote: quote,
    p_customer: parsed.data.customer,
    p_payment: { method: "cash", status: "pending" },
  });
  if (createError) return Response.json({ error: frenchError(createError) }, { status: httpStatusForError(createError) });
  const row = Array.isArray(created) ? created[0] : created;
  const { data: order } = await admin
    .from("orders")
    .select("id, order_number, cancel_token, customer_email, total_cents")
    .eq("id", row?.order_id ?? "")
    .eq("house", house)
    .maybeSingle();
  if (row?.created && order) {
    const { data: settings } = await admin.from("settings").select("notify_email").eq("house", house).maybeSingle();
    const { data: ops } = await admin.from("house_ops").select("contact_email, display_name").eq("house", house).maybeSingle();
    if (order.customer_email) {
      await sendEmail({
        house,
        type: "order_confirmation_guest",
        to: order.customer_email,
        subject: `Commande ${order.order_number} — ${HOUSE_LABEL[house]}`,
        html: brandedHtml(ops?.display_name ?? HOUSE_LABEL[house], `Votre commande ${order.order_number} est bien reçue (${euro(order.total_cents)}).`),
        entity: { type: "order", id: order.id },
      });
    }
    const houseTo = settings?.notify_email ?? ops?.contact_email;
    if (houseTo) {
      await sendEmail({
        house,
        type: "order_new_house",
        to: houseTo,
        subject: `Nouvelle commande ${order.order_number}`,
        html: brandedHtml(ops?.display_name ?? HOUSE_LABEL[house], `Commande ${order.order_number} — ${euro(order.total_cents)}.`),
        entity: { type: "order", id: order.id },
      });
    }
  }
  return Response.json({ orderNumber: row?.order_number, token: order?.cancel_token ?? "" });
}
