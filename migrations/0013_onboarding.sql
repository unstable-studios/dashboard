-- Migration: Add onboarding tracking to user_preferences
-- Tracks whether a user has completed the initial onboarding flow

ALTER TABLE user_preferences ADD COLUMN onboarding_completed INTEGER DEFAULT 0;
ALTER TABLE user_preferences ADD COLUMN onboarding_completed_at TEXT;
