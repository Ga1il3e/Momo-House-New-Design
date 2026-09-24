"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { FadeIn } from "@/components/motion/FadeIn";
import { createBrowserSupabase } from "@/lib/supabase/client";
import { HOUSE_LABEL, isHouse, type House } from "@/lib/house";

type Banner = {
  id: string;
  house: House;
  title: string | null;
  body: string | null;
  image_url: string;
  link_url: string | null;
  updated_at: string;
  ends_on: string;
  show_on_home: boolean;
};

export function EventBannersPopup() {
  const pathname = usePathname();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") close();
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  useEffect(() => {
    if (pathname.startsWith("/admin")) return;
    const supabase = createBrowserSupabase();
    if (!supabase) return;
    supabase
      .from("event_banners")
      .select("id, house, title, body, image_url, link_url, updated_at, ends_on, show_on_home, enabled")
      .eq("enabled", true)
      .then(({ data }) => {
        const house = pathname.startsWith("/montmartre")
          ? "montmartre"
          : pathname.startsWith("/poissonniere")
            ? "poissonniere"
            : null;
        const list = (data ?? []).filter((row) => {
          if (!isHouse(row.house)) return false;
          if (house) return row.house === house;
          return row.show_on_home;
        }) as Banner[];
        const fingerprint = list.map((row) => `${row.id}:${row.updated_at}:${row.ends_on}`).join("|");
        try {
          if (fingerprint && sessionStorage.getItem("mh_banners") === fingerprint) return;
        } catch {
          // ignore
        }
        setBanners(list);
        setOpen(list.length > 0);
      });
  }, [pathname]);

  if (!open || banners.length === 0) return null;

  function close() {
    const fingerprint = banners.map((row) => `${row.id}:${row.updated_at}:${row.ends_on}`).join("|");
    try {
      sessionStorage.setItem("mh_banners", fingerprint);
    } catch {
      // ignore
    }
    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-bistro/60 p-4" role="dialog" aria-modal="true">
      <FadeIn className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-paper p-4">
        <button type="button" aria-label="Fermer" className="absolute right-3 top-3 rounded-full bg-white px-3 py-1 text-sm" onClick={close}>
          X
        </button>
        <div className="space-y-4 pt-6">
          {banners.map((banner) => (
            <article key={banner.id} className="overflow-hidden rounded-2xl bg-white">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={banner.image_url} alt="" className="h-40 w-full object-cover" />
              <div className="p-4">
                <p className="font-label text-[10px] uppercase text-burgundy">{HOUSE_LABEL[banner.house]}</p>
                <h2 className="font-display text-xl font-bold">{banner.title}</h2>
                {banner.body ? <p className="mt-1 text-sm text-ink-muted">{banner.body}</p> : null}
                {banner.link_url ? (
                  <a href={banner.link_url} className="mt-2 inline-block text-sm text-burgundy underline">
                    En savoir plus
                  </a>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </FadeIn>
    </div>
  );
}
