-- Seed data migration - only runs if tables are empty
-- This ensures seed data is only added for fresh databases

-- Default categories (only if categories table is empty)
INSERT INTO categories (name, slug, icon, color, sort_order)
SELECT 'Finance', 'finance', '💰', 'green', 1
WHERE NOT EXISTS (SELECT 1 FROM categories LIMIT 1);

INSERT INTO categories (name, slug, icon, color, sort_order)
SELECT 'HR & Payroll', 'hr', '👥', 'blue', 2
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'hr');

INSERT INTO categories (name, slug, icon, color, sort_order)
SELECT 'Development', 'dev', '💻', 'purple', 3
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'dev');

INSERT INTO categories (name, slug, icon, color, sort_order)
SELECT 'Operations', 'ops', '⚙️', 'orange', 4
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'ops');

INSERT INTO categories (name, slug, icon, color, sort_order)
SELECT 'Communication', 'comms', '💬', 'cyan', 5
WHERE NOT EXISTS (SELECT 1 FROM categories WHERE slug = 'comms');

-- Example service links (only if service_links table is empty)
INSERT INTO service_links (title, description, url, icon, category_id, is_pinned, sort_order)
SELECT 'QuickBooks', 'Accounting & invoicing', 'https://quickbooks.intuit.com', '📊',
       (SELECT id FROM categories WHERE slug = 'finance'), 1, 1
WHERE NOT EXISTS (SELECT 1 FROM service_links LIMIT 1);

INSERT INTO service_links (title, description, url, icon, category_id, is_pinned, sort_order)
SELECT 'Gusto', 'Payroll & benefits', 'https://gusto.com', '💵',
       (SELECT id FROM categories WHERE slug = 'hr'), 1, 2
WHERE NOT EXISTS (SELECT 1 FROM service_links WHERE url = 'https://gusto.com');

INSERT INTO service_links (title, description, url, icon, category_id, is_pinned, sort_order)
SELECT 'GitHub', 'Code repositories', 'https://github.com/unstable-studios', '🐙',
       (SELECT id FROM categories WHERE slug = 'dev'), 1, 3
WHERE NOT EXISTS (SELECT 1 FROM service_links WHERE url = 'https://github.com/unstable-studios');

INSERT INTO service_links (title, description, url, icon, category_id, is_pinned, sort_order)
SELECT 'Slack', 'Team communication', 'https://unstablestudios.slack.com', '💬',
       (SELECT id FROM categories WHERE slug = 'comms'), 1, 4
WHERE NOT EXISTS (SELECT 1 FROM service_links WHERE url = 'https://unstablestudios.slack.com');

-- Initial admin (only if admin_users table is empty)
INSERT INTO admin_users (email, added_by)
SELECT 'mike@unstablestudios.com', 'system'
WHERE NOT EXISTS (SELECT 1 FROM admin_users LIMIT 1);
