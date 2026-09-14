import type { HouseId } from "./houses";

export type DishCard = {
  id: string;
  name: string;
  price: string;
  description: string;
  tag: string;
  tagTone: "burgundy" | "amber" | "veg" | "neutral" | "blush";
  footerLeft: string;
  footerRight: string;
  image: string;
  category?: string;
};

export type CarteSignature = {
  id: string;
  name: string;
  price: string;
  badge?: string;
  description: string;
  image: string;
};

export type CarteCooking = {
  id: string;
  name: string;
  price: string;
  description: string;
};

export type CarteSauce = {
  id: string;
  name: string;
  price: string;
  description: string;
};

export type CarteHot = {
  id: string;
  name: string;
  price: string;
  badge?: string;
  note?: string;
  description?: string;
  image: string;
};

export type CarteDrink = {
  id: string;
  name: string;
  price: string;
  description: string;
};

export type CarteData = {
  houseId: HouseId;
  heroNote: string;
  signatures: CarteSignature[];
  cooking: CarteCooking[];
  sauces: CarteSauce[];
  hot: CarteHot[];
  drinks: CarteDrink[];
};

export const homepageDishes: DishCard[] = [
  {
    id: "boeuf",
    name: "Momo Bœuf Épicé",
    price: "11,50 €",
    description:
      "Bœuf d'origine française mariné au gingembre, oignons rouges, coriandre fraîche et 7 épices traditionnelles de l'Himalaya.",
    tag: "CLASSIQUE NÉPALAIS",
    tagTone: "burgundy",
    footerLeft: "Au choix : Vapeur ou Poêlé",
    footerRight: "8 pièces",
    image: "/assets/dish-boeuf.png",
  },
  {
    id: "poulet",
    name: "Momo Poulet Fermier",
    price: "11,00 €",
    description:
      "Effiloché de poulet tendre, cardamome verte, poireaux émincés et bouillon concentré qui jaillit à la première bouchée.",
    tag: "COUP DE CŒUR",
    tagTone: "amber",
    footerLeft: "Recommandé : Poêlé Kothey",
    footerRight: "8 pièces",
    image: "/assets/dish-poulet.png",
  },
  {
    id: "paneer",
    name: "Momo Paneer & Épinards",
    price: "10,50 €",
    description:
      "Fromage artisanal paneer, pousses d'épinards sautées à l'ail, champignons shiitaké et touche de noix de muscade.",
    tag: "VÉGÉTARIEN",
    tagTone: "veg",
    footerLeft: "100% Végétarien",
    footerRight: "8 pièces",
    image: "/assets/dish-paneer.png",
  },
  {
    id: "thukpa",
    name: "Thukpa Fumant Maison",
    price: "13,50 €",
    description:
      "La soupe tibétaine emblématique : nouilles de blé fraîches, bouillon mijoté 8h, légumes croquants et garniture au choix.",
    tag: "RÉCONFORT",
    tagTone: "neutral",
    footerLeft: "Option bœuf, poulet ou tofu",
    footerRight: "Grand bol",
    image: "/assets/dish-thukpa.png",
  },
  {
    id: "shabaley",
    name: "Shabaley Doré",
    price: "9,00 €",
    description:
      "Chaussons frits dorés farcis de viande épicée ou de légumes des montagnes, croustillants à l'extérieur, fondants à l'intérieur.",
    tag: "STREET FOOD",
    tagTone: "amber",
    footerLeft: "2 grands chaussons",
    footerRight: "À partager",
    image: "/assets/dish-shabaley.png",
  },
  {
    id: "drinks",
    name: "Bière Everest & Chaï Épicé",
    price: "4,50 – 7,00 €",
    description:
      "Thé noir infusé à la cardamome et lait chaud, ou bières importées des contreforts de l'Everest (Mustang, Gorkha).",
    tag: "BOISSONS RARES",
    tagTone: "blush",
    footerLeft: "Boissons artisanales",
    footerRight: "Fait maison",
    image: "/assets/dish-drinks.png",
  },
];

export const montmartreSpecialties: DishCard[] = [
  {
    id: "mont-boeuf",
    name: "Momo Bœuf Épicé Maison",
    price: "11,50 €",
    description:
      "Bœuf français mariné au gingembre, oignons rouges, coriandre et 7 épices himalayennes. Signature de la salle boisée Montmartre.",
    tag: "SIGNATURE MAISON",
    tagTone: "burgundy",
    footerLeft: "PORTION : 8 OU 10 PIÈCES",
    footerRight: "VAPEUR OU KOTHEY",
    image: "/assets/dish-boeuf.png",
    category: "momo",
  },
  {
    id: "mont-poulet",
    name: "Momo Poulet Fermier & Cardamome",
    price: "11,00 €",
    description:
      "Effiloché de poulet tendre, cardamome verte, poireaux et bouillon concentré. Plie minute sous les lanternes népalaises.",
    tag: "COUP DE CŒUR",
    tagTone: "amber",
    footerLeft: "PORTION : 8 PIÈCES",
    footerRight: "VAPEUR BAMBOU",
    image: "/assets/dish-poulet.png",
    category: "momo",
  },
  {
    id: "mont-paneer",
    name: "Momo Paneer & Épinards Frais",
    price: "10,50 €",
    description:
      "Paneer artisanal, pousses d'épinards, shiitaké et noix de muscade. Le classique végétarien de la maison.",
    tag: "100% VÉGÉTARIEN",
    tagTone: "veg",
    footerLeft: "PORTION : 8 PIÈCES",
    footerRight: "VAPEUR OU POÊLÉ",
    image: "/assets/dish-paneer.png",
    category: "momo",
  },
  {
    id: "mont-thukpa",
    name: "Thukpa Fumé Maison",
    price: "13,50 €",
    description:
      "Nouilles fraîches, bouillon mijoté 8h, légumes croquants et garniture au choix — le bol réconfort du Sentier.",
    tag: "INCONTOURNABLE",
    tagTone: "neutral",
    footerLeft: "OPTION BŒUF / POULET / TOFU",
    footerRight: "GRAND BOL",
    image: "/assets/dish-thukpa.png",
    category: "accompagnements",
  },
  {
    id: "mont-shabaley",
    name: "Shabaley Doré",
    price: "9,00 €",
    description:
      "Deux chaussons frits dorés, croustillants, farcis de viande épicée ou de légumes des montagnes.",
    tag: "STREET FOOD",
    tagTone: "amber",
    footerLeft: "2 CHAUSSONS",
    footerRight: "À PARTAGER",
    image: "/assets/dish-shabaley.png",
    category: "accompagnements",
  },
  {
    id: "mont-drinks",
    name: "Chaï Épicé & Bières Everest",
    price: "4,50 – 7,00 €",
    description:
      "Thé noir à la cardamome et lait chaud, ou bières blondes artisanales des contreforts himalayens.",
    tag: "BOISSONS",
    tagTone: "blush",
    footerLeft: "FAIT MAISON",
    footerRight: "33CL / 65CL",
    image: "/assets/dish-drinks.png",
    category: "boissons",
  },
];

export const poissonniereSpecialties: DishCard[] = [
  {
    id: "pois-boeuf",
    name: "Momo Bœuf & Épices Sauvages",
    price: "11,50 €",
    description:
      "Bœuf mariné au gingembre, oignons rouges, coriandre et mélange 7 épices himalayennes. Face dorée croustillante et cœur ultra juteux.",
    tag: "SPÉCIALITÉ KOTHEY",
    tagTone: "burgundy",
    footerLeft: "PORTION : 8 OU 10 PIÈCES",
    footerRight: "KOTHEY POÊLÉ",
    image: "/assets/pois-dish-1.png",
    category: "momo",
  },
  {
    id: "pois-poulet",
    name: "Momo Poulet & Cardamome",
    price: "11,00 €",
    description:
      "Effiloché de poulet tendre mariné, poireaux émincés et cardamome verte. Cuit à la vapeur douce dans les paniers de bambou.",
    tag: "COUP DE CŒUR",
    tagTone: "amber",
    footerLeft: "PORTION : 8 PIÈCES",
    footerRight: "VAPEUR BAMBOU",
    image: "/assets/pois-dish-2.png",
    category: "momo",
  },
  {
    id: "pois-paneer",
    name: "Paneer, Épinards & Shiitaké",
    price: "10,50 €",
    description:
      "Fromage artisanal paneer fondant, pousses d'épinards, shiitaké et touche de noix de muscade. Fondant et très aromatique.",
    tag: "100% VÉGÉTARIEN",
    tagTone: "veg",
    footerLeft: "PORTION : 8 PIÈCES",
    footerRight: "VAPEUR OU POÊLÉ",
    image: "/assets/pois-dish-3.png",
    category: "momo",
  },
  {
    id: "pois-thukpa",
    name: "Thukpa Fumant Traditionnel",
    price: "12,50 €",
    description:
      "Grand bol de nouilles fraîches dans un bouillon mijoté, légumes croquants et garniture au choix.",
    tag: "GRAND BOL CHAUD",
    tagTone: "neutral",
    footerLeft: "OPTION BŒUF / POULET / TOFU",
    footerRight: "RÉCONFORT",
    image: "/assets/pois-dish-4.png",
    category: "accompagnements",
  },
  {
    id: "pois-shabaley",
    name: "Shabaley Doré (Pain Frit)",
    price: "9,00 €",
    description:
      "Deux chaussons frits dorés, croustillants, farcis de viande épicée ou de légumes des montagnes.",
    tag: "STREET FOOD",
    tagTone: "amber",
    footerLeft: "2 CHAUSSONS",
    footerRight: "À EMPORTER",
    image: "/assets/pois-dish-5.png",
    category: "accompagnements",
  },
  {
    id: "pois-drinks",
    name: "Bières Everest & Chaï Maison",
    price: "4,50 – 7,50 €",
    description:
      "Chaï épicé maison au lait, ou bières blondes artisanales népalaises d'altitude.",
    tag: "BOISSONS",
    tagTone: "blush",
    footerLeft: "FAIT MAISON",
    footerRight: "33CL / 65CL",
    image: "/assets/pois-dish-6.png",
    category: "boissons",
  },
];

const sharedCooking: CarteCooking[] = [
  {
    id: "vapeur",
    name: "Vapeur Bambou",
    price: "Inclus",
    description: "Moelleux, perlé de buée, bouillon délicat et fondant absolu.",
  },
  {
    id: "kothey",
    name: "Kothey Croustillant",
    price: "Inclus",
    description: "Saisi sur fonte dorée d'un côté, vapeur tendre de l'autre.",
  },
  {
    id: "jhol",
    name: "Jhol Momo",
    price: "+1,50 €",
    description:
      "Plongé dans un grand bol de bouillon chaud aux tomates rôties et sésame.",
  },
];

const sharedSauces: CarteSauce[] = [
  {
    id: "achar-classique",
    name: "Achar Classique Tomate & Sésame",
    price: "Inclus",
    description: "Tomates braisées, sésame blanc torréfié, doux et crémeux.",
  },
  {
    id: "achar-piment",
    name: "Achar Piment Fort & Ail Confit",
    price: "0,80 €",
    description: "Piments oiseaux rouges, ail confit à l'huile de moutarde.",
  },
  {
    id: "achar-menthe",
    name: "Achar Menthe & Coriandre Fraîche",
    price: "0,80 €",
    description: "Fraîcheur vive, citron vert pressé et cumin vert.",
  },
  {
    id: "huile",
    name: "Huile Pimentée Fumée Maison",
    price: "1,00 €",
    description: "Infusée 48h aux 12 épices et poivre de Timur crépitant.",
  },
];

const sharedDrinks: CarteDrink[] = [
  {
    id: "chai",
    name: "Thé Chaï Épicé Maison",
    price: "4,50 €",
    description:
      "Infusé au lait entier, cannelle, cardamome et clous de girofle.",
  },
  {
    id: "biere",
    name: "Bières Everest & Mustang",
    price: "7,00 €",
    description:
      "Bières blondes artisanales népalaises d'altitude (33cl / 65cl).",
  },
  {
    id: "lassi",
    name: "Lassi Mangue & Cardamome",
    price: "5,00 €",
    description: "Yaourt onctueux battu minute, pulpe de mangue Alphonso.",
  },
  {
    id: "sucre",
    name: "Momo Sucré Choco-Banane",
    price: "6,50 €",
    description:
      "4 pièces frites, chocolat fondant, banane caramélisée et éclats de noisettes.",
  },
];

export const cartes: Record<HouseId, CarteData> = {
  poissonniere: {
    houseId: "poissonniere",
    heroNote: "MAISON FONDÉE SUR LE BOUILLON & LA VAPEUR",
    signatures: [
      {
        id: "sig-boeuf",
        name: "Momo Bœuf Épicé",
        price: "11,50 €",
        badge: "SIGNATURE",
        description:
          "Bœuf français mariné au gingembre, oignons rouges, coriandre et 7 épices himalayennes.",
        image: "/assets/pois-dish-1.png",
      },
      {
        id: "sig-poulet",
        name: "Momo Poulet Fermier & Cardamome",
        price: "11,00 €",
        badge: "DOUX",
        description:
          "Effiloché de poulet tendre, cardamome verte, poireaux et bouillon concentré.",
        image: "/assets/pois-dish-2.png",
      },
      {
        id: "sig-paneer",
        name: "Momo Paneer & Épinards Frais",
        price: "10,50 €",
        badge: "VÉGÉTARIEN",
        description:
          "Paneer artisanal, pousses d'épinards, shiitaké et noix de muscade.",
        image: "/assets/pois-dish-3.png",
      },
      {
        id: "sig-porc",
        name: "Momo Porc Confit au Gingembre",
        price: "11,50 €",
        description:
          "Porc confit lentement, gingembre frais et oignons caramélisés.",
        image: "/assets/momo-3d.png",
      },
      {
        id: "sig-vegan",
        name: "Momo Vegan Légumes des Montagnes",
        price: "10,00 €",
        badge: "100% VÉGÉTAL",
        description:
          "Légumes de saison, chou, carotte et épices douces — sans produit animal.",
        image: "/assets/kothey-3d.png",
      },
      {
        id: "sig-mixte",
        name: "Le Panier Dégustation Mixte",
        price: "14,50 €",
        description:
          "10 pièces mixtes confectionnées à la commande dans nos paniers de saule et bambou.",
        image: "/assets/enseigne.png",
      },
    ],
    cooking: sharedCooking,
    sauces: sharedSauces,
    hot: [
      {
        id: "hot-thukpa",
        name: "Thukpa Fumé Maison",
        price: "13,50 €",
        badge: "INCONTOURNABLE",
        note: "Option : Bœuf effiloché, Poulet fermier ou Tofu grillé",
        image: "/assets/pois-dish-4.png",
      },
      {
        id: "hot-shabaley",
        name: "Shabaley Doré",
        price: "8,00 €",
        note: "2 grands chaussons croustillants",
        image: "/assets/pois-dish-5.png",
      },
      {
        id: "hot-tingmo",
        name: "Tingmo Maison",
        price: "3,50 €",
        note: "Pain vapeur en fleur",
        image: "/assets/kothey-3d.png",
      },
    ],
    drinks: sharedDrinks,
  },
  montmartre: {
    houseId: "montmartre",
    heroNote: "MAISON FONDÉE SUR LE BOUILLON & LA VAPEUR",
    signatures: [
      {
        id: "m-sig-boeuf",
        name: "Momo Bœuf Épicé",
        price: "11,50 €",
        badge: "SIGNATURE",
        description:
          "Bœuf français mariné au gingembre, oignons rouges, coriandre et 7 épices himalayennes.",
        image: "/assets/dish-boeuf.png",
      },
      {
        id: "m-sig-poulet",
        name: "Momo Poulet Fermier & Cardamome",
        price: "11,00 €",
        badge: "DOUX",
        description:
          "Effiloché de poulet tendre, cardamome verte, poireaux et bouillon concentré.",
        image: "/assets/dish-poulet.png",
      },
      {
        id: "m-sig-paneer",
        name: "Momo Paneer & Épinards Frais",
        price: "10,50 €",
        badge: "VÉGÉTARIEN",
        description:
          "Paneer artisanal, pousses d'épinards, shiitaké et noix de muscade.",
        image: "/assets/dish-paneer.png",
      },
      {
        id: "m-sig-porc",
        name: "Momo Porc Confit au Gingembre",
        price: "11,50 €",
        description:
          "Porc confit lentement, gingembre frais et oignons caramélisés.",
        image: "/assets/momo-3d.png",
      },
      {
        id: "m-sig-agneau",
        name: "Momo Agneau aux Épices Sauvages",
        price: "12,00 €",
        badge: "SAISON",
        description:
          "Agneau tendre, poivre de Timur, coriandre fraîche et oignons confits.",
        image: "/assets/kothey-3d.png",
      },
      {
        id: "m-sig-vegan",
        name: "Momo Vegan Légumes des Montagnes",
        price: "10,00 €",
        badge: "100% VÉGÉTAL",
        description:
          "Légumes de saison, chou, carotte et épices douces — sans produit animal.",
        image: "/assets/pois-dish-3.png",
      },
      {
        id: "m-sig-mixte",
        name: "Le Panier Dégustation Mixte",
        price: "14,50 €",
        description:
          "10 pièces mixtes confectionnées à la commande dans nos paniers de saule et bambou.",
        image: "/assets/carte-hero.png",
      },
    ],
    cooking: sharedCooking,
    sauces: sharedSauces,
    hot: [
      {
        id: "m-hot-thukpa",
        name: "Thukpa Fumé Maison",
        price: "13,50 €",
        badge: "INCONTOURNABLE",
        note: "Option : Bœuf effiloché, Poulet fermier ou Tofu grillé",
        image: "/assets/dish-thukpa.png",
      },
      {
        id: "m-hot-shabaley",
        name: "Shabaley Doré",
        price: "8,00 €",
        note: "2 grands chaussons croustillants",
        image: "/assets/dish-shabaley.png",
      },
      {
        id: "m-hot-tingmo",
        name: "Tingmo Maison",
        price: "3,50 €",
        note: "Pain vapeur en fleur",
        image: "/assets/kothey-3d.png",
      },
      {
        id: "m-hot-chowmein",
        name: "Chow Mein Maison",
        price: "12,00 €",
        note: "Nouilles sautées style népalais",
        image: "/assets/pois-dish-4.png",
      },
    ],
    drinks: sharedDrinks,
  },
};

export function tagClass(tone: DishCard["tagTone"]): string {
  switch (tone) {
    case "burgundy":
      return "bg-burgundy text-white";
    case "amber":
      return "bg-amber text-[#6a3500]";
    case "veg":
      return "bg-[#b8eaff] text-[#001f29]";
    case "blush":
      return "bg-[#e4beba] text-ink";
    case "neutral":
      return "bg-paper-muted text-ink";
    default: {
      const _exhaustive: never = tone;
      return _exhaustive;
    }
  }
}
