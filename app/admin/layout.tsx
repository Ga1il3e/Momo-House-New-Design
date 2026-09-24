import Link from "next/link";
import { signOut } from "@/app/admin/actions";
import { getStaffClaims } from "@/lib/supabase/staff";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Administration",
};

const links = [
  { href: "/admin", label: "Retenues" },
  { href: "/admin/tables", label: "Tables" },
  { href: "/admin/settings", label: "Réglages" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const staff = await getStaffClaims();

  return (
    <div className="min-h-full bg-paper text-ink">
      <header className="border-b border-[rgba(228,190,186,0.45)] bg-bistro text-paper">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[1.6px] text-amber-soft">
              Momo House
            </p>
            <p className="font-display text-xl font-bold">Tables & retenues</p>
          </div>
          {staff ? (
            <nav className="flex flex-wrap items-center gap-2">
              {links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-full px-3 py-2 font-label text-xs font-bold uppercase tracking-wide text-paper/80 hover:bg-white/10 hover:text-paper"
                >
                  {link.label}
                </Link>
              ))}
              <form action={signOut}>
                <button
                  type="submit"
                  className="rounded-full bg-paper px-3 py-2 font-label text-xs font-bold uppercase tracking-wide text-burgundy"
                >
                  Sortir
                </button>
              </form>
            </nav>
          ) : null}
        </div>
      </header>
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6">{children}</div>
    </div>
  );
}
