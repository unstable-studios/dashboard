-- Default categories
INSERT INTO categories (name, slug, icon, color, sort_order) VALUES
  ('Finance', 'finance', '💰', 'green', 1),
  ('HR & Payroll', 'hr', '👥', 'blue', 2),
  ('Development', 'dev', '💻', 'purple', 3),
  ('Operations', 'ops', '⚙️', 'orange', 4),
  ('Communication', 'comms', '💬', 'cyan', 5);

-- Example service links
INSERT INTO service_links (title, description, url, icon, category_id, is_pinned, sort_order) VALUES
  ('QuickBooks', 'Accounting & invoicing', 'https://quickbooks.intuit.com', '📊', 1, 1, 1),
  ('Gusto', 'Payroll & benefits', 'https://gusto.com', '💵', 2, 1, 1),
  ('GitHub', 'Code repositories', 'https://github.com/unstable-studios', '🐙', 3, 1, 1),
  ('Slack', 'Team communication', 'https://unstablestudios.slack.com', '💬', 5, 1, 1);

-- Initial admin
INSERT INTO admin_users (email, added_by) VALUES
  ('mike@unstablestudios.com', 'system');
