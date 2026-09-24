import { notFound } from "next/navigation";
import { requireHouseAccess } from "@/lib/auth/staff";
import { isHouse } from "@/lib/house";
import { createStaffClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/admin/EmptyState";
import { EmailsClient } from "./EmailsClient";

export default async function EmailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ house: string }>;
  searchParams: Promise<{ statut?: string; q?: string }>;
}) {
  const { house: raw } = await params;
  if (!isHouse(raw)) notFound();
  const { house } = await requireHouseAccess(raw);
  const query = await searchParams;
  const supabase = await createStaffClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  let request = supabase
    .from("email_logs")
    .select("*")
    .eq("house", house)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(200);
  if (query.statut === "sent") request = request.eq("status", "sent");
  if (query.statut === "failed") request = request.eq("status", "failed");
  if (query.statut === "skipped") request = request.eq("status", "skipped");
  const { data } = await request;
  const needle = (query.q ?? "").toLowerCase();
  const logs = (data ?? []).filter((row) =>
    !needle || row.to_email.toLowerCase().includes(needle) || (row.subject ?? "").toLowerCase().includes(needle),
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Journal</p>
        <h1 className="font-display text-3xl font-extrabold">E-mails</h1>
      </header>
      <form className="flex flex-wrap gap-2">
        <select name="statut" defaultValue={query.statut ?? ""} className="rounded-xl border px-3 py-2 text-sm">
          <option value="">Tous</option>
          <option value="sent">Envoyés</option>
          <option value="failed">Non envoyés</option>
          <option value="skipped">Ignorés</option>
        </select>
        <input name="q" defaultValue={query.q ?? ""} placeholder="Destinataire ou sujet" className="rounded-xl border px-3 py-2 text-sm" />
        <button className="btn-burgundy px-4 py-2 text-xs">Filtrer</button>
      </form>
      {logs.length === 0 ? <EmptyState title="Aucun e-mail." /> : <EmailsClient house={house} logs={logs} />}
    </div>
  );
}
