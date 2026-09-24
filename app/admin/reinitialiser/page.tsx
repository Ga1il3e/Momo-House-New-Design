import { setNewPassword } from "@/app/admin/actions";

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ erreur?: string }>;
}) {
  const params = await searchParams;
  const message =
    params.erreur === "mdp"
      ? "Le mot de passe doit faire 12 caractères et les deux champs doivent correspondre."
      : params.erreur
        ? "Impossible de changer le mot de passe pour le moment."
        : null;
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <h1 className="font-display text-3xl font-extrabold">Nouveau mot de passe</h1>
      {message ? (
        <p className="mt-4 rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          {message}
        </p>
      ) : null}
      <form action={setNewPassword} className="mt-6 space-y-4">
        <label className="block">
          <span className="font-label mb-2 block text-xs uppercase text-ink-muted">
            Nouveau mot de passe
          </span>
          <input
            required
            minLength={12}
            type="password"
            name="password"
            className="w-full rounded-xl border border-[rgba(228,190,186,0.5)] bg-white px-4 py-3 text-sm"
          />
        </label>
        <label className="block">
          <span className="font-label mb-2 block text-xs uppercase text-ink-muted">
            Confirmer
          </span>
          <input
            required
            minLength={12}
            type="password"
            name="confirm"
            className="w-full rounded-xl border border-[rgba(228,190,186,0.5)] bg-white px-4 py-3 text-sm"
          />
        </label>
        <button type="submit" className="btn-burgundy w-full px-5 py-3 text-sm">
          Enregistrer
        </button>
      </form>
    </div>
  );
}
