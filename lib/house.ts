export const HOUSES = ["montmartre", "poissonniere"] as const;
export type House = (typeof HOUSES)[number];

export const isHouse = (v: unknown): v is House =>
  typeof v === "string" && (HOUSES as readonly string[]).includes(v);

export const HOUSE_LABEL: Record<House, string> = {
  montmartre: "Montmartre",
  poissonniere: "Poissonnière",
};

export const HOUSE_PREFIX: Record<House, "M" | "P"> = {
  montmartre: "M",
  poissonniere: "P",
};

export const HOUSE_ORDER: House[] = ["montmartre", "poissonniere"];
