# Citadels — The Online Table

A playable, unofficial web adaptation of classic **Citadels**, built with **Next.js 16, React 19, TypeScript, Tailwind CSS 4, and shadcn/ui (Base UI)**. Original illustrated cards, a parchment-and-emerald interface, and a server-authoritative game engine.

## Run locally

Requires **Node.js 24+** (uses built-in `node:sqlite`). No API keys or external database required.

```sh
npm ci
npm run dev
```

Open the URL printed by Next.js. If port 3000 is occupied, Next.js picks an available port. To choose explicitly:

```sh
npm run dev -- --port 3002
```

## Play

- **Practice your craft:** play a complete game against computer rivals, with 2–7 seats and a 7- or 8-district finish line.
- **Play with friends:** create a private lobby, share its link or eight-character code, and optionally fill seats with bots. The host starts the game.
- **Resume:** revisit the room link in the same browser. The game is stored on the server and your seat is recovered through a private, HTTP-only cookie.
- **Disconnected player:** the host can permanently hand another human seat to a bot through table settings.
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

## Production

```sh
npm run build
npm start
```

Deploy as a **long-running Node.js 24 server with a persistent writable volume**. SQLite files live in `.data/`, or set `CITADEL_DATA_DIR` to an absolute persistent directory. Use HTTPS in production (session cookies are Secure). Back up the database with SQLite's backup API or while the server is stopped, including WAL files if applicable.

A Docker setup is included:

```sh
docker compose up --build -d
```

Terminate HTTPS with your hosting platform or reverse proxy. Keep this app as one instance per database; it is not configured for horizontally distributed servers or ephemeral/serverless filesystems. No public deployment or cloud account is provisioned by this repository.

## Architecture

- `src/lib/game/catalog.ts`: character and district definitions.
- `src/lib/game/engine.ts`: rules, state transitions, scoring and bot strategy.
- `src/lib/game/store.ts`: SQLite WAL persistence with atomic transactions.
- `src/lib/game/http.ts`: private guest identities, origin checks and action validation.
- `src/app/api/rooms/`: room creation, joining, action handling and per-player views.
- `src/lib/game/use-game.ts`: one-second polling, stale-response protection and reconnect handling.
- `src/components/game/`: table, guided actions, draft, card inspection, powers, chat, lobby and results.

The server validates every move. Opponent hands, uncalled roles, deck order and private draw choices are removed **before** responses reach the browser. Public player IDs are hashes of private cookie tokens. SQLite transactions and state versions reject conflicting moves. Bots use their own hand and public city information to choose actions; hidden opponent characters are not used to select assassination or theft targets.

Polling advances computer moves while at least one player is viewing the table. Human turns have no time limit. Sessions are browser-bound; there is no account login, cross-device identity, matchmaking, ranking ladder, or expansion support.

## Verification

```sh
npm run typecheck
npm run lint
npm test
npm run build
npm run test:production
```

The production smoke test launches an isolated production server and verifies persistence across restarts, completed-game recovery, rematches, and archived result protection.

Browser tests need the app running and Playwright Chromium installed:

```sh
npx playwright install chromium
TEST_BASE_URL=http://localhost:3002 npm run test:e2e
```

Tests cover complete simulations for every table size, individual power interactions, card conservation, hidden information, browser play, saved games, multiplayer synchronization, forged origins, stale actions and mobile overflow. `artifacts/` contains browser screenshots from visual verification. Artwork provenance and design notes are in `docs/`.
