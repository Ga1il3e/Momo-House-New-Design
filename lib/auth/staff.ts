import { cache } from "react";
import { notFound, redirect } from "next/navigation";
import { isHouse, type House } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";

export type Staff = {
  userId: string;
  email: string | null;
  role: "staff" | "owner";
  house: House | null;
  displayName: string | null;
};

type Claims = {
  app_metadata?: { role?: string; house?: string };
  email?: string;
  sub?: string;
};

export const getStaff = cache(async (): Promise<Staff | null> => {
  const supabase = await createStaffClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  const claims = data?.claims as Claims | undefined;
  let email = claims?.email ?? null;
  let userId = claims?.sub ?? null;
  if (error || !userId) {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    email = userData.user.email ?? null;
    userId = userData.user.id;
  }
  const { data: member } = await supabase
    .from("staff_members")
    .select("user_id, role, house, display_name, active")
    .eq("user_id", userId)
    .maybeSingle();
  if (!member?.active) return null;
  if (member.role !== "staff" && member.role !== "owner") return null;
  return {
    userId: member.user_id,
    email,
    role: member.role,
    house: member.house && isHouse(member.house) ? member.house : null,
    displayName: member.display_name,
  };
});

export async function requireStaff() {
  const staff = await getStaff();
  if (!staff) redirect("/admin/login");
  return staff;
}

export async function requireHouseAccess(house: string) {
  if (!isHouse(house)) notFound();
  const staff = await getStaff();
  if (!staff) redirect(`/admin/login?next=/admin/${house}`);
  if (staff.role === "staff" && staff.house !== house) {
    redirect(`/admin/${staff.house}`);
  }
  return { staff, house };
}

export async function requireOwner() {
  const staff = await requireStaff();
  if (staff.role !== "owner") {
    redirect(staff.house ? `/admin/${staff.house}` : "/admin");
  }
  return staff;
}
