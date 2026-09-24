import { isHouse } from "@/lib/house";
import { getStripe, getWebhookSecret } from "@/lib/stripe";
import { createAdminClient } from "@/lib/supabase/admin";
import { finalizePaidOrder } from "@/lib/orders/finalize";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ house: string }> },
) {
  const { house } = await params;
  if (!isHouse(house)) return new Response("not found", { status: 404 });
  const stripe = getStripe(house);
  const secret = getWebhookSecret(house);
  if (!stripe || !secret) return new Response("unconfigured", { status: 400 });
  const payload = await request.text();
  const signature = request.headers.get("stripe-signature");
  if (!signature) return new Response("missing signature", { status: 400 });
  let event;
  try {
    event = stripe.webhooks.constructEvent(payload, signature, secret);
  } catch {
    return new Response("bad signature", { status: 400 });
  }
  const admin = createAdminClient();
  if (!admin) return new Response("ok", { status: 200 });

  if (event.type === "payment_intent.succeeded") {
    const intent = event.data.object;
    if (intent.metadata?.house === house) {
      await finalizePaidOrder(house, intent.id);
    }
  } else if (event.type === "payment_intent.payment_failed") {
    const intent = event.data.object;
    await admin
      .from("checkout_intents")
      .update({
        status: "failed",
        last_error: intent.last_payment_error?.message ?? "payment_failed",
      })
      .eq("payment_intent_id", intent.id)
      .eq("house", house);
  } else if (event.type === "charge.refunded") {
    const charge = event.data.object;
    const pi = typeof charge.payment_intent === "string" ? charge.payment_intent : charge.payment_intent?.id;
    if (pi) {
      const refunded = charge.amount_refunded ?? 0;
      const full = refunded >= (charge.amount ?? 0);
      await admin
        .from("orders")
        .update({
          refunded_cents: refunded,
          payment_status: full ? "refunded" : "partially_refunded",
        })
        .eq("payment_intent_id", pi)
        .eq("house", house);
    }
  }

  return new Response("ok", { status: 200 });
}
