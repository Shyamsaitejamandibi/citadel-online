import { test, expect, type Browser, type Page } from "@playwright/test";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../convex/_generated/api";
import type { GameAction, GameView } from "../../src/lib/game/types";

try {
  process.loadEnvFile(".env.local");
} catch {}
const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
const sessionOf = (page: Page) =>
  page.evaluate(() => localStorage.getItem("citadel-session")!);
async function viewOf(page: Page, code: string) {
  const token = await sessionOf(page);
  return (await convex.query(api.rooms.get, { token, code })).game as GameView;
}
async function actAs(
  page: Page,
  code: string,
  action: GameAction & { version?: number },
) {
  const token = await sessionOf(page);
  return convex.mutation(api.rooms.act, { token, code, action });
}

// A host and a guest in separate browser profiles, seated at one table.
async function seatTable(browser: Browser) {
  const contexts = await Promise.all([
    browser.newContext(),
    browser.newContext(),
  ]);
  for (const c of contexts)
    await c.addInitScript(() => {
      localStorage.setItem("citadel-aid-seen", "1");
      localStorage.setItem("citadel-moments", "off");
    });
  const [h, f] = await Promise.all(contexts.map((c) => c.newPage()));
  await h.goto("/");
  await h.getByRole("button", { name: /Play with friends/ }).click();
  await h
    .getByRole("textbox", { name: "What shall we call you?" })
    .fill("Host ruler");
  await h
    .getByRole("button", { name: "Create private table", exact: true })
    .click();
  await expect(h).toHaveURL(/\/play\/[A-Z0-9]{8}$/);
  const code = h.url().split("/").pop()!;
  await f.goto(`/play/${code}`);
  await f
    .getByRole("textbox", { name: "Your display name" })
    .fill("Guest ruler");
  await f.getByRole("button", { name: "Take my seat", exact: true }).click();
  await expect(
    h.locator(".lobby-seat").filter({ hasText: "Guest ruler" }),
  ).toBeVisible();
  await expect(h.locator(".lobby-room .lobby-invitation")).toBeVisible();
  await f
    .getByRole("button", { name: "I’m ready to play", exact: true })
    .click();
  await h
    .getByRole("button", { name: "I’m ready to play", exact: true })
    .click();
  await expect(
    h.getByRole("button", { name: "Start the game with 2", exact: true }),
  ).toBeEnabled();
  return {
    h,
    f,
    code,
    close: () => Promise.all(contexts.map((c) => c.close())),
  };
}
// Picks the first available character for whoever is drafting.
async function draftAll(pages: Page[], code: string) {
  for (let i = 0; i < 12; i++) {
    const g = await viewOf(pages[0], code);
    if (g.phase !== "draft") return;
    const page = (
      await Promise.all(
        pages.map(async (p) => ({ p, g: await viewOf(p, code) })),
      )
    ).find((x) => x.g.active === x.g.me)!.p;
    await page
      .locator(".draft-cards .character-card:not([disabled])")
      .first()
      .click();
    await page
      .getByRole("button", {
        name: /^(Choose character|Set character aside)$/,
      })
      .click();
    await expect
      .poll(async () => (await viewOf(page, code)).version)
      .toBeGreaterThan(g.version);
  }
}

test("home, character library, search and mobile fit", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", {
      name: /Your people. One table. Endless intrigue/,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /Play with friends/ }).click();
  await expect(page.locator(".play-section #table-setup")).toBeVisible();
  await page.getByRole("button", { name: "Close setup" }).click();
  await page
    .getByRole("link", { name: "Card collection", exact: true })
    .click();
  await page.getByRole("button", { name: "Districts · 28" }).click();
  await page.getByRole("textbox", { name: "Search cards" }).fill("Library");
  await expect(page.locator(".district-grid .district-card")).toHaveCount(1);
  await page.locator(".district-grid .district-card").click();
  await expect(page.getByRole("dialog")).toContainText("Library");
  await page.getByRole("button", { name: "Close", exact: true }).click();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("button", { name: "Let’s play" })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/home-mobile-tested.png",
    fullPage: true,
  });
  expect(errors).toEqual([]);
});

test("two players draft, gather, build and resume after reload", async ({
  browser,
}) => {
  const { h, f, code, close } = await seatTable(browser);
  const errors: string[] = [];
  for (const p of [h, f]) p.on("pageerror", (e) => errors.push(e.message));
  try {
    await h.getByRole("button", { name: "Start the game with 2" }).click();
    await expect(
      h.getByRole("heading", { name: "Who will you be?" }),
    ).toBeVisible();
    await expect(h.locator(".table-layout .table-aside")).toBeVisible();
    await h.screenshot({ path: "artifacts/table-desktop.png", fullPage: true });
    await draftAll([h, f], code);
    // Whoever's character is called first takes a guided turn.
    let page = h;
    await expect
      .poll(async () => {
        for (const p of [h, f]) {
          const g = await viewOf(p, code);
          if (g.phase === "turn" && g.active === g.me) {
            page = p;
            return true;
          }
        }
        return false;
      })
      .toBe(true);
    await page
      .getByRole("button", { name: "Take 2 gold", exact: true })
      .click();
    await expect(
      page.getByRole("button", { name: "End my turn", exact: true }),
    ).toBeVisible();
    let g = await viewOf(page, code);
    const me = g.players.find((p) => p.id === g.me)!;
    expect(g.gathered).toBe(true);
    const { district } = await import("../../src/lib/game/catalog");
    const affordable = me.hand.find((c) => district(c).cost <= me.gold);
    if (affordable) {
      await page
        .locator(".hand-cards")
        .getByRole("button", {
          name: new RegExp(`^${district(affordable).name},`),
        })
        .first()
        .click();
      await page
        .getByRole("button", {
          name: `Build for ${district(affordable).cost} gold`,
          exact: true,
        })
        .click();
      await expect(page.getByRole("dialog")).toHaveCount(0);
      g = await viewOf(page, code);
      expect(g.players.find((p) => p.id === g.me)!.city).toContain(affordable);
    }
    await page.reload();
    await expect(
      page.getByRole("button", { name: "End my turn", exact: true }),
    ).toBeVisible();
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({
      path: "artifacts/table-mobile.png",
      fullPage: true,
    });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    await page
      .getByRole("button", { name: "End my turn", exact: true })
      .click();
    expect(errors).toEqual([]);
  } finally {
    await close();
  }
});

test("two independent browsers share a private table without leaking secrets", async ({
  browser,
}) => {
  const { h, f, code, close } = await seatTable(browser);
  try {
    // Presence and reactions reach the other browser live.
    await expect(h.locator(".lobby-seat .player-avatar i.online")).toHaveCount(
      2,
    );
    await expect(h.locator(".lobby-ready-check")).toContainText("2/2");
    await h.getByRole("button", { name: "Start the game with 2" }).click();
    await expect(
      h.getByRole("heading", { name: "Who will you be?" }),
    ).toBeVisible();
    const hostView = await viewOf(h, code);
    const guestView = await viewOf(f, code);
    expect(
      hostView.players.find((p) => p.id === hostView.me)!.hand,
    ).toHaveLength(4);
    expect(
      guestView.players.find((p) => p.id === hostView.me)!.hand,
    ).toHaveLength(0);
    expect(guestView.available).toHaveLength(0);
    expect("deck" in guestView).toBe(false);
    const token = await sessionOf(h);
    expect(JSON.stringify(hostView)).not.toContain(token);
    expect(hostView.me).not.toBe(token);
    await expect(
      actAs(f, code, { type: "draft", role: hostView.available[0] }),
    ).rejects.toThrow();
    await h.locator(".draft-cards .character-card").first().click();
    await h
      .getByRole("button", { name: "Choose character", exact: true })
      .click();
    await expect(
      f.getByRole("heading", { name: "Who will you be?" }),
    ).toBeVisible();
    const updated = await viewOf(f, code);
    expect(
      updated.players.find((p) => p.id === hostView.me)!.roles,
    ).toHaveLength(0);
    await expect(
      actAs(h, code, {
        type: "draft",
        role: hostView.available[1],
        version: hostView.version,
      }),
    ).rejects.toThrow();
    await actAs(h, code, { type: "chat", text: "Good luck, friend!" });
    await expect
      .poll(async () => JSON.stringify((await viewOf(f, code)).log))
      .toContain("Good luck, friend!");
    await f.reload();
    await expect(
      f.getByRole("heading", { name: "Who will you be?" }),
    ).toBeVisible();
  } finally {
    await close();
  }
});

test("guided practice is playable on mobile and never creates an online table", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await page
    .getByRole("button", { name: "First time? Play a guided turn" })
    .click();
  await expect(page.getByRole("dialog")).toContainText(
    "A new round. A secret identity.",
  );
  await page
    .getByRole("button", { name: "Choose the Merchant", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Draw 2 cards, keep 1", exact: true })
    .click();
  await page.locator(".lesson-cards .district-card").first().click();
  await page
    .getByRole("button", { name: "Keep selected card", exact: true })
    .click();
  await page
    .locator(".lesson-cards")
    .getByRole("button", { name: /^Market,/ })
    .click();
  await page
    .getByRole("button", { name: "Build Market for 2 gold", exact: true })
    .click();
  await expect(page.locator(".lesson-wallet")).toContainText("2 points");
  await page
    .getByRole("button", { name: "Collect trade income", exact: true })
    .click();
  await page.getByRole("button", { name: "End my turn", exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText(
    "You’ve built more than a city.",
  );
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "I’m ready for the table" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page).toHaveURL(/\/$/);
});

test("ready checks synchronize and private plans survive reload without reaching rivals", async ({
  browser,
}) => {
  const { h, f, code, close } = await seatTable(browser);
  try {
    const initial = await viewOf(h, code);
    await f
      .getByRole("button", { name: "Ready · click to undo", exact: true })
      .click();
    await expect(
      h.getByRole("button", { name: "Waiting for everyone to be ready" }),
    ).toBeDisabled();
    await expect(actAs(h, code, { type: "start" })).rejects.toThrow(/ready/);
    // Readiness is independent of the move version, so simultaneous checks work.
    await actAs(f, code, {
      type: "ready",
      ready: true,
      version: initial.version,
    });
    await h.getByRole("button", { name: "Start the game with 2" }).click();
    await expect(h.locator(".hand-cards .plan-pin").first()).toBeVisible();
    const button = h.locator(".hand-cards .plan-pin").first();
    const label = await button.getAttribute("aria-label");
    const districtName = label!.replace(/^Plan /, "");
    await button.click();
    await expect(h.locator(".private-plan")).toContainText(districtName);
    await expect(f.locator(".private-plan")).toContainText("Pin a card");
    const guestView = await viewOf(f, code);
    expect(JSON.stringify(guestView)).not.toContain("citadel-plan");
    await h.reload();
    await expect(h.locator(".private-plan")).toContainText(districtName);
    await h.getByRole("button", { name: "Focus on the game" }).click();
    await expect(h.locator(".table-aside")).toBeHidden();
    await h.setViewportSize({ width: 390, height: 844 });
    await expect(h.locator(".table-aside")).toBeHidden();
    await h.getByRole("button", { name: "Focus on the game" }).click();
    await expect(h.locator(".table-aside")).toBeVisible();
    await expect(h.getByRole("log", { name: "Game journal" })).toBeVisible();
    const workbench = await h.locator(".workbench").boundingBox();
    const journal = await h.locator(".game-journal").boundingBox();
    expect(journal!.y).toBeGreaterThan(workbench!.y + workbench!.height);
    await expect(h.getByRole("button", { name: "Table talk" })).toHaveCount(0);
    await h.getByRole("button", { name: "Clear planned district" }).click();
    await expect(h.locator(".private-plan")).toContainText("Pin a card");
  } finally {
    await close();
  }
});

test("seven-player tabletop fits desktop and mobile without hiding seats or legal draft cards", async ({
  page,
}) => {
  const tokens = Array.from({ length: 7 }, () => crypto.randomUUID());
  const { code } = await convex.mutation(api.rooms.create, {
    token: tokens[0],
    name: "Seven-seat host",
  });
  for (let i = 1; i < tokens.length; i++)
    await convex.mutation(api.rooms.act, {
      token: tokens[i],
      code,
      action: { type: "join", name: `Rival ${i}` },
    });
  for (const token of tokens)
    await convex.mutation(api.rooms.act, {
      token,
      code,
      action: { type: "ready", ready: true },
    });
  await convex.mutation(api.rooms.act, {
    token: tokens[0],
    code,
    action: { type: "start" },
  });
  await page.addInitScript((token) => {
    localStorage.setItem("citadel-session", token);
    localStorage.setItem("citadel-moments", "off");
  }, tokens[0]);
  await page.goto(`/play/${code}`);
  await expect(page.locator(".living-table .player-seat")).toHaveCount(7);
  await expect(page.locator(".draft-cards .character-card")).toHaveCount(7);
  for (const seat of await page.locator(".living-table .player-seat").all())
    await expect(seat).toBeVisible();
  const overlaps = await page.evaluate(() => {
    const stage = document
      .querySelector(".game-stage")!
      .getBoundingClientRect();
    return [...document.querySelectorAll(".player-seat")].filter((seat) => {
      const r = seat.getBoundingClientRect();
      return (
        r.left < stage.right &&
        r.right > stage.left &&
        r.top < stage.bottom &&
        r.bottom > stage.top
      );
    }).length;
  });
  expect(overlaps).toBe(0);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "artifacts/table-seven-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await expect(page.locator(".draft-cards .character-card")).toHaveCount(7);
  await page.screenshot({
    path: "artifacts/table-seven-mobile.png",
    fullPage: true,
  });
});
