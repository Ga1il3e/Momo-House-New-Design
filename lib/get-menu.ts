import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import type { House } from "@/lib/house";
import type { MenuDish, PublicMenu } from "@/lib/menu";

function menuClient() {
  const admin = createAdminClient();
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function loadMenu(house: House): Promise<PublicMenu> {
  const empty: PublicMenu = { house, categories: [], featured: [] };
  const supabase = menuClient();
  if (!supabase) return empty;
  const { data: categories } = await supabase
    .from("menu_categories")
    .select("id, name, name_alt, slug, is_drinks, display_order")
    .eq("house", house)
    .eq("is_active", true)
    .order("display_order");
  const { data: dishes } = await supabase
    .from("dishes")
    .select("*")
    .eq("house", house)
    .order("display_order");
  const mapped: MenuDish[] = (dishes ?? []).map((dish) => ({
    id: dish.id,
    name: dish.name,
    nameAlt: dish.name_alt,
    description: dish.description,
    priceCents: dish.price_cents,
    imageUrl: dish.image_url,
    available: dish.available,
    orderable: dish.orderable,
    featured: dish.featured,
    spiceLevel: dish.spice_level,
    tags: dish.tags ?? [],
    allergens: dish.allergens ?? [],
    categoryId: dish.category_id,
  }));
  return {
    house,
    categories: (categories ?? []).map((category) => ({
      id: category.id,
      name: category.name,
      nameAlt: category.name_alt,
      slug: category.slug,
      isDrinks: category.is_drinks,
      dishes: mapped.filter((dish) => dish.categoryId === category.id),
    })),
    featured: mapped.filter((dish) => dish.featured).slice(0, 6),
  };
}

export function getMenu(house: House) {
  return unstable_cache(() => loadMenu(house), ["menu", house], {
    tags: [`menu:${house}`],
  })();
}
