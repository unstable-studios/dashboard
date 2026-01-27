-- Add favorite_docs column to user_preferences
ALTER TABLE user_preferences ADD COLUMN favorite_docs TEXT; -- JSON array of document IDs
