"use server";

import { redirect } from "next/navigation";
import { createStaffClient } from "@/lib/supabase/server";

function safeNext(value: FormDataEntryValue | null) {
  const next = String(value ?? "");
  return next.startsWith("/admin") ? next : "/admin";
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(formData.get("next"));
  const supabase = await createStaffClient();
  if (!supabase) redirect("/admin/login?erreur=config");

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    if (error.status === 429) redirect("/admin/login?erreur=limite");
    redirect("/admin/login?erreur=auth");
  }

  const { data } = await supabase.auth.getClaims();
  const role = (data?.claims as { app_metadata?: { role?: string } } | undefined)
    ?.app_metadata?.role;
  if (role !== "staff" && role !== "owner") {
    await supabase.auth.signOut();
    redirect("/admin/login?erreur=acces");
  }
  redirect(next);
}

export async function signOut() {
  const supabase = await createStaffClient();
  if (supabase) await supabase.auth.signOut();
  redirect("/admin/login");
}

export async function requestPasswordReset(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const supabase = await createStaffClient();
  const site = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  if (supabase && email) {
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${site}/admin/reinitialiser`,
    });
  }
  redirect("/admin/mot-de-passe?ok=1");
}

export async function setNewPassword(formData: FormData) {
  const password = String(formData.get("password") ?? "");
  const confirm = String(formData.get("confirm") ?? "");
  if (password.length < 12 || password !== confirm) {
    redirect("/admin/reinitialiser?erreur=mdp");
  }
  const supabase = await createStaffClient();
  if (!supabase) redirect("/admin/reinitialiser?erreur=config");
  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect("/admin/reinitialiser?erreur=mdp");
  redirect("/admin");
}
