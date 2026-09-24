const ERROR_COPY: Record<string, string> = {
  table_taken: "Cette table est déjà prise sur ce créneau.",
  forbidden_house: "Accès refusé pour cette maison.",
  forbidden: "Accès refusé pour cette maison.",
  not_found: "Élément introuvable (il a peut-être été supprimé).",
  invalid_status_transition: "Ce changement de statut n’est pas possible.",
  invalid_status: "Ce changement de statut n’est pas possible.",
  invalid_table: "Table inconnue ou désactivée.",
  invalid_hold_minutes: "Durée invalide (entre 15 et 360 minutes).",
  reservations_disabled:
    "Les réservations en ligne ne sont pas disponibles pour le moment.",
  house_closed: "La maison est fermée ce jour-là.",
  invalid_slot: "Ce créneau n’est pas proposé.",
  slot_in_past: "Ce créneau est passé ou trop proche. Appelez-nous directement.",
  date_too_far: "Cette date est trop lointaine pour réserver en ligne.",
  party_size_invalid: "Nombre de couverts invalide. Pour un groupe, appelez-nous.",
  party_too_large_for_table: "Cette table est trop petite pour votre groupe.",
  guest_details_required: "Nom et téléphone obligatoires.",
  ordering_disabled: "Les commandes en ligne ne sont pas disponibles pour le moment.",
  ordering_paused: "La cuisine fait une courte pause. Réessayez dans quelques minutes.",
  takeaway_disabled: "Le retrait n’est pas disponible pour le moment.",
  delivery_disabled: "La livraison n’est pas disponible pour le moment.",
  cash_not_allowed_for_delivery:
    "Le paiement en espèces n’est pas disponible pour la livraison (carte en ligne uniquement).",
  cash_disabled: "Le paiement en espèces n’est pas disponible.",
  delivery_postcode_not_served: "Nous ne livrons pas encore ce code postal.",
  outside_service_hours:
    "Nous ne prenons pas de commande en dehors des heures de service.",
  empty_cart: "Votre panier est vide.",
  dish_not_found: "Un plat n’est plus disponible : {detail}.",
  dish_unavailable: "Un plat n’est plus disponible : {detail}.",
  invalid_quantity: "Quantité invalide.",
  delivery_minimum_not_met: "Minimum de commande pour la livraison : {min}.",
  refund_required: "Commande payée par carte : utilisez « Annuler et rembourser ».",
  payment_status_locked: "Le paiement par carte est géré par Stripe.",
  house_immutable: "Une erreur est survenue. Réessayez ou appelez la maison.",
  house_mismatch: "Une erreur est survenue. Réessayez ou appelez la maison.",
  quote_mismatch: "Une erreur est survenue. Réessayez ou appelez la maison.",
};

const FALLBACK = "Une erreur est survenue. Réessayez ou appelez la maison.";

export function rpcErrorKey(error: unknown): string | null {
  const message =
    typeof error === "string"
      ? error
      : error && typeof error === "object" && "message" in error
        ? String((error as { message?: string }).message ?? "")
        : "";
  if (!message) return null;
  const known = Object.keys(ERROR_COPY).find((key) => message.includes(key));
  return known ?? null;
}

export function frenchError(
  error: unknown,
  extras?: { detail?: string; min?: string },
): string {
  const key = rpcErrorKey(error);
  if (!key) {
    console.error("[momo-house] unmapped error", error);
    return FALLBACK;
  }
  return ERROR_COPY[key]
    .replace("{detail}", extras?.detail ?? "ce plat")
    .replace("{min}", extras?.min ?? "");
}

export function httpStatusForError(error: unknown): number {
  const key = rpcErrorKey(error);
  if (key === "table_taken") return 409;
  if (key === "forbidden" || key === "forbidden_house") return 403;
  if (key === "not_found") return 404;
  if (key) return 422;
  return 500;
}
