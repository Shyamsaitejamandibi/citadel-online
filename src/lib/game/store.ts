import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import path from "node:path";
import type { Game } from "./types";
const globals = globalThis as unknown as { citadelDB?: DatabaseSync };
function database() {
  if (!globals.citadelDB) {
    const dir =
      process.env.CITADEL_DATA_DIR ?? path.join(process.cwd(), ".data");
    mkdirSync(dir, { recursive: true });
    const db = new DatabaseSync(path.join(dir, "citadel.sqlite"));
    db.exec(
      "PRAGMA journal_mode=WAL; PRAGMA busy_timeout=5000; CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, state TEXT NOT NULL, updated INTEGER NOT NULL);",
    );
    globals.citadelDB = db;
  }
  return globals.citadelDB;
}
export function insertGame(g: Game) {
  database()
    .prepare("INSERT INTO rooms VALUES (?, ?, ?)")
    .run(g.code, JSON.stringify(g), Date.now());
}
export function transact<T>(code: string, fn: (g: Game) => T): T {
  const db = database();
  db.exec("BEGIN IMMEDIATE");
  try {
    const row = db.prepare("SELECT state FROM rooms WHERE code=?").get(code) as
      { state: string } | undefined;
    if (!row) throw new Error("Table not found. Check your invite code.");
    const game = JSON.parse(row.state) as Game;
    const result = fn(game);
    const serialized = JSON.stringify(game);
    if (serialized !== row.state) {
      db.prepare("UPDATE rooms SET state=?, updated=? WHERE code=?").run(
        serialized,
        Date.now(),
        code,
      );
    }
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
export function gamesFor(id: string) {
  const rows = database()
    .prepare(
      `SELECT state FROM rooms WHERE EXISTS (
      SELECT 1 FROM json_each(rooms.state, '$.players') AS player
      WHERE json_extract(player.value, '$.id') = ?
      AND json_extract(player.value, '$.bot') = 0
    ) ORDER BY updated DESC`,
    )
    .all(id) as { state: string }[];
  return rows.map((r) => JSON.parse(r.state) as Game);
}
