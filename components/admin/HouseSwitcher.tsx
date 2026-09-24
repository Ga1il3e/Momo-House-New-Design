"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HOUSE_LABEL, HOUSES, type House } from "@/lib/house";

export function HouseSwitcher({ house }: { house: House }) {
  const pathname = usePathname();
  const rest = pathname.replace(/^\/admin\/(montmartre|poissonniere)/, "") || "";
  return (
    <div className="flex gap-1 rounded-full bg-white/10 p-1">
      {HOUSES.map((item) => (
        <Link
          key={item}
          href={`/admin/${item}${rest}`}
          className={`rounded-full px-3 py-1.5 font-label text-[11px] font-bold uppercase ${
            item === house ? "bg-paper text-burgundy" : "text-paper/80"
          }`}
        >
          {HOUSE_LABEL[item]}
        </Link>
      ))}
    </div>
  );
}
