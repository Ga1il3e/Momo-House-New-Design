import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/admin/EmptyState";
import { TablesClient } from "./TablesClient";

export default async function TablesPage({ params }: { params: Promise<{ house: string }> }) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house } = await requireHouseAccess(raw);
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const { data } = await supabase.from("tables").select("*").eq("house", house).order("zone").order("number");
  const tables = data ?? [];

  return (
    <div className="space-y-6">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Salle</p>
        <h1 className="font-display text-3xl font-extrabold">Tables</h1>
      </header>
      {tables.length === 0 ? <EmptyState title="Aucune table." /> : null}
      <TablesClient
        house={house}
        tables={tables.map((table) => ({
          id: table.id,
          zone: table.zone,
          number: table.number,
          seats: table.seats,
          active: table.active,
        }))}
      />
    </div>
  );
}
