-- Add favorite_docs column to user_preferences
-- SQLite doesn't support IF NOT EXISTS for ALTER TABLE in this context
-- Note: this will raise an error if the column already exists; the CI/CD script detects and tolerates this specific error
ALTER TABLE user_preferences ADD COLUMN favorite_docs TEXT; -- JSON array of document IDs
