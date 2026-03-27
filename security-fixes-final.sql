-- ============================================================
-- FINAL SECURITY FIXES — Run in Supabase SQL Editor
-- Fixes all ERRORs and WARNINGs from the database linter
-- ============================================================


-- ============================================================
-- FIX 1: Enable RLS on tables where it is disabled
-- (policies already exist but RLS is off — so they do nothing)
-- ============================================================

ALTER TABLE public.foods    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- FIX 2: coupon_usages — Remove always-true policies
-- Replace unconditional ALL policy with proper role-checked ones
-- ============================================================

-- Drop the bad catch-all policy
DROP POLICY IF EXISTS "Admin full access" ON public.coupon_usages;
DROP POLICY IF EXISTS "Admin full access for ALL" ON public.coupon_usages;

-- Users can read their own coupon usage
CREATE POLICY "Users can view own coupon usages"
  ON public.coupon_usages FOR SELECT
  USING (auth.uid() = user_id);

-- Only admins can insert/update/delete coupon usage records
CREATE POLICY "Admins can manage coupon usages"
  ON public.coupon_usages FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Allow server-side inserts via service role (bypasses RLS anyway)
-- This policy lets authenticated users insert their own usage entry
CREATE POLICY "Users can insert own coupon usage"
  ON public.coupon_usages FOR INSERT
  WITH CHECK (auth.uid() = user_id);


-- ============================================================
-- FIX 3: offer_cards — Remove always-true INSERT/UPDATE policies
-- Only admins should be able to modify offer cards
-- ============================================================

DROP POLICY IF EXISTS "Allow admin update" ON public.offer_cards;
DROP POLICY IF EXISTS "Allow admin insert" ON public.offer_cards;
DROP POLICY IF EXISTS "Admins can update offer cards" ON public.offer_cards;
DROP POLICY IF EXISTS "Admins can insert offer cards" ON public.offer_cards;
DROP POLICY IF EXISTS "Admins can delete offer cards" ON public.offer_cards;

CREATE POLICY "Admins can manage offer cards"
  ON public.offer_cards FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ============================================================
-- FIX 4: Fix mutable search_path on all functions
-- Prevents search_path injection attacks
-- ============================================================

ALTER FUNCTION public.check_order_rate_limit(UUID)
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.enforce_pending_payment()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.create_secure_order(UUID, TEXT, TEXT, TEXT, TEXT, TEXT, JSONB)
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.validate_coupon(TEXT, NUMERIC)
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.handle_new_user()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.is_admin()
  SET search_path = public, pg_catalog;

ALTER FUNCTION public.increment_coupon_usage(TEXT)
  SET search_path = public, pg_catalog;


-- ============================================================
-- MANUAL STEP (cannot be done via SQL):
-- Enable Leaked Password Protection
-- Go to: Dashboard → Authentication → Sign In / Security
-- Toggle ON: "Enable leaked password protection (HaveIBeenPwned)"
-- ============================================================


-- ============================================================
-- VERIFY: Check RLS is now enabled on all tables
-- Run this after the above — all should show TRUE
-- ============================================================

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
