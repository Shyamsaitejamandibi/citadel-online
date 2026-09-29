export type DistrictType =
  "noble" | "religious" | "trade" | "military" | "unique";
export type District = {
  id: string;
  name: string;
  cost: number;
  type: DistrictType;
  description: string;
  copies: number;
  art: number;
};
export type Character = {
  id: number;
  name: string;
  title: string;
  description: string;
  hint: string;
  color: string;
  income?: DistrictType;
};
export const CHARACTERS: Character[] = [
  {
    id: 1,
    name: "Assassin",
    title: "A whisper. A blade.",
    description:
      "Choose a character to assassinate. That character loses their turn this round.",
    hint: "Predict who your biggest rival will choose.",
    color: "#596756",
  },
  {
    id: 2,
    name: "Thief",
    title: "Fortune favors the quick.",
    description:
      "Choose a character to rob. Take all their gold when their turn begins. You cannot rob the Assassin or an assassinated character.",
    hint: "A wealthy city often attracts a Merchant.",
    color: "#9a7451",
  },
  {
    id: 3,
    name: "Magician",
    title: "Nothing is as it seems.",
    description:
      "Exchange your hand with another player, or discard any number of cards to draw the same number.",
    hint: "Even an empty hand can be a powerful bargaining chip.",
    color: "#827095",
  },
  {
    id: 4,
    name: "King",
    title: "The city answers to you.",
    description:
      "Take the crown and choose first next round. Collect one gold for each noble district in your city.",
    hint: "Control the draft and keep your options open.",
    color: "#ba914b",
    income: "noble",
  },
  {
    id: 5,
    name: "Bishop",
    title: "Faith is a fortress.",
    description:
      "Collect one gold for each religious district. Your city is protected from the Warlord, unless you are assassinated.",
    hint: "Protect a valuable city as the finish line approaches.",
    color: "#6f91a2",
    income: "religious",
  },
  {
    id: 6,
    name: "Merchant",
    title: "Every coin tells a story.",
    description:
      "Gain one extra gold after gathering resources. Collect one gold for each trade district.",
    hint: "Build an economy that can fund your grandest plans.",
    color: "#518575",
    income: "trade",
  },
  {
    id: 7,
    name: "Architect",
    title: "Leave a lasting legacy.",
    description:
      "Draw two extra district cards after gathering resources. You may build up to three districts this turn.",
    hint: "Save your gold, then build an entire neighborhood.",
    color: "#7790a2",
  },
  {
    id: 8,
    name: "Warlord",
    title: "Empires are not given.",
    description:
      "Collect one gold for each military district. Destroy one district by paying one less than its cost. Completed cities are protected.",
    hint: "A well-timed siege can change everything.",
    color: "#aa6c56",
    income: "military",
  },
];
export const DISTRICTS: District[] = [
  [
    "tavern",
    "Tavern",
    1,
    "trade",
    5,
    0,
    "A welcoming hearth at the heart of your city.",
  ],
  [
    "market",
    "Market",
    2,
    "trade",
    4,
    1,
    "The daily bustle of a flourishing city.",
  ],
  [
    "trading-post",
    "Trading Post",
    2,
    "trade",
    3,
    2,
    "Where new routes bring new opportunities.",
  ],
  [
    "docks",
    "Docks",
    3,
    "trade",
    3,
    3,
    "Ships arrive laden with goods and stories.",
  ],
  ["harbor", "Harbor", 4, "trade", 3, 4, "A gateway to the wider world."],
  [
    "town-hall",
    "Town Hall",
    5,
    "trade",
    2,
    5,
    "The beating heart of civic life.",
  ],
  [
    "temple",
    "Temple",
    1,
    "religious",
    3,
    6,
    "A quiet place to find a little grace.",
  ],
  [
    "church",
    "Church",
    2,
    "religious",
    3,
    7,
    "Bells ring above the morning streets.",
  ],
  [
    "monastery",
    "Monastery",
    3,
    "religious",
    3,
    8,
    "A sanctuary beyond the city noise.",
  ],
  [
    "cathedral",
    "Cathedral",
    5,
    "religious",
    2,
    9,
    "An enduring monument to faith.",
  ],
  [
    "manor",
    "Manor",
    3,
    "noble",
    5,
    10,
    "A distinguished home for an ambitious house.",
  ],
  ["castle", "Castle", 4, "noble", 4, 11, "Stone walls. Unwavering ambition."],
  [
    "palace",
    "Palace",
    5,
    "noble",
    3,
    12,
    "A seat of power worthy of the crown.",
  ],
  [
    "watchtower",
    "Watchtower",
    1,
    "military",
    3,
    13,
    "A watchful eye over the city gates.",
  ],
  ["prison", "Prison", 2, "military", 3, 14, "Order comes at a price."],
  [
    "barracks",
    "Barracks",
    3,
    "military",
    3,
    15,
    "The city’s defenders find their home.",
  ],
  [
    "fortress",
    "Fortress",
    5,
    "military",
    2,
    16,
    "A formidable statement of strength.",
  ],
  [
    "haunted-city",
    "Haunted City",
    2,
    "unique",
    1,
    17,
    "At scoring, counts as any color, unless built in the final round.",
  ],
  ["keep", "Keep", 3, "unique", 2, 18, "Cannot be destroyed by the Warlord."],
  [
    "laboratory",
    "Laboratory",
    5,
    "unique",
    1,
    19,
    "Once per turn, discard one card to gain one gold.",
  ],
  [
    "smithy",
    "Smithy",
    5,
    "unique",
    1,
    20,
    "Once per turn, pay two gold to draw three cards.",
  ],
  [
    "observatory",
    "Observatory",
    5,
    "unique",
    1,
    21,
    "When gathering cards, choose from three instead of two.",
  ],
  [
    "graveyard",
    "Graveyard",
    5,
    "unique",
    1,
    22,
    "After the Warlord destroys a district, you may pay one gold to return it to your hand. Not available when you are the Warlord.",
  ],
  [
    "library",
    "Library",
    6,
    "unique",
    1,
    23,
    "Keep two cards when gathering cards instead of one.",
  ],
  [
    "school-of-magic",
    "School of Magic",
    6,
    "unique",
    1,
    24,
    "Counts as the color of your choice when collecting character income.",
  ],
  [
    "university",
    "University",
    6,
    "unique",
    1,
    25,
    "Worth eight points at the end of the game.",
  ],
  [
    "dragon-gate",
    "Dragon Gate",
    6,
    "unique",
    1,
    26,
    "Worth eight points at the end of the game.",
  ],
  [
    "great-wall",
    "Great Wall",
    6,
    "unique",
    1,
    27,
    "Your other districts cost one extra gold to destroy.",
  ],
].map(([id, name, cost, type, copies, art, description]) => ({
  id,
  name,
  cost,
  type,
  copies,
  art,
  description,
})) as District[];
export const district = (instance: string): District =>
  DISTRICTS.find((d) => d.id === instance.split(":")[0])!;
export const character = (id: number) => CHARACTERS.find((c) => c.id === id)!;
export const TYPE_LABELS: Record<DistrictType, string> = {
  noble: "Noble",
  religious: "Religious",
  trade: "Trade",
  military: "Military",
  unique: "Unique",
};
