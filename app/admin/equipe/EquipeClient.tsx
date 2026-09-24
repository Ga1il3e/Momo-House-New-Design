"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { inviteStaff, sendStaffReset, setStaffActive } from "@/app/admin/[house]/actions";
import { HOUSE_LABEL, HOUSES, type House } from "@/lib/house";

type Member = {
  user_id: string;
  email: string | null;
  house: House | null;
  role: "staff" | "owner";
  active: boolean;
  last_sign_in: string | null;
};

export function EquipeClient({ members, selfId }: { members: Member[]; selfId: string }) {
  const [pending, start] = useTransition();

  return (
    <div className="space-y-6">
      <form
        className="grid gap-2 rounded-3xl bg-white p-4 sm:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault();
          const data = new FormData(event.currentTarget);
          start(async () => {
            const result = await inviteStaff({
              email: String(data.get("email")),
              house: String(data.get("house")) as House,
              displayName: String(data.get("displayName")),
            });
            if (result.error) toast.error(result.error);
            else toast.success("Invitation envoyée");
          });
        }}
      >
        <input name="email" type="email" required placeholder="E-mail" className="rounded-xl border px-3 py-2 text-sm" />
        <input name="displayName" required placeholder="Nom" className="rounded-xl border px-3 py-2 text-sm" />
        <select name="house" className="rounded-xl border px-3 py-2 text-sm">
          {HOUSES.map((house) => (
            <option key={house} value={house}>{HOUSE_LABEL[house]}</option>
          ))}
        </select>
        <button disabled={pending} className="btn-burgundy px-3 py-2 text-xs">Ajouter un membre</button>
      </form>
      <div className="overflow-x-auto rounded-3xl bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-paper-soft font-label text-[11px] uppercase text-ink-muted">
            <tr>
              {["E-mail", "Maison", "Rôle", "Actif", "Dernière connexion", ""].map((header) => (
                <th key={header} className="px-4 py-3">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {members.map((member) => (
              <tr key={member.user_id} className="border-t border-[rgba(228,190,186,0.35)]">
                <td className="px-4 py-2">{member.email ?? "—"}</td>
                <td className="px-4 py-2">{member.house ? HOUSE_LABEL[member.house] : "—"}</td>
                <td className="px-4 py-2">{member.role}</td>
                <td className="px-4 py-2">{member.active ? "Oui" : "Non"}</td>
                <td className="px-4 py-2">{member.last_sign_in ? new Date(member.last_sign_in).toLocaleString("fr-FR") : "—"}</td>
                <td className="px-4 py-2">
                  {member.user_id !== selfId ? (
                    <button
                      type="button"
                      className="mr-2 text-xs uppercase text-burgundy"
                      onClick={() => start(async () => { await setStaffActive(member.user_id, !member.active); })}
                    >
                      {member.active ? "Désactiver" : "Réactiver"}
                    </button>
                  ) : null}
                  {member.email ? (
                    <button type="button" className="text-xs uppercase" onClick={() => start(async () => { await sendStaffReset(member.email!); })}>
                      Lien de réinitialisation
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
