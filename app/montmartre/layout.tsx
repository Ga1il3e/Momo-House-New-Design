import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Montmartre — Restaurant & Salle Boisée",
  description:
    "Momo House Montmartre : salle chaleureuse, drapeaux de prière et momos pliés minute dans le 2e arrondissement.",
};

export default function MontmartreLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
