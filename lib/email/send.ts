import "server-only";
import { Resend } from "resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { House } from "@/lib/house";
import type { EmailType } from "@/lib/email/templates";

export type SendEmailInput = {
  house: House;
  type: EmailType;
  to: string;
  subject: string;
  html: string;
  entity: { type: "reservation" | "order" | "contact_message" | "other"; id?: string };
};

export async function sendEmail(input: SendEmailInput) {
  const admin = createAdminClient();
  if (!admin || !input.to) return { sent: false as const, duplicate: false };

  const { data: inserted, error } = await admin
    .from("email_logs")
    .insert({
      house: input.house,
      type: input.type,
      to_email: input.to,
      subject: input.subject,
      html: input.html,
      status: "queued",
      entity_type: input.entity.type,
      entity_id: input.entity.id ?? null,
    })
    .select("id")
    .maybeSingle();

  if (error) {
    if (error.code === "23505") return { sent: false as const, duplicate: true };
    console.error("[email] log insert failed", error);
    return { sent: false as const, duplicate: false };
  }

  const rowId = inserted?.id;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    if (rowId) await admin.from("email_logs").update({ status: "skipped" }).eq("id", rowId);
    return { sent: false as const, duplicate: false };
  }

  const { data: ops } = await admin
    .from("house_ops")
    .select("display_name, email_from_name, contact_email")
    .eq("house", input.house)
    .maybeSingle();

  const domain = process.env.EMAIL_FROM_DOMAIN;
  const fromName = ops?.email_from_name ?? ops?.display_name ?? "Momo House";
  const from = domain
    ? `${fromName} <${input.house}@${domain}>`
    : process.env.RESERVATION_FROM_EMAIL ?? `${fromName} <noreply@localhost>`;

  try {
    const resend = new Resend(apiKey);
    const result = await resend.emails.send({
      from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      replyTo: ops?.contact_email ?? undefined,
    });
    if (result.error) throw new Error(result.error.message);
    if (rowId) {
      await admin
        .from("email_logs")
        .update({ status: "sent", provider_id: result.data?.id ?? null })
        .eq("id", rowId);
    }
    return { sent: true as const, duplicate: false };
  } catch (error) {
    console.error("[email] send failed", error);
    if (rowId) {
      await admin
        .from("email_logs")
        .update({
          status: "failed",
          error: error instanceof Error ? error.message : "send_failed",
        })
        .eq("id", rowId);
    }
    return { sent: false as const, duplicate: false };
  }
}
