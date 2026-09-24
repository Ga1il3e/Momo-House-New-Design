"use server";

import { revalidatePath, updateTag } from "next/cache";
import { frenchError } from "@/lib/errors";
import { requireHouseAccess, requireOwner } from "@/lib/auth/staff";
import { isHouse, type House } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { DEFAULT_TEMPLATES } from "@/lib/email/templates";
import { fillAndRender } from "@/lib/email/render";
import { HOUSE_LABEL } from "@/lib/house";
import { addMinutes, formatDateFr, formatTime } from "@/lib/time";
import { getStripe } from "@/lib/stripe";
import type { ReservationStatus } from "@/lib/status";

function asHouse(house: string): House {
  if (!isHouse(house)) throw new Error("invalid_house");
  return house;
}

function refresh(house: House) {
  revalidatePath(`/admin/${house}`);
  revalidatePath(`/admin/${house}/reservations`);
  revalidatePath(`/admin/${house}/tables`);
  revalidatePath(`/admin/${house}/commandes`);
  revalidatePath(`/admin/${house}/messages`);
  revalidatePath(`/admin/${house}/reglages`);
  updateTag(`house:${house}`);
  updateTag(`menu:${house}`);
  updateTag("site");
  revalidatePath("/");
  revalidatePath("/admin/marque");
}

async function staffClient(house: string) {
  const access = await requireHouseAccess(house);
  const supabase = await createStaffClient();
  if (!supabase) throw new Error("unconfigured");
  return { ...access, supabase };
}

export async function confirmHold(house: string, id: string) {
  const { supabase } = await staffClient(house);
  const { data, error } = await supabase.rpc("set_reservation_status", {
    p_reservation_id: id,
    p_status: "confirmed",
  });
  if (error) return { error: frenchError(error) };
  await maybeMailReservation(house, data, "confirmed");
  refresh(house as House);
  return { ok: true, emailSent: Boolean(data?.guest_email) };
}

export async function setHoldStatus(house: string, id: string, status: ReservationStatus) {
  const { supabase } = await staffClient(house);
  const { data, error } = await supabase.rpc("set_reservation_status", {
    p_reservation_id: id,
    p_status: status,
  });
  if (error) return { error: frenchError(error) };
  if (status === "cancelled") await maybeMailReservation(house, data, "cancelled");
  refresh(house as House);
  return { ok: true };
}

export async function changeHoldMinutes(house: string, id: string, minutes: number) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.rpc("set_hold_minutes", {
    p_reservation_id: id,
    p_hold_minutes: minutes,
  });
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function moveHoldTable(house: string, id: string, tableId: string) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.rpc("set_reservation_table", {
    p_reservation_id: id,
    p_table_id: tableId,
  });
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function updateGuest(house: string, id: string, values: {
  guest_name?: string;
  guest_phone?: string;
  guest_email?: string;
  note?: string;
  guests?: number;
}) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.from("reservations").update(values).eq("id", id).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function trashReservation(house: string, id: string) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase
    .from("reservations")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function placeStaffHold(
  house: string,
  input: {
    tableId: string;
    date: string;
    time: string;
    holdMinutes: number;
    guests: number;
    name: string;
    phone: string;
    email: string;
    note: string;
    status: "held" | "blocked";
    confirmNow?: boolean;
  },
) {
  const { supabase } = await staffClient(house);
  const { data, error } = await supabase.rpc("place_hold", {
    p_house: house as House,
    p_table_id: input.tableId,
    p_date: input.date,
    p_start: input.time.length === 5 ? `${input.time}:00` : input.time,
    p_hold_minutes: input.holdMinutes,
    p_guests: input.guests,
    p_name: input.name,
    p_phone: input.phone,
    p_email: input.email,
    p_note: input.note,
    p_status: input.status,
  });
  if (error) return { error: frenchError(error) };
  if (input.confirmNow && data?.id) {
    await supabase.rpc("set_reservation_status", {
      p_reservation_id: data.id,
      p_status: "confirmed",
    });
  }
  refresh(house as House);
  return { ok: true };
}

export async function saveSettings(house: string, values: Record<string, unknown>) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.from("settings").update(values as never).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function saveOrdering(house: string, values: Record<string, unknown>) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.from("ordering_settings").update(values as never).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function saveHouseOps(house: string, values: Record<string, unknown>) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.from("house_ops").update(values as never).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function addClosure(
  house: string,
  input: { starts_on: string; ends_on: string; scope: "all" | "reservations" | "orders"; reason: string },
) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.from("house_closures").insert({ ...input, house: house as House });
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function deleteClosure(house: string, id: string) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.from("house_closures").delete().eq("id", id).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function pauseOrdering(house: string, minutes: number | null) {
  const { supabase } = await staffClient(house);
  const paused_until = minutes
    ? new Date(Date.now() + minutes * 60 * 1000).toISOString()
    : null;
  const { error } = await supabase
    .from("ordering_settings")
    .update({ paused_until })
    .eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function updateOrderStatus(house: string, id: string, status: string) {
  const { supabase } = await staffClient(house);
  const { data: order, error: loadError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("house", asHouse(house))
    .maybeSingle();
  if (loadError) return { error: frenchError(loadError) };
  if (!order) return { error: "Commande introuvable." };
  const patch: Record<string, unknown> = { status };
  if (status === "confirmed") patch.confirmed_at = new Date().toISOString();
  if (status === "ready") patch.ready_at = new Date().toISOString();
  if (status === "completed") patch.completed_at = new Date().toISOString();
  const { error } = await supabase.from("orders").update(patch as never).eq("id", id).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  if (order.customer_email && (status === "confirmed" || status === "ready")) {
    const readyCopy =
      order.fulfillment === "delivery"
        ? "Votre commande part en livraison."
        : "Votre commande est prête, à tout de suite !";
    const body =
      status === "confirmed"
        ? `Votre commande ${order.order_number} est acceptée.`
        : readyCopy;
    await sendEmail({
      house: house as House,
      type: status === "confirmed" ? "order_accepted_guest" : "order_ready_guest",
      to: order.customer_email,
      subject: `Commande ${order.order_number}`,
      html: fillAndRender(HOUSE_LABEL[house as House], body, {}).html,
      entity: { type: "order", id: order.id },
    });
  }
  refresh(house as House);
  return { ok: true };
}

export async function markCashPaid(house: string, id: string, paid: boolean) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase
    .from("orders")
    .update({
      payment_status: paid ? "paid" : "pending",
      paid_at: paid ? new Date().toISOString() : null,
    })
    .eq("id", id)
    .eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function refundOrder(house: string, id: string, reason: string) {
  const { house: scoped } = await requireHouseAccess(house);
  const admin = createAdminClient();
  if (!admin) return { error: "Stripe n’est pas configuré pour cette maison." };
  const { data: order } = await admin
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("house", scoped)
    .maybeSingle();
  if (!order?.payment_intent_id) return { error: "Paiement introuvable." };
  const stripe = getStripe(scoped);
  if (!stripe) return { error: "Stripe n’est pas configuré pour cette maison." };
  await stripe.refunds.create({ payment_intent: order.payment_intent_id });
  const { error } = await admin
    .from("orders")
    .update({
      status: "cancelled",
      payment_status: "refunded",
      refunded_cents: order.total_cents,
      cancelled_by: "staff",
      cancel_reason: reason,
    })
    .eq("id", id)
    .eq("house", scoped);
  if (error) return { error: frenchError(error) };
  if (order.customer_email) {
    await sendEmail({
      house: scoped,
      type: "order_cancelled_guest",
      to: order.customer_email,
      subject: `Commande ${order.order_number} annulée`,
      html: fillAndRender(HOUSE_LABEL[scoped], "Votre commande est annulée. Le remboursement apparaîtra sous 5 à 10 jours ouvrés.", {}).html,
      entity: { type: "order", id: order.id },
    });
  }
  refresh(scoped);
  return { ok: true };
}

export async function saveSiteEmail(email: string) {
  await requireOwner();
  const supabase = await createStaffClient();
  if (!supabase) return { error: "unconfigured" };
  const { error } = await supabase.from("site_settings").update({ contact_email: email }).eq("id", true);
  if (error) return { error: frenchError(error) };
  updateTag("site");
  revalidatePath("/");
  revalidatePath("/admin/marque");
  return { ok: true };
}

export async function addTable(
  house: string,
  input: { zone: "salle" | "terrasse"; number: number; seats: number },
) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.from("tables").insert({
    house: house as House,
    zone: input.zone,
    number: input.number,
    seats: input.seats,
    sort_order: input.number,
    active: true,
  });
  if (error) {
    if (error.code === "23505") return { error: "Ce numéro existe déjà dans cette zone." };
    return { error: frenchError(error) };
  }
  refresh(house as House);
  return { ok: true };
}

export async function updateTable(
  house: string,
  id: string,
  values: { number?: number; seats?: number; zone?: "salle" | "terrasse"; sort_order?: number },
) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.from("tables").update(values).eq("id", id).eq("house", asHouse(house));
  if (error) {
    if (error.code === "23505") return { error: "Ce numéro existe déjà dans cette zone." };
    return { error: frenchError(error) };
  }
  refresh(house as House);
  return { ok: true };
}

export async function setTableActive(house: string, id: string, active: boolean) {
  const { supabase } = await staffClient(house);
  if (!active) {
    const today = new Date().toISOString().slice(0, 10);
    const { count } = await supabase
      .from("reservations")
      .select("id", { count: "exact", head: true })
      .eq("house", asHouse(house))
      .eq("table_id", id)
      .is("deleted_at", null)
      .in("status", ["held", "confirmed", "blocked"])
      .gte("service_date", today);
    if ((count ?? 0) > 0) {
      return { error: `Déplacez d’abord les ${count} retenues à venir.`, blocked: count ?? 0 };
    }
  }
  const { error } = await supabase.from("tables").update({ active }).eq("id", id).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function saveCategory(
  house: string,
  input: {
    id?: string;
    name: string;
    name_alt?: string;
    slug: string;
    is_active: boolean;
    orderable: boolean;
    is_drinks: boolean;
    display_order?: number;
  },
) {
  const { supabase } = await staffClient(house);
  if (input.id) {
    const { error } = await supabase
      .from("menu_categories")
      .update({
        name: input.name,
        name_alt: input.name_alt || null,
        slug: input.slug,
        is_active: input.is_active,
        orderable: input.orderable,
        is_drinks: input.is_drinks,
        display_order: input.display_order,
      })
      .eq("id", input.id)
      .eq("house", asHouse(house));
    if (error) return { error: frenchError(error) };
  } else {
    const { error } = await supabase.from("menu_categories").insert({
      house: house as House,
      name: input.name,
      name_alt: input.name_alt || null,
      slug: input.slug,
      is_active: input.is_active,
      orderable: input.orderable,
      is_drinks: input.is_drinks,
      display_order: input.display_order ?? 0,
    });
    if (error) return { error: frenchError(error) };
  }
  refresh(house as House);
  return { ok: true };
}

export async function deleteCategory(house: string, id: string) {
  const { supabase } = await staffClient(house);
  const { count } = await supabase
    .from("dishes")
    .select("id", { count: "exact", head: true })
    .eq("house", asHouse(house))
    .eq("category_id", id);
  if ((count ?? 0) > 0) return { error: "Catégorie non vide" };
  const { error } = await supabase.from("menu_categories").delete().eq("id", id).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function saveDish(
  house: string,
  input: {
    id?: string;
    category_id: string;
    name: string;
    name_alt?: string;
    description?: string;
    price_cents: number;
    spice_level: number;
    tags: string[];
    allergens: string[];
    available: boolean;
    orderable: boolean;
    featured: boolean;
    image_path?: string | null;
    image_url?: string | null;
    display_order?: number;
  },
) {
  const { supabase } = await staffClient(house);
  if (input.featured) {
    const { count } = await supabase
      .from("dishes")
      .select("id", { count: "exact", head: true })
      .eq("house", asHouse(house))
      .eq("featured", true)
      .neq("id", input.id ?? "00000000-0000-0000-0000-000000000000");
    if ((count ?? 0) >= 6) return { error: "6 signatures maximum" };
  }
  if (input.id) {
    const { error } = await supabase
      .from("dishes")
      .update({
        category_id: input.category_id,
        name: input.name,
        name_alt: input.name_alt || null,
        description: input.description || null,
        price_cents: input.price_cents,
        spice_level: input.spice_level,
        tags: input.tags,
        allergens: input.allergens,
        available: input.available,
        orderable: input.orderable,
        featured: input.featured,
        image_path: input.image_path,
        image_url: input.image_url,
        display_order: input.display_order,
      })
      .eq("id", input.id)
      .eq("house", asHouse(house));
    if (error) return { error: frenchError(error) };
  } else {
    const { error } = await supabase.from("dishes").insert({
      house: house as House,
      category_id: input.category_id,
      name: input.name,
      name_alt: input.name_alt || null,
      description: input.description || null,
      price_cents: input.price_cents,
      spice_level: input.spice_level,
      tags: input.tags,
      allergens: input.allergens,
      available: input.available,
      orderable: input.orderable,
      featured: input.featured,
      image_path: input.image_path ?? null,
      image_url: input.image_url ?? null,
      display_order: input.display_order ?? 0,
    });
    if (error) return { error: frenchError(error) };
  }
  refresh(house as House);
  return { ok: true };
}

export async function deleteDish(house: string, id: string, imagePath?: string | null) {
  const { supabase } = await staffClient(house);
  if (imagePath) await supabase.storage.from("dish-images").remove([imagePath]);
  const { error } = await supabase.from("dishes").delete().eq("id", id).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function toggleDishAvailable(house: string, id: string, available: boolean) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase.from("dishes").update({ available }).eq("id", id).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function copyMenuFromOtherHouse(house: string) {
  await requireOwner();
  const { supabase } = await staffClient(house);
  const source = house === "montmartre" ? "poissonniere" : "montmartre";
  const { count } = await supabase
    .from("dishes")
    .select("id", { count: "exact", head: true })
    .eq("house", asHouse(house));
  if ((count ?? 0) > 0) return { error: "La carte de cette maison n’est pas vide." };
  const { data: cats } = await supabase.from("menu_categories").select("*").eq("house", source);
  const { data: dishes } = await supabase.from("dishes").select("*").eq("house", source);
  const idMap = new Map<string, string>();
  for (const category of cats ?? []) {
    const { data } = await supabase
      .from("menu_categories")
      .insert({
        house: house as House,
        name: category.name,
        name_alt: category.name_alt,
        slug: category.slug,
        is_active: category.is_active,
        orderable: category.orderable,
        is_drinks: category.is_drinks,
        display_order: category.display_order,
      })
      .select("id")
      .maybeSingle();
    if (data) idMap.set(category.id, data.id);
  }
  for (const dish of dishes ?? []) {
    const categoryId = idMap.get(dish.category_id);
    if (!categoryId) continue;
    await supabase.from("dishes").insert({
      house: house as House,
      category_id: categoryId,
      name: dish.name,
      name_alt: dish.name_alt,
      description: dish.description,
      price_cents: dish.price_cents,
      spice_level: dish.spice_level,
      tags: dish.tags,
      allergens: dish.allergens,
      available: dish.available,
      orderable: dish.orderable,
      featured: dish.featured,
      display_order: dish.display_order,
      image_path: null,
      image_url: dish.image_url,
    });
  }
  refresh(house as House);
  return { ok: true };
}

export async function saveBanner(
  house: string,
  input: {
    id?: string;
    title: string;
    body?: string;
    link_url?: string;
    starts_on: string;
    ends_on: string;
    enabled: boolean;
    show_on_home: boolean;
    display_order: number;
    image_path: string;
    image_url: string;
  },
) {
  const { supabase } = await staffClient(house);
  if (input.link_url && !/^https?:\/\//i.test(input.link_url)) {
    return { error: "Le lien doit commencer par http:// ou https://." };
  }
  if (input.ends_on < input.starts_on) return { error: "La date de fin doit être après le début." };
  if (input.id) {
    const { error } = await supabase
      .from("event_banners")
      .update({
        title: input.title,
        body: input.body || null,
        link_url: input.link_url || null,
        starts_on: input.starts_on,
        ends_on: input.ends_on,
        enabled: input.enabled,
        show_on_home: input.show_on_home,
        display_order: input.display_order,
        image_path: input.image_path,
        image_url: input.image_url,
      })
      .eq("id", input.id)
      .eq("house", asHouse(house));
    if (error) return { error: frenchError(error) };
  } else {
    const { error } = await supabase.from("event_banners").insert({
      house: house as House,
      title: input.title,
      body: input.body || null,
      link_url: input.link_url || null,
      starts_on: input.starts_on,
      ends_on: input.ends_on,
      enabled: input.enabled,
      show_on_home: input.show_on_home,
      display_order: input.display_order,
      image_path: input.image_path,
      image_url: input.image_url,
    });
    if (error) return { error: frenchError(error) };
  }
  refresh(house as House);
  return { ok: true };
}

export async function deleteBanner(house: string, id: string, imagePath: string) {
  const { supabase } = await staffClient(house);
  if (imagePath) await supabase.storage.from("event-banners").remove([imagePath]);
  const { error } = await supabase.from("event_banners").delete().eq("id", id).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function markMessage(house: string, id: string, status: "read" | "archived", handledBy: string) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase
    .from("contact_messages")
    .update({ status, handled_by: handledBy })
    .eq("id", id)
    .eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function trashMessage(house: string, id: string) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase
    .from("contact_messages")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function trashEmail(house: string, id: string) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase
    .from("email_logs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function trashAllEmails(house: string) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase
    .from("email_logs")
    .update({ deleted_at: new Date().toISOString() })
    .eq("house", asHouse(house))
    .is("deleted_at", null);
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function resendEmail(house: string, id: string) {
  const { house: scoped } = await requireHouseAccess(house);
  const admin = createAdminClient();
  if (!admin) return { error: "unconfigured" };
  const { data: row } = await admin
    .from("email_logs")
    .select("*")
    .eq("id", id)
    .eq("house", scoped)
    .maybeSingle();
  if (!row) return { error: "E-mail introuvable." };
  await sendEmail({
    house: scoped,
    type: row.type as Parameters<typeof sendEmail>[0]["type"],
    to: row.to_email,
    subject: row.subject ?? "",
    html: row.html ?? "",
    entity: { type: (row.entity_type as "reservation" | "order" | "contact_message" | "other") ?? "other", id: row.entity_id ?? undefined },
  });
  refresh(scoped);
  return { ok: true };
}

export async function sendTestEmail(house: string, to: string, subject: string, html: string) {
  const { house: scoped } = await requireHouseAccess(house);
  const result = await sendEmail({
    house: scoped,
    type: "staff_test",
    to,
    subject,
    html,
    entity: { type: "other" },
  });
  return { ok: true, emailSent: result.sent };
}

export async function restoreTrash(
  house: string,
  kind: "reservations" | "orders" | "messages" | "emails",
  id: string,
) {
  const { supabase } = await staffClient(house);
  const table =
    kind === "reservations"
      ? "reservations"
      : kind === "orders"
        ? "orders"
        : kind === "messages"
          ? "contact_messages"
          : "email_logs";
  const { error } = await supabase.from(table).update({ deleted_at: null }).eq("id", id).eq("house", asHouse(house));
  if (error) {
    if (error.message.includes("exclusion") || error.message.includes("table_taken")) {
      return { error: "Cette table est déjà prise sur ce créneau." };
    }
    return { error: frenchError(error) };
  }
  refresh(house as House);
  return { ok: true };
}

export async function purgeTrash(
  house: string,
  kind: "reservations" | "orders" | "messages" | "emails",
  id: string,
) {
  const { supabase } = await staffClient(house);
  const table =
    kind === "reservations"
      ? "reservations"
      : kind === "orders"
        ? "orders"
        : kind === "messages"
          ? "contact_messages"
          : "email_logs";
  const { error } = await supabase.from(table).delete().eq("id", id).eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function bulkTrash(
  house: string,
  kind: "reservations" | "orders" | "messages" | "emails",
  action: "restore" | "purge",
  confirm: string,
) {
  if (confirm !== "SUPPRIMER") return { error: "Tapez SUPPRIMER pour confirmer." };
  const { supabase } = await staffClient(house);
  const table =
    kind === "reservations"
      ? "reservations"
      : kind === "orders"
        ? "orders"
        : kind === "messages"
          ? "contact_messages"
          : "email_logs";
  if (action === "restore") {
    const { error } = await supabase.from(table).update({ deleted_at: null }).eq("house", asHouse(house)).not("deleted_at", "is", null);
    if (error) return { error: frenchError(error) };
  } else {
    const { error } = await supabase.from(table).delete().eq("house", asHouse(house)).not("deleted_at", "is", null);
    if (error) return { error: frenchError(error) };
  }
  refresh(house as House);
  return { ok: true };
}

export async function trashOrder(house: string, id: string) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase
    .from("orders")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id)
    .eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function updateOrderNote(house: string, id: string, note: string) {
  const { supabase } = await staffClient(house);
  const { error } = await supabase
    .from("orders")
    .update({ internal_note: note })
    .eq("id", id)
    .eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  refresh(house as House);
  return { ok: true };
}

export async function cancelOrder(house: string, id: string, reason: string) {
  const { supabase } = await staffClient(house);
  const { data: order, error: loadError } = await supabase
    .from("orders")
    .select("*")
    .eq("id", id)
    .eq("house", asHouse(house))
    .maybeSingle();
  if (loadError) return { error: frenchError(loadError) };
  if (!order) return { error: "Commande introuvable." };
  if (order.payment_method === "card" && order.payment_status === "paid") {
    return { error: "Commande payée par carte : utilisez « Annuler et rembourser »." };
  }
  const { error } = await supabase
    .from("orders")
    .update({
      status: "cancelled",
      cancelled_by: "staff",
      cancel_reason: reason,
      cancelled_at: new Date().toISOString(),
    })
    .eq("id", id)
    .eq("house", asHouse(house));
  if (error) return { error: frenchError(error) };
  if (order.customer_email) {
    await sendEmail({
      house: house as House,
      type: "order_cancelled_guest",
      to: order.customer_email,
      subject: `Commande ${order.order_number} annulée`,
      html: fillAndRender(HOUSE_LABEL[house as House], `Votre commande ${order.order_number} a été annulée.`, {}).html,
      entity: { type: "order", id: order.id },
    });
  }
  refresh(house as House);
  return { ok: true };
}

export async function inviteStaff(input: { email: string; house: House; displayName: string }) {
  await requireOwner();
  const admin = createAdminClient();
  if (!admin) return { error: "unconfigured" };
  const password = `Mh-${crypto.randomUUID()}!aA1`;
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password,
    email_confirm: true,
    app_metadata: { role: "staff", house: input.house },
  });
  if (error || !data.user) return { error: error?.message ?? "Impossible de créer le compte." };
  const { error: memberError } = await admin.from("staff_members").insert({
    user_id: data.user.id,
    house: input.house,
    role: "staff",
    display_name: input.displayName,
    active: true,
  });
  if (memberError) return { error: frenchError(memberError) };
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await admin.auth.resetPasswordForEmail(input.email, { redirectTo: `${site}/admin/reinitialiser` });
  return { ok: true };
}

export async function setStaffActive(userId: string, active: boolean) {
  const staff = await requireOwner();
  if (staff.userId === userId && !active) return { error: "Vous ne pouvez pas désactiver votre propre compte." };
  const supabase = await createStaffClient();
  if (!supabase) return { error: "unconfigured" };
  const { error } = await supabase.from("staff_members").update({ active }).eq("user_id", userId);
  if (error) return { error: frenchError(error) };
  return { ok: true };
}

export async function sendStaffReset(email: string) {
  await requireOwner();
  const supabase = await createStaffClient();
  if (!supabase) return { error: "unconfigured" };
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  await supabase.auth.resetPasswordForEmail(email, { redirectTo: `${site}/admin/reinitialiser` });
  return { ok: true };
}

async function maybeMailReservation(
  house: string,
  reservation: {
    id?: string;
    guest_email?: string | null;
    guest_name?: string | null;
    guest_phone?: string | null;
    guests?: number;
    service_date?: string;
    start_time?: string;
    hold_minutes?: number;
    cancel_token?: string;
  } | null,
  kind: "confirmed" | "cancelled",
) {
  if (!isHouse(house) || !reservation?.guest_email) return;
  const admin = createAdminClient();
  if (!admin) return;
  const { data: settings } = await admin.from("settings").select("*").eq("house", asHouse(house)).maybeSingle();
  const { data: ops } = await admin.from("house_ops").select("*").eq("house", asHouse(house)).maybeSingle();
  const fields = {
    house: ops?.display_name ?? HOUSE_LABEL[house],
    table: "",
    zone: "",
    date: reservation.service_date ? formatDateFr(reservation.service_date) : "",
    start: reservation.start_time ? formatTime(reservation.start_time) : "",
    end: reservation.start_time
      ? addMinutes(reservation.start_time, reservation.hold_minutes ?? 90)
      : "",
    guests: String(reservation.guests ?? ""),
    name: reservation.guest_name ?? "",
    phone: reservation.guest_phone ?? "",
    email: reservation.guest_email,
    note: "",
    housePhone: ops?.phone ?? "",
    cancelUrl: `${process.env.NEXT_PUBLIC_SITE_URL ?? ""}/reservation/annuler?token=${reservation.cancel_token ?? ""}`,
  };
  const template =
    kind === "confirmed"
      ? {
          subject: settings?.confirm_email_subject ?? DEFAULT_TEMPLATES.confirm_guest.subject,
          body: settings?.confirm_email_body ?? DEFAULT_TEMPLATES.confirm_guest.body,
        }
      : {
          subject: settings?.cancel_email_subject ?? DEFAULT_TEMPLATES.cancel_guest.subject,
          body: settings?.cancel_email_body ?? DEFAULT_TEMPLATES.cancel_guest.body,
        };
  const rendered = fillAndRender(fields.house, template.body, fields);
  await sendEmail({
    house,
    type: kind === "confirmed" ? "reservation_confirmed_guest" : "reservation_cancelled_guest",
    to: reservation.guest_email,
    subject: fillAndRender(fields.house, template.subject, fields).plain,
    html: rendered.html,
    entity: { type: "reservation", id: reservation.id },
  });
}
