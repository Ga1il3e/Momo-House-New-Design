import { redirect } from "next/navigation";
import { saveSettings } from "@/app/admin/actions";
import { houses, type HouseId } from "@/lib/houses";
import type { HouseSettings } from "@/lib/reservations";
import { supabaseConfigured } from "@/lib/supabase/env";
import { createServiceClient } from "@/lib/supabase/server";
import { getStaffClaims } from "@/lib/supabase/staff";

export default async function AdminSettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const staff = await getStaffClaims();
  if (!staff) redirect("/admin/login");
  const params = await searchParams;
  if (!supabaseConfigured()) return <p>La base n&apos;est pas configurée.</p>;

  const supabase = createServiceClient()!;
  const { data } = await supabase.from("settings").select("*");
  const rows = (data ?? []) as HouseSettings[];

  return (
    <div className="space-y-8">
      <div>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
          Durée & messages
        </p>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">Réglages</h1>
        <p className="mt-2 max-w-xl text-sm leading-6 text-ink-muted">
          La durée par défaut est de 90 minutes. Une table choisie à 19:30 reste
          prise jusqu&apos;à 21:00, puis redevient libre. Les modèles acceptent{" "}
          {"{{table}} {{date}} {{start}} {{end}} {{guests}} {{name}} {{phone}} {{housePhone}}"}.
        </p>
      </div>
      {params.error ? (
        <p className="rounded-xl bg-burgundy/10 px-4 py-3 text-sm text-burgundy">
          Réglage refusé. La durée doit être d&apos;au moins 15 minutes.
        </p>
      ) : null}
      {rows.map((row) => (
        <form
          key={row.house}
          action={saveSettings}
          className="space-y-4 rounded-3xl border border-[rgba(228,190,186,0.45)] bg-white p-5 sm:p-7"
        >
          <input type="hidden" name="house" value={row.house} />
          <h2 className="font-display text-2xl font-bold">
            {houses[row.house as HouseId].name}
          </h2>
          <label className="block text-sm">
            <span className="font-label mb-2 block text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
              Durée de retenue (minutes)
            </span>
            <input
              name="holdMinutes"
              type="number"
              min={15}
              max={1440}
              defaultValue={row.hold_minutes}
              className="w-32 rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-3"
            />
          </label>
          <Field name="guestSubject" label="Sujet email convive" defaultValue={row.guest_email_subject} />
          <Area name="guestBody" label="Message convive" defaultValue={row.guest_email_body} />
          <Field name="houseSubject" label="Sujet email maison" defaultValue={row.house_email_subject} />
          <Area name="houseBody" label="Message maison" defaultValue={row.house_email_body} />
          <button type="submit" className="btn-burgundy px-5 py-3 text-sm">
            Enregistrer
          </button>
        </form>
      ))}
    </div>
  );
}

function Field({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-label mb-2 block text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
        {label}
      </span>
      <input
        name={name}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-3"
      />
    </label>
  );
}

function Area({
  name,
  label,
  defaultValue,
}: {
  name: string;
  label: string;
  defaultValue: string;
}) {
  return (
    <label className="block text-sm">
      <span className="font-label mb-2 block text-xs font-medium uppercase tracking-[0.8px] text-ink-muted">
        {label}
      </span>
      <textarea
        name={name}
        rows={6}
        defaultValue={defaultValue}
        className="w-full rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-3"
      />
    </label>
  );
}
