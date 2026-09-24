import { z } from "zod";
import { isHouse } from "@/lib/house";
import { createAdminClient } from "@/lib/supabase/admin";
import { frenchError, httpStatusForError } from "@/lib/errors";
import { getStripe } from "@/lib/stripe";

const schema = z.object({
  fulfillment: z.enum(["pickup", "delivery"]),
  postcode: z.string().optional(),
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
    delivery_address: z.object({
      line1: z.string(),
      line2: z.string().optional(),
      postcode: z.string(),
      city: z.string(),
      instructions: z.string().optional(),
    }).optional(),
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
  const stripe = getStripe(house);
  if (!admin || !stripe) {
    return Response.json({ error: "Stripe n’est pas configuré pour cette maison." }, { status: 503 });
  }
  const { data: quote, error } = await admin.rpc("checkout_quote", {
    p_house: house,
    p_fulfillment: parsed.data.fulfillment,
    p_items: parsed.data.items,
    p_payment_method: "card",
    p_postcode: parsed.data.customer.delivery_address?.postcode ?? parsed.data.postcode,
  });
  if (error) return Response.json({ error: frenchError(error) }, { status: httpStatusForError(error) });
  const total = Number((quote as { total_cents?: number } | null)?.total_cents ?? 0);
  const intent = await stripe.paymentIntents.create({
    amount: total,
    currency: "eur",
    automatic_payment_methods: { enabled: true },
    metadata: { house, kind: "order" },
    receipt_email: parsed.data.customer.email,
  });
  const { error: insertError } = await admin.from("checkout_intents").insert({
    house,
    payment_intent_id: intent.id,
    quote,
    customer: parsed.data.customer,
    amount_cents: total,
    status: "pending",
  });
  if (insertError) return Response.json({ error: frenchError(insertError) }, { status: 500 });
  return Response.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id, quote });
}
