import { redirect } from "next/navigation";
import { requireStaff } from "@/lib/auth/staff";

export default async function AdminIndexPage() {
  const staff = await requireStaff();
  if (staff.role === "owner") redirect("/admin/maisons");
  if (staff.house) redirect(`/admin/${staff.house}`);
  redirect("/admin/login?erreur=acces");
}
