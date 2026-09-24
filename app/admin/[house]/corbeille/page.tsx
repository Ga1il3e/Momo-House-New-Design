import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { TrashClient } from "./TrashClient";

export default async function CorbeillePage({ params }: { params: Promise<{ house: string }> }) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house } = await requireHouseAccess(raw);
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const [reservations, orders, messages, emails] = await Promise.all([
    supabase.from("reservations").select("id, guest_name, service_date, deleted_at").eq("house", house).not("deleted_at", "is", null),
    supabase.from("orders").select("id, order_number, deleted_at").eq("house", house).not("deleted_at", "is", null),
    supabase.from("contact_messages").select("id, name, subject, deleted_at").eq("house", house).not("deleted_at", "is", null),
    supabase.from("email_logs").select("id, subject, to_email, deleted_at").eq("house", house).not("deleted_at", "is", null),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">35 jours</p>
        <h1 className="font-display text-3xl font-extrabold">Corbeille</h1>
      </header>
      <TrashClient
        house={house}
        sections={{
          reservations: (reservations.data ?? []).map((row) => ({
            id: row.id,
            label: `${row.guest_name ?? "Sans nom"} · ${row.service_date}`,
            deleted_at: row.deleted_at ?? "",
          })),
          orders: (orders.data ?? []).map((row) => ({
            id: row.id,
            label: row.order_number,
            deleted_at: row.deleted_at ?? "",
          })),
          messages: (messages.data ?? []).map((row) => ({
            id: row.id,
            label: `${row.name} · ${row.subject ?? ""}`,
            deleted_at: row.deleted_at ?? "",
          })),
          emails: (emails.data ?? []).map((row) => ({
            id: row.id,
            label: `${row.subject ?? ""} → ${row.to_email}`,
            deleted_at: row.deleted_at ?? "",
          })),
        }}
      />
    </div>
  );
}
