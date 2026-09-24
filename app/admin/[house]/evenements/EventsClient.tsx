"use client";

import { useState, useTransition } from "react";
import { deleteBanner, saveBanner } from "@/app/admin/[house]/actions";
import { createBrowserSupabase } from "@/lib/supabase/client";
import type { House } from "@/lib/house";

type Banner = {
  id: string;
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

async function resizeWebp(file: File) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("canvas");
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((value) => (value ? resolve(value) : reject(new Error("webp"))), "image/webp", 0.86);
  });
}

export function EventsClient({ house, banners }: { house: House; banners: Banner[] }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: () => Promise<{ error?: string }>) {
    start(async () => {
      const result = await action();
      setError(result.error ?? null);
    });
  }

  async function upload(file: File) {
    const supabase = createBrowserSupabase();
    if (!supabase) throw new Error("unconfigured");
    const blob = await resizeWebp(file);
    const path = `${house}/banners/${crypto.randomUUID()}.webp`;
    const { error: uploadError } = await supabase.storage.from("event-banners").upload(path, blob, { contentType: "image/webp" });
    if (uploadError) throw uploadError;
    const { data } = supabase.storage.from("event-banners").getPublicUrl(path);
    return { path, url: data.publicUrl };
  }

  return (
    <div className="space-y-6">
      {error ? <p className="text-sm text-burgundy">{error}</p> : null}
      <div className="grid gap-3 sm:grid-cols-2">
        {banners.map((banner) => (
          <article key={banner.id} className="rounded-3xl bg-white p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={banner.image_url} alt="" className="h-36 w-full rounded-2xl object-cover" />
            <p className="mt-2 font-display font-bold">{banner.title}</p>
            <p className="text-xs text-ink-muted">{banner.starts_on} → {banner.ends_on}</p>
            <BannerForm house={house} banner={banner} pending={pending} onSave={(values) => run(() => saveBanner(house, values))} onUpload={upload} />
            <button type="button" className="mt-2 text-xs uppercase text-burgundy" onClick={() => run(() => deleteBanner(house, banner.id, banner.image_path))}>
              Supprimer
            </button>
          </article>
        ))}
      </div>
      <div className="rounded-3xl bg-white p-4">
        <h2 className="font-display text-xl font-bold">Nouvelle affiche</h2>
        <BannerForm house={house} pending={pending} onSave={(values) => run(() => saveBanner(house, values))} onUpload={upload} />
      </div>
    </div>
  );
}

function BannerForm({
  house,
  banner,
  pending,
  onSave,
  onUpload,
}: {
  house: House;
  banner?: Banner;
  pending: boolean;
  onSave: (values: Parameters<typeof saveBanner>[1]) => void;
  onUpload: (file: File) => Promise<{ path: string; url: string }>;
}) {
  return (
    <form
      className="mt-3 space-y-2"
      onSubmit={async (event) => {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        const file = data.get("image") as File | null;
        let image_path = banner?.image_path ?? "";
        let image_url = banner?.image_url ?? "";
        if (file && file.size > 0) {
          const uploaded = await onUpload(file);
          image_path = uploaded.path;
          image_url = uploaded.url;
        }
        if (!image_path) return;
        onSave({
          id: banner?.id,
          title: String(data.get("title")),
          body: String(data.get("body") ?? ""),
          link_url: String(data.get("link_url") ?? ""),
          starts_on: String(data.get("starts_on")),
          ends_on: String(data.get("ends_on")),
          enabled: data.get("enabled") === "on",
          show_on_home: data.get("show_on_home") === "on",
          display_order: Number(data.get("display_order") ?? 0),
          image_path,
          image_url,
        });
      }}
    >
      <input type="hidden" value={house} readOnly />
      <input name="title" defaultValue={banner?.title ?? ""} placeholder="Titre" className="w-full rounded-xl border px-3 py-2 text-sm" />
      <textarea name="body" defaultValue={banner?.body ?? ""} placeholder="Texte" className="w-full rounded-xl border px-3 py-2 text-sm" />
      <input name="link_url" defaultValue={banner?.link_url ?? ""} placeholder="https://…" className="w-full rounded-xl border px-3 py-2 text-sm" />
      <div className="grid grid-cols-2 gap-2">
        <input name="starts_on" type="date" defaultValue={banner?.starts_on} required className="rounded-xl border px-3 py-2 text-sm" />
        <input name="ends_on" type="date" defaultValue={banner?.ends_on} required className="rounded-xl border px-3 py-2 text-sm" />
      </div>
      <input name="display_order" type="number" defaultValue={banner?.display_order ?? 0} className="w-full rounded-xl border px-3 py-2 text-sm" />
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="enabled" defaultChecked={banner?.enabled ?? true} /> Actif</label>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="show_on_home" defaultChecked={banner?.show_on_home ?? false} /> Aussi sur l’accueil</label>
      <input name="image" type="file" accept="image/*" required={!banner} className="block text-sm" />
      <button disabled={pending} className="btn-burgundy px-4 py-2 text-xs">Enregistrer</button>
    </form>
  );
}
