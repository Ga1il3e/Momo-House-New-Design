import { Toaster } from "sonner";
import { requireOwner } from "@/lib/auth/staff";
import { OwnerShell } from "@/components/admin/OwnerShell";
import { isHouse, type House } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { SiteClient, type SiteBanner, type SiteDish } from "./SiteClient";

export default async function MarquePage() {
  await requireOwner();
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;

  const [{ data: settings }, { data: bannerRows }, { data: dishRows }] = await Promise.all([
    supabase
      .from("site_settings")
      .select("contact_email, home_banner_left, home_banner_right, featured_dish_ids")
      .eq("id", true)
      .maybeSingle(),
    supabase
      .from("event_banners")
      .select(
        "id, house, title, body, link_url, starts_on, ends_on, enabled, show_on_home, display_order, image_path, image_url",
      )
      .order("house")
      .order("display_order"),
    supabase
      .from("dishes")
      .select("id, name, house, featured, available, price_cents, image_url")
      .order("house")
      .order("display_order"),
  ]);

  const banners: SiteBanner[] = (bannerRows ?? []).flatMap((row) => {
    if (!isHouse(row.house)) return [];
    return [{ ...row, house: row.house as House }];
  });

  const dishes: SiteDish[] = (dishRows ?? []).flatMap((row) => {
    if (!isHouse(row.house)) return [];
    return [{ ...row, house: row.house as House }];
  });

  return (
    <OwnerShell title="Site">
      <Toaster position="top-right" />
      <p className="text-sm text-ink-muted">
        Accueil, affiches des deux maisons, incontournables. Horaires, téléphone et carte restent
        dans chaque maison.
      </p>
      <SiteClient
        contactEmail={settings?.contact_email ?? ""}
        homeBannerLeft={settings?.home_banner_left ?? ""}
        homeBannerRight={settings?.home_banner_right ?? ""}
        featuredDishIds={settings?.featured_dish_ids ?? []}
        banners={banners}
        dishes={dishes}
      />
    </OwnerShell>
  );
}
