-- Reminders for calendar/task tracking
CREATE TABLE reminders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  rrule TEXT,                         -- RFC 5545 RRULE (e.g., "FREQ=QUARTERLY;BYMONTH=4,7,10,1;BYMONTHDAY=15")
  next_due TEXT NOT NULL,             -- ISO date of next occurrence
  advance_notice_days INTEGER DEFAULT 7,
  doc_id INTEGER REFERENCES documents(id) ON DELETE SET NULL,
  is_global INTEGER DEFAULT 0,        -- 0=user-specific, 1=org-wide
  owner_id TEXT NOT NULL,             -- Auth0 sub of creator
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Calendar subscription tokens for iCal feeds
CREATE TABLE calendar_tokens (
  user_id TEXT PRIMARY KEY,
  token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX idx_reminders_owner ON reminders(owner_id);
CREATE INDEX idx_reminders_global ON reminders(is_global);
CREATE INDEX idx_reminders_next_due ON reminders(next_due);
CREATE INDEX idx_reminders_doc ON reminders(doc_id);
CREATE INDEX idx_calendar_tokens_token ON calendar_tokens(token);
