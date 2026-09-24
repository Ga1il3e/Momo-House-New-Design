"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/supabase/staff";
import { createServiceClient, createStaffClient } from "@/lib/supabase/server";
import { isHouseId, isZone } from "@/lib/reservation-store";

function service() {
  const client = createServiceClient();
  if (!client) throw new Error("unconfigured");
  return client;
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const supabase = await createStaffClient();
  if (!supabase) redirect("/admin/login?error=config");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) redirect("/admin/login?error=auth");

  const { data } = await supabase.auth.getClaims();
  const role = (data?.claims as { app_metadata?: { role?: string } } | undefined)
    ?.app_metadata?.role;
  if (role !== "staff") {
    await supabase.auth.signOut();
    redirect("/admin/login?error=role");
  }
  redirect("/admin");
}

export async function signOut() {
  const supabase = await createStaffClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function releaseHold(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { error } = await service()
    .from("reservations")
    .update({ status: "released" })
    .eq("id", id)
    .in("status", ["held", "blocked"]);
  if (error) throw error;
  revalidatePath("/admin");
}

export async function extendHold(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const holdMinutes = Number(formData.get("holdMinutes"));
  if (!id || !Number.isInteger(holdMinutes)) return;
  const { error } = await service()
    .schema("private")
    .rpc("set_hold_minutes", {
      p_reservation_id: id,
      p_hold_minutes: holdMinutes,
    });
  if (error) {
    if (error.message.includes("table_taken")) {
      redirect("/admin?error=overlap");
    }
    throw error;
  }
  revalidatePath("/admin");
}

export async function blockTable(formData: FormData) {
  await requireStaff();
  const house = String(formData.get("house") ?? "");
  const tableId = String(formData.get("tableId") ?? "");
  const date = String(formData.get("date") ?? "");
  const time = String(formData.get("time") ?? "");
  const holdMinutes = Number(formData.get("holdMinutes"));
  const guests = Number(formData.get("guests") ?? 1);
  const note = String(formData.get("note") ?? "");
  if (!isHouseId(house) || !tableId) redirect("/admin?error=block");

  const { error } = await service().schema("private").rpc("place_hold", {
    p_house: house,
    p_table_id: tableId,
    p_date: date,
    p_start: time.length === 5 ? `${time}:00` : time,
    p_hold_minutes: holdMinutes,
    p_guests: Number.isInteger(guests) && guests > 0 ? guests : 1,
    p_name: "",
    p_phone: "",
    p_email: "",
    p_note: note || "Blocage manuel",
    p_status: "blocked",
  });
  if (error) redirect("/admin?error=block");
  revalidatePath("/admin");
}

export async function saveTable(formData: FormData) {
  await requireStaff();
  const id = String(formData.get("id") ?? "");
  const house = String(formData.get("house") ?? "");
  const zone = String(formData.get("zone") ?? "");
  const number = Number(formData.get("number"));
  const seats = Number(formData.get("seats"));
  const active = formData.get("active") === "on";
  if (!isHouseId(house) || !isZone(zone)) redirect("/admin/tables?error=save");
  if (!Number.isInteger(number) || number < 1 || !Number.isInteger(seats) || seats < 1) {
    redirect("/admin/tables?error=save");
  }

  const payload = { house, zone, number, seats, active };
  const query = id
    ? service().from("tables").update(payload).eq("id", id)
    : service().from("tables").insert(payload);
  const { error } = await query;
  if (error) redirect("/admin/tables?error=save");
  revalidatePath("/admin/tables");
  revalidatePath("/admin");
}

export async function saveSettings(formData: FormData) {
  await requireStaff();
  const house = String(formData.get("house") ?? "");
  const holdMinutes = Number(formData.get("holdMinutes"));
  if (!isHouseId(house) || !Number.isInteger(holdMinutes) || holdMinutes < 15) {
    redirect("/admin/settings?error=save");
  }
  const { error } = await service()
    .from("settings")
    .update({
      hold_minutes: holdMinutes,
      guest_email_subject: String(formData.get("guestSubject") ?? ""),
      guest_email_body: String(formData.get("guestBody") ?? ""),
      house_email_subject: String(formData.get("houseSubject") ?? ""),
      house_email_body: String(formData.get("houseBody") ?? ""),
    })
    .eq("house", house);
  if (error) redirect("/admin/settings?error=save");
  revalidatePath("/admin/settings");
}
