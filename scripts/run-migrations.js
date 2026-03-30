const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { pool, getBareDatabaseUrl, applySslMode } = require("../lib/db");

async function ensureSchema(schema) {
  if (!schema || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) return;
  const bare = getBareDatabaseUrl();
  if (!bare) return;
  const connectionString = applySslMode(bare);
  const client = new Client({
    connectionString,
    ssl: connectionString?.startsWith("postgres://") ? undefined : { rejectUnauthorized: false },
  });
  await client.connect();
  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS ${schema}`);
    console.log(`Schema namespace "${schema}" is ready.`);
  } finally {
    await client.end();
  }
}

async function run() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is not set. Set it in .env or environment.");
    process.exit(1);
  }
  const schema = process.env.POSTGRES_SCHEMA?.trim();
  if (schema) {
    await ensureSchema(schema);
  }
  const sqlPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(sqlPath, "utf8");
  try {
    await pool.query(sql);
    console.log("Schema applied successfully.");
  } catch (err) {
    console.error("Migration failed:", err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

run();
