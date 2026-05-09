-- src/db/migrations/init.sql
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'text',
  raw_content TEXT,
  file_path TEXT,
  created_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS context_envelopes (
  id TEXT PRIMARY KEY,
  note_id TEXT NOT NULL,
  session_id TEXT,
  source_domain TEXT,
  focused_app TEXT,
  open_tabs TEXT,
  captured_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS connections (
  id TEXT PRIMARY KEY,
  note_a TEXT NOT NULL,
  note_b TEXT NOT NULL,
  strength REAL NOT NULL DEFAULT 0,
  updated_at INTEGER NOT NULL
);

ALTER TABLE notes ADD COLUMN file_name TEXT;
ALTER TABLE notes ADD COLUMN mime_type TEXT;