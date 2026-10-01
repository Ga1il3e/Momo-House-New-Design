import type { Metadata } from "next";
import { CarteFlipbook } from "@/components/flipbook/CarteFlipbook";

export const metadata: Metadata = {
  title: "La Carte",
  description:
    "La carte de Momo House : momos vapeur, kothey, jhol, formule midi, boissons et desserts. La même carte à Montmartre et à Poissonnière.",
};

export default function CartePage() {
  return <CarteFlipbook houseLabel="La Carte" />;
}
