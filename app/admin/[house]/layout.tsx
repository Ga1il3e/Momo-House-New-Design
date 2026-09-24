import { notFound } from "next/navigation";
import { AdminShell } from "@/components/admin/AdminShell";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { stripeConfigured } from "@/lib/stripe";

export default async function HouseAdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ house: string }>;
}) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { staff, house } = await requireHouseAccess(raw);
  const supabase = await createStaffClient();
  const { data: dash } = supabase
    ? await supabase.from("admin_dashboard_today").select("*").eq("house", house).maybeSingle()
    : { data: null };
  const { count: failedEmails } = supabase
    ? await supabase
        .from("email_logs")
        .select("id", { count: "exact", head: true })
        .eq("house", house)
        .eq("status", "failed")
        .is("deleted_at", null)
    : { count: 0 };
  const { count: trash } = supabase
    ? await supabase
        .from("reservations")
        .select("id", { count: "exact", head: true })
        .eq("house", house)
        .not("deleted_at", "is", null)
    : { count: 0 };

  const hideOrders = !stripeConfigured(house) && (dash?.active_orders ?? 0) === 0;

  return (
    <AdminShell
      house={house}
      isOwner={staff.role === "owner"}
      hideOrders={hideOrders}
      badges={{
        held: dash?.held ?? 0,
        pendingOrders: dash?.active_orders ?? 0,
        newMessages: dash?.new_messages ?? 0,
        failedEmails: failedEmails ?? 0,
        trash: trash ?? 0,
      }}
    >
      {children}
    </AdminShell>
  );
}
