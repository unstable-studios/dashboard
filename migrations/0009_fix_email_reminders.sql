-- Fix database schema issues from 0008_email_reminders.sql

-- 1. Fix UNIQUE constraint in reminder_email_log to prevent duplicate emails
--    Remove sent_at from the constraint since we only care about one email per occurrence
DROP INDEX IF EXISTS sqlite_autoindex_reminder_email_log_1;

CREATE UNIQUE INDEX IF NOT EXISTS idx_reminder_email_log_unique
  ON reminder_email_log(user_id, reminder_id, occurrence_date);

-- 2. Add index for reminder_user_state queries to optimize lookups
CREATE INDEX IF NOT EXISTS idx_reminder_user_state_user_reminder_date
  ON reminder_user_state(user_id, reminder_id, occurrence_date);

-- 3. Add CHECK constraint for mutually exclusive snoozed/ignored states
--    Note: SQLite doesn't support adding CHECK constraints to existing tables,
--    so we need to recreate the table

-- Save existing data
CREATE TABLE IF NOT EXISTS reminder_user_state_backup AS
  SELECT * FROM reminder_user_state;

-- Drop old table
DROP TABLE reminder_user_state;

-- Recreate table with CHECK constraint
CREATE TABLE IF NOT EXISTS reminder_user_state (
  user_id TEXT NOT NULL,
  reminder_id INTEGER NOT NULL,
  occurrence_date TEXT NOT NULL,
  snoozed INTEGER DEFAULT 0,
  ignored INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE,
  CHECK (NOT (snoozed = 1 AND ignored = 1)),
  PRIMARY KEY (user_id, reminder_id, occurrence_date)
);

-- Restore data, ensuring no rows violate the new constraint
INSERT INTO reminder_user_state (user_id, reminder_id, occurrence_date, snoozed, ignored, created_at)
SELECT user_id, reminder_id, occurrence_date,
       CASE WHEN snoozed = 1 AND ignored = 1 THEN 0 ELSE snoozed END,
       ignored,
       created_at
FROM reminder_user_state_backup;

-- Drop backup table
DROP TABLE reminder_user_state_backup;

-- Recreate index for reminder_user_state
CREATE INDEX IF NOT EXISTS idx_reminder_user_state_user_reminder_date
  ON reminder_user_state(user_id, reminder_id, occurrence_date);
