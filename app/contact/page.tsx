import type { Metadata } from "next";
import Link from "next/link";
import { FadeIn } from "@/components/motion/FadeIn";

export const metadata: Metadata = {
  title: "Contact & Presse",
};

export default function ContactPage() {
  return (
    <FadeIn className="mx-auto max-w-3xl px-4 py-16 sm:px-12">
      <h1 className="font-display text-4xl font-bold">Contact & Presse</h1>
      <p className="mt-4 text-ink-muted leading-7">
        Pour les demandes presse, partenariats ou privatisation, écrivez-nous ou
        appelez directement nos maisons.
      </p>
      <ul className="mt-8 space-y-3 text-ink">
        <li>
          <strong>Poissonnière :</strong>{" "}
          <a className="text-burgundy underline" href="tel:+33140261184">
            01 40 26 11 84
          </a>
        </li>
        <li>
          <strong>Montmartre :</strong>{" "}
          <a className="text-burgundy underline" href="tel:+33142338910">
            01 42 33 89 10
          </a>
        </li>
        <li>
          <strong>Email :</strong> contact@momohouse.fr
        </li>
      </ul>
      <Link
        href="/"
        className="btn-burgundy mt-10 inline-flex px-6 py-3 text-sm"
      >
        RETOUR À L&apos;ACCUEIL
      </Link>
    </FadeIn>
  );
}
