export type HouseId = "montmartre" | "poissonniere";

export type House = {
  id: HouseId;
  number: string;
  name: string;
  shortName: string;
  arrondissement: string;
  address: string;
  district: string;
  metro: string;
  hours: string;
  hoursNote: string;
  phone: string;
  phoneHref: string;
  ambiance: string;
  accent: "burgundy" | "amber";
  enterHref: string;
  carteHref: string;
  facadeImage: string;
  heroImage: string;
  mapsUrl: string;
  mapsEmbedUrl: string;
  tags: [string, string];
  portalBlurb: string;
  statusLabel: string;
};

export const houses: Record<HouseId, House> = {
  montmartre: {
    id: "montmartre",
    number: "01",
    name: "Momo House Montmartre",
    shortName: "Montmartre",
    arrondissement: "Paris 2e",
    address: "85 Rue Montmartre, 75002 Paris",
    district: "Sentier / Bourse",
    metro: "Sentier (Ligne 3) · Bourse (Ligne 3)",
    hours: "11h45 – 15h00 & 18h30 – 22h30",
    hoursNote: "Ouvert 7j/7",
    phone: "01 42 33 89 10",
    phoneHref: "tel:+33142338910",
    ambiance: "Salle boisée, drapeaux de prière, cozy",
    accent: "burgundy",
    enterHref: "/montmartre",
    carteHref: "/montmartre/carte",
    facadeImage: "/assets/montmartre-facade.png",
    heroImage: "/assets/montmartre-facade.png",
    mapsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=85+Rue+Montmartre,+75002+Paris",
    mapsEmbedUrl:
      "https://maps.google.com/maps?q=85%20Rue%20Montmartre%2C%2075002%20Paris&z=15&output=embed",
    tags: ["FAITS MAIN À PARIS", "DEPUIS 2024"],
    portalBlurb:
      "Salle chaleureuse boisée sous les guirlandes et lanternes népalaises, vue sur l'artisanat des momos pliés minute et terrasse conviviale de quartier.",
    statusLabel: "Midi & soir · 11h45–15h00 & 18h30–22h30",
  },
  poissonniere: {
    id: "poissonniere",
    number: "02",
    name: "Momo House Poissonnière",
    shortName: "Poissonnière",
    arrondissement: "Paris 10e",
    address: "46 Rue Poissonnière, 75010 Paris",
    district: "Bonne Nouvelle / Grands Boulevards",
    metro: "Bonne Nouvelle (L8, L9) · Poissonnière (L7)",
    hours: "12h00 – 22h30 sans interruption",
    hoursNote: "Service Continu",
    phone: "01 40 26 11 84",
    phoneHref: "tel:+33140261184",
    ambiance: "Grande terrasse, store rouge, streetfood minute",
    accent: "amber",
    enterHref: "/poissonniere",
    carteHref: "/poissonniere/carte",
    facadeImage: "/assets/poissonniere-facade.png",
    heroImage: "/assets/poissonniere-hero.png",
    mapsUrl:
      "https://www.google.com/maps/dir/?api=1&destination=46+Rue+Poissonnière,+75010+Paris",
    mapsEmbedUrl:
      "https://maps.google.com/maps?q=46%20Rue%20Poissonni%C3%A8re%2C%2075010%20Paris&z=15&output=embed",
    tags: ["SERVICE CONTINU", "TERRASSE PLEIN AIR"],
    portalBlurb:
      "Store rouge iconique, chaises de bistrot en bois au soleil, comptoir vapeur minute et bières artisanales des contreforts himalayens.",
    statusLabel: "Service continu · 12h00–22h30",
  },
};

export const houseList = Object.values(houses);
