import { Suspense } from "react";
import { getOrderingStatus } from "@/lib/house-ops";
import { CheckoutClient } from "@/components/site/CheckoutClient";

export default async function PoissonnierePaiementPage() {
  const status = await getOrderingStatus("poissonniere");
  return (
    <Suspense fallback={<p className="p-10 text-center">Chargement…</p>}>
      <CheckoutClient house="poissonniere" status={status} />
    </Suspense>
  );
}
