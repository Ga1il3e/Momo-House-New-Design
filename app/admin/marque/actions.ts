"use server";

import { revalidatePath, updateTag } from "next/cache";
import { frenchError } from "@/lib/errors";
import { requireOwner } from "@/lib/auth/staff";
import { createStaffClient } from "@/lib/supabase/server";

function refreshSite() {
  revalidatePath("/");
  revalidatePath("/admin/marque");
  updateTag("site");
}

export async function saveSiteDesk(input: {
  contact_email?: string;
  home_banner_left?: string;
  home_banner_right?: string;
  featured_dish_ids?: string[];
}) {
  await requireOwner();
  const supabase = await createStaffClient();
  if (!supabase) return { error: "Supabase n’est pas configuré." };

  const patch: {
    contact_email?: string;
    home_banner_left?: string | null;
    home_banner_right?: string | null;
    featured_dish_ids?: string[];
  } = {};
  if (input.contact_email !== undefined) patch.contact_email = input.contact_email;
  if (input.home_banner_left !== undefined) {
    patch.home_banner_left = input.home_banner_left.trim() || null;
  }
  if (input.home_banner_right !== undefined) {
    patch.home_banner_right = input.home_banner_right.trim() || null;
  }
  if (input.featured_dish_ids !== undefined) {
    patch.featured_dish_ids = input.featured_dish_ids;
  }

  const { error } = await supabase.from("site_settings").update(patch).eq("id", true);
  if (error) return { error: frenchError(error) };
  refreshSite();
  return { ok: true };
}
