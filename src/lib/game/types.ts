export type Player = {
  id: string;
  name: string;
  bot: boolean;
  gold: number;
  hand: string[];
  city: string[];
  roles: number[];
  revealed: number[];
  builtAt: Record<string, number>;
};
export type GameAction = {
  type:
    | "start"
    | "draft"
    | "discard-role"
    | "gold"
    | "draw"
    | "keep"
    | "build"
    | "income"
    | "ability"
    | "end"
    | "smithy"
    | "laboratory"
    | "recover"
    | "pass-recovery"
    | "add-bot"
    | "remove-bot"
    | "replace"
    | "rematch"
    | "chat";
  role?: number;
  card?: string;
  cards?: string[];
  target?: string;
  text?: string;
};
export type Game = {
  archived?: boolean;
  code: string;
  host: string;
  name: string;
  phase: "lobby" | "draft" | "turn" | "recovery" | "finished";
  players: Player[];
  deck: string[];
  round: number;
  crown: string;
  draftOrder: string[];
  draftIndex: number;
  draftDiscard: boolean;
  available: number[];
  faceup: number[];
  facedown: number[];
  activeRole: number;
  active: string;
  killed: number | null;
  robbed: number | null;
  gathered: boolean;
  builds: number;
  incomeUsed: boolean;
  abilityUsed: boolean;
  districtUsed: string[];
  choices: string[];
  keepCount: number;
  firstComplete: string | null;
  target: number;
  log: {
    id: number;
    round: number;
    text: string;
    kind: "game" | "build" | "power" | "chat";
    player?: string;
  }[];
  recovery: { player: string; card: string; warlord: string } | null;
  version: number;
  updatedAt: number;
  botAt: number;
  createdAt: number;
};
export type PublicPlayer = Omit<Player, "hand" | "roles"> & {
  hand: string[];
  handCount: number;
  roles: number[];
  score: Score;
};
export type Score = {
  districts: number;
  diversity: number;
  completion: number;
  special: number;
  total: number;
};
export type GameView = Omit<Game, "deck" | "facedown" | "players"> & {
  deckCount: number;
  players: PublicPlayer[];
  me: string;
  winnerIds: string[];
};
