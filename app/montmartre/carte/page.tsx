import type { Metadata } from "next";
import { CartePage } from "@/components/CartePage";
import { getMenu } from "@/lib/get-menu";

export const metadata: Metadata = {
  title: "La Carte — Montmartre",
  description:
    "La carte des saveurs himalayennes à Momo House Montmartre : momos, thukpa, achar et streetfood.",
};

export default async function MontmartreCartePage() {
  const menu = await getMenu("montmartre");
  return <CartePage houseId="montmartre" menu={menu} />;
}
