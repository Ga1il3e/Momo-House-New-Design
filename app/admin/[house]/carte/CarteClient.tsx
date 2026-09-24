"use client";

import { useState, useTransition } from "react";
import {
  copyMenuFromOtherHouse,
  deleteCategory,
  deleteDish,
  saveCategory,
  saveDish,
  toggleDishAvailable,
} from "@/app/admin/[house]/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { euro, parseEuroToCents } from "@/lib/money";
import { HOUSE_LABEL, type House } from "@/lib/house";

const ALLERGENS = [
  ["gluten", "Gluten"],
  ["crustaces", "Crustacés"],
  ["oeufs", "Œufs"],
  ["poissons", "Poissons"],
  ["arachides", "Arachides"],
  ["soja", "Soja"],
  ["lait", "Lait"],
  ["fruits_a_coque", "Fruits à coque"],
  ["celeri", "Céleri"],
  ["moutarde", "Moutarde"],
  ["sesame", "Sésame"],
  ["sulfites", "Sulfites"],
  ["lupin", "Lupin"],
  ["mollusques", "Mollusques"],
] as const;

const TAGS = ["vegetarien", "vegan", "halal", "sans gluten", "fait maison", "signature"] as const;

type Category = {
  id: string;
  name: string;
  name_alt: string | null;
  slug: string;
  is_active: boolean;
  orderable: boolean;
  is_drinks: boolean;
  display_order: number;
  dish_count: number;
};

type Dish = {
  id: string;
  category_id: string;
  name: string;
  name_alt: string | null;
  description: string | null;
  price_cents: number;
  spice_level: number;
  tags: string[];
  allergens: string[];
  available: boolean;
  orderable: boolean;
  featured: boolean;
  image_path: string | null;
  image_url: string | null;
};

async function resizeWebp(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("webp"))), "image/webp", 0.86);
  });
  return blob;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function CarteClient({
  house,
  categories,
  dishes,
  isOwner,
}: {
  house: House;
  categories: Category[];
  dishes: Dish[];
  isOwner: boolean;
}) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("");
  const other = house === "montmartre" ? "poissonniere" : "montmartre";

  function run(action: () => Promise<{ error?: string }>) {
    start(async () => {
      const result = await action();
      setError(result.error ?? null);
    });
  }

  async function uploadPhoto(file: File) {
    const supabase = createBrowserSupabase();
    if (!supabase) throw new Error("unconfigured");
    const blob = await resizeWebp(file);
    const path = `${house}/dishes/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage.from("dish-images").upload(path, blob, { contentType: "image/webp", upsert: true });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("dish-images").getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[18rem_1fr]">
      {error ? <p className="lg:col-span-2 text-sm text-burgundy">{error}</p> : null}
      <aside className="space-y-3">
        <h2 className="font-display text-xl font-bold">Catégories</h2>
        {categories.map((category) => (
          <article key={category.id} className="rounded-2xl bg-white p-3">
            <p className="font-medium">{category.name} <span className="text-ink-muted">({category.dish_count})</span></p>
            <form
              className="mt-2 space-y-2"
              onSubmit={(event) => {
                event.preventDefault();
                const data = new FormData(event.currentTarget);
                run(() =>
                  saveCategory(house, {
                    id: category.id,
                    name: String(data.get("name")),
                    name_alt: String(data.get("name_alt") ?? ""),
                    slug: String(data.get("slug")),
                    is_active: data.get("is_active") === "on",
                    orderable: data.get("orderable") === "on",
                    is_drinks: data.get("is_drinks") === "on",
                    display_order: category.display_order,
                  }),
                );
              }}
            >
              <input name="name" defaultValue={category.name} className="w-full rounded-xl border px-2 py-1 text-sm" />
              <input name="name_alt" defaultValue={category.name_alt ?? ""} placeholder="Nom népalais" className="w-full rounded-xl border px-2 py-1 text-sm" />
              <input name="slug" defaultValue={category.slug} className="w-full rounded-xl border px-2 py-1 text-sm" />
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="is_active" defaultChecked={category.is_active} /> Active</label>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="orderable" defaultChecked={category.orderable} /> Commandable en ligne</label>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="is_drinks" defaultChecked={category.is_drinks} /> Boissons</label>
              <div className="flex gap-2">
                <button className="rounded-full bg-paper-soft px-2 py-1 text-[11px] font-bold uppercase">Sauver</button>
                <button type="button" className="text-[11px] uppercase text-burgundy" onClick={() => run(() => deleteCategory(house, category.id))}>Supprimer</button>
              </div>
            </form>
          </article>
        ))}
        <form
          className="rounded-2xl bg-white p-3 space-y-2"
          onSubmit={(event) => {
            event.preventDefault();
            const data = new FormData(event.currentTarget);
            const name = String(data.get("name"));
            run(() =>
              saveCategory(house, {
                name,
                slug: slugify(name),
                is_active: true,
                orderable: true,
                is_drinks: data.get("is_drinks") === "on",
                display_order: categories.length + 1,
              }),
            );
            event.currentTarget.reset();
          }}
        >
          <p className="font-bold">Nouvelle catégorie</p>
          <input name="name" required placeholder="Nom" className="w-full rounded-xl border px-2 py-1 text-sm" />
          <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="is_drinks" /> Boissons</label>
          <button className="btn-burgundy px-3 py-1 text-xs">Ajouter</button>
        </form>
      </aside>
      <section className="space-y-4">
        <div className="flex flex-wrap items-center gap-2">
          <input value={filter} onChange={(event) => setFilter(event.target.value)} placeholder="Rechercher un plat" className="rounded-xl border px-3 py-2 text-sm" />
          {isOwner ? (
            <button type="button" disabled={pending} className="rounded-full border px-3 py-2 text-xs font-bold uppercase" onClick={() => run(() => copyMenuFromOtherHouse(house))}>
              Copier la carte depuis {HOUSE_LABEL[other]}
            </button>
          ) : null}
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          {dishes
            .filter((dish) => dish.name.toLowerCase().includes(filter.toLowerCase()))
            .map((dish) => (
              <article key={dish.id} className="rounded-3xl bg-white p-4">
                {dish.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={dish.image_url} alt="" className="mb-2 h-32 w-full rounded-2xl object-cover" />
                ) : null}
                <p className="font-display text-lg font-bold">{dish.name}</p>
                <p className="text-sm text-burgundy">{euro(dish.price_cents)}</p>
                <div className="mt-1 flex flex-wrap gap-1">
                  {dish.featured ? <span className="rounded-full bg-amber px-2 py-0.5 text-[10px] font-bold">Signature</span> : null}
                  {!dish.available ? <span className="rounded-full bg-burgundy/10 px-2 py-0.5 text-[10px] font-bold text-burgundy">Épuisé</span> : null}
                </div>
                <p className="mt-2 text-xs text-ink-muted">
                  {dish.allergens.length ? dish.allergens.join(", ") : "Aucun allergène déclaré"}
                </p>
                <DishForm
                  house={house}
                  categories={categories}
                  dish={dish}
                  pending={pending}
                  onSave={(values) => run(() => saveDish(house, values))}
                  onToggle={() => run(() => toggleDishAvailable(house, dish.id, !dish.available))}
                  onDelete={() => {
                    if (confirm("Supprimer ce plat ?")) run(() => deleteDish(house, dish.id, dish.image_path));
                  }}
                  onUpload={uploadPhoto}
                />
              </article>
            ))}
        </div>
        <div className="rounded-3xl bg-white p-4">
          <h3 className="font-display text-xl font-bold">Nouveau plat</h3>
          <DishForm
            house={house}
            categories={categories}
            pending={pending}
            onSave={(values) => run(() => saveDish(house, values))}
            onUpload={uploadPhoto}
          />
        </div>
      </section>
    </div>
  );
}

function DishForm({
  house,
  categories,
  dish,
  pending,
  onSave,
  onToggle,
  onDelete,
  onUpload,
}: {
  house: House;
  categories: Category[];
  dish?: Dish;
  pending: boolean;
  onSave: (values: Parameters<typeof saveDish>[1]) => void;
  onToggle?: () => void;
  onDelete?: () => void;
  onUpload: (file: File) => Promise<{ path: string; url: string }>;
}) {
  const [image, setImage] = useState({ path: dish?.image_path ?? null, url: dish?.image_url ?? null });
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const cents = parseEuroToCents(String(data.get("price") ?? ""));
        if (cents == null) return;
        const file = (data.get("photo") as File | null);
        let image_path = image.path;
        let image_url = image.url;
        if (file && file.size > 0) {
          const uploaded = await onUpload(file);
          image_path = uploaded.path;
          image_url = uploaded.url;
          setImage(uploaded);
        }
        onSave({
          id: dish?.id,
          category_id: String(data.get("category_id")),
          name: String(data.get("name")),
          name_alt: String(data.get("name_alt") ?? ""),
          description: String(data.get("description") ?? ""),
          price_cents: cents,
          spice_level: Number(data.get("spice_level") ?? 0),
          tags: TAGS.filter((tag) => data.get(`tag_${tag}`) === "on"),
          allergens: ALLERGENS.filter(([key]) => data.get(`all_${key}`) === "on").map(([key]) => key),
          available: data.get("available") === "on",
          orderable: data.get("orderable") === "on",
          featured: data.get("featured") === "on",
          image_path,
          image_url,
        });
      }}
    >
      <input type="hidden" value={house} readOnly />
      <input name="name" required defaultValue={dish?.name} placeholder="Nom" className="w-full rounded-xl border px-2 py-1 text-sm" />
      <input name="name_alt" defaultValue={dish?.name_alt ?? ""} placeholder="Nom népalais" className="w-full rounded-xl border px-2 py-1 text-sm" />
      <select name="category_id" defaultValue={dish?.category_id} required className="w-full rounded-xl border px-2 py-1 text-sm">
        {categories.map((category) => (
          <option key={category.id} value={category.id}>{category.name}</option>
        ))}
      </select>
      <input name="price" defaultValue={dish ? (dish.price_cents / 100).toFixed(2).replace(".", ",") : ""} placeholder="Prix (€)" className="w-full rounded-xl border px-2 py-1 text-sm" />
      <textarea name="description" defaultValue={dish?.description ?? ""} placeholder="Description" className="w-full rounded-xl border px-2 py-1 text-sm" />
      <select name="spice_level" defaultValue={dish?.spice_level ?? 0} className="w-full rounded-xl border px-2 py-1 text-sm">
        <option value={0}>Doux</option>
        <option value={1}>Léger</option>
        <option value={2}>Épicé</option>
        <option value={3}>Très épicé</option>
      </select>
      <div className="flex flex-wrap gap-2">
        {TAGS.map((tag) => (
          <label key={tag} className="text-xs"><input type="checkbox" name={`tag_${tag}`} defaultChecked={dish?.tags.includes(tag)} /> {tag}</label>
        ))}
      </div>
      <div className="flex flex-wrap gap-2">
        {ALLERGENS.map(([key, label]) => (
          <label key={key} className="rounded-full bg-paper-soft px-2 py-1 text-xs">
            <input type="checkbox" name={`all_${key}`} defaultChecked={dish?.allergens.includes(key)} /> {label}
          </label>
        ))}
      </div>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="available" defaultChecked={dish?.available ?? true} /> Disponible</label>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="orderable" defaultChecked={dish?.orderable ?? true} /> Commandable en ligne</label>
      <label className="flex items-center gap-2 text-xs"><input type="checkbox" name="featured" defaultChecked={dish?.featured ?? false} /> Signature</label>
      <input name="photo" type="file" accept="image/*" className="block text-xs" />
      <div className="flex flex-wrap gap-2">
        <button disabled={pending} className="btn-burgundy px-3 py-1 text-xs">Enregistrer</button>
        {onToggle ? <button type="button" className="text-xs uppercase" onClick={onToggle}>{dish?.available ? "Épuisé ce soir" : "Disponible"}</button> : null}
        {onDelete ? <button type="button" className="text-xs uppercase text-burgundy" onClick={onDelete}>Supprimer</button> : null}
      </div>
    </form>
  );
}
