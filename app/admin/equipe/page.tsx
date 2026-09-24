import { Toaster } from "sonner";
import { requireOwner } from "@/lib/auth/staff";
import { isHouse, type House } from "@/lib/house";
import { createAdminClient } from "@/lib/supabase/admin";
import { createStaffClient } from "@/lib/supabase/server";
import { EquipeClient } from "./EquipeClient";

export default async function EquipePage() {
  const staff = await requireOwner();
  const supabase = await createStaffClient();
  const admin = createAdminClient();
  if (!supabase) return <p>Supabase n’est pas configuré.</p>;
  const { data: members } = await supabase.from("staff_members").select("*").order("created_at");
  const emails = new Map<string, { email: string | null; last: string | null }>();
  if (admin) {
    const { data } = await admin.auth.admin.listUsers({ perPage: 200 });
    for (const user of data.users) {
      emails.set(user.id, { email: user.email ?? null, last: user.last_sign_in_at ?? null });
    }
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-10">
      <Toaster position="top-right" />
      <header>
        <p className="font-label text-xs font-bold uppercase tracking-[1.5px] text-burgundy">Propriétaire</p>
        <h1 className="font-display text-3xl font-extrabold">Équipe</h1>
      </header>
      <EquipeClient
        selfId={staff.userId}
        members={(members ?? []).map((member) => ({
          user_id: member.user_id,
          email: emails.get(member.user_id)?.email ?? null,
          house: member.house && isHouse(member.house) ? (member.house as House) : null,
          role: member.role,
          active: member.active,
          last_sign_in: emails.get(member.user_id)?.last ?? null,
        }))}
      />
    </div>
  );
}
