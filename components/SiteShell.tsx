"use client";

import { usePathname } from "next/navigation";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { PageTransition } from "@/components/motion/PageTransition";
import { TopBanner } from "@/components/TopBanner";
import { EventBannersPopup } from "@/components/site/EventBannersPopup";
import type { HouseId } from "@/lib/houses";

function resolveChrome(pathname: string): {
  variant: "home" | "house";
  activeHouse?: HouseId;
  bannerLeft?: string;
  bannerRight?: string;
} {
  if (pathname === "/") {
    return { variant: "home" };
  }

  if (pathname.startsWith("/montmartre")) {
    return {
      variant: "house",
      activeHouse: "montmartre",
      bannerLeft:
        pathname === "/montmartre"
          ? "MAISON MONTMARTRE : OUVERT 7J/7 · 11H45–15H00 & 18H30–22H30 • SALLE BOISÉE"
          : undefined,
      bannerRight:
        pathname === "/montmartre" ? "85 RUE MONTMARTRE PARIS 2" : undefined,
    };
  }

  if (pathname.startsWith("/poissonniere")) {
    return {
      variant: "house",
      activeHouse: "poissonniere",
      bannerLeft:
        pathname === "/poissonniere"
          ? "MAISON POISSONNIÈRE : SERVICE CONTINU 7J/7 DE 12H00 À 22H30 • GRANDE TERRASSE ENSOLEILLÉE"
          : undefined,
      bannerRight:
        pathname === "/poissonniere" ? "46 RUE POISSONNIÈRE PARIS 10" : undefined,
    };
  }

  // Reservation, contact, legal — shared chrome without a forced house context
  return { variant: "home" };
}

export function SiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname.startsWith("/admin")) {
    return <main className="flex flex-1 flex-col">{children}</main>;
  }

  const { variant, activeHouse, bannerLeft, bannerRight } =
    resolveChrome(pathname);

  return (
    <>
      <TopBanner
        variant={variant === "home" ? "home" : "house"}
        left={bannerLeft}
        right={bannerRight}
      />
      <Header variant={variant} activeHouse={activeHouse} />
      <main className="flex flex-1 flex-col">
        <PageTransition>{children}</PageTransition>
      </main>
      <Footer />
      <EventBannersPopup />
    </>
  );
}
