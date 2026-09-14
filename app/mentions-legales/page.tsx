import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = {
  title: "Mentions Légales",
};

export default function MentionsLegalesPage() {
  return (
    <FadeIn className="mx-auto max-w-3xl px-4 py-16 sm:px-12">
      <h1 className="font-display text-4xl font-bold">Mentions Légales</h1>
      <div className="mt-6 space-y-4 text-ink-muted leading-7">
        <p>
          Éditeur du site : Momo House Paris — restaurants de streetfood
          népalaise & tibétaine.
        </p>
        <p>
          Maisons : 85 Rue Montmartre, 75002 Paris · 46 Rue Poissonnière, 75010
          Paris.
        </p>
        <p>
          Ce site est une vitrine informative. Les formulaires de réservation
          sont présentés à titre illustratif et n&apos;enregistrent aucune
          réservation réelle.
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
