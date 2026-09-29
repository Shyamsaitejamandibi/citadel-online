import test from "node:test";
import assert from "node:assert/strict";
import {
  applyAction,
  botAction,
  createGame,
  makePlayer,
  score,
  viewFor,
  canDestroy,
} from "../src/lib/game/engine";
import { DISTRICTS } from "../src/lib/game/catalog";
import type { Game } from "../src/lib/game/types";
function setup(n = 4) {
  const g = createGame("TESTCODE", "host", "You");
  for (let i = 1; i < n; i++) g.players.push(makePlayer(`p${i}`, `Rival ${i}`));
  applyAction(g, "host", { type: "start" });
  return g;
}
function turn(role: number) {
  const g = setup();
  g.phase = "turn";
  g.active = "host";
  g.activeRole = role;
  g.players[0].roles = [role];
  g.gathered = false;
  return g;
}
function assertConservation(g: Game) {
  const cards = [
    ...g.deck,
    ...g.choices,
    ...g.players.flatMap((p) => [...p.hand, ...p.city]),
    ...(g.recovery ? [g.recovery.card] : []),
  ];
  assert.equal(
    cards.length,
    DISTRICTS.reduce((n, d) => n + d.copies, 0),
  );
  assert.equal(new Set(cards).size, cards.length);
  for (const p of g.players) assert.ok(p.gold >= 0);
}
test("setup deals four cards and two gold, with legal face-up removals", () => {
  for (const n of [2, 3, 4, 5, 6, 7]) {
    const g = setup(n);
    assert.equal(g.players.length, n);
    assert.ok(g.players.every((p) => p.hand.length === 4 && p.gold === 2));
    assert.equal(g.faceup.length, n >= 4 ? Math.max(0, 6 - n) : 0);
    assert.ok(!g.faceup.includes(4));
    assertConservation(g);
  }
});
test("two-player draft grants two roles each and includes the two discard choices", () => {
  const g = setup(2);
  let discards = 0;
  while (g.phase === "draft") {
    if (g.draftDiscard) discards++;
    applyAction(g, g.active, {
      type: g.draftDiscard ? "discard-role" : "draft",
      role: g.available[0],
    });
  }
  assert.equal(discards, 2);
  assert.deepEqual(
    g.players.map((p) => p.roles.length),
    [2, 2],
  );
  assert.equal(new Set(g.players.flatMap((p) => p.roles)).size, 4);
});
test("seven-player last choice includes the secretly removed character", () => {
  const g = setup(7);
  const hidden = g.facedown[0];
  for (let i = 0; i < 6; i++)
    applyAction(g, g.active, { type: "draft", role: g.available[0] });
  assert.equal(g.available.length, 2);
  assert.ok(g.available.includes(hidden));
});
test("private views hide hands, roles, draft choices and deck order from rivals", () => {
  const g = setup();
  applyAction(g, g.active, { type: "draft", role: g.available[0] });
  const view = viewFor(g, "p1");
  assert.equal(view.players[0].hand.length, 0);
  assert.equal(view.players[0].roles.length, 0);
  assert.equal(view.players[1].hand.length, 4);
  assert.ok(!("deck" in view));
  assert.ok(!("facedown" in view));
  assert.equal(viewFor(g, "p2").available.length, 0);
  g.choices = ["palace:0"];
  g.active = "host";
  assert.deepEqual(viewFor(g, "p1").choices, []);
});
test("out-of-turn and unaffordable actions are rejected", () => {
  const g = turn(4);
  assert.throws(() => applyAction(g, "p1", { type: "gold" }), /another/);
  assert.throws(() => applyAction(g, "host", { type: "end" }), /Gather/);
  g.players[0].hand = ["palace:0"];
  g.gathered = true;
  assert.throws(
    () => applyAction(g, "host", { type: "build", card: "palace:0" }),
    /enough/,
  );
});
test("resource choice is mandatory, cards must be explicitly selected", () => {
  const g = turn(4);
  applyAction(g, "host", { type: "draw" });
  assert.equal(g.choices.length, 2);
  assert.throws(() => applyAction(g, "host", { type: "end" }), /Choose/);
  applyAction(g, "host", { type: "keep", cards: [g.choices[0]] });
  assert.equal(g.players[0].hand.length, 5);
  assert.equal(g.choices.length, 0);
  assert.throws(() => applyAction(g, "host", { type: "gold" }), /already/);
  assertConservation(g);
});
test("Architect draws two extra cards and may build three different districts", () => {
  const g = turn(7);
  const p = g.players[0];
  const before = p.hand.length;
  applyAction(g, "host", { type: "gold" });
  assert.equal(p.hand.length, before + 2);
  p.hand = ["tavern:0", "market:0", "temple:0", "watchtower:0"];
  p.gold = 20;
  for (const card of ["tavern:0", "market:0", "temple:0"])
    applyAction(g, "host", { type: "build", card });
  assert.throws(
    () => applyAction(g, "host", { type: "build", card: "watchtower:0" }),
    /limit/,
  );
  assert.equal(p.city.length, 3);
});
test("duplicate districts cannot be built", () => {
  const g = turn(7);
  g.gathered = true;
  g.players[0].city = ["tavern:0"];
  g.players[0].hand = ["tavern:1"];
  assert.throws(
    () => applyAction(g, "host", { type: "build", card: "tavern:1" }),
    /already/,
  );
});
test("Assassin skips the target and a murdered King inherits at round end", () => {
  const g = turn(1);
  g.players.forEach((p) => {
    p.roles = [];
  });
  g.players[0].roles = [1];
  g.players[1].roles = [4];
  applyAction(g, "host", { type: "ability", role: 4 });
  applyAction(g, "host", { type: "gold" });
  applyAction(g, "host", { type: "end" });
  assert.equal(g.phase, "draft");
  assert.equal(g.crown, "p1");
  assert.equal(g.players[1].gold, 2);
});
test("Thief steals only when the chosen character is called", () => {
  const g = turn(2);
  g.players.forEach((p) => {
    p.roles = [];
  });
  g.players[0].roles = [2];
  g.players[1].roles = [6];
  g.players[1].gold = 7;
  applyAction(g, "host", { type: "ability", role: 6 });
  assert.equal(g.players[1].gold, 7);
  applyAction(g, "host", { type: "gold" });
  applyAction(g, "host", { type: "end" });
  assert.equal(g.players[1].gold, 0);
  assert.equal(g.players[0].gold, 11);
});
test("Magician can swap an empty hand and cannot duplicate exchanges", () => {
  const g = turn(3);
  g.players[0].hand = [];
  g.players[1].hand = ["castle:0", "palace:0"];
  applyAction(g, "host", { type: "ability", target: "p1" });
  assert.deepEqual(g.players[0].hand, ["castle:0", "palace:0"]);
  assert.equal(g.players[1].hand.length, 0);
  assert.throws(
    () => applyAction(g, "host", { type: "ability", target: "p1" }),
    /already/,
  );
});
test("Bishop, Keep and completed cities are protected from destruction", () => {
  const g = turn(8);
  const p = g.players[1];
  p.city = ["castle:0", "keep:0"];
  p.roles = [5];
  assert.equal(canDestroy(g, p, "castle:0"), false);
  g.killed = 5;
  assert.equal(canDestroy(g, p, "castle:0"), true);
  assert.equal(canDestroy(g, p, "keep:0"), false);
  p.city = DISTRICTS.slice(0, 8).map((d) => `${d.id}:0`);
  assert.equal(canDestroy(g, p, p.city[0]), false);
});
test("Great Wall adjusts cost, Graveyard interrupts and returns to Warlord", () => {
  const g = turn(8);
  const p = g.players[0];
  p.gold = 10;
  const target = g.players[1];
  target.roles = [3];
  target.city = ["castle:0", "great-wall:0"];
  g.players[2].city = ["graveyard:0"];
  g.players[2].roles = [6];
  applyAction(g, "host", { type: "ability", target: "p1", card: "castle:0" });
  assert.equal(p.gold, 6);
  assert.equal(g.phase, "recovery");
  assert.equal(g.active, "p2");
  applyAction(g, "p2", { type: "recover" });
  assert.equal(g.players[2].gold, 1);
  assert.ok(g.players[2].hand.includes("castle:0"));
  assert.equal(g.phase, "turn");
  assert.equal(g.active, "host");
  assert.equal(g.abilityUsed, true);
});
test("Library and Observatory give three choices with two keeps", () => {
  const g = turn(4);
  const p = g.players[0];
  p.city = ["library:0", "observatory:0"];
  applyAction(g, "host", { type: "draw" });
  assert.equal(g.choices.length, 3);
  assert.equal(g.keepCount, 2);
  assert.throws(
    () => applyAction(g, "host", { type: "keep", cards: [g.choices[0]] }),
    /indicated/,
  );
  applyAction(g, "host", { type: "keep", cards: g.choices.slice(0, 2) });
  assert.equal(p.hand.length, 6);
});
test("Haunted City cannot represent two colors or change color in its construction round", () => {
  const g = turn(4);
  g.round = 3;
  const p = g.players[0];
  p.city = ["tavern:0", "temple:0", "manor:0", "haunted-city:0"];
  p.builtAt["haunted-city:0"] = 1;
  assert.equal(score(g, p).diversity, 0);
  p.city.push("keep:0");
  assert.equal(score(g, p).diversity, 3);
  p.builtAt["haunted-city:0"] = 3;
  assert.equal(score(g, p).diversity, 0);
});
test("scoring accounts for color, completion and special district bonuses", () => {
  const g = turn(4);
  const p = g.players[0];
  p.city = [
    "tavern:0",
    "temple:0",
    "manor:0",
    "watchtower:0",
    "university:0",
    "dragon-gate:0",
    "castle:0",
    "market:0",
  ];
  g.firstComplete = "host";
  const s = score(g, p);
  assert.equal(s.diversity, 3);
  assert.equal(s.completion, 4);
  assert.equal(s.special, 4);
  assert.equal(s.total, s.districts + 11);
});
test("all table sizes finish full simulated games without losing cards or exposing illegal actions", () => {
  for (const n of [2, 3, 4, 5, 6, 7]) {
    for (let run = 0; run < 4; run++) {
      const g = setup(n);
      g.players.forEach((p) => (p.bot = true));
      let moves = 0;
      while (g.phase !== "finished" && moves < 6000) {
        const a = botAction(g);
        assert.ok(a, `no action: ${g.phase}`);
        applyAction(g, g.active, a);
        assertConservation(g);
        moves++;
      }
      assert.equal(g.phase, "finished", `${n}-player game stalled`);
      assert.ok(viewFor(g, g.host).winnerIds.length > 0);
    }
  }
});

test("Magician returns exchanged cards to the bottom before drawing from an exhausted deck", () => {
  const g = turn(3);
  g.deck = ["temple:0"];
  g.players[0].hand = ["palace:0", "castle:0"];
  applyAction(g, "host", { type: "ability", cards: ["palace:0", "castle:0"] });
  assert.deepEqual(g.players[0].hand, ["temple:0", "palace:0"]);
  assert.deepEqual(g.deck, ["castle:0"]);
});
test("district income can be collected after building and School of Magic earns income", () => {
  const g = turn(4);
  const p = g.players[0];
  p.city = ["school-of-magic:0"];
  p.hand = ["manor:0"];
  p.gold = 3;
  applyAction(g, "host", { type: "gold" });
  applyAction(g, "host", { type: "build", card: "manor:0" });
  applyAction(g, "host", { type: "income" });
  assert.equal(p.gold, 4);
  assert.throws(
    () => applyAction(g, "host", { type: "income" }),
    /not available/,
  );
});
test("Smithy and Laboratory may each be used once per turn", () => {
  const g = turn(4);
  const p = g.players[0];
  p.city = ["smithy:0", "laboratory:0"];
  const initial = p.hand.length;
  applyAction(g, "host", { type: "smithy" });
  assert.equal(p.hand.length, initial + 3);
  assert.equal(p.gold, 0);
  assert.throws(
    () => applyAction(g, "host", { type: "smithy" }),
    /not available/,
  );
  applyAction(g, "host", { type: "laboratory", card: p.hand[0] });
  assert.equal(p.gold, 1);
  assert.equal(p.hand.length, initial + 2);
  assert.throws(
    () => applyAction(g, "host", { type: "laboratory", card: p.hand[0] }),
    /not available/,
  );
});
test("completing a city waits until the end of the round, then records victory", () => {
  const g = turn(4);
  g.players.forEach((p) => (p.roles = []));
  const p = g.players[0];
  p.roles = [4];
  g.players[1].roles = [6];
  p.city = [
    "tavern:0",
    "market:0",
    "temple:0",
    "manor:0",
    "castle:0",
    "church:0",
    "prison:0",
  ];
  p.hand = ["watchtower:0"];
  applyAction(g, "host", { type: "gold" });
  applyAction(g, "host", { type: "build", card: "watchtower:0" });
  assert.equal(g.firstComplete, "host");
  assert.equal(g.phase, "turn");
  applyAction(g, "host", { type: "end" });
  assert.equal(g.active, "p1");
  assert.equal(g.phase, "turn");
  applyAction(g, "p1", { type: "gold" });
  applyAction(g, "p1", { type: "end" });
  assert.equal(g.phase, "finished");
  assert.deepEqual(viewFor(g, "host").winnerIds, ["host"]);
});

test("rematches reset the table, while archived results remain immutable", () => {
  const g = setup();
  g.phase = "finished";
  g.firstComplete = "host";
  g.players[0].gold = 99;
  g.players[0].city = ["palace:0"];
  const archived = structuredClone(g);
  archived.archived = true;
  assert.throws(
    () => applyAction(archived, "host", { type: "rematch" }),
    /archived/,
  );
  applyAction(g, "host", { type: "rematch" });
  assert.equal(g.phase, "draft");
  assert.equal(g.round, 1);
  assert.equal(g.firstComplete, null);
  assert.ok(
    g.players.every(
      (p) => p.gold === 2 && p.city.length === 0 && p.hand.length === 4,
    ),
  );
  assertConservation(g);
});
