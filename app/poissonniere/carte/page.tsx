import type { Metadata } from "next";
import { CarteFlipbook } from "@/components/flipbook/CarteFlipbook";

export const metadata: Metadata = {
  title: "La Carte — Poissonnière",
  description:
    "La carte de Momo House Poissonnière : momos vapeur, kothey, jhol, formule midi, boissons et desserts.",
};

export default function PoissonniereCartePage() {
  return <CarteFlipbook houseLabel="Maison Poissonnière" />;
}
