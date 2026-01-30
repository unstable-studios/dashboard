-- Per-user snooze/ignore state for each reminder occurrence
CREATE TABLE IF NOT EXISTS reminder_user_state (
  user_id TEXT NOT NULL,
  reminder_id INTEGER NOT NULL,
  occurrence_date TEXT NOT NULL,
  snoozed INTEGER DEFAULT 0,
  ignored INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (reminder_id) REFERENCES reminders(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, reminder_id, occurrence_date)
);

-- One-click email action tokens (no login required)
CREATE TABLE IF NOT EXISTS email_action_tokens (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  reminder_id INTEGER NOT NULL,
  occurrence_date TEXT NOT NULL,
  action TEXT NOT NULL,
  expires_at TEXT NOT NULL,
  used_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_email_tokens_expires ON email_action_tokens(expires_at);

-- Track last email sent to avoid duplicates
CREATE TABLE IF NOT EXISTS reminder_email_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  reminder_id INTEGER NOT NULL,
  occurrence_date TEXT NOT NULL,
  sent_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, reminder_id, occurrence_date, sent_at)
);

-- Add timezone and email prefs to user_preferences
ALTER TABLE user_preferences ADD COLUMN timezone TEXT DEFAULT 'America/Los_Angeles';
ALTER TABLE user_preferences ADD COLUMN email_notifications INTEGER DEFAULT 1;
ALTER TABLE user_preferences ADD COLUMN email TEXT;
