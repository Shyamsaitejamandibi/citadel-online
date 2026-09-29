import { test, expect, type Page } from "@playwright/test";
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

test("home, character library, search and mobile fit", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Great cities. Greater rivalries." }),
  ).toBeVisible();
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

test("practice game supports drafting, gathering, building and reload", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto("/");
  await page.getByRole("button", { name: "Let’s play" }).click();
  await page
    .getByRole("textbox", { name: "What shall we call you?" })
    .fill("Test ruler");
  await page.getByRole("button", { name: "Take my seat", exact: true }).click();
  await expect(page).toHaveURL(/\/play\/[A-Z0-9]{8}$/);
  await expect(
    page.getByRole("heading", { name: "Who will you be?" }),
  ).toBeVisible();
  await page.screenshot({
    path: "artifacts/table-desktop.png",
    fullPage: true,
  });
  const code = page.url().split("/").pop()!;
  const state = () => viewOf(page, code);
  let g = await state();
  const best = [6, 4, 5, 7, 1, 2, 3, 8].find((r) => g.available.includes(r))!;
  await page
    .locator(".draft-cards .character-card")
    .filter({
      has: page.getByRole("heading", {
        name: {
          1: "Assassin",
          2: "Thief",
          3: "Magician",
          4: "King",
          5: "Bishop",
          6: "Merchant",
          7: "Architect",
          8: "Warlord",
        }[best],
        exact: true,
      }),
    })
    .click();
  await page
    .getByRole("button", { name: "Choose character", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Take 2 gold", exact: true }),
  ).toBeVisible({ timeout: 60000 });
  await page.getByRole("button", { name: "Take 2 gold", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "End my turn", exact: true }),
  ).toBeVisible();
  g = await state();
  const me = g.players.find((p) => p.id === g.me)!;
  expect(g.gathered).toBe(true);
  expect(me.gold).toBeGreaterThanOrEqual(4);
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
    g = await state();
    expect(g.players.find((p) => p.id === g.me)!.city).toContain(affordable);
  }
  await page.reload();
  await expect(
    page.getByRole("button", { name: "End my turn", exact: true }),
  ).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: "artifacts/table-mobile.png", fullPage: true });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "End my turn", exact: true }).click();
  expect(errors).toEqual([]);
});

test("two independent browsers share a private table without leaking secrets", async ({
  browser,
}) => {
  const host = await browser.newContext();
  const guest = await browser.newContext();
  const h = await host.newPage();
  const f = await guest.newPage();
  try {
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
    await h.getByRole("button", { name: "Begin our story" }).click();
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
    await host.close();
    await guest.close();
  }
});
