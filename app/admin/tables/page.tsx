import { redirect } from "next/navigation";
import { saveTable } from "@/app/admin/actions";
import { houseList } from "@/lib/houses";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/server";
import { getStaffClaims } from "@/lib/supabase/staff";

type TableRow = {
  id: string;
  house: "montmartre" | "poissonniere";
  zone: "salle" | "terrasse";
  number: number;
  seats: number;
  active: boolean;
};

export default async function AdminTablesPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const staff = await getStaffClaims();
  if (!staff) redirect("/admin/login");
  const params = await searchParams;
  if (!supabaseConfigured()) return <p>La base n&apos;est pas configurée.</p>;

  const supabase = createServiceClient()!;
  const { data } = await supabase
    .from("tables")
    .select("*")
    .order("house")
    .order("zone")
    .order("number");
  const tables = (data ?? []) as TableRow[];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
          Plan de salle
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Tables</h1>
      </div>
      {params.error ? (
        <p className="rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          Enregistrement impossible. Le numéro existe peut-être déjà dans cette zone.
        </p>
      ) : null}

      <ul className="space-y-3">
        {tables.map((table) => (
          <li key={table.id} className="rounded-2xl border border-[rgba(228,190,186,0.45)] bg-white p-4">
            <form action={saveTable} className="grid gap-3 sm:grid-cols-6 sm:items-end">
              <input type="hidden" name="id" value={table.id} />
              <label className="text-xs text-ink-muted">
                Maison
                <select name="house" defaultValue={table.house} className="mt-1 w-full rounded-xl border px-2 py-2 text-sm text-ink">
                  {houseList.map((house) => (
                    <option key={house.id} value={house.id}>{house.shortName}</option>
                  ))}
                </select>
              </label>
              <label className="text-xs text-ink-muted">
                Zone
                <select name="zone" defaultValue={table.zone} className="mt-1 w-full rounded-xl border px-2 py-2 text-sm text-ink">
                  <option value="salle">Salle</option>
                  <option value="terrasse">Terrasse</option>
                </select>
              </label>
              <label className="text-xs text-ink-muted">
                N°
                <input name="number" type="number" min={1} defaultValue={table.number} className="mt-1 w-full rounded-xl border px-2 py-2 text-sm" />
              </label>
              <label className="text-xs text-ink-muted">
                Places
                <input name="seats" type="number" min={1} max={12} defaultValue={table.seats} className="mt-1 w-full rounded-xl border px-2 py-2 text-sm" />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input name="active" type="checkbox" defaultChecked={table.active} />
                Active
              </label>
              <button type="submit" className="rounded-full bg-burgundy px-3 py-2 font-label text-xs font-bold uppercase text-white">
                Sauver
              </button>
            </form>
          </li>
        ))}
      </ul>

      <section className="rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white p-5">
        <h2 className="font-display text-xl font-bold">Ajouter une table</h2>
        <form action={saveTable} className="mt-4 grid gap-3 sm:grid-cols-5 sm:items-end">
          <select name="house" className="rounded-xl border px-3 py-3 text-sm">
            {houseList.map((house) => (
              <option key={house.id} value={house.id}>{house.shortName}</option>
            ))}
          </select>
          <select name="zone" className="rounded-xl border px-3 py-3 text-sm">
            <option value="salle">Salle</option>
            <option value="terrasse">Terrasse</option>
          </select>
          <input required name="number" type="number" min={1} placeholder="N°" className="rounded-xl border px-3 py-3 text-sm" />
          <input required name="seats" type="number" min={1} max={12} placeholder="Places" className="rounded-xl border px-3 py-3 text-sm" />
          <input type="hidden" name="active" value="on" />
          <button type="submit" className="btn-burgundy px-4 py-3 text-sm sm:col-span-5">
            Ajouter
          </button>
        </form>
      </section>
    </div>
  );
}
