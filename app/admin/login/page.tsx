import { signIn } from "@/app/admin/actions";
import { authConfigured } from "@/lib/supabase/env";
import { getStaffClaims } from "@/lib/supabase/staff";
import { redirect } from "next/navigation";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const staff = await getStaffClaims();
  if (staff) redirect("/admin");
  const params = await searchParams;
  const configured = authConfigured();

  const message =
    params.error === "auth"
      ? "Email ou mot de passe incorrect."
      : params.error === "role"
        ? "Ce compte n'est pas un compte équipe."
        : params.error === "config"
          ? "Supabase n'est pas configuré."
          : null;

  return (
    <div className="mx-auto max-w-md">
      <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
        Équipe
      </p>
      <h1 className="font-display mt-2 text-3xl font-extrabold tracking-tight">
        Connexion
      </h1>
      <p className="mt-3 text-sm leading-6 text-ink-muted">
        Réservé au personnel. Le rôle <span className="font-medium">staff</span>{" "}
        doit être posé dans app_metadata, pas dans les données modifiables du compte.
      </p>
      {message ? (
        <p className="mt-4 rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          {message}
        </p>
      ) : null}
      {configured ? (
        <form action={signIn} className="mt-6 space-y-4">
          <label className="block">
            <span className="font-label mb-2 block text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
              Email
            </span>
            <input
              required
              type="email"
              name="email"
              className="w-full rounded-xl border border-[rgba(228,190,186,0.5)] bg-white px-4 py-3 text-sm outline-none focus:border-burgundy"
            />
          </label>
          <label className="block">
            <span className="font-label mb-2 block text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
              Mot de passe
            </span>
            <input
              required
              type="password"
              name="password"
              className="w-full rounded-xl border border-[rgba(228,190,186,0.5)] bg-white px-4 py-3 text-sm outline-none focus:border-burgundy"
            />
          </label>
          <button type="submit" className="btn-burgundy w-full px-5 py-3 text-sm">
            Entrer
          </button>
        </form>
      ) : (
        <p className="mt-6 rounded-2xl border border-[rgba(228,190,186,0.5)] bg-white p-4 text-sm leading-6 text-ink-muted">
          Ajoutez NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
          pour ouvrir la connexion.
        </p>
      )}
    </div>
  );
}
