import Link from "next/link";
import { redirect } from "next/navigation";
import { signIn } from "@/app/admin/actions";
import { isHouse, HOUSE_LABEL } from "@/lib/house";
import { getStaff } from "@/lib/auth/staff";
import { authConfigured } from "@/lib/supabase/env";

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string; error?: string; next?: string; maison?: string }>;
}) {
  const staff = await getStaff();
  if (staff) redirect("/admin");
  const params = await searchParams;
  const configured = authConfigured();
  const code = params.erreur ?? params.error;
  const maison = isHouse(params.maison) ? params.maison : null;

  const message =
    code === "auth"
      ? "E-mail ou mot de passe incorrect."
      : code === "acces" || code === "role"
        ? "Ce compte n’a pas accès à l’espace équipe."
        : code === "limite"
          ? "Trop de tentatives. Réessayez dans quelques minutes."
          : code === "config"
            ? "Supabase n’est pas configuré : ajoutez NEXT_PUBLIC_SUPABASE_URL et la clé publique dans .env.local."
            : code
              ? "Connexion impossible pour le moment."
              : null;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
        Équipe
      </p>
      <h1 className="font-display mt-2 text-4xl font-extrabold tracking-tight">
        Espace équipe
      </h1>
      {maison ? (
        <p className="mt-2 font-medium text-ink">Momo House {HOUSE_LABEL[maison]}</p>
      ) : null}
      {message ? (
        <p className="mt-4 rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          {message}
        </p>
      ) : null}
      {configured ? (
        <form action={signIn} className="mt-6 space-y-4">
          {params.next ? <input type="hidden" name="next" value={params.next} /> : null}
          <label className="block">
            <span className="font-label mb-2 block text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
              Adresse e-mail
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
            Se connecter
          </button>
        </form>
      ) : (
        <p className="mt-6 rounded-2xl border border-[rgba(228,190,186,0.5)] bg-white p-4 text-sm leading-6 text-ink-muted">
          Supabase n’est pas configuré : ajoutez NEXT_PUBLIC_SUPABASE_URL et la clé
          publique dans .env.local.
        </p>
      )}
      <p className="mt-4 text-sm">
        <Link href="/admin/mot-de-passe" className="text-burgundy underline">
          Mot de passe oublié ?
        </Link>
      </p>
    </div>
  );
}
