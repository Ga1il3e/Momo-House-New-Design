import { z } from "zod";
import { isHouse } from "@/lib/house";
import { finalizePaidOrder } from "@/lib/orders/finalize";

const schema = z.object({ paymentIntentId: z.string().min(8) });

export async function POST(
  request: Request,
  { params }: { params: Promise<{ house: string }> },
) {
  const { house } = await params;
  if (!isHouse(house)) return Response.json({ error: "Maison inconnue." }, { status: 404 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Paiement introuvable." }, { status: 422 });
  const result = await finalizePaidOrder(house, parsed.data.paymentIntentId);
  if ("error" in result && result.error) {
    return Response.json({ error: "Le paiement n’a pas pu être finalisé." }, { status: 422 });
  }
  return Response.json(result);
}
