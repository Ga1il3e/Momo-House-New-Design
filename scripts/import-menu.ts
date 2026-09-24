import { createClient } from "@supabase/supabase-js";
import { cartes } from "../lib/menu";
import { HOUSES, type House } from "../lib/house";
import { parseEuroToCents } from "../lib/money";
import type { Database } from "../lib/supabase/database.types";

const apply = process.argv.includes("--apply");

function priceOf(label: string) {
  const match = label.match(/(\d+[,.]\d+)/);
  return parseEuroToCents(match?.[1] ?? "0") ?? 0;
}

type PlannedDish = {
  name: string;
  description: string;
  price_cents: number;
  featured: boolean;
  image_url: string | null;
  is_drinks: boolean;
  category: string;
};

function dishesFor(house: House): PlannedDish[] {
  const carte = cartes[house];
  const rows: PlannedDish[] = [];
  carte.signatures.forEach((item, index) => {
    rows.push({
      name: item.name,
      description: item.description,
      price_cents: priceOf(item.price),
      featured: index < 6,
      image_url: item.image,
      is_drinks: false,
      category: "momos",
    });
  });
  carte.hot.forEach((item) => {
    rows.push({
      name: item.name,
      description: item.description ?? item.note ?? "",
      price_cents: priceOf(item.price),
      featured: false,
      image_url: item.image,
      is_drinks: false,
      category: "plats",
    });
  });
  carte.drinks.forEach((item) => {
    rows.push({
      name: item.name,
      description: item.description,
      price_cents: priceOf(item.price),
      featured: false,
      image_url: null,
      is_drinks: true,
      category: "boissons",
    });
  });
  return rows;
}

async function main() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
    process.exit(1);
  }
  const supabase = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  for (const house of HOUSES) {
    const planned = dishesFor(house);
    console.log(`\n${house}: ${planned.length} plats`);
    planned.forEach((dish) => {
      console.log(`  - ${dish.category}: ${dish.name} (${dish.price_cents} ct)${dish.featured ? " ★" : ""}`);
    });
    if (!apply) continue;

    const categories = ["momos", "plats", "boissons"] as const;
    const ids = new Map<string, string>();
    for (const [index, slug] of categories.entries()) {
      const name = slug === "momos" ? "Momos" : slug === "plats" ? "Plats" : "Boissons";
      const { data: existing } = await supabase
        .from("menu_categories")
        .select("id")
        .eq("house", house)
        .eq("slug", slug)
        .maybeSingle();
      if (existing) {
        ids.set(slug, existing.id);
        continue;
      }
      const { data, error } = await supabase
        .from("menu_categories")
        .insert({
          house,
          name,
          slug,
          is_active: true,
          orderable: true,
          is_drinks: slug === "boissons",
          display_order: index + 1,
        })
        .select("id")
        .maybeSingle();
      if (error) throw error;
      if (data) ids.set(slug, data.id);
    }

    for (const [index, dish] of planned.entries()) {
      const category_id = ids.get(dish.category);
      if (!category_id) continue;
      const { data: existing } = await supabase
        .from("dishes")
        .select("id")
        .eq("house", house)
        .eq("name", dish.name)
        .maybeSingle();
      const payload = {
        house,
        category_id,
        name: dish.name,
        description: dish.description,
        price_cents: dish.price_cents,
        featured: dish.featured,
        image_url: dish.image_url,
        available: true,
        orderable: true,
        spice_level: 0,
        tags: dish.featured ? ["signature"] : [],
        allergens: [] as string[],
        display_order: index,
      };
      if (existing) {
        const { error } = await supabase.from("dishes").update(payload).eq("id", existing.id).eq("house", house);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("dishes").insert(payload);
        if (error) throw error;
      }
    }
  }

  if (!apply) {
    console.log("\nDry-run only. Re-run with --apply to write both houses.");
  } else {
    console.log("\nMenu imported for both houses.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
