"use client";

import { useState } from "react";
import { Toaster } from "sonner";
import { HouseSwitcher } from "@/components/admin/HouseSwitcher";
import { Sidebar } from "@/components/admin/Sidebar";
import { useHouseLive } from "@/components/admin/useHouseLive";
import { FadeIn } from "@/components/motion/FadeIn";
import type { House } from "@/lib/house";

export function AdminShell({
  house,
  isOwner,
  badges,
  hideOrders,
  children,
}: {
  house: House;
  isOwner: boolean;
  badges: {
    held: number;
    pendingOrders: number;
    newMessages: number;
    failedEmails: number;
    trash: number;
  };
  hideOrders: boolean;
  children: React.ReactNode;
}) {
  useHouseLive(house);
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-full bg-paper text-ink lg:grid lg:grid-cols-[16rem_1fr]">
      <Toaster position="top-right" />
      <div className="border-b border-[rgba(228,190,186,0.4)] bg-burgundy px-4 py-3 text-paper lg:col-span-2 lg:flex lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            className="rounded-full bg-paper px-3 py-2 font-label text-xs font-bold uppercase text-burgundy lg:hidden"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? "Fermer le menu" : "Ouvrir le menu"}
          </button>
          {isOwner ? <HouseSwitcher house={house} /> : <span className="font-label text-xs uppercase">Momo House</span>}
        </div>
      </div>
      <div className={open ? "block" : "hidden lg:block"}>
        <Sidebar house={house} isOwner={isOwner} badges={badges} hideOrders={hideOrders} />
      </div>
      <div className="px-4 py-6 sm:px-6">
        <FadeIn>{children}</FadeIn>
      </div>
    </div>
  );
}
