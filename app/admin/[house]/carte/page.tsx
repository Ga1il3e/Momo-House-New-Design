import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { CarteClient } from "./CarteClient";

export default async function CarteAdminPage({ params }: { params: Promise<{ house: string }> }) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house, staff } = await requireHouseAccess(raw);
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const [{ data: categories }, { data: dishes }] = await Promise.all([
    supabase.from("menu_categories").select("*").eq("house", house).order("display_order"),
    supabase.from("dishes").select("*").eq("house", house).order("display_order"),
  ]);
  const counts = new Map<string, number>();
  for (const dish of dishes ?? []) counts.set(dish.category_id, (counts.get(dish.category_id) ?? 0) + 1);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Carte</p>
        <h1 className="font-display text-3xl font-extrabold">La carte</h1>
      </header>
      <CarteClient
        house={house}
        isOwner={staff.role === "owner"}
        categories={(categories ?? []).map((category) => ({
          ...category,
          dish_count: counts.get(category.id) ?? 0,
        }))}
        dishes={dishes ?? []}
      />
    </div>
  );
}
