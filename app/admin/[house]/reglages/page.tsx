import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { SettingsClient } from "./SettingsClient";

const TABS = [
  { id: "reservations", label: "Réservations" },
  { id: "commandes", label: "Commandes" },
  { id: "horaires", label: "Horaires" },
  { id: "emails", label: "E-mails" },
] as const;

type Tab = (typeof TABS)[number]["id"];

export default async function ReglagesPage({
  params,
  searchParams,
}: {
  params: Promise<{ house: string }>;
  searchParams: Promise<{ onglet?: string }>;
}) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house, staff } = await requireHouseAccess(raw);
  const { onglet } = await searchParams;
  const tab: Tab = TABS.some((item) => item.id === onglet) ? (onglet as Tab) : "reservations";
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const [{ data: settings }, { data: ordering }, { data: ops }, { data: closures }] = await Promise.all([
    supabase.from("settings").select("*").eq("house", house).maybeSingle(),
    supabase.from("ordering_settings").select("*").eq("house", house).maybeSingle(),
    supabase.from("house_ops").select("*").eq("house", house).maybeSingle(),
    supabase.from("house_closures").select("*").eq("house", house).order("starts_on", { ascending: false }),
  ]);

  return (
    <div className="space-y-6">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Maison</p>
        <h1 className="font-display text-3xl font-extrabold">Réglages</h1>
      </header>
      <nav className="flex flex-wrap gap-2">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`?onglet=${item.id}`}
            className={`rounded-full px-4 py-2 font-label text-xs font-bold uppercase ${tab === item.id ? "bg-burgundy text-paper" : "bg-white"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      <SettingsClient
        house={house}
        tab={tab}
        settings={(settings ?? {}) as Record<string, unknown>}
        ordering={(ordering ?? {}) as Record<string, unknown>}
        ops={(ops ?? {}) as Record<string, unknown>}
        closures={closures ?? []}
        staffEmail={staff.email}
      />
    </div>
  );
}
