export const EMAIL_TYPES = [
  "reservation_hold_guest",
  "reservation_hold_house",
  "reservation_confirmed_guest",
  "reservation_cancelled_guest",
  "reservation_cancelled_by_guest_house",
  "order_confirmation_guest",
  "order_new_house",
  "order_accepted_guest",
  "order_ready_guest",
  "order_cancelled_guest",
  "order_cancelled_by_guest_house",
  "contact_message_house",
  "staff_test",
] as const;

export type EmailType = (typeof EMAIL_TYPES)[number];

export const EMAIL_TYPE_LABEL: Record<EmailType, string> = {
  reservation_hold_guest: "Retenue — client",
  reservation_hold_house: "Retenue — maison",
  reservation_confirmed_guest: "Confirmation — client",
  reservation_cancelled_guest: "Annulation — client",
  reservation_cancelled_by_guest_house: "Annulation client — maison",
  order_confirmation_guest: "Commande — client",
  order_new_house: "Nouvelle commande — maison",
  order_accepted_guest: "Commande acceptée",
  order_ready_guest: "Commande prête",
  order_cancelled_guest: "Commande annulée — client",
  order_cancelled_by_guest_house: "Commande annulée par le client",
  contact_message_house: "Message contact",
  staff_test: "Test e-mail",
};

export const DEFAULT_TEMPLATES: Record<
  "hold_guest" | "hold_house" | "confirm_guest" | "cancel_guest",
  { subject: string; body: string }
> = {
  hold_guest: {
    subject: "Votre table est retenue — {{house}}",
    body: "Bonjour {{name}},\n\nLa table {{table}} ({{zone}}) est retenue à {{house}} le {{date}} de {{start}} à {{end}}, pour {{guests}}.\n\nCe n'est pas une confirmation. Appelez {{housePhone}} pour confirmer.\n\nAnnuler : {{cancelUrl}}",
  },
  hold_house: {
    subject: "Nouvelle retenue — {{house}}",
    body: "Table {{table}} ({{zone}}) le {{date}} {{start}}–{{end}}.\n{{name}} · {{phone}} · {{email}}\n{{note}}",
  },
  confirm_guest: {
    subject: "Réservation confirmée — {{house}}",
    body: "Bonjour {{name}},\n\nVotre table {{table}} est confirmée le {{date}} de {{start}} à {{end}}.",
  },
  cancel_guest: {
    subject: "Réservation annulée — {{house}}",
    body: "Bonjour {{name}},\n\nLa retenue du {{date}} à {{start}} a été annulée.",
  },
};
