import { getMenu } from "@/lib/get-menu";
import { getOrderingStatus } from "@/lib/house-ops";
import { HouseOrderClient } from "@/components/site/HouseOrderClient";

export default async function MontmartreCommanderPage() {
  const [menu, status] = await Promise.all([getMenu("montmartre"), getOrderingStatus("montmartre")]);
  return <HouseOrderClient house="montmartre" menu={menu} status={status} />;
}
