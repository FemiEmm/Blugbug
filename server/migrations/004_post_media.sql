CREATE TABLE IF NOT EXISTS post_media (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL UNIQUE,
  public_url TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  caption TEXT NOT NULL DEFAULT '',
  mime_type TEXT NOT NULL,
  byte_size INTEGER NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_post_media_post_id ON post_media(post_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_media_user_id ON post_media(user_id, created_at);
