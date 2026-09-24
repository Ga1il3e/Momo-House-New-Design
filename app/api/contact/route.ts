import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isHouse } from "@/lib/house";
import { frenchError, httpStatusForError } from "@/lib/errors";
import { sendEmail } from "@/lib/email/send";
import { brandedHtml } from "@/lib/email/render";
import { HOUSE_LABEL } from "@/lib/house";

const schema = z.object({
  house: z.enum(["montmartre", "poissonniere"]),
  name: z.string().trim().min(2),
  email: z.string().trim().email(),
  phone: z.string().trim().optional().default(""),
  subject: z.string().trim().max(160).optional().default(""),
  message: z.string().trim().min(10).max(2000),
  website: z.string().max(0).optional().default(""),
  startedAt: z.number(),
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse({
    ...body,
    house: body?.house ?? body?.maison,
    startedAt: Number(body?.startedAt),
    website: body?.website ?? "",
  });
  if (!parsed.success) return Response.json({ error: "Vérifiez le formulaire." }, { status: 422 });
  const input = parsed.data;
  if (input.website) return Response.json({ ok: true });
  if (Date.now() - input.startedAt < 3000) {
    return Response.json({ error: "Réessayez dans un instant." }, { status: 422 });
  }
  if (!isHouse(input.house)) return Response.json({ error: "Maison inconnue." }, { status: 400 });
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "unconfigured" }, { status: 503 });
  const { data, error } = await admin
    .from("contact_messages")
    .insert({
      house: input.house,
      name: input.name,
      email: input.email,
      phone: input.phone || null,
      subject: input.subject || null,
      message: input.message,
      status: "new",
    })
    .select("id")
    .maybeSingle();
  if (error) return Response.json({ error: frenchError(error) }, { status: httpStatusForError(error) });

  const { data: settings } = await admin.from("settings").select("notify_email").eq("house", input.house).maybeSingle();
  const { data: ops } = await admin.from("house_ops").select("contact_email, display_name").eq("house", input.house).maybeSingle();
  const { data: site } = await admin.from("site_settings").select("contact_email").eq("id", true).maybeSingle();
  const to = settings?.notify_email ?? ops?.contact_email ?? site?.contact_email;
  if (to) {
    await sendEmail({
      house: input.house,
      type: "contact_message_house",
      to,
      subject: input.subject || `Message — ${input.name}`,
      html: brandedHtml(
        ops?.display_name ?? HOUSE_LABEL[input.house],
        `${input.name} (${input.email}${input.phone ? ` · ${input.phone}` : ""})\n\n${input.message}`,
      ),
      entity: { type: "contact_message", id: data?.id },
    });
  }
  return Response.json({ ok: true });
}
