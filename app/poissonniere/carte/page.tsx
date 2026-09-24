import type { Metadata } from "next";
import { CartePage } from "@/components/CartePage";
import { getMenu } from "@/lib/get-menu";

export const metadata: Metadata = {
  title: "La Carte — Poissonnière",
  description:
    "La carte des saveurs himalayennes à Momo House Poissonnière : momos, thukpa, achar et streetfood.",
};

export default async function PoissonniereCartePage() {
  const menu = await getMenu("poissonniere");
  return <CartePage houseId="poissonniere" menu={menu} />;
}
