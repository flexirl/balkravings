-- ============================================================
-- ANTI-SPAM: Order Rate Limiting RPC Function
-- Run this in Supabase SQL Editor
-- ============================================================

-- Returns JSON: { "allowed": true/false, "reason": "...", "wait_seconds": 0 }
CREATE OR REPLACE FUNCTION public.check_order_rate_limit(user_uuid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  cooldown_minutes INT := 2;       -- Must wait 2 min between orders
  daily_cap INT := 5;              -- Max 5 orders per day
  last_order_at TIMESTAMPTZ;
  seconds_since_last INT;
  orders_today INT;
BEGIN
  -- 1. Check cooldown: find user's most recent order
  SELECT created_at INTO last_order_at
  FROM public.orders
  WHERE user_id = user_uuid
  ORDER BY created_at DESC
  LIMIT 1;

  IF last_order_at IS NOT NULL THEN
    seconds_since_last := EXTRACT(EPOCH FROM (now() - last_order_at))::INT;
    IF seconds_since_last < (cooldown_minutes * 60) THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'cooldown',
        'wait_seconds', (cooldown_minutes * 60) - seconds_since_last
      );
    END IF;
  END IF;

  -- 2. Check daily cap: count orders placed today (IST timezone)
  SELECT COUNT(*) INTO orders_today
  FROM public.orders
  WHERE user_id = user_uuid
    AND created_at >= (now() AT TIME ZONE 'Asia/Kolkata')::date AT TIME ZONE 'Asia/Kolkata';

  IF orders_today >= daily_cap THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'reason', 'daily_limit',
      'wait_seconds', 0
    );
  END IF;

  -- All checks passed
  RETURN jsonb_build_object(
    'allowed', true,
    'reason', '',
    'wait_seconds', 0
  );
END;
$$;
