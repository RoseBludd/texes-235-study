const { Pool } = require("pg");

const isProd = process.env.NODE_ENV === "production";

/** Normalize .env quoting and stray escape sequences. */
function normalizeDatabaseUrl(raw) {
  if (!raw) return null;
  let url = String(raw).trim().replace(/\\r\\n/g, "").replace(/\r?\n/g, "");
  if ((url.startsWith('"') && url.endsWith('"')) || (url.startsWith("'") && url.endsWith("'"))) {
    url = url.slice(1, -1).trim();
  }
  return url;
}

/** Bare URL for creating schema (no search_path). */
function getBareDatabaseUrl() {
  return normalizeDatabaseUrl(process.env.DATABASE_URL);
}

/**
 * Optional POSTGRES_SCHEMA isolates this app (e.g. texes235) on a shared Neon DB
 * without touching tables in public — other apps keep using public.
 */
function withSearchPath(url, schema) {
  if (!schema || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(schema)) return url;
  const opt = encodeURIComponent(`-c search_path=${schema},public`);
  const sep = url.includes("?") ? "&" : "?";
  if (url.includes("options=")) return url;
  return `${url}${sep}options=${opt}`;
}

function applySslMode(url) {
  if (url && url.includes("sslmode=require")) {
    return url.replace("sslmode=require", "sslmode=verify-full");
  }
  return url;
}

function buildPoolConnectionString() {
  let url = getBareDatabaseUrl();
  if (!url) return null;
  const schema = process.env.POSTGRES_SCHEMA?.trim();
  url = withSearchPath(url, schema);
  return applySslMode(url);
}

const pool =
  process.env.DATABASE_URL &&
  (() => {
    const connectionString = buildPoolConnectionString();
    if (!connectionString) return null;
    const poolConfig = {
      connectionString,
      ssl: connectionString?.startsWith("postgres://")
        ? undefined
        : { rejectUnauthorized: false },
    };
    if (isProd) {
      poolConfig.max = 10;
      poolConfig.idleTimeoutMillis = 30000;
    } else {
      poolConfig.max = 1;
    }
    return new Pool(poolConfig);
  })();

async function query(text, params) {
  if (!pool) {
    const err = new Error("DATABASE_URL is not set");
    err.code = "NO_DATABASE";
    throw err;
  }
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  if (process.env.NODE_ENV === "development" && duration > 50) {
    console.log("db query", { text: text.slice(0, 60), duration, rows: res.rowCount });
  }
  return res;
}

module.exports = { query, pool, getBareDatabaseUrl, applySslMode };
