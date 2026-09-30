import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadEnvFile } from "node:process";
import { Client, neon, neonConfig } from "@neondatabase/serverless";
import { getDatabaseUrl, safeDatabaseError } from "../lib/database/config";

const command = process.argv[2];
const envArg = process.argv
  .slice(3)
  .find((value) => value.startsWith("--env="));
const envFile = envArg?.slice("--env=".length) ?? ".env.local";

async function check() {
  const sql = neon(getDatabaseUrl());
  const [result] =
    await sql`SELECT 1 AS connected, to_regclass('ejder_ai.leads') IS NOT NULL AS leads, to_regclass('ejder_ai.calls') IS NOT NULL AS calls, to_regclass('ejder_ai.reservation_drafts') IS NOT NULL AS drafts`;
  console.log("Neon PostgreSQL bağlantısı başarılı.");
  console.log(
    `Tablolar: leads=${result.leads ? "var" : "yok"}, calls=${result.calls ? "var" : "yok"}, reservation_drafts=${result.drafts ? "var" : "yok"}`,
  );
}

async function migrate() {
  const url = getDatabaseUrl();
  if (!existsSync(".vercel/project.json"))
    throw new Error("Project linkage required");
  const project = JSON.parse(await readFile(".vercel/project.json", "utf8"));
  if (project.projectName !== "ejder-ai")
    throw new Error("Unexpected linked project");
  if (!globalThis.WebSocket) throw new Error("Node.js 22 or newer required");
  neonConfig.webSocketConstructor = globalThis.WebSocket;
  const client = new Client({
    connectionString: url,
    connectionTimeoutMillis: 15000,
  });
  let connected = false;
  try {
    await client.connect();
    connected = true;
    await client.query("BEGIN");
    await client.query("SET LOCAL lock_timeout = '10s'");
    await client.query("SET LOCAL statement_timeout = '30s'");
    await client.query("SELECT pg_advisory_xact_lock(739014)");
    await client.query("CREATE SCHEMA IF NOT EXISTS ejder_ai");
    await client.query(
      "CREATE TABLE IF NOT EXISTS ejder_ai.schema_migrations (name text PRIMARY KEY, checksum text NOT NULL, applied_at timestamptz NOT NULL DEFAULT now())",
    );
    const directory = join(process.cwd(), "database/migrations");
    const files = (await readdir(directory))
      .filter((name) => /^\d+_[a-z0-9_]+\.sql$/.test(name))
      .sort();
    const applied: string[] = [];
    for (const name of files) {
      const content = await readFile(join(directory, name), "utf8");
      const checksum = createHash("sha256").update(content).digest("hex");
      const previous = await client.query(
        "SELECT checksum FROM ejder_ai.schema_migrations WHERE name = $1",
        [name],
      );
      if (previous.rowCount) {
        if (previous.rows[0].checksum !== checksum)
          throw new Error("Applied migration checksum mismatch");
        continue;
      }
      await client.query(content);
      await client.query(
        "INSERT INTO ejder_ai.schema_migrations (name, checksum) VALUES ($1, $2)",
        [name, checksum],
      );
      applied.push(name);
    }
    await client.query("COMMIT");
    console.log(
      applied.length
        ? `Uygulanan migration: ${applied.join(", ")}`
        : "Tablo şeması güncel; değişiklik yapılmadı.",
    );
  } catch (error) {
    if (connected) await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function main() {
  if (existsSync(envFile)) loadEnvFile(envFile);
  if (command === "check") await check();
  else if (command === "migrate") await migrate();
  else throw new Error("Unknown database command");
}

main().catch((error: unknown) => {
  console.error(safeDatabaseError(error));
  process.exitCode = 1;
});
