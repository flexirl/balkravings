-- Freebie Coupons Migration
-- Run this in your Supabase SQL Editor

-- 1. Add freebie columns to coupons table
ALTER TABLE coupons
  ADD COLUMN IF NOT EXISTS reward_type TEXT NOT NULL DEFAULT 'discount',
  ADD COLUMN IF NOT EXISTS freebie_name TEXT;

-- 2. Add freebie_item column to orders table
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS freebie_item TEXT;

-- Done! Now freebie coupons can be created from the admin panel.
