"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { signOut } from "@/app/admin/actions";

const LINKS = [
  { href: "/admin/maisons", label: "Maisons" },
  { href: "/admin/marque", label: "Site" },
  { href: "/admin/equipe", label: "Équipe" },
] as const;

export function OwnerShell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-full bg-paper text-ink">
      <div className="border-b border-[rgba(228,190,186,0.4)] bg-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[1.4px] text-burgundy">
              Momo House
            </p>
            <p className="font-display text-lg font-bold">Propriétaire</p>
          </div>
          <nav className="flex flex-wrap items-center gap-1">
            {LINKS.map((link) => {
              const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`rounded-xl px-3 py-2 font-label text-sm ${
                    active ? "bg-burgundy text-paper" : "text-ink hover:bg-paper-soft"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <form action={signOut}>
              <button
                type="submit"
                className="rounded-xl px-3 py-2 font-label text-sm text-ink-muted"
              >
                Sortir
              </button>
            </form>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
        <header>
          <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">
            Propriétaire
          </p>
          <h1 className="font-display text-3xl font-extrabold">{title}</h1>
        </header>
        {children}
      </div>
    </div>
  );
}
