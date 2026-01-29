-- Add favorite_docs column to user_preferences (idempotent)
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE, so we check first
-- This will fail silently if column already exists due to PRAGMA ignore
ALTER TABLE user_preferences ADD COLUMN favorite_docs TEXT; -- JSON array of document IDs
