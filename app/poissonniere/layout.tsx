import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Poissonnière — Restaurant & Terrasse",
  description:
    "Momo House Poissonnière : grande terrasse, service continu et streetfood népalaise & tibétaine dans le 10e.",
};

export default function PoissonniereLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
