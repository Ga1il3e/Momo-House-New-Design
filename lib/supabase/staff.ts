import { createStaffClient } from "@/lib/supabase/server";

type Claims = {
  app_metadata?: { role?: string };
  role?: string;
};

export async function getStaffClaims() {
  const supabase = await createStaffClient();
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) return null;
  const claims = data.claims as Claims;
  const role = claims.app_metadata?.role;
  if (role !== "staff") return null;
  return claims;
}

export async function requireStaff() {
  const claims = await getStaffClaims();
  if (!claims) {
    throw new Error("unauthorized");
  }
  return claims;
}
