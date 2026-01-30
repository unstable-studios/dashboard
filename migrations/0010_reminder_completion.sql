-- Add completed tracking to existing per-occurrence state table
ALTER TABLE reminder_user_state ADD COLUMN completed INTEGER DEFAULT 0;
ALTER TABLE reminder_user_state ADD COLUMN actioned_at TEXT;

-- Index for efficient history queries
CREATE INDEX IF NOT EXISTS idx_reminder_state_actioned
  ON reminder_user_state(user_id, actioned_at)
  WHERE completed = 1 OR ignored = 1;
