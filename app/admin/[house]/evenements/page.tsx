import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/admin/EmptyState";
import { EventsClient } from "./EventsClient";

export default async function EvenementsPage({ params }: { params: Promise<{ house: string }> }) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house } = await requireHouseAccess(raw);
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const { data } = await supabase.from("event_banners").select("*").eq("house", house).order("display_order");

  return (
    <div className="space-y-6">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Affiches</p>
        <h1 className="font-display text-3xl font-extrabold">Événements</h1>
      </header>
      {(data ?? []).length === 0 ? <EmptyState title="Aucune affiche." /> : null}
      <EventsClient house={house} banners={data ?? []} />
    </div>
  );
}
