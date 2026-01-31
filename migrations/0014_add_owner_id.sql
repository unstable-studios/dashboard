-- Migration: Add owner_id column to support user-specific content
-- Adds owner_id to categories, service_links, and documents tables
-- NULL owner_id indicates shared/global content visible to all users
-- Non-NULL owner_id indicates user-specific content created via onboarding

-- Add owner_id to categories
ALTER TABLE categories ADD COLUMN owner_id TEXT;

-- Add owner_id to service_links
ALTER TABLE service_links ADD COLUMN owner_id TEXT;

-- Add owner_id to documents
ALTER TABLE documents ADD COLUMN owner_id TEXT;

-- Create indexes for common owner-based queries
CREATE INDEX IF NOT EXISTS idx_categories_owner ON categories(owner_id);
CREATE INDEX IF NOT EXISTS idx_service_links_owner ON service_links(owner_id);
CREATE INDEX IF NOT EXISTS idx_documents_owner ON documents(owner_id);
