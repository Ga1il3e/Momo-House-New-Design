import type { Metadata } from "next";
import { CarteFlipbook } from "@/components/flipbook/CarteFlipbook";

export const metadata: Metadata = {
  title: "La Carte — Montmartre",
  description:
    "La carte de Momo House Montmartre : momos vapeur, kothey, jhol, formule midi, boissons et desserts.",
};

export default function MontmartreCartePage() {
  return <CarteFlipbook houseLabel="Maison Montmartre" />;
}
