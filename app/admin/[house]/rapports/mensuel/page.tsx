import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { HOUSE_LABEL, isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { parisToday } from "@/lib/time";
import { euro } from "@/lib/money";
import { fulfillmentLabel, orderLabel, paymentLabel, type FulfillmentType, type OrderStatus, type PaymentStatus } from "@/lib/status";

type Monthly = {
  year?: number;
  month?: number;
  summary?: {
    orders?: { revenue_cents?: number; count?: number };
    reservations?: { covers?: number };
  };
  orders?: {
    order_number: string;
    created_at: string;
    customer_name: string;
    fulfillment: FulfillmentType;
    payment_method: "card" | "cash";
    payment_status: PaymentStatus;
    status: OrderStatus;
    total_cents: number;
  }[];
};

export default async function MensuelPage({
  params,
  searchParams,
}: {
  params: Promise<{ house: string }>;
  searchParams: Promise<{ mois?: string }>;
}) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house } = await requireHouseAccess(raw);
  const { mois } = await searchParams;
  const today = parisToday();
  const current = mois && /^\d{4}-\d{2}$/.test(mois) ? mois : today.slice(0, 7);
  const [year, month] = current.split("-").map(Number);
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const { data } = await supabase.rpc("monthly_report", {
    p_house: house,
    p_year: year,
    p_month: month,
  });
  const report = (data ?? {}) as Monthly;

  return (
    <div className="space-y-6">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">{HOUSE_LABEL[house]}</p>
        <h1 className="font-display text-3xl font-extrabold">Rapport mensuel</h1>
      </header>
      <form className="flex items-end gap-2">
        <label className="text-sm">
          Mois
          <input type="month" name="mois" defaultValue={current} className="mt-1 block rounded-xl border px-3 py-2" />
        </label>
        <button className="btn-burgundy px-4 py-2 text-xs">Voir</button>
      </form>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-xs uppercase text-ink-muted">CA</p>
          <p className="font-display text-2xl font-bold">{euro(report.summary?.orders?.revenue_cents ?? 0)}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-xs uppercase text-ink-muted">Commandes</p>
          <p className="font-display text-2xl font-bold">{report.summary?.orders?.count ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-white px-4 py-3">
          <p className="text-xs uppercase text-ink-muted">Couverts</p>
          <p className="font-display text-2xl font-bold">{report.summary?.reservations?.covers ?? 0}</p>
        </div>
      </div>
      <div className="overflow-x-auto rounded-3xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-paper-soft font-label text-[11px] uppercase text-ink-muted">
            <tr>
              {["N°", "Date", "Client", "Mode", "Paiement", "Statut", "Total"].map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(report.orders ?? []).map((order) => (
              <tr key={order.order_number} className="border-t border-[rgba(228,190,186,0.35)]">
                <td className="px-4 py-2">{order.order_number}</td>
                <td className="px-4 py-2">{new Date(order.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="px-4 py-2">{order.customer_name}</td>
                <td className="px-4 py-2">{fulfillmentLabel(order.fulfillment)}</td>
                <td className="px-4 py-2">{paymentLabel(order.payment_method, order.payment_status)}</td>
                <td className="px-4 py-2">{orderLabel(order.status, order.fulfillment)}</td>
                <td className="px-4 py-2 tabular-nums">{euro(order.total_cents)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-ink-muted">Les éléments mis à la corbeille sont exclus.</p>
    </div>
  );
}
