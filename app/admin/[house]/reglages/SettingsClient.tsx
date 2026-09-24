"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { addClosure, deleteClosure, saveHouseOps, saveOrdering, saveSettings, sendTestEmail } from "@/app/admin/[house]/actions";
import { DEFAULT_TEMPLATES } from "@/lib/email/templates";
import { fillAndRender } from "@/lib/email/render";
import { HOUSE_LABEL, type House } from "@/lib/house";
import { parseEuroToCents } from "@/lib/money";
import { stripeConfigured } from "@/lib/stripe-public";

const PLACEHOLDERS = ["house", "table", "zone", "date", "start", "end", "guests", "name", "phone", "email", "note", "housePhone", "cancelUrl"];

function phoneHrefFrom(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("33")) return `tel:+${digits}`;
  if (digits.startsWith("0")) return `tel:+33${digits.slice(1)}`;
  return `tel:${digits}`;
}

export function SettingsClient({
  house,
  tab,
  settings,
  ordering,
  ops,
  closures,
  staffEmail,
}: {
  house: House;
  tab: "reservations" | "commandes" | "horaires" | "emails";
  settings: Record<string, unknown>;
  ordering: Record<string, unknown>;
  ops: Record<string, unknown>;
  closures: { id: string; starts_on: string; ends_on: string; scope: string; reason: string | null }[];
  staffEmail: string | null;
}) {
  const [pending, start] = useTransition();
  const stripeOk = stripeConfigured(house);

  function save(action: () => Promise<{ error?: string; emailSent?: boolean }>) {
    start(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else if (result.emailSent === false) toast.message("E-mail non envoyé");
      else toast.success("Réglages enregistrés");
    });
  }

  return (
    <div className="rounded-3xl bg-white p-5">
      {tab === "reservations" ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const slots = String(data.get("time_slots") ?? "")
              .split(",")
              .map((slot) => slot.trim())
              .filter(Boolean);
            save(() =>
              saveSettings(house, {
                reservations_enabled: data.get("reservations_enabled") === "on",
                hold_minutes: Number(data.get("hold_minutes")),
                time_slots: slots,
                max_party_size: Number(data.get("max_party_size")),
                min_lead_minutes: Number(data.get("min_lead_minutes")),
                booking_horizon_days: Number(data.get("booking_horizon_days")),
              }),
            );
          }}
        >
          <label className="flex items-center gap-2"><input type="checkbox" name="reservations_enabled" defaultChecked={Boolean(settings.reservations_enabled)} /> Réservations en ligne</label>
          <Field label="Durée d’une retenue (min)" name="hold_minutes" defaultValue={String(settings.hold_minutes ?? 90)} />
          <Field label="Créneaux proposés (séparés par des virgules)" name="time_slots" defaultValue={(settings.time_slots as string[] | undefined)?.join(", ") ?? ""} />
          <Field label="Couverts max en ligne" name="max_party_size" defaultValue={String(settings.max_party_size ?? 8)} />
          <Field label="Délai minimum (min)" name="min_lead_minutes" defaultValue={String(settings.min_lead_minutes ?? 60)} />
          <Field label="Réservable jusqu’à (jours)" name="booking_horizon_days" defaultValue={String(settings.booking_horizon_days ?? 30)} />
          <button disabled={pending} className="btn-burgundy px-4 py-2 text-xs">Enregistrer</button>
        </form>
      ) : null}

      {tab === "commandes" ? (
        <form
          className="space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            save(() =>
              saveOrdering(house, {
                takeaway_enabled: stripeOk && data.get("takeaway_enabled") === "on",
                delivery_enabled: stripeOk && data.get("delivery_enabled") === "on",
                cash_on_pickup_enabled: data.get("cash_on_pickup_enabled") === "on",
                takeaway_fee_cents: parseEuroToCents(String(data.get("takeaway_fee") ?? "0")) ?? 0,
                takeaway_discount_pct: Number(data.get("takeaway_discount_pct") ?? 0),
                prep_minutes: Number(data.get("prep_minutes") ?? 20),
                delivery_fee_cents: parseEuroToCents(String(data.get("delivery_fee") ?? "0")) ?? 0,
                delivery_min_cents: parseEuroToCents(String(data.get("delivery_min") ?? "0")) ?? 0,
                delivery_postcodes: String(data.get("delivery_postcodes") ?? "").split(",").map((item) => item.trim()).filter(Boolean),
                delivery_eta_minutes: Number(data.get("delivery_eta_minutes") ?? 40),
                last_order_minutes_before_close: Number(data.get("last_order_minutes_before_close") ?? 30),
              }),
            );
          }}
        >
          {!stripeOk ? <p className="text-sm text-burgundy">Stripe n’est pas configuré pour cette maison (clés STRIPE_*_{house.toUpperCase()}).</p> : null}
          <label className="flex items-center gap-2"><input type="checkbox" name="takeaway_enabled" defaultChecked={Boolean(ordering.takeaway_enabled)} disabled={!stripeOk} /> Retrait</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="delivery_enabled" defaultChecked={Boolean(ordering.delivery_enabled)} disabled={!stripeOk} /> Livraison</label>
          <label className="flex items-center gap-2"><input type="checkbox" name="cash_on_pickup_enabled" defaultChecked={Boolean(ordering.cash_on_pickup_enabled)} /> Espèces au retrait</label>
          <Field label="Frais de retrait (€)" name="takeaway_fee" defaultValue={((Number(ordering.takeaway_fee_cents ?? 0)) / 100).toFixed(2).replace(".", ",")} />
          <Field label="Remise à emporter (%)" name="takeaway_discount_pct" defaultValue={String(ordering.takeaway_discount_pct ?? 0)} />
          <Field label="Temps de préparation (min)" name="prep_minutes" defaultValue={String(ordering.prep_minutes ?? 20)} />
          <Field label="Frais de livraison (€)" name="delivery_fee" defaultValue={((Number(ordering.delivery_fee_cents ?? 0)) / 100).toFixed(2).replace(".", ",")} />
          <Field label="Minimum livraison (€)" name="delivery_min" defaultValue={((Number(ordering.delivery_min_cents ?? 0)) / 100).toFixed(2).replace(".", ",")} />
          <Field label="Codes postaux livrés" name="delivery_postcodes" defaultValue={(ordering.delivery_postcodes as string[] | undefined)?.join(", ") ?? ""} />
          <Field label="Délai de livraison (min)" name="delivery_eta_minutes" defaultValue={String(ordering.delivery_eta_minutes ?? 40)} />
          <Field label="Dernière commande X min avant fermeture" name="last_order_minutes_before_close" defaultValue={String(ordering.last_order_minutes_before_close ?? 30)} />
          <button disabled={pending} className="btn-burgundy px-4 py-2 text-xs">Enregistrer</button>
        </form>
      ) : null}

      {tab === "horaires" ? (
        <div className="space-y-6">
          <form
            className="space-y-3"
            onSubmit={(event) => {
              event.preventDefault();
              const data = new FormData(event.currentTarget);
              const phone = String(data.get("phone"));
              const closed = [1, 2, 3, 4, 5, 6, 7].filter((day) => data.get(`d${day}`) === "on");
              save(() =>
                saveHouseOps(house, {
                  phone,
                  phone_href: phoneHrefFrom(phone),
                  hours_label: String(data.get("hours_label")),
                  hours_note: String(data.get("hours_note")),
                  lunch_open: String(data.get("lunch_open") || "") || null,
                  lunch_close: String(data.get("lunch_close") || "") || null,
                  dinner_open: String(data.get("dinner_open") || "") || null,
                  dinner_close: String(data.get("dinner_close") || "") || null,
                  continuous: data.get("continuous") === "on",
                  closed_weekdays: closed,
                  address_line: String(data.get("address_line")),
                  contact_email: String(data.get("contact_email")),
                  email_from_name: String(data.get("email_from_name")),
                }),
              );
            }}
          >
            <Field label="Téléphone" name="phone" defaultValue={String(ops.phone ?? "")} />
            <Field label="Libellé horaires" name="hours_label" defaultValue={String(ops.hours_label ?? "")} />
            <Field label="Note" name="hours_note" defaultValue={String(ops.hours_note ?? "")} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Midi ouverture" name="lunch_open" defaultValue={String(ops.lunch_open ?? "")} />
              <Field label="Midi fermeture" name="lunch_close" defaultValue={String(ops.lunch_close ?? "")} />
              <Field label="Soir ouverture" name="dinner_open" defaultValue={String(ops.dinner_open ?? "")} />
              <Field label="Soir fermeture" name="dinner_close" defaultValue={String(ops.dinner_close ?? "")} />
            </div>
            <label className="flex items-center gap-2"><input type="checkbox" name="continuous" defaultChecked={Boolean(ops.continuous)} /> Service continu</label>
            <p className="text-sm font-medium">Jours de fermeture</p>
            <div className="flex flex-wrap gap-2">
              {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map((label, index) => (
                <label key={label} className="text-xs">
                  <input type="checkbox" name={`d${index + 1}`} defaultChecked={(ops.closed_weekdays as number[] | undefined)?.includes(index + 1)} /> {label}
                </label>
              ))}
            </div>
            <Field label="Adresse" name="address_line" defaultValue={String(ops.address_line ?? "")} />
            <Field label="E-mail de contact" name="contact_email" defaultValue={String(ops.contact_email ?? "")} />
            <Field label="Nom d’expéditeur" name="email_from_name" defaultValue={String(ops.email_from_name ?? "")} />
            <button disabled={pending} className="btn-burgundy px-4 py-2 text-xs">Enregistrer</button>
          </form>
          <section>
            <h3 className="font-display font-bold">Fermetures exceptionnelles</h3>
            <ul className="mt-2 space-y-2 text-sm">
              {closures.map((row) => (
                <li key={row.id} className="flex justify-between">
                  <span>{row.starts_on} → {row.ends_on} · {row.scope} · {row.reason}</span>
                  <button type="button" className="text-burgundy" onClick={() => save(() => deleteClosure(house, row.id))}>Retirer</button>
                </li>
              ))}
            </ul>
            <form
              className="mt-3 grid gap-2 sm:grid-cols-4"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                save(() =>
                  addClosure(house, {
                    starts_on: String(data.get("starts_on")),
                    ends_on: String(data.get("ends_on")),
                    scope: String(data.get("scope")) as "all" | "reservations" | "orders",
                    reason: String(data.get("reason")),
                  }),
                );
              }}
            >
              <input name="starts_on" type="date" required className="rounded-xl border px-3 py-2 text-sm" />
              <input name="ends_on" type="date" required className="rounded-xl border px-3 py-2 text-sm" />
              <select name="scope" className="rounded-xl border px-3 py-2 text-sm">
                <option value="all">Tout</option>
                <option value="reservations">Réservations</option>
                <option value="orders">Commandes</option>
              </select>
              <input name="reason" placeholder="Raison" className="rounded-xl border px-3 py-2 text-sm" />
              <button className="btn-burgundy px-3 py-2 text-xs sm:col-span-4">Ajouter</button>
            </form>
          </section>
        </div>
      ) : null}

      {tab === "emails" ? <EmailTemplates house={house} settings={settings} staffEmail={staffEmail} pending={pending} save={save} /> : null}
    </div>
  );
}

function Field({ label, name, defaultValue }: { label: string; name: string; defaultValue: string }) {
  return (
    <label className="block text-sm">
      {label}
      <input name={name} defaultValue={defaultValue} className="mt-1 w-full rounded-xl border border-[rgba(228,190,186,0.5)] px-3 py-2" />
    </label>
  );
}

function EmailTemplates({
  house,
  settings,
  staffEmail,
  pending,
  save,
}: {
  house: House;
  settings: Record<string, unknown>;
  staffEmail: string | null;
  pending: boolean;
  save: (action: () => Promise<{ error?: string; emailSent?: boolean }>) => void;
}) {
  const [preview, setPreview] = useState("");
  const sample: Record<string, string> = {
    house: HOUSE_LABEL[house],
    table: "Salle 1",
    zone: "salle",
    date: "vendredi 26 septembre",
    start: "19:30",
    end: "21:00",
    guests: "2",
    name: "Alex",
    phone: "06 00 00 00 00",
    email: "alex@example.com",
    note: "",
    housePhone: "01 42 33 89 10",
    cancelUrl: "https://momo-house.fr/reservation/annuler",
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        save(() =>
          saveSettings(house, {
            notify_email: String(data.get("notify_email")),
            guest_email_subject: String(data.get("guest_email_subject")),
            guest_email_body: String(data.get("guest_email_body")),
            house_email_subject: String(data.get("house_email_subject")),
            house_email_body: String(data.get("house_email_body")),
            confirm_email_subject: String(data.get("confirm_email_subject")),
            confirm_email_body: String(data.get("confirm_email_body")),
            cancel_email_subject: String(data.get("cancel_email_subject")),
            cancel_email_body: String(data.get("cancel_email_body")),
          }),
        );
      }}
    >
      <Field label="E-mail de la maison" name="notify_email" defaultValue={String(settings.notify_email ?? "")} />
      {(["guest", "house", "confirm", "cancel"] as const).map((key) => {
        const labels = {
          guest: "Retenue — client",
          house: "Retenue — maison",
          confirm: "Confirmation — client",
          cancel: "Annulation — client",
        };
        const defaults = {
          guest: DEFAULT_TEMPLATES.hold_guest,
          house: DEFAULT_TEMPLATES.hold_house,
          confirm: DEFAULT_TEMPLATES.confirm_guest,
          cancel: DEFAULT_TEMPLATES.cancel_guest,
        };
        return (
          <fieldset key={key} className="space-y-2 rounded-2xl bg-paper-soft p-3">
            <legend className="font-display font-bold">{labels[key]}</legend>
            <input name={`${key === "guest" ? "guest" : key === "house" ? "house" : key === "confirm" ? "confirm" : "cancel"}_email_subject`} defaultValue={String(settings[`${key}_email_subject`] ?? defaults[key].subject)} className="w-full rounded-xl border px-3 py-2 text-sm" />
            <textarea name={`${key}_email_body`} defaultValue={String(settings[`${key}_email_body`] ?? defaults[key].body)} rows={5} className="w-full rounded-xl border px-3 py-2 text-sm" />
            <button
              type="button"
              className="text-xs uppercase text-burgundy"
              onClick={(event) => {
                const form = event.currentTarget.form;
                const body = String(new FormData(form ?? undefined).get(`${key}_email_body`) ?? "");
                setPreview(fillAndRender(HOUSE_LABEL[house], body, sample).html);
              }}
            >
              Aperçu
            </button>
          </fieldset>
        );
      })}
      <div className="flex flex-wrap gap-1">
        {PLACEHOLDERS.map((key) => (
          <span key={key} className="rounded-full bg-paper-soft px-2 py-1 text-[11px]">{`{{${key}}}`}</span>
        ))}
      </div>
      {preview ? <iframe title="Aperçu" sandbox="" srcDoc={preview} className="h-48 w-full rounded-xl border" /> : null}
      <div className="flex flex-wrap gap-2">
        <button disabled={pending} className="btn-burgundy px-4 py-2 text-xs">Enregistrer</button>
        {staffEmail ? (
          <button
            type="button"
            className="rounded-full border px-3 py-2 text-xs uppercase"
            onClick={() =>
              save(() =>
                sendTestEmail(house, staffEmail, "Test Momo House", fillAndRender(HOUSE_LABEL[house], "Ceci est un e-mail de test.", sample).html),
              )
            }
          >
            M’envoyer un test
          </button>
        ) : null}
      </div>
    </form>
  );
}
