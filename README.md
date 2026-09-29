# Citadels — The Online Table

A playable, unofficial web adaptation of classic **Citadels**, built with **Next.js 16, React 19, TypeScript, Tailwind CSS 4, and shadcn/ui (Base UI)**. Original illustrated cards, a parchment-and-emerald interface, and a server-authoritative game engine.

## Run locally

Requires **Node.js 24+** and a free [Convex](https://convex.dev) account. Game state lives in Convex, which also pushes live table updates to every player.

```sh
npm ci
npx convex dev   # first run: log in and create/select a project; keeps functions in sync
npm run dev      # in a second terminal
```

`npx convex dev` writes `CONVEX_DEPLOYMENT` and `NEXT_PUBLIC_CONVEX_URL` to `.env.local`.

Open the URL printed by Next.js. If port 3000 is occupied, Next.js picks an available port. To choose explicitly:

```sh
npm run dev -- --port 3002
```

## Play

- **Play with friends:** create a private table, share its link or eight-character code, and start once at least two people are seated (2–7 players, 7- or 8-district finish line). Only real players: there are no computer rivals.
- **Feel the table:** setup, invitations, seats, choices, hand, city, and game activity live on one tabletop scene. Online/away dots, a “thinking…” timer, floating emoji reactions, and full-screen game moments bring the players together.
- **Player aid:** open the two-sided reference card (turn summary and the eight characters in calling order) whenever you need it. The active turn walks you through each step.
- **Game after game:** “Play again” restarts with the same people at the same link, with a running win tally; the host can also reopen the lobby so new friends can join.
- **Resume:** revisit the room link in the same browser. The game is stored in Convex and your seat is recovered through a private session token kept in this browser's local storage.
- **Disconnected player:** once a player has been away for a minute, the host can put their seat on autopilot from table settings so the game can finish.
- **Table talk:** room chat sits beside the game journal; on phones it appears below your city.
- **Learn:** searchable character/district collection, field guide, contextual abilities, build validation, and automatic scoring.

For different human players on one machine, use separate browser profiles or private windows. Tabs in the same browser share the same seat. For friends elsewhere, run the app on a reachable host with HTTPS; a localhost invite is only accessible on your own computer.

## Implemented rules

The classic eight characters: Assassin, Thief, Magician, King, Bishop, Merchant, Architect, and Warlord. The 66-card base deck has 28 district types, including all 11 unique types (12 unique cards because Keep appears twice).

- 2–7 players, including two-character turns for 2–3 players.
- Proper face-up/face-down removals, two-player discard steps, seven-player final draft choice.
- Gathering gold/cards, duplicate prevention, turn/build limits, Architect bonuses.
- Assassination, delayed theft, both Magician exchanges, crown transfer, color income, Bishop protection, Warlord destruction.
- Haunted City, Keep, Laboratory, Smithy, Observatory, Graveyard recovery, Library, School of Magic, University, Dragon Gate, Great Wall.
- Final-round completion, color diversity, district bonuses, tie-breakers and shared victories.
- Full rematches from completed games.

This targets the **classic base game**, not later expansion character sets. The online host receives the initial crown instead of selecting the oldest player. Rules reference: [classic rulebook](https://www.fantasyflightgames.com/ffg_content/Citadels/support/citadels-rules-english.pdf). Card descriptions and illustrations are original to this implementation.

## Deploy to Vercel

1. In the [Convex dashboard](https://dashboard.convex.dev), open the project → **Production** deployment → **Settings → Deploy keys**, and generate a **production deploy key**.
2. In Vercel → Project **citadel-online** → **Settings → Environment Variables**, add `CONVEX_DEPLOY_KEY` with that key for the **Production** environment. (For preview deployments, add a separate *preview* deploy key scoped to **Preview**.)
3. Redeploy. `vercel.json` sets the build command to `npx convex deploy --cmd 'npm run build'`, which pushes `convex/` to your production deployment and injects `NEXT_PUBLIC_CONVEX_URL` into the Next.js build.

Any host works the same way: the Next.js app is stateless, so it runs fine on serverless or multiple instances. For Docker, pass `NEXT_PUBLIC_CONVEX_URL` at build time (`NEXT_PUBLIC_CONVEX_URL=… docker compose up --build -d`) after running `npx convex deploy`.

## Architecture

- `src/lib/game/catalog.ts`: character and district definitions.
- `src/lib/game/engine.ts`: rules, state transitions, scoring and bot strategy.
- `convex/schema.ts`: `rooms` (serialized game state) and `seats` (human player → table index).
- `convex/rooms.ts`: room creation, joining, action handling, per-player views and scheduled autopilot moves.
- `convex/social.ts`: presence heartbeats and short-lived emoji reactions.
- `src/lib/session.ts`: private per-browser session token.
- `src/lib/game/use-game.ts`: live Convex subscription, actions and connection status.
- `src/components/game/`: table, guided actions, draft, card inspection, powers, chat, lobby and results.

The server validates every move. Opponent hands, uncalled roles, deck order and private draw choices are removed **before** responses reach the browser. Public player IDs are SHA-256 hashes of private session tokens. Convex mutations are serializable transactions, and state versions reject conflicting moves. Autopilot seats use their own hand and public city information to choose actions; hidden opponent characters are not used to select assassination or theft targets.

Autopilot moves are scheduled on the Convex backend and advance even when nobody is viewing the table. Human turns have no time limit. Sessions are browser-bound; there is no account login, cross-device identity, matchmaking, ranking ladder, or expansion support.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
```

Browser tests need the app running against your Convex dev deployment (they read `.env.local`) and Playwright Chromium installed:

```sh
npx playwright install chromium
TEST_BASE_URL=http://localhost:3002 npm run test:e2e
```

Tests cover complete simulations for every table size, individual power interactions, card conservation, hidden information, browser play, saved games, multiplayer synchronization, stale actions and mobile overflow. `artifacts/` contains browser screenshots from visual verification. Artwork provenance and design notes are in `docs/`.
