import Link from "next/link";
import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/admin/EmptyState";
import { MessagesClient } from "./MessagesClient";

const TABS = [
  { id: "new", label: "Nouveaux" },
  { id: "read", label: "Lus" },
  { id: "archived", label: "Archivés" },
] as const;

export default async function MessagesPage({
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
  const tab = TABS.some((item) => item.id === onglet) ? onglet! : "new";
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("house", house)
    .eq("status", tab)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Inbox</p>
        <h1 className="font-display text-3xl font-extrabold">Messages</h1>
      </header>
      <nav className="flex gap-2">
        {TABS.map((item) => (
          <Link
            key={item.id}
            href={`?onglet=${item.id}`}
            className={`rounded-full px-4 py-2 font-label text-xs font-bold uppercase ${tab === item.id ? "bg-burgundy text-paper" : "bg-white text-ink"}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {(data ?? []).length === 0 ? (
        <EmptyState title="Aucun message." />
      ) : (
        <MessagesClient house={house} userId={staff.userId} messages={data ?? []} />
      )}
    </div>
  );
}
