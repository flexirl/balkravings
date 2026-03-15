-- ============================================================
-- HIGH-PRIORITY SECURITY FIXES (4, 5, 6)
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- FIX 4: Server-side coupon validation RPC
-- Prevents bypassing client-side coupon checks
-- ============================================================

CREATE OR REPLACE FUNCTION public.validate_coupon(
  p_coupon_code TEXT,
  p_subtotal NUMERIC
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_coupon RECORD;
  v_discount NUMERIC(10,2) := 0;
BEGIN
  -- Find active coupon
  SELECT * INTO v_coupon
  FROM public.coupons
  WHERE code = UPPER(p_coupon_code)
    AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid or expired coupon');
  END IF;

  -- Check expiry
  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon has expired');
  END IF;

  -- Check min order
  IF p_subtotal < v_coupon.min_order THEN
    RETURN jsonb_build_object(
      'valid', false,
      'error', 'Minimum order ₹' || v_coupon.min_order || ' required for this coupon'
    );
  END IF;

  -- Check usage limit
  IF v_coupon.usage_limit > 0 AND v_coupon.used_count >= v_coupon.usage_limit THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This coupon has reached its usage limit');
  END IF;

  -- Handle freebie type
  IF v_coupon.reward_type = 'freebie' THEN
    RETURN jsonb_build_object(
      'valid', true,
      'type', 'freebie',
      'freebie_name', COALESCE(v_coupon.freebie_name, 'Free item'),
      'code', v_coupon.code,
      'discount', 0
    );
  END IF;

  -- Calculate discount
  IF v_coupon.discount_type = 'percent' THEN
    v_discount := ROUND(p_subtotal * (v_coupon.discount_value / 100));
    IF v_coupon.max_discount > 0 THEN
      v_discount := LEAST(v_discount, v_coupon.max_discount);
    END IF;
  ELSE
    v_discount := v_coupon.discount_value;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'type', 'discount',
    'code', v_coupon.code,
    'discount', v_discount,
    'freebie_name', null
  );
END;
$$;


-- ============================================================
-- FIX 6: Quantity limit on order_items (max 20 per item)
-- Prevents absurd quantities like 99999
-- ============================================================

-- Add CHECK constraint (safe even if column already has a check for > 0)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints
    WHERE constraint_name = 'order_items_quantity_max'
  ) THEN
    ALTER TABLE public.order_items
      ADD CONSTRAINT order_items_quantity_max CHECK (quantity <= 20);
  END IF;
END $$;


-- ============================================================
-- FIX 5: Email verification note
-- ============================================================
-- This fix requires a MANUAL step in your Supabase Dashboard:
--
-- 1. Go to: Supabase Dashboard → Authentication → Settings
-- 2. Under "Email Auth", enable "Confirm email"
-- 3. Save
--
-- This ensures users must verify their email before they can
-- log in successfully. No SQL migration needed for this.
-- ============================================================
