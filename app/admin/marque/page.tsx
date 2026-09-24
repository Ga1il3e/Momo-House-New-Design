import { requireOwner } from "@/lib/auth/staff";
import { createStaffClient } from "@/lib/supabase/server";
import { saveSiteEmail } from "@/app/admin/[house]/actions";

export default async function MarquePage() {
  await requireOwner();
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const { data } = await supabase.from("site_settings").select("contact_email").eq("id", true).maybeSingle();

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-10">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Propriétaire</p>
        <h1 className="font-display text-3xl font-extrabold">Marque</h1>
      </header>
      <form
        className="space-y-3 rounded-3xl bg-white p-5"
        action={async (formData) => {
          "use server";
          await saveSiteEmail(String(formData.get("contact_email") ?? ""));
        }}
      >
        <label className="block text-sm">
          E-mail de contact du site
          <input
            name="contact_email"
            type="email"
            required
            defaultValue={data?.contact_email ?? ""}
            className="mt-1 w-full rounded-xl border px-3 py-2"
          />
        </label>
        <button className="btn-burgundy px-4 py-2 text-xs">Enregistrer</button>
      </form>
    </div>
  );
}
