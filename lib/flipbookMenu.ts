export const fmt = (n: number) => `${n.toFixed(2).replace(".", ",")} €`;

const img = (slug: string) => `/menu-flipbook/${slug}.jpeg`;

export type PriceOption = {
  label: string;
  sub?: string;
  price: number;
  prefix?: string;
};

export type MenuItem = {
  name: string;
  desc: string;
  price: number;
  image: string;
};

export const INTRO = {
  eyebrow: "Bienvenue",
  title: "L'Art du MoMo",
  body: "Plié à la main, garni avec soin et relevé d'épices douces, le moMo est le trésor partagé de l'Himalaya. Chaque bouffée de vapeur raconte un bout du Népal.",
  styles: [
    { n: "01", name: "Vapeur", desc: "fondant, cuit à l'étouffée" },
    { n: "02", name: "Kothey", desc: "doré, saisi à la poêle" },
    { n: "03", name: "Jhol", desc: "noyé dans un bouillon épicé" },
    { n: "04", name: "Épicé", desc: "relevé, servi avec sauce pimentée" },
  ],
  note: "Portion de 8 pièces — prix nets, service et taxes compris.",
};

const MOMO_OPTIONS: PriceOption[] = [
  { label: "Vapeur", sub: "à l'étouffée", price: 11.5 },
  { label: "Kothey", sub: "saisi à la poêle", price: 12.5 },
  { label: "Jhol", sub: "en soupe de tomates", price: 14 },
  { label: "Épicé", sub: "sauce pimentée", price: 15 },
];

export const FORMULE = {
  eyebrow: "Le Midi",
  title: "La Formule Midi",
  desc: "Choisissez votre garniture et sa cuisson, servis avec deux accompagnements.",
  image: img("formule_midi"),
  fillLabel: "Garniture — 8 pièces",
  fills: ["Végétarien", "Poulet", "Bœuf"],
  cooks: [
    { label: "Vapeur", sub: "à l'étouffée", price: 14.5 },
    { label: "Kothey", sub: "saisi à la poêle", price: 14.5 },
    { label: "Jhol", sub: "soupe tomate-coriandre", price: 15.5 },
    { label: "Épicé", sub: "avec sauce pimentée", price: 15.5 },
  ] satisfies PriceOption[],
  sidesLabel: "Accompagnements — deux au choix",
  sides: [
    "Riz Basmati",
    "Chana — pois chiches noirs",
    "Aloo Dum — pommes de terre épicées",
    "Salade de Chou & Cacahuètes",
  ],
  extras: [
    { label: "Formule Yak", sub: "12 pièces", price: 4, prefix: "+" },
    { label: "Daal", sub: "soupe du jour", price: 4, prefix: "+" },
  ] satisfies PriceOption[],
};

export const SUPPS = {
  eyebrow: "Pour les Gourmands",
  title: "Extra & Suppléments",
  extra: {
    image: img("extra_momo"),
    name: "Plaque Supplémentaire",
    sub: "4 MoMo supplémentaires, vapeur ou sautées",
    price: 8,
  },
  label: "Suppléments Formule Midi",
  rows: [
    { label: "Daal", sub: "soupe du jour", price: 4, prefix: "+" },
    { label: "Canette 33 cl", price: 2.5, prefix: "+" },
    { label: "San Pellegrino 50 cl", price: 2.5, prefix: "+" },
    { label: "Mango Lassi", price: 4, prefix: "+" },
    { label: "Chai Masala au Lait", price: 3, prefix: "+" },
  ] satisfies PriceOption[],
};

export const BACK = {
  dev: "धन्यवाद",
  merci: "Merci",
  brand: "Momo House",
  tag: "Cuisine Népalaise",
  note: "Prix nets — service et taxes compris",
};

type CoverPageDef = { id: "cover"; kind: "cover" };
type IntroPageDef = { id: "intro"; kind: "intro" };
type FormulePageDef = { id: "formule"; kind: "formule" };
type SupplementsPageDef = { id: "supplements"; kind: "supplements" };
type BackPageDef = { id: "back"; kind: "back" };

export type DishPageDef = {
  id: string;
  kind: "dish";
  eyebrow: string;
  title: string;
  desc: string;
  image: string;
  badge?: string;
  options: PriceOption[];
};

export type GridPageDef = {
  id: string;
  kind: "grid";
  eyebrow: string;
  title: string;
  items: MenuItem[];
};

export type PairPageDef = {
  id: string;
  kind: "pair";
  eyebrow: string;
  title: string;
  items: MenuItem[];
};

export type TrioPageDef = {
  id: string;
  kind: "trio";
  eyebrow: string;
  title: string;
  featured: MenuItem;
  rows: MenuItem[];
};

export type PageDef =
  | CoverPageDef
  | IntroPageDef
  | FormulePageDef
  | SupplementsPageDef
  | BackPageDef
  | DishPageDef
  | GridPageDef
  | PairPageDef
  | TrioPageDef;

export const PRELOAD = [
  img("cover_momo"),
  img("momo_vegetarien"),
  img("momo_boeuf"),
  img("momo_poulet"),
  img("formule_midi"),
];

export const PAGES: PageDef[] = [
  { id: "cover", kind: "cover" },
  { id: "intro", kind: "intro" },
  {
    id: "momo-vegetarien",
    kind: "dish",
    eyebrow: "Les MoMo — 8 pièces",
    title: "MoMo Végétarien",
    desc: "Champignons, chou, oignon, ciboule, carottes, pomme de terre, coriandre & épices traditionnelles du Népal.",
    image: img("momo_vegetarien"),
    badge: "8 pièces",
    options: MOMO_OPTIONS,
  },
  {
    id: "momo-boeuf",
    kind: "dish",
    eyebrow: "Les MoMo — 8 pièces",
    title: "MoMo Bœuf",
    desc: "Bœuf, oignon, ciboule, coriandre & épices traditionnelles du Népal.",
    image: img("momo_boeuf"),
    badge: "8 pièces",
    options: MOMO_OPTIONS,
  },
  {
    id: "momo-poulet",
    kind: "dish",
    eyebrow: "Les MoMo — 8 pièces",
    title: "MoMo Poulet",
    desc: "Poulet, oignon, ciboule, coriandre & épices traditionnelles du Népal.",
    image: img("momo_poulet"),
    badge: "8 pièces",
    options: MOMO_OPTIONS,
  },
  { id: "formule", kind: "formule" },
  {
    id: "daal",
    kind: "dish",
    eyebrow: "Soupe du Jour",
    title: "Soupe Daal",
    desc: "Soupe de lentilles du jour, parfumée aux épices.",
    image: img("soupe_daal"),
    options: [{ label: "Bol", sub: "lentilles du jour", price: 4 }],
  },
  {
    id: "accompagnements",
    kind: "grid",
    eyebrow: "Pour Composer",
    title: "Les Accompagnements",
    items: [
      {
        name: "Salade de Chou & Cacahuètes",
        desc: "salade de chou aux cacahuètes",
        price: 4,
        image: img("salade_chou"),
      },
      { name: "Riz Basmati", desc: "riz basmati vapeur", price: 3, image: img("riz_basmati") },
      { name: "Aloo Dum", desc: "pommes de terre épicées", price: 3, image: img("aloo_dum") },
      {
        name: "Chana Masala",
        desc: "pois chiches noirs aux épices traditionnelles",
        price: 3,
        image: img("chana_masala"),
      },
    ],
  },
  {
    id: "boissons-chaudes",
    kind: "pair",
    eyebrow: "À Chaud",
    title: "Boissons Chaudes",
    items: [
      {
        name: "Tulsi Infusion",
        desc: "infusion au basilic sacré (tulsi), aussi disponible à la camomille, au gingembre ou en thé vert",
        price: 4,
        image: img("tulsi_infusion"),
      },
      {
        name: "Chai Masala au Lait",
        desc: "chai masala au lait, aux épices douces",
        price: 4,
        image: img("chai_masala"),
      },
    ],
  },
  {
    id: "boissons-fraiches",
    kind: "trio",
    eyebrow: "À Frais",
    title: "Lassi & Boissons Fraîches",
    featured: {
      name: "Mango Lassi",
      desc: "lassi traditionnel à la mangue",
      price: 5,
      image: img("mango_lassi"),
    },
    rows: [
      {
        name: "Canettes 33 cl",
        desc: "Coca-Cola / Coca-Cola Zero, Oasis, Ice Tea, Sprite, Orangina, Fuze Tea, Fanta",
        price: 3.5,
        image: img("sodas_canettes"),
      },
      { name: "Eau 50 cl", desc: "Cristaline ou San Pellegrino", price: 3.5, image: img("eau_bouteille") },
    ],
  },
  {
    id: "bieres",
    kind: "pair",
    eyebrow: "Népal en Verre",
    title: "Les Bières",
    items: [
      { name: "GORKHA — 33 cl", desc: "bière népalaise GORKHA", price: 5, image: img("biere_gorkha") },
      {
        name: "Bière Artisanale — 33 cl",
        desc: "bière artisanale népalaise",
        price: 6.5,
        image: img("biere_artisanale"),
      },
    ],
  },
  {
    id: "desserts",
    kind: "pair",
    eyebrow: "Pour Finir",
    title: "Les Desserts",
    items: [
      {
        name: "Kulfi à la Pistache",
        desc: "glace maison infusée au cardamome et à la pistache",
        price: 6,
        image: img("kulfi_pistache"),
      },
      {
        name: "Perles de Tapioca",
        desc: "perles de tapioca, lait de coco, sésame noir, noix et fruit du jour",
        price: 6,
        image: img("perles_tapioca"),
      },
    ],
  },
  { id: "supplements", kind: "supplements" },
  { id: "back", kind: "back" },
];
