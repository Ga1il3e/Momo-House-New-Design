import { unstable_cache } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";
import { HOUSE_LABEL, isHouse, type House } from "@/lib/house";
import type { DishCard } from "@/lib/menu";
import { euro } from "@/lib/money";

const FALLBACK_IMAGE = "/assets/brand-signature.jpg";

export type SiteHomeSettings = {
  contactEmail: string | null;
  homeBannerLeft: string | null;
  homeBannerRight: string | null;
  featuredDishIds: string[];
};

function publicClient() {
  const admin = createAdminClient();
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  return createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function tagTone(tags: string[]): DishCard["tagTone"] {
  const blob = tags.join(" ").toLowerCase();
  if (/(végét|veget|veggie|vegan)/.test(blob)) return "veg";
  if (/(épicé|epice|piquant|spicy)/.test(blob)) return "burgundy";
  if (/(street|kothey|frit)/.test(blob)) return "amber";
  if (/(réconfort|reconfort|soupe)/.test(blob)) return "neutral";
  return "blush";
}

function toCard(dish: {
  id: string;
  name: string;
  description: string | null;
  price_cents: number;
  image_url: string | null;
  tags: string[] | null;
  house: House;
}): DishCard {
  const tags = dish.tags ?? [];
  return {
    id: dish.id,
    name: dish.name,
    price: euro(dish.price_cents),
    description: dish.description ?? "",
    tag: (tags[0] ?? HOUSE_LABEL[dish.house]).toUpperCase(),
    tagTone: tagTone(tags),
    footerLeft: HOUSE_LABEL[dish.house],
    footerRight: tags[1] ?? "Maison",
    image: dish.image_url || FALLBACK_IMAGE,
  };
}

async function loadSiteSettings(): Promise<SiteHomeSettings> {
  const empty: SiteHomeSettings = {
    contactEmail: null,
    homeBannerLeft: null,
    homeBannerRight: null,
    featuredDishIds: [],
  };
  const supabase = publicClient();
  if (!supabase) return empty;
  const { data } = await supabase
    .from("site_settings")
    .select("contact_email, home_banner_left, home_banner_right, featured_dish_ids")
    .eq("id", true)
    .maybeSingle();
  if (!data) return empty;
  return {
    contactEmail: data.contact_email,
    homeBannerLeft: data.home_banner_left,
    homeBannerRight: data.home_banner_right,
    featuredDishIds: data.featured_dish_ids ?? [],
  };
}

async function loadFeaturedDishes(): Promise<DishCard[]> {
  const supabase = publicClient();
  if (!supabase) return [];
  const settings = await loadSiteSettings();
  const query = supabase
    .from("dishes")
    .select("id, name, description, price_cents, image_url, tags, house, featured, available")
    .eq("available", true);
  const { data } = settings.featuredDishIds.length
    ? await query.in("id", settings.featuredDishIds)
    : await query.eq("featured", true).order("display_order").limit(6);
  const rows = (data ?? []).filter((row) => isHouse(row.house));
  if (settings.featuredDishIds.length) {
    const byId = new Map(rows.map((row) => [row.id, row]));
    return settings.featuredDishIds
      .map((id) => byId.get(id))
      .filter((row): row is NonNullable<typeof row> => Boolean(row))
      .map((row) => toCard({ ...row, house: row.house as House }));
  }
  return rows.map((row) => toCard({ ...row, house: row.house as House }));
}

export function getSiteSettings() {
  return unstable_cache(() => loadSiteSettings(), ["site-settings"], {
    tags: ["site"],
  })();
}

export function getFeaturedDishes() {
  return unstable_cache(() => loadFeaturedDishes(), ["featured-dishes"], {
    tags: ["site"],
  })();
}
