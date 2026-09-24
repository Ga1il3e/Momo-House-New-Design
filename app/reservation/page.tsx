import type { Metadata } from "next";
import { Suspense } from "react";
import { ReservationExperience } from "@/components/ReservationExperience";

export const metadata: Metadata = {
  title: "Réserver une table",
  description:
    "Réservez une table numérotée chez Momo House Montmartre ou Poissonnière. Une table retenue se libère à la fin du créneau.",
};

export default function ReservationPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-[50vh] items-center justify-center text-ink-muted">
          Chargement de la réservation…
        </div>
      }
    >
      <ReservationExperience />
    </Suspense>
  );
}
