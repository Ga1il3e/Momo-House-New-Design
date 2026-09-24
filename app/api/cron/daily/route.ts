import { createAdminClient } from "@/lib/supabase/admin";
import { parisToday } from "@/lib/time";

export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  const secret = process.env.CRON_SECRET;
  if (!secret || auth !== `Bearer ${secret}`) {
    return Response.json({ error: "unauthorized" }, { status: 401 });
  }
  const admin = createAdminClient();
  if (!admin) return Response.json({ error: "unconfigured" }, { status: 503 });
  const today = parisToday();
  const { data: expired } = await admin
    .from("event_banners")
    .select("id, image_path")
    .lt("ends_on", today);
  const paths = (expired ?? []).map((row) => row.image_path).filter(Boolean);
  if (paths.length) await admin.storage.from("event-banners").remove(paths);
  if ((expired ?? []).length) {
    await admin.from("event_banners").delete().lt("ends_on", today);
  }
  let purged = null;
  try {
    const { data } = await admin.rpc("purge_trash" as never, { p_days: 35 } as never);
    purged = data;
  } catch {
    const cut = new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString();
    await Promise.all([
      admin.from("reservations").delete().lt("deleted_at", cut),
      admin.from("orders").delete().lt("deleted_at", cut),
      admin.from("email_logs").delete().lt("deleted_at", cut),
      admin.from("contact_messages").delete().lt("deleted_at", cut),
    ]);
  }
  return Response.json({
    bannersRemoved: expired?.length ?? 0,
    purged,
  });
}
