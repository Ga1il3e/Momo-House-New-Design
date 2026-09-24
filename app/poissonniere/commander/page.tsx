import { getMenu } from "@/lib/get-menu";
import { getOrderingStatus } from "@/lib/house-ops";
import { HouseOrderClient } from "@/components/site/HouseOrderClient";

export default async function PoissonniereCommanderPage() {
  const [menu, status] = await Promise.all([getMenu("poissonniere"), getOrderingStatus("poissonniere")]);
  return <HouseOrderClient house="poissonniere" menu={menu} status={status} />;
}
