#!/usr/bin/env node
/**
 * Deploy-time database migrator (node-postgres, `pg`).
 *
 * Runs during `npm run build` on every Vercel deploy, applying pending files
 * in ../migrations to DATABASE_URL. Each file runs in a transaction and is
 * recorded in `_migrations`, so it is applied only once.
 *
 * The non-recursive read excludes opt-in auth migrations under migrations/auth/.
 * With no DATABASE_URL, local / preview builds skip remote migrations.
 *
 * When DATABASE_URL is set, SUPABASE_DB_CA_BASE64 must contain the base64
 * encoding of the PEM CA certificate downloaded from the Supabase project's
 * Database Settings > SSL Configuration. The certificate is not a password.
 * Connections verify both certificate chain and server hostname; do not set
 * NODE_TLS_REJECT_UNAUTHORIZED=0 or rejectUnauthorized=false.
 */
import { readdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import pg from "pg";
import { pendingMigrations } from "./migration-plan.mjs";

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  console.log("[migrate] DATABASE_URL not set — skipping (the PGLite fallback migrates itself).");
  process.exit(0);
}

const migrationsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "migrations");

function verifiedDatabaseConnection() {
  const encodedCa = process.env.SUPABASE_DB_CA_BASE64;
  if (!encodedCa) {
    throw new Error(
      "SUPABASE_DB_CA_BASE64 is required when DATABASE_URL is set. Download the CA from Supabase Database Settings > SSL Configuration and configure it in Vercel.",
    );
  }

  const ca = Buffer.from(encodedCa.replace(/\s/g, ""), "base64").toString("utf8");
  if (!ca.includes("-----BEGIN CERTIFICATE-----") || !ca.includes("-----END CERTIFICATE-----")) {
    throw new Error("SUPABASE_DB_CA_BASE64 does not contain a valid PEM certificate block.");
  }

  const url = new URL(databaseUrl);
  if (url.protocol !== "postgresql:" && url.protocol !== "postgres:") {
    throw new Error("DATABASE_URL must use a PostgreSQL connection URL.");
  }
  // node-postgres / pg-connection-string may override an explicit ssl object
  // when sslmode/sslrootcert/etc. are present in the connection URL.
  // Supply the CA and hostname verification via the explicit TLS options.
  for (const key of ["sslmode", "sslrootcert", "sslcert", "sslkey"]) {
    url.searchParams.delete(key);
  }

  return {
    connectionString: url.toString(),
    max: 1,
    ssl: { ca, rejectUnauthorized: true, servername: url.hostname },
  };
}

async function main() {
  let entries;
  try {
    entries = await readdir(migrationsDir);
  } catch {
    console.log("[migrate] no migrations/ directory — nothing to do.");
    return;
  }
  if (pendingMigrations(entries, []).length === 0) {
    console.log("[migrate] no migrations — nothing to do.");
    return;
  }

  const pool = new pg.Pool(verifiedDatabaseConnection());
  let client;
  try {
    client = await pool.connect();
    await client.query(
      "CREATE TABLE IF NOT EXISTS _migrations (name TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT now())",
    );
    const applied = (await client.query("SELECT name FROM _migrations")).rows.map(
      (r) => r.name,
    );

    let count = 0;
    for (const { name } of pendingMigrations(entries, applied)) {
      const text = await readFile(join(migrationsDir, name), "utf8");
      try {
        await client.query("BEGIN");
        await client.query(text);
        await client.query("INSERT INTO _migrations (name) VALUES ($1)", [name]);
        await client.query("COMMIT");
      } catch (err) {
        console.error(`[migrate] error applying ${name}`);
        try {
          await client.query("ROLLBACK");
        } catch {
          // Preserve the original error if the connection has died.
        }
        throw err;
      }
      console.log(`[migrate] applied ${name}`);
      count += 1;
    }
    console.log(count ? `[migrate] done — ${count} migration(s) applied.` : "[migrate] up to date.");
  } finally {
    if (client) client.release();
    await pool.end();
  }
}

main().catch((err) => {
  console.error("[migrate] failed:", err?.message || err);
  for (const key of ["code", "detail", "hint", "position", "where"]) {
    if (err?.[key] != null) console.error(`[migrate]   ${key}: ${err[key]}`);
  }
  process.exit(1);
});
