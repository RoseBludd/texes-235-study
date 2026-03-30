-- TExES 235 study app – PostgreSQL schema
-- Run via: psql $DATABASE_URL -f scripts/schema.sql (or use run-migrations.js)

CREATE TABLE IF NOT EXISTS sections (
  id TEXT PRIMARY KEY,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS segments (
  id TEXT PRIMARY KEY,
  section_id TEXT NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  color TEXT NOT NULL,
  icon TEXT NOT NULL,
  sort_order INT NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS questions (
  id TEXT PRIMARY KEY,
  segment_id TEXT NOT NULL REFERENCES segments(id) ON DELETE CASCADE,
  q TEXT NOT NULL,
  opts JSONB NOT NULL,
  ans SMALLINT NOT NULL CHECK (ans >= 0 AND ans <= 3),
  exp TEXT NOT NULL,
  is_custom BOOLEAN NOT NULL DEFAULT FALSE,
  client_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_questions_segment ON questions(segment_id);
CREATE INDEX IF NOT EXISTS idx_questions_custom ON questions(is_custom, client_id) WHERE is_custom = TRUE;

CREATE TABLE IF NOT EXISTS progress (
  client_id TEXT NOT NULL,
  segment_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  correct INT NOT NULL DEFAULT 0,
  streak INT NOT NULL DEFAULT 0,
  notes TEXT DEFAULT '',
  last_seen TIMESTAMPTZ,
  PRIMARY KEY (client_id, segment_id, question_id)
);

CREATE INDEX IF NOT EXISTS idx_progress_client ON progress(client_id);

CREATE TABLE IF NOT EXISTS daily (
  client_id TEXT NOT NULL,
  day DATE NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  correct INT NOT NULL DEFAULT 0,
  PRIMARY KEY (client_id, day)
);

CREATE INDEX IF NOT EXISTS idx_daily_client ON daily(client_id);
