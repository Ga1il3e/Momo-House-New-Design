import { z } from "zod";
import { isHouse } from "@/lib/house";
import { createAdminClient } from "@/lib/supabase/admin";
import { frenchError, httpStatusForError } from "@/lib/errors";

const schema = z.object({
  fulfillment: z.enum(["pickup", "delivery"]),
  payment_method: z.enum(["card", "cash"]).optional().default("card"),
  postcode: z.string().optional(),
  items: z.array(z.object({
    dish_id: z.string().uuid(),
    quantity: z.number().int().min(1).max(50),
    notes: z.string().max(200).optional(),
  })).min(1),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ house: string }> },
) {
  const { house } = await params;
  if (!isHouse(house)) return Response.json({ error: "Maison inconnue." }, { status: 404 });
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) return Response.json({ error: "Panier invalide." }, { status: 422 });
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "unconfigured" }, { status: 503 });
  const { data, error } = await admin.rpc("checkout_quote", {
    p_house: house,
    p_fulfillment: parsed.data.fulfillment,
    p_items: parsed.data.items,
    p_payment_method: parsed.data.payment_method,
    p_postcode: parsed.data.postcode,
  });
  if (error) return Response.json({ error: frenchError(error) }, { status: httpStatusForError(error) });
  return Response.json(data);
}
