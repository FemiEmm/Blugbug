PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS paragraph_questions (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  paragraph_index INTEGER NOT NULL CHECK (paragraph_index >= 0),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (length(trim(body)) BETWEEN 1 AND 1000),
  author_response TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS paragraph_questions_post_idx
  ON paragraph_questions(post_id, paragraph_index, created_at);
