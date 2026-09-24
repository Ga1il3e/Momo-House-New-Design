import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe";
import { sendEmail } from "@/lib/email/send";
import { brandedHtml } from "@/lib/email/render";
import { HOUSE_LABEL, isHouse } from "@/lib/house";
import { frenchError, httpStatusForError } from "@/lib/errors";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "unconfigured" }, { status: 503 });
  const { data: order } = await admin
    .from("orders")
    .select("id, house, order_number, status, fulfillment, total_cents, payment_method, payment_status, customer_name, requested_time, delivery_address, stripe_payment_label, created_at")
    .eq("cancel_token", token)
    .is("deleted_at", null)
    .maybeSingle();
  if (!order) return Response.json({ error: "Commande introuvable." }, { status: 404 });
  const { data: items } = await admin
    .from("order_items")
    .select("dish_name, quantity, unit_price_cents, line_total_cents, notes")
    .eq("order_id", order.id)
    .eq("house", order.house);
  return Response.json({ ...order, items: items ?? [] });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> },
) {
  const { token } = await params;
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "unconfigured" }, { status: 503 });
  const { data: order } = await admin.from("orders").select("*").eq("cancel_token", token).maybeSingle();
  if (!order || !isHouse(order.house)) return Response.json({ error: "Commande introuvable." }, { status: 404 });
  if (order.status !== "pending") {
    return Response.json({ error: "Cette commande ne peut plus être annulée en ligne." }, { status: 422 });
  }
  if (order.payment_method === "card" && order.payment_status === "paid" && order.payment_intent_id) {
    const stripe = getStripe(order.house);
    if (stripe) await stripe.refunds.create({ payment_intent: order.payment_intent_id });
  }
  const { error } = await admin
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_by: "guest",
      cancelled_at: new Date().toISOString(),
      payment_status: order.payment_method === "card" && order.payment_status === "paid" ? "refunded" : order.payment_status,
    })
    .eq("id", order.id)
    .eq("house", order.house);
  if (error) return Response.json({ error: frenchError(error) }, { status: httpStatusForError(error) });
  const { data: settings } = await admin.from("settings").select("notify_email").eq("house", order.house).maybeSingle();
  const { data: ops } = await admin.from("house_ops").select("contact_email, display_name").eq("house", order.house).maybeSingle();
  const to = settings?.notify_email ?? ops?.contact_email;
  if (to) {
    await sendEmail({
      house: order.house,
      type: "order_cancelled_by_guest_house",
      to,
      subject: `Commande annulée par le client ${order.order_number}`,
      html: brandedHtml(ops?.display_name ?? HOUSE_LABEL[order.house], `Le client a annulé ${order.order_number}.`),
      entity: { type: "order", id: order.id },
    });
  }
  return Response.json({ ok: true });
}
