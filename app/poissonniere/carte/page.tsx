import type { Metadata } from "next";
import { CartePage } from "@/components/CartePage";

export const metadata: Metadata = {
  title: "La Carte — Poissonnière",
  description:
    "La carte des saveurs himalayennes à Momo House Poissonnière : momos, thukpa, achar et streetfood.",
};

export default function PoissonniereCartePage() {
  return <CartePage houseId="poissonniere" />;
}
