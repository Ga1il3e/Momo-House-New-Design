import "server-only";
import Stripe from "stripe";
import type { House } from "@/lib/house";

function secretFor(house: House) {
  return house === "montmartre"
    ? process.env.STRIPE_SECRET_KEY_MONTMARTRE
    : process.env.STRIPE_SECRET_KEY_POISSONNIERE;
}

export function stripeConfigured(house: House) {
  return Boolean(secretFor(house) && getPublishableKey(house));
}

export function getPublishableKey(house: House) {
  return house === "montmartre"
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_MONTMARTRE
    : process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY_POISSONNIERE;
}

export function getWebhookSecret(house: House) {
  return house === "montmartre"
    ? process.env.STRIPE_WEBHOOK_SECRET_MONTMARTRE
    : process.env.STRIPE_WEBHOOK_SECRET_POISSONNIERE;
}

export function getStripe(house: House) {
  const secret = secretFor(house);
  if (!secret) return null;
  return new Stripe(secret);
}
