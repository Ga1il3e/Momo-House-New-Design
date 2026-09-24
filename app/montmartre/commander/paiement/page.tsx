import { Suspense } from "react";
import { getOrderingStatus } from "@/lib/house-ops";
import { CheckoutClient } from "@/components/site/CheckoutClient";

export default async function MontmartrePaiementPage() {
  const status = await getOrderingStatus("montmartre");
  return (
    <Suspense fallback={<p className="p-10 text-center">Chargement…</p>}>
      <CheckoutClient house="montmartre" status={status} />
    </Suspense>
  );
}
