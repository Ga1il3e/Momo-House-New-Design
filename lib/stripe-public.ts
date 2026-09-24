import type { House } from "@/lib/house";

export function getPublishableKey(house: House) {
  return house === "montmartre"
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_MONTMARTRE
    : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_POISSONNIERE;
}

export function stripeConfigured(house: House) {
  return Boolean(getPublishableKey(house));
}
