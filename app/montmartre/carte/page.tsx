import type { Metadata } from "next";
import { CartePage } from "@/components/CartePage";

export const metadata: Metadata = {
  title: "La Carte — Montmartre",
  description:
    "La carte des saveurs himalayennes à Momo House Montmartre : momos, thukpa, achar et streetfood.",
};

export default function MontmartreCartePage() {
  return <CartePage houseId="montmartre" />;
}
