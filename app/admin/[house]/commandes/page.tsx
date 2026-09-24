import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { parisToday } from "@/lib/time";
import { EmptyState } from "@/components/admin/EmptyState";
import type { FulfillmentType, OrderStatus, PaymentStatus } from "@/lib/status";
import { OrdersClient } from "./OrdersClient";

export default async function CommandesPage({
  params,
}: {
  params: Promise<{ house: string }>;
}) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house } = await requireHouseAccess(raw);
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const today = parisToday();
  const [{ data: settings }, { data: orders }] = await Promise.all([
    supabase.from("ordering_settings").select("*").eq("house", house).maybeSingle(),
    supabase
      .from("orders")
      .select("*")
      .eq("house", house)
      .is("deleted_at", null)
      .order("created_at", { ascending: false })
      .limit(200),
  ]);
  const list = (orders ?? []).map((order) => ({
    id: order.id,
    order_number: order.order_number,
    created_at: order.created_at,
    requested_time: order.requested_time,
    customer_name: order.customer_name,
    customer_phone: order.customer_phone,
    customer_email: order.customer_email,
    fulfillment: order.fulfillment as FulfillmentType,
    payment_method: order.payment_method,
    payment_status: order.payment_status as PaymentStatus,
    status: order.status as OrderStatus,
    total_cents: order.total_cents,
    needs_review: order.needs_review,
    stripe_payment_label: order.stripe_payment_label,
    customer_note: order.customer_note,
  }));
  const isToday = (iso: string) => iso.slice(0, 10) === today || new Date(iso).toLocaleDateString("en-CA", { timeZone: "Europe/Paris" }) === today;
  const columns = {
    pending: list.filter((order) => order.status === "pending"),
    confirmed: list.filter((order) => order.status === "confirmed"),
    preparing: list.filter((order) => order.status === "preparing"),
    ready: list.filter((order) => order.status === "ready"),
  };
  const completed = list.filter((order) => order.status === "completed" && isToday(order.created_at));
  const cancelled = list.filter((order) => order.status === "cancelled" && isToday(order.created_at));
  const orderingOff = !settings?.takeaway_enabled && !settings?.delivery_enabled;

  return (
    <div className="space-y-6">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Service</p>
        <h1 className="font-display text-3xl font-extrabold">Commandes</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Retrait {settings?.takeaway_enabled ? "ouvert" : "fermé"} · Livraison {settings?.delivery_enabled ? "ouverte" : "fermée"}
        </p>
      </header>
      {orderingOff && list.length === 0 ? (
        <EmptyState title="Les commandes en ligne ne sont pas ouvertes.">
          <Link href={`/admin/${house}/reglages?onglet=commandes`} className="text-burgundy underline">
            Réglages → Commandes
          </Link>
        </EmptyState>
      ) : (
        <OrdersClient
          house={house}
          pausedUntil={settings?.paused_until ?? null}
          columns={columns}
          completed={completed}
          cancelled={cancelled}
        />
      )}
    </div>
  );
}
