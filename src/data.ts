/**
 * Portal Pantry — hand-written demo data. Every kitchen, dish, and
 * dimension is fictional; any resemblance to your dimension is a
 * scheduling coincidence.
 */

/** Fictional interdimensional currency: "zeeps". */
export const CURRENCY = "ƶ";

/** Flat wormhole toll added to every order. */
export const PORTAL_TOLL = 12;

export const dimensions = [
  "All dimensions",
  "C-131",
  "Ω-77",
  "B-612",
  "Pickle-9",
  "Fantasy-42",
];

export const categories = [
  "All",
  "Human food",
  "Alien delicacies",
  "Lab snacks",
  "Sweets",
  "Questionable",
];

export interface MenuItem {
  id: string;
  name: string;
  desc: string;
  price: number;
  emoji: string;
  /** Set by store owners — delisted items are hidden from customers. */
  delisted?: boolean;
  /** Kitchen prep time in minutes — owner-adjustable, shown to customers. */
  prepMinutes?: number;
  /** Image key resolved via images.ts; falls back to the emoji when unset. */
  image?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  emoji: string;
  tagline: string;
  category: string;
  dimension: string;
  rating: number;
  time: string;
  /** Delivery fee in zeeps — 0 renders as "Free portal". */
  fee: number;
  /** Hue for the generated cover art. */
  hue: number;
  promoted?: boolean;
  /** Image key resolved via images.ts; falls back to the emoji when unset. */
  image?: string;
  items: MenuItem[];
}

export const restaurants: Restaurant[] = [
  {
    id: "gargantua",
    name: "Greasy Gargantua",
    emoji: "🍔",
    tagline: "Burgers bigger than your timeline.",
    category: "Human food",
    dimension: "C-131",
    rating: 4.7,
    time: "15–25 min",
    fee: 0,
    hue: 28,
    promoted: true,
    image: "restaurant_greasy_gargantua",
    items: [
      {
        id: "gg1",
        name: "Event Horizon Burger",
        desc: "Triple patty so dense not even the sauce escapes. Napkin singularity included.",
        price: 45,
        emoji: "🍔",
      },
      {
        id: "gg2",
        name: "Singularity Fries",
        desc: "Infinitely crispy. Finite portion (legally required disclosure).",
        price: 18,
        emoji: "🍟",
      },
      {
        id: "gg3",
        name: "Dark Matter Shake",
        desc: "We don't know what's in it. Neither does science. 5 stars.",
        price: 22,
        emoji: "🥤",
      },
      {
        id: "gg4",
        name: "Baby Universe Nuggets",
        desc: "Each nugget contains a tiny universe. Dip responsibly.",
        price: 26,
        emoji: "🍗",
      },
    ],
  },
  {
    id: "quantum-q",
    name: "Quantum Quesadillas",
    emoji: "🌮",
    tagline: "Simultaneously cheesy and not. You decide by observing.",
    category: "Human food",
    dimension: "Ω-77",
    rating: 4.5,
    time: "10–20 min",
    fee: 8,
    hue: 45,
    image: "restaurant_quantum_quesadillas",
    items: [
      {
        id: "qq1",
        name: "Schrödinger Quesadilla",
        desc: "Both folded and unfolded until you open the box.",
        price: 32,
        emoji: "🫓",
      },
      {
        id: "qq2",
        name: "Entangled Tacos (pair)",
        desc: "Bite one and the other one flinches. Sold in pairs, obviously.",
        price: 38,
        emoji: "🌮",
      },
      {
        id: "qq3",
        name: "Probability Salsa",
        desc: "70% mild, 30% regret.",
        price: 9,
        emoji: "🌶️",
      },
      {
        id: "qq4",
        name: "Waveform Guac",
        desc: "Collapses if you look at it too long. Eat fast.",
        price: 14,
        emoji: "🥑",
      },
    ],
  },
  {
    id: "neutrino",
    name: "Neutrino Noodles",
    emoji: "🍜",
    tagline: "Ramen so light it phases through you. Zero calories, zero mercy.",
    category: "Alien delicacies",
    dimension: "Ω-77",
    rating: 4.8,
    time: "8–14 min",
    fee: 5,
    hue: 190,
    promoted: true,
    image: "restaurant_neutrino_noodles",
    items: [
      {
        id: "nn1",
        name: "Phase-Through Pho",
        desc: "Passes through matter, lingers in memory.",
        price: 29,
        emoji: "🍜",
        image: "phase_through_pho",
      },
      {
        id: "nn2",
        name: "Zero-G Gyoza",
        desc: "five dumplings orbiting a mutual dipping sauce.",
        price: 21,
        emoji: "🥟",
        image: "zero_g_gyoza",
      },
      {
        id: "nn3",
        name: "Antimatter Broth Refill",
        desc: "Cancels out the first bowl. Somehow still filling.",
        price: 3,
        emoji: "🫕",
        image: "antimatter_broth_refill",
      },
      {
        id: "nn4",
        name: "Neutron Star Egg",
        desc: "Very small. VERY heavy. One per customer, per lifetime.",
        price: 12,
        emoji: "🥚",
        image: "neutron_star_egg",
      },
    ],
  },
  {
    id: "brined-one",
    name: "The Brined One",
    emoji: "🥒",
    tagline: "The owner turned himself into a pickle bar. Please stop asking why.",
    category: "Questionable",
    dimension: "Pickle-9",
    rating: 4.2,
    time: "20–35 min",
    fee: 6,
    hue: 80,
    items: [
      {
        id: "bo1",
        name: "Pickle Platter Supreme",
        desc: "Pickled pickles in pickle reduction. Pickle on the side.",
        price: 24,
        emoji: "🥒",
      },
      {
        id: "bo2",
        name: "Brine Smoothie",
        desc: "Electrolytes from a dimension where that word means something else.",
        price: 11,
        emoji: "🧃",
      },
      {
        id: "bo3",
        name: "Fermented Mystery Jar",
        desc: "It was labeled once. The label left.",
        price: 17,
        emoji: "🫙",
      },
      {
        id: "bo4",
        name: "Dill-emma Dog",
        desc: "A hot dog that's 60% pickle. The other 40% is also pickle.",
        price: 19,
        emoji: "🌭",
      },
    ],
  },
  {
    id: "zorp",
    name: "Grandma Zorp's",
    emoji: "👽",
    tagline: "Home cooking, just like grandma used to synthesize.",
    category: "Alien delicacies",
    dimension: "B-612",
    rating: 4.9,
    time: "25–40 min",
    fee: 0,
    hue: 280,
    image: "restaurant_grandma_zorps",
    items: [
      {
        id: "gz1",
        name: "Slow-Cooked Glorbo",
        desc: "Basted for three lunar cycles in love and enzymes.",
        price: 41,
        emoji: "🍲",
      },
      {
        id: "gz2",
        name: "Tentacle Pot Pie",
        desc: "It hugs back. That's the flaky crust talking.",
        price: 33,
        emoji: "🥧",
      },
      {
        id: "gz3",
        name: "Zorp Family Dumplings",
        desc: "Recipe handed down, then up, then sideways through time.",
        price: 27,
        emoji: "🥟",
      },
      {
        id: "gz4",
        name: "Warm Plasma Pudding",
        desc: "Glows in the dark so you can find it at 3 a.m.",
        price: 15,
        emoji: "🍮",
      },
    ],
  },
  {
    id: "blorbo-lab",
    name: "Blorbo's Lab Snax",
    emoji: "🧪",
    tagline: "FDA-unapproved in 43 dimensions and counting.",
    category: "Lab snacks",
    dimension: "C-131",
    rating: 3.9,
    time: "5–10 min",
    fee: 12,
    hue: 160,
    items: [
      {
        id: "bl1",
        name: "Beaker Popcorn",
        desc: "Pops itself. Occasionally re-pops inside you.",
        price: 13,
        emoji: "🍿",
      },
      {
        id: "bl2",
        name: "Isotope Gummies",
        desc: "Half-life of 20 minutes. Eat them faster than that.",
        price: 16,
        emoji: "🧬",
      },
      {
        id: "bl3",
        name: "Centrifuge Slushie",
        desc: "Separated into 7 flavors by 9,000 RPM of pure science.",
        price: 14,
        emoji: "🌀",
      },
      {
        id: "bl4",
        name: "Petri Dish of the Day",
        desc: "Today's culture: surprisingly zesty.",
        price: 21,
        emoji: "🧫",
      },
    ],
  },
  {
    id: "sauce-shack",
    name: "The Secret Sauce Shack",
    emoji: "🍗",
    tagline: "People have crossed timelines for this sauce. Twice.",
    category: "Human food",
    dimension: "C-131",
    rating: 4.6,
    time: "12–22 min",
    fee: 4,
    hue: 10,
    image: "restaurant_the_secret_sauce_shack",
    items: [
      {
        id: "ss1",
        name: "10-Piece Multiverse Nuggets",
        desc: "Tastes like your favorite childhood memory (ethically sourced).",
        price: 28,
        emoji: "🍗",
      },
      {
        id: "ss2",
        name: "THE Sauce (1 cup)",
        desc: "We legally can't tell you what's in it, when it's from, or why.",
        price: 35,
        emoji: "🥫",
      },
      {
        id: "ss3",
        name: "Crispy Timeline Tenders",
        desc: "Fried in oil from a dimension where cholesterol fears YOU.",
        price: 25,
        emoji: "🍖",
      },
    ],
  },
  {
    id: "donut-sing",
    name: "Donut Singularity",
    emoji: "🍩",
    tagline: "Infinite density. Infinite glaze. One-bite limit.",
    category: "Sweets",
    dimension: "B-612",
    rating: 4.4,
    time: "10–18 min",
    fee: 7,
    hue: 320,
    items: [
      {
        id: "ds1",
        name: "Black Hole Original",
        desc: "The hole is the donut. The donut is elsewhere.",
        price: 12,
        emoji: "🍩",
      },
      {
        id: "ds2",
        name: "Accretion Dozen",
        desc: "Twelve donuts orbiting a mutual center of glaze.",
        price: 48,
        emoji: "🍩",
      },
      {
        id: "ds3",
        name: "Spaghettified Churro",
        desc: "One churro, fourteen meters long. Physics!",
        price: 16,
        emoji: "🥖",
      },
      {
        id: "ds4",
        name: "Hawking Radiation Latte",
        desc: "Slowly evaporates. Drink faster.",
        price: 13,
        emoji: "☕",
      },
    ],
  },
  {
    id: "wormhole-waffles",
    name: "Wormhole Waffles",
    emoji: "🧇",
    tagline: "Breakfast from a timeline where it's always Sunday morning.",
    category: "Sweets",
    dimension: "Fantasy-42",
    rating: 4.7,
    time: "15–25 min",
    fee: 0,
    hue: 50,
    image:"restaurant_wormhole_waffle",
    items: [
      {
        id: "ww1",
        name: "Möbius Waffle Stack",
        desc: "A one-sided waffle. Butter both sides anyway.",
        price: 23,
        emoji: "🧇",
      },
      {
        id: "ww2",
        name: "Syrup From The Before-Times",
        desc: "Aged 10,000 years. Tastes like 9 a.m.",
        price: 9,
        emoji: "🍯",
      },
      {
        id: "ww3",
        name: "Portal Pancakes",
        desc: "Bite here, it vanishes there. Great for sharing with alternate you.",
        price: 20,
        emoji: "🥞",
      },
    ],
  },
  {
    id: "dragon-drive",
    name: "Dragon Drive-Thru",
    emoji: "🐉",
    tagline: "Flame-grilled by an actual dragon named Kevin.",
    category: "Alien delicacies",
    dimension: "Fantasy-42",
    rating: 4.3,
    time: "18–30 min",
    fee: 9,
    hue: 0,
    items: [
      {
        id: "dd1",
        name: "Kevin's Char-Blasted Wings",
        desc: "Cooked at 1,200 °C in 0.3 seconds. Kevin doesn't do medium-rare.",
        price: 31,
        emoji: "🍗",
      },
      {
        id: "dd2",
        name: "Knight's Armor Nachos",
        desc: "Crunchy exterior, soft squire interior. Kidding — it's cheese.",
        price: 26,
        emoji: "🧀",
      },
      {
        id: "dd3",
        name: "Potion of Thirst-Quenching +2",
        desc: "Grants advantage on hydration checks.",
        price: 12,
        emoji: "🧪",
      },
      {
        id: "dd4",
        name: "Roasted Rock-Candy Golem",
        desc: "He volunteered. He's delicious.",
        price: 18,
        emoji: "🍬",
      },
    ],
  },
];
