"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HOUSE_LABEL, HOUSE_PREFIX, type House } from "@/lib/house";
import { signOut } from "@/app/admin/actions";

type BadgeKey =
  | "held"
  | "pendingOrders"
  | "newMessages"
  | "failedEmails"
  | "trash";

const LINKS: { href: string; label: string; badge?: BadgeKey }[] = [
  { href: "", label: "Retenues", badge: "held" },
  { href: "/reservations", label: "Réservations" },
  { href: "/commandes", label: "Commandes", badge: "pendingOrders" },
  { href: "/tables", label: "Tables" },
  { href: "/carte", label: "Carte" },
  { href: "/evenements", label: "Événements" },
  { href: "/messages", label: "Messages", badge: "newMessages" },
  { href: "/rapports", label: "Rapports" },
  { href: "/emails", label: "E-mails", badge: "failedEmails" },
  { href: "/corbeille", label: "Corbeille", badge: "trash" },
  { href: "/reglages", label: "Réglages" },
];

export function Sidebar({
  house,
  isOwner,
  badges,
  hideOrders,
}: {
  house: House;
  isOwner: boolean;
  badges: Partial<Record<BadgeKey, number>>;
  hideOrders: boolean;
}) {
  const pathname = usePathname();
  const prefix = `/admin/${house}`;
  return (
    <aside className="flex w-full flex-col gap-4 bg-paper px-4 py-5 lg:min-h-full lg:w-64 lg:border-r lg:border-[rgba(228,190,186,0.4)]">
      <div className="flex items-center gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-burgundy font-display text-lg font-bold text-paper">
          {HOUSE_PREFIX[house]}
        </span>
        <div>
          <p className="font-label text-[10px] font-bold uppercase tracking-[1.4px] text-burgundy">
            Momo House
          </p>
          <p className="font-display text-lg font-bold">{HOUSE_LABEL[house]}</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {LINKS.filter((link) => !(link.href === "/commandes" && hideOrders)).map((link) => {
          const href = `${prefix}${link.href}`;
          const active =
            link.href === "/rapports"
              ? pathname.startsWith(`${prefix}/rapports`)
              : link.href === ""
                ? pathname === prefix
                : pathname === href || pathname.startsWith(`${href}/`);
          const count = link.badge ? badges[link.badge] ?? 0 : 0;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center justify-between rounded-xl px-3 py-2.5 font-label text-sm ${
                active ? "bg-burgundy text-paper" : "text-ink hover:bg-paper-soft"
              }`}
            >
              <span>{link.label}</span>
              {count > 0 ? (
                <span className={`rounded-full px-2 text-xs ${active ? "bg-paper text-burgundy" : "bg-burgundy text-paper"}`}>
                  {count}
                </span>
              ) : null}
            </Link>
          );
        })}
        {isOwner ? (
          <>
            <Link href="/admin/maisons" className="rounded-xl px-3 py-2.5 font-label text-sm hover:bg-paper-soft">
              Maisons
            </Link>
            <Link href="/admin/equipe" className="rounded-xl px-3 py-2.5 font-label text-sm hover:bg-paper-soft">
              Équipe
            </Link>
            <Link href="/admin/marque" className="rounded-xl px-3 py-2.5 font-label text-sm hover:bg-paper-soft">
              Site
            </Link>
          </>
        ) : null}
        <form action={signOut}>
          <button type="submit" className="w-full rounded-xl px-3 py-2.5 text-left font-label text-sm text-ink-muted">
            Sortir
          </button>
        </form>
      </nav>
    </aside>
  );
}
