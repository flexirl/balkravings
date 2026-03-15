-- Promo Banner Migration
-- Run this in your Supabase SQL Editor

ALTER TABLE settings
  ADD COLUMN IF NOT EXISTS banner_image TEXT,
  ADD COLUMN IF NOT EXISTS banner_enabled BOOLEAN NOT NULL DEFAULT false;
