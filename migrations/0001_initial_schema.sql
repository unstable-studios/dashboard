-- Categories for organizing links and documents
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  color TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Service links (bookmarks to external services)
CREATE TABLE IF NOT EXISTS service_links (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT,
  url TEXT NOT NULL,
  icon TEXT,
  icon_type TEXT DEFAULT 'emoji', -- 'emoji', 'url', 'lucide'
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  is_pinned INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Business process documents
CREATE TABLE IF NOT EXISTS documents (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  content TEXT, -- markdown content
  excerpt TEXT,
  category_id INTEGER REFERENCES categories(id) ON DELETE SET NULL,
  external_url TEXT, -- for linking to external docs (OneDrive, etc.)
  external_type TEXT, -- 'onedrive', 'google', 'notion', etc.
  is_published INTEGER DEFAULT 1,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT,
  updated_by TEXT
);

-- Admin users (email allowlist)
CREATE TABLE IF NOT EXISTS admin_users (
  email TEXT PRIMARY KEY,
  added_by TEXT,
  added_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  user_id TEXT PRIMARY KEY,
  theme TEXT DEFAULT 'system', -- 'light', 'dark', 'system'
  favorite_links TEXT, -- JSON array of link IDs
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_links_category ON service_links(category_id);
CREATE INDEX IF NOT EXISTS idx_links_pinned ON service_links(is_pinned);
CREATE INDEX IF NOT EXISTS idx_docs_category ON documents(category_id);
CREATE INDEX IF NOT EXISTS idx_docs_published ON documents(is_published);
CREATE INDEX IF NOT EXISTS idx_docs_slug ON documents(slug);
