"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";
import { deleteBanner, saveBanner } from "@/app/admin/[house]/actions";
import { BannerForm, resizeWebp } from "@/app/admin/[house]/evenements/EventsClient";
import { saveSiteDesk } from "@/app/admin/marque/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { HOUSE_LABEL, HOUSE_ORDER, isHouse, type House } from "@/lib/house";
import { euro } from "@/lib/money";

export type SiteBanner = {
  id: string;
  house: House;
  title: string | null;
  body: string | null;
  link_url: string | null;
  starts_on: string;
  ends_on: string;
  enabled: boolean;
  show_on_home: boolean;
  display_order: number;
  image_path: string;
  image_url: string;
};

export type SiteDish = {
  id: string;
  name: string;
  house: House;
  featured: boolean;
  available: boolean;
  price_cents: number;
  image_url: string | null;
};

function bannerInput(banner: SiteBanner, patch: Partial<Parameters<typeof saveBanner>[1]> = {}) {
  return {
    id: banner.id,
    title: banner.title ?? "",
    body: banner.body ?? "",
    link_url: banner.link_url ?? "",
    starts_on: banner.starts_on,
    ends_on: banner.ends_on,
    enabled: banner.enabled,
    show_on_home: banner.show_on_home,
    display_order: banner.display_order,
    image_path: banner.image_path,
    image_url: banner.image_url,
    ...patch,
  };
}

export function SiteClient({
  contactEmail,
  homeBannerLeft,
  homeBannerRight,
  featuredDishIds,
  banners,
  dishes,
}: {
  contactEmail: string;
  homeBannerLeft: string;
  homeBannerRight: string;
  featuredDishIds: string[];
  banners: SiteBanner[];
  dishes: SiteDish[];
}) {
  const [pending, start] = useTransition();
  const [picked, setPicked] = useState<string[]>(featuredDishIds);
  const [createHouse, setCreateHouse] = useState<House>("montmartre");

  function run(action: () => Promise<{ error?: string }>, ok: string) {
    start(async () => {
      const result = await action();
      if (result.error) toast.error(result.error);
      else toast.success(ok);
    });
  }

  async function upload(house: House, file: File) {
    const supabase = createBrowserSupabase();
    if (!supabase) throw new Error("unconfigured");
    const blob = await resizeWebp(file);
    const path = `${house}/banners/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage.from("event-banners").upload(path, blob, {
      contentType: "image/webp",
    });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("event-banners").getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  function toggleDish(id: string) {
    setPicked((current) =>
      current.includes(id) ? current.filter((value) => value !== id) : [...current, id],
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-3xl bg-white p-5">
        <p className="font-label text-[10px] font-bold uppercase tracking-[1.4px] text-burgundy">
          Accueil
        </p>
        <h2 className="font-display text-xl font-bold">Bandeau accueil</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Texte du ticker en haut de la page d’accueil. Laissez vide pour le texte d’origine.
        </p>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            run(
              () =>
                saveSiteDesk({
                  home_banner_left: String(data.get("home_banner_left") ?? ""),
                  home_banner_right: String(data.get("home_banner_right") ?? ""),
                }),
              "Bandeau enregistré",
            );
          }}
        >
          <label className="block text-sm">
            Gauche
            <input
              name="home_banner_left"
              defaultValue={homeBannerLeft}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            Droite
            <input
              name="home_banner_right"
              defaultValue={homeBannerRight}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
          <button disabled={pending} className="btn-burgundy px-4 py-2 text-xs">
            Enregistrer le bandeau
          </button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-[1.4px] text-burgundy">
            Événements
          </p>
          <h2 className="font-display text-xl font-bold">Affiches sur l’accueil</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Les deux maisons. L’accueil n’affiche que les affiches actives marquées « aussi sur
            l’accueil ».
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {banners.map((banner) => (
            <article key={banner.id} className="rounded-3xl bg-white p-4">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.image_url} alt="" className="h-36 w-full rounded-2xl object-cover" />
              <p className="mt-2 font-label text-[10px] font-bold uppercase tracking-[1.2px] text-burgundy">
                {HOUSE_LABEL[banner.house]}
              </p>
              <p className="font-display font-bold">{banner.title}</p>
              <p className="text-xs text-ink-muted">
                {banner.starts_on} → {banner.ends_on}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-xl border px-3 py-1.5 font-label text-xs"
                  onClick={() =>
                    run(
                      () => saveBanner(banner.house, bannerInput(banner, { enabled: !banner.enabled })),
                      banner.enabled ? "Affiche désactivée" : "Affiche activée",
                    )
                  }
                >
                  {banner.enabled ? "Actif" : "Inactif"}
                </button>
                <button
                  type="button"
                  className="rounded-xl border px-3 py-1.5 font-label text-xs"
                  onClick={() =>
                    run(
                      () =>
                        saveBanner(banner.house, bannerInput(banner, { show_on_home: !banner.show_on_home })),
                      banner.show_on_home ? "Retirée de l’accueil" : "Aussi sur l’accueil",
                    )
                  }
                >
                  {banner.show_on_home ? "Aussi sur l’accueil" : "Maison seulement"}
                </button>
                <button
                  type="button"
                  className="font-label text-xs uppercase text-burgundy"
                  onClick={() =>
                    run(
                      () => deleteBanner(banner.house, banner.id, banner.image_path),
                      "Affiche supprimée",
                    )
                  }
                >
                  Supprimer
                </button>
              </div>
              <Link
                href={`/admin/${banner.house}/evenements`}
                className="mt-3 inline-block font-label text-xs uppercase text-ink-muted"
              >
                Éditeur {HOUSE_LABEL[banner.house]}
              </Link>
            </article>
          ))}
        </div>
        <div className="rounded-3xl bg-white p-4">
          <h3 className="font-display text-lg font-bold">Créer une affiche</h3>
          <label className="mt-3 block text-sm">
            Maison
            <select
              value={createHouse}
              onChange={(event) => {
                const value = event.target.value;
                if (isHouse(value)) setCreateHouse(value);
              }}
              className="mt-1 w-full rounded-xl border px-3 py-2 text-sm"
            >
              {HOUSE_ORDER.map((house) => (
                <option key={house} value={house}>
                  {HOUSE_LABEL[house]}
                </option>
              ))}
            </select>
          </label>
          <BannerForm
            house={createHouse}
            pending={pending}
            onSave={(values) =>
              run(() => saveBanner(createHouse, values), "Affiche créée")
            }
            onUpload={(file) => upload(createHouse, file)}
          />
          <Link
            href={`/admin/${createHouse}/evenements`}
            className="mt-2 inline-block font-label text-xs uppercase text-ink-muted"
          >
            Éditeur complet {HOUSE_LABEL[createHouse]}
          </Link>
        </div>
      </section>

      <section className="rounded-3xl bg-white p-5">
        <p className="font-label text-[10px] font-bold uppercase tracking-[1.4px] text-burgundy">
          Menu
        </p>
        <h2 className="font-display text-xl font-bold">Incontournables</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Plats affichés dans « Les Incontournables de la Maison ». Aucun choix : les signatures
          (plats mis en avant) des deux maisons.
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {dishes.map((dish) => {
            const checked = picked.includes(dish.id);
            return (
              <label
                key={dish.id}
                className={`flex items-center gap-3 rounded-2xl border px-3 py-2 text-sm ${
                  checked ? "border-burgundy bg-paper-soft" : "border-[rgba(228,190,186,0.4)]"
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleDish(dish.id)}
                />
                <span className="flex-1">
                  <span className="block font-medium">{dish.name}</span>
                  <span className="text-xs text-ink-muted">
                    {HOUSE_LABEL[dish.house]} · {euro(dish.price_cents)}
                    {dish.featured ? " · signature" : ""}
                    {!dish.available ? " · indisponible" : ""}
                  </span>
                </span>
              </label>
            );
          })}
        </div>
        <button
          type="button"
          disabled={pending}
          className="btn-burgundy mt-4 px-4 py-2 text-xs"
          onClick={() =>
            run(() => saveSiteDesk({ featured_dish_ids: picked }), "Incontournables enregistrés")
          }
        >
          Enregistrer la sélection
        </button>
      </section>

      <section className="rounded-3xl bg-white p-5">
        <p className="font-label text-[10px] font-bold uppercase tracking-[1.4px] text-burgundy">
          Contact
        </p>
        <h2 className="font-display text-xl font-bold">E-mail de contact</h2>
        <form
          className="mt-4 space-y-3"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            run(
              () => saveSiteDesk({ contact_email: String(data.get("contact_email") ?? "") }),
              "E-mail enregistré",
            );
          }}
        >
          <label className="block text-sm">
            E-mail de contact du site
            <input
              name="contact_email"
              type="email"
              required
              defaultValue={contactEmail}
              className="mt-1 w-full rounded-xl border px-3 py-2"
            />
          </label>
          <button disabled={pending} className="btn-burgundy px-4 py-2 text-xs">
            Enregistrer
          </button>
        </form>
      </section>
    </div>
  );
}
