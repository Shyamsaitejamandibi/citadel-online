import { spawn, type ChildProcess } from "node:child_process";
import { once } from "node:events";
import { mkdirSync, mkdtempSync } from "node:fs";
import { DatabaseSync } from "node:sqlite";
import path from "node:path";
import assert from "node:assert/strict";
import { createServer } from "node:net";
import { applyAction, botAction } from "../src/lib/game/engine";
import type { Game } from "../src/lib/game/types";

async function main() {
  mkdirSync("test-results", { recursive: true });
  const dataDir = mkdtempSync(path.resolve("test-results/production-"));
  const portFinder = createServer();
  portFinder.listen(0, "127.0.0.1");
  await once(portFinder, "listening");
  const port = (portFinder.address() as { port: number }).port;
  await new Promise<void>((resolve) => portFinder.close(() => resolve()));
  const base = `http://localhost:${port}`;
  let child: ChildProcess | null = null;
  let logs = "";
  async function start() {
    logs = "";
    child = spawn(
      process.execPath,
      ["node_modules/next/dist/bin/next", "start", "--port", String(port)],
      {
        env: {
          ...process.env,
          NODE_ENV: "production",
          CITADEL_DATA_DIR: dataDir,
        },
        stdio: ["ignore", "pipe", "pipe"],
      },
    );
    child.stdout?.on("data", (x) => (logs += x));
    child.stderr?.on("data", (x) => (logs += x));
    for (let i = 0; i < 150; i++) {
      if (child.exitCode !== null) throw Error(logs);
      try {
        const r = await fetch(base);
        if (r.ok) return;
      } catch {}
      await new Promise((r) => setTimeout(r, 100));
    }
    throw Error("Production server did not become ready. " + logs);
  }
  async function stop() {
    if (!child || child.exitCode !== null) return;
    const exited = once(child, "exit");
    child.kill("SIGTERM");
    await exited;
    child = null;
  }
  try {
    await start();
    const created = await fetch(`${base}/api/rooms`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Origin: base },
      body: JSON.stringify({
        name: "Persistence test",
        mode: "solo",
        players: 4,
        target: 8,
      }),
    });
    assert.equal(created.status, 200);
    const cookie = created.headers.get("set-cookie")!.split(";")[0];
    const { code, game: initial } = await created.json();
    assert.equal(initial.phase, "draft");
    await stop();
    // Complete this isolated test game while offline, then resume through production APIs.
    const db = new DatabaseSync(path.join(dataDir, "citadel.sqlite"));
    const row = db
      .prepare("SELECT state FROM rooms WHERE code=?")
      .get(code) as { state: string };
    const game = JSON.parse(row.state) as Game;
    game.players.forEach((p) => (p.bot = true));
    let moves = 0;
    while (game.phase !== "finished" && moves < 6000) {
      const action = botAction(game);
      assert.ok(action);
      applyAction(game, game.active, action);
      moves++;
    }
    assert.equal(game.phase, "finished");
    game.players.find((p) => p.id === game.host)!.bot = false;
    db.prepare("UPDATE rooms SET state=? WHERE code=?").run(
      JSON.stringify(game),
      code,
    );
    db.close();
    await start();
    const resumed = await (
      await fetch(`${base}/api/rooms/${code}`, { headers: { Cookie: cookie } })
    ).json();
    assert.equal(resumed.game.phase, "finished");
    assert.equal(resumed.game.me, initial.me);
    const rematch = await fetch(`${base}/api/rooms/${code}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        Origin: base,
      },
      body: JSON.stringify({ type: "rematch", version: resumed.game.version }),
    });
    assert.equal(rematch.status, 200);
    const next = await rematch.json();
    assert.equal(next.game.phase, "draft");
    assert.equal(next.game.round, 1);
    const history = await (
      await fetch(`${base}/api/rooms`, { headers: { Cookie: cookie } })
    ).json();
    assert.equal(history.games.length, 2);
    const archived = history.games.find(
      (g: { phase: string }) => g.phase === "finished",
    );
    assert.ok(archived);
    const replay = await fetch(`${base}/api/rooms/${archived.code}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: cookie,
        Origin: base,
      },
      body: JSON.stringify({ type: "rematch" }),
    });
    assert.equal(replay.status, 400);
    await stop();
    await start();
    const persisted = await (
      await fetch(`${base}/api/rooms/${code}`, { headers: { Cookie: cookie } })
    ).json();
    assert.equal(persisted.game.phase, "draft");
    assert.equal(persisted.game.me, initial.me);
    console.log(
      "Production smoke passed: startup, full-game persistence across restarts, private seat recovery, rematch, archived results and archive protection.",
    );
  } finally {
    await stop();
  }
}
main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
