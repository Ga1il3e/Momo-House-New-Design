import "server-only";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { brandedHtml } from "@/lib/email/render";
import { HOUSE_LABEL, type House } from "@/lib/house";
import { getStripe } from "@/lib/stripe";
import { euro } from "@/lib/money";

function cardLabel(intent: {
  payment_method?: unknown;
}): string {
  const method = intent.payment_method as
    | {
        type?: string;
        card?: { brand?: string; last4?: string; wallet?: { type?: string } };
      }
    | string
    | null;
  if (!method || typeof method === "string") return "Carte bancaire";
  const wallet = method.card?.wallet?.type;
  if (wallet === "apple_pay") return "Apple Pay";
  if (wallet === "google_pay") return "Google Pay";
  if (wallet === "link") return "Link";
  if (method.card?.brand && method.card.last4) {
    const brand = method.card.brand.replace(/^./, (c) => c.toUpperCase());
    return `Carte ${brand} ···· ${method.card.last4}`;
  }
  return "Carte bancaire";
}

export async function finalizePaidOrder(house: House, paymentIntentId: string) {
  const stripe = getStripe(house);
  const admin = createAdminClient();
  if (!stripe || !admin) return { error: "stripe_unconfigured" as const };

  const pi = await stripe.paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method"],
  });
  if (pi.status !== "succeeded") return { error: "not_paid" as const };
  if (pi.metadata?.house !== house) return { error: "house_mismatch" as const };

  const { data: intent } = await admin
    .from("checkout_intents")
    .select("*")
    .eq("payment_intent_id", paymentIntentId)
    .eq("house", house)
    .maybeSingle();
  if (!intent) return { error: "not_found" as const };

  const { data: created, error } = await admin.rpc("checkout_create_order", {
    p_house: house,
    p_quote: intent.quote,
    p_customer: intent.customer,
    p_payment: {
      method: "card",
      status: "paid",
      payment_intent_id: paymentIntentId,
      amount_cents: pi.amount_received,
      stripe_payment_label: cardLabel(pi),
    },
  });
  if (error) return { error: error.message };
  const row = Array.isArray(created) ? created[0] : created;
  if (!row) return { error: "create_failed" as const };

  if (row.created) {
    const { data: order } = await admin
      .from("orders")
      .select("id, order_number, customer_email, total_cents, cancel_token")
      .eq("id", row.order_id)
      .maybeSingle();
    const { data: settings } = await admin
      .from("settings")
      .select("notify_email")
      .eq("house", house)
      .maybeSingle();
    const { data: ops } = await admin
      .from("house_ops")
      .select("contact_email, display_name")
      .eq("house", house)
      .maybeSingle();
    if (order?.customer_email) {
      await sendEmail({
        house,
        type: "order_confirmation_guest",
        to: order.customer_email,
        subject: `Commande ${order.order_number} — ${HOUSE_LABEL[house]}`,
        html: brandedHtml(
          ops?.display_name ?? HOUSE_LABEL[house],
          `Votre commande ${order.order_number} est bien reçue (${euro(order.total_cents)}).`,
        ),
        entity: { type: "order", id: order.id },
      });
    }
    const houseTo = settings?.notify_email ?? ops?.contact_email;
    if (houseTo && order) {
      await sendEmail({
        house,
        type: "order_new_house",
        to: houseTo,
        subject: `Nouvelle commande ${order.order_number}`,
        html: brandedHtml(
          ops?.display_name ?? HOUSE_LABEL[house],
          `Commande ${order.order_number} — ${euro(order.total_cents)}.`,
        ),
        entity: { type: "order", id: order.id },
      });
    }
    return {
      orderNumber: row.order_number,
      token: order?.cancel_token ?? "",
      created: true,
    };
  }

  const { data: existing } = await admin
    .from("orders")
    .select("order_number, cancel_token")
    .eq("id", row.order_id)
    .maybeSingle();
  return {
    orderNumber: row.order_number,
    token: existing?.cancel_token ?? "",
    created: false,
  };
}
