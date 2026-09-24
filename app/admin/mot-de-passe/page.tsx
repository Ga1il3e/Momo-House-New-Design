import { requestPasswordReset } from "@/app/admin/actions";

export default async function PasswordRequestPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center">
      <h1 className="font-display text-3xl font-extrabold">Mot de passe oublié</h1>
      {params.ok ? (
        <p className="mt-4 rounded-xl bg-paper-soft px-4 py-3 text-sm">
          Si ce compte existe, un lien vient d’être envoyé.
        </p>
      ) : (
        <form action={requestPasswordReset} className="mt-6 space-y-4">
          <label className="block">
            <span className="font-label mb-2 block text-xs font-medium uppercase text-ink-muted">
              Adresse e-mail
            </span>
            <input
              required
              type="email"
              name="email"
              className="w-full rounded-xl border border-[rgba(228,190,186,0.5)] bg-white px-4 py-3 text-sm"
            />
          </label>
          <button type="submit" className="btn-burgundy w-full px-5 py-3 text-sm">
            Envoyer le lien
          </button>
        </form>
      )}
    </div>
  );
}
