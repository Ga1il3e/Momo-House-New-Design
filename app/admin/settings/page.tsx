import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";

export default async function LegacySettingsPage() {
  const staff = await requireStaff();
  redirect(staff.house ? `/admin/${staff.house}/reglages` : "/admin/maisons");
}
