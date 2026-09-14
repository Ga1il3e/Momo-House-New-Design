import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = {
  title: "Confidentialité",
};

export default function ConfidentialitePage() {
  return (
    <FadeIn className="mx-auto max-w-3xl px-4 py-16 sm:px-12">
      <h1 className="font-display text-4xl font-bold">Confidentialité</h1>
      <div className="mt-6 space-y-4 text-ink-muted leading-7">
        <p>
          Nous respectons votre vie privée. Les informations éventuellement
          saisies dans les formulaires de démonstration restent dans votre
          navigateur et ne sont pas transmises à un serveur de réservation.
        </p>
        <p>
          Pour toute question relative aux données personnelles, contactez
          contact@momohouse.fr.
        </p>
      </div>
      <Link
        href="/"
        className="btn-burgundy mt-10 inline-flex px-6 py-3 text-sm"
      >
        RETOUR À L&apos;ACCUEIL
      </Link>
    </FadeIn>
  );
}
