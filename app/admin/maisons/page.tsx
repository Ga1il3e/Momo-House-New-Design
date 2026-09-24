import Link from "next/link";
import { requireOwner } from "@/lib/auth/staff";
import { OwnerShell } from "@/components/admin/OwnerShell";
import { HOUSE_LABEL, HOUSE_ORDER } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { euro } from "@/lib/money";

export default async function MaisonsPage() {
  await requireOwner();
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const { data } = await supabase.from("admin_dashboard_today").select("*");
  const byHouse = new Map((data ?? []).map((row) => [row.house, row]));

  return (
    <OwnerShell title="Maisons">
      <div className="grid gap-4 md:grid-cols-2">
        {HOUSE_ORDER.map((house) => {
          const dash = byHouse.get(house);
          return (
            <article key={house} className="rounded-3xl bg-white p-6">
              <h2 className="font-display text-2xl font-bold">{HOUSE_LABEL[house]}</h2>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="text-ink-muted">À confirmer</dt><dd className="font-display text-xl font-bold">{dash?.held ?? 0}</dd></div>
                <div><dt className="text-ink-muted">Confirmées</dt><dd className="font-display text-xl font-bold">{dash?.confirmed ?? 0}</dd></div>
                <div><dt className="text-ink-muted">Couverts</dt><dd className="font-display text-xl font-bold">{dash?.covers_expected ?? 0}</dd></div>
                <div><dt className="text-ink-muted">Commandes en cours</dt><dd className="font-display text-xl font-bold">{dash?.active_orders ?? 0}</dd></div>
                <div><dt className="text-ink-muted">CA du jour</dt><dd className="font-display text-xl font-bold">{euro(dash?.revenue_today_cents ?? 0)}</dd></div>
                <div><dt className="text-ink-muted">Messages</dt><dd className="font-display text-xl font-bold">{dash?.new_messages ?? 0}</dd></div>
              </dl>
              <Link href={`/admin/${house}`} className="btn-burgundy mt-5 inline-flex px-4 py-2 text-xs">
                Ouvrir {HOUSE_LABEL[house]}
              </Link>
            </article>
          );
        })}
      </div>
    </OwnerShell>
  );
}
