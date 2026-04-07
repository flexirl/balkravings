-- ============================================================
-- WALLET & CASHBACK SYSTEM MIGRATION
-- Run this in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. WALLETS TABLE (one row per user)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0 CHECK (balance >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- ============================================================
-- 2. WALLET TRANSACTIONS TABLE (audit log)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  amount NUMERIC(10,2) NOT NULL CHECK (amount > 0),
  reason TEXT NOT NULL,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ DEFAULT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_wallet_txn_user_id ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_txn_order_id ON public.wallet_transactions(order_id);

-- ============================================================
-- 3. ALTER COUPONS — add cashback fields
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'coupons' AND column_name = 'cashback_type'
  ) THEN
    ALTER TABLE public.coupons
      ADD COLUMN cashback_type TEXT CHECK (cashback_type IN ('percent', 'flat')) DEFAULT NULL,
      ADD COLUMN cashback_value NUMERIC(10,2) DEFAULT 0;
  END IF;
END $$;

-- ============================================================
-- 4. ALTER ORDERS — track wallet usage & pending cashback
-- ============================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'orders' AND column_name = 'wallet_deduction'
  ) THEN
    ALTER TABLE public.orders
      ADD COLUMN wallet_deduction NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN cashback_amount NUMERIC(10,2) DEFAULT 0,
      ADD COLUMN cashback_credited BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ============================================================
-- 5. RPC: credit_wallet
-- ============================================================
CREATE OR REPLACE FUNCTION public.credit_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reason TEXT,
  p_order_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_wallet_id UUID;
  v_new_balance NUMERIC;
  v_expires_at TIMESTAMPTZ;
  v_expiry_days INTEGER;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Read expiry days from admin settings (fallback to 90)
  SELECT COALESCE(wallet_expiry_days, 90) INTO v_expiry_days
  FROM public.settings
  LIMIT 1;

  IF v_expiry_days IS NULL THEN
    v_expiry_days := 90;
  END IF;

  v_expires_at := now() + (v_expiry_days || ' days')::INTERVAL;

  -- Upsert wallet row
  INSERT INTO public.wallets (user_id, balance, updated_at)
  VALUES (p_user_id, p_amount, now())
  ON CONFLICT (user_id)
  DO UPDATE SET
    balance = wallets.balance + p_amount,
    updated_at = now()
  RETURNING id, balance INTO v_wallet_id, v_new_balance;

  -- Log transaction
  INSERT INTO public.wallet_transactions (user_id, type, amount, reason, order_id, expires_at)
  VALUES (p_user_id, 'credit', p_amount, p_reason, p_order_id, v_expires_at);

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 6. RPC: debit_wallet
-- ============================================================
CREATE OR REPLACE FUNCTION public.debit_wallet(
  p_user_id UUID,
  p_amount NUMERIC,
  p_reason TEXT,
  p_order_id UUID DEFAULT NULL
)
RETURNS JSON AS $$
DECLARE
  v_current_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  IF p_amount <= 0 THEN
    RETURN json_build_object('success', false, 'error', 'Amount must be positive');
  END IF;

  -- Lock the wallet row
  SELECT balance INTO v_current_balance
  FROM public.wallets
  WHERE user_id = p_user_id
  FOR UPDATE;

  IF v_current_balance IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'No wallet found');
  END IF;

  IF v_current_balance < p_amount THEN
    RETURN json_build_object('success', false, 'error', 'Insufficient balance');
  END IF;

  v_new_balance := v_current_balance - p_amount;

  UPDATE public.wallets
  SET balance = v_new_balance, updated_at = now()
  WHERE user_id = p_user_id;

  -- Log transaction
  INSERT INTO public.wallet_transactions (user_id, type, amount, reason, order_id)
  VALUES (p_user_id, 'debit', p_amount, p_reason, p_order_id);

  RETURN json_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 7. RPC: get_wallet_balance (with expired credits deducted)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_wallet_balance(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
  v_balance NUMERIC;
  v_expired NUMERIC;
BEGIN
  -- Calculate expired credits that haven't been accounted for
  SELECT COALESCE(SUM(amount), 0) INTO v_expired
  FROM public.wallet_transactions
  WHERE user_id = p_user_id
    AND type = 'credit'
    AND expires_at IS NOT NULL
    AND expires_at < now()
    AND id NOT IN (
      -- Exclude credits that have a matching expiry-debit
      SELECT order_id FROM public.wallet_transactions
      WHERE user_id = p_user_id AND type = 'debit' AND reason = 'Wallet credit expired'
      AND order_id IS NOT NULL
    );

  -- If there are expired credits, debit them
  IF v_expired > 0 THEN
    UPDATE public.wallets
    SET balance = GREATEST(balance - v_expired, 0), updated_at = now()
    WHERE user_id = p_user_id;

    INSERT INTO public.wallet_transactions (user_id, type, amount, reason)
    VALUES (p_user_id, 'debit', v_expired, 'Wallet credit expired');
  END IF;

  SELECT COALESCE(balance, 0) INTO v_balance
  FROM public.wallets
  WHERE user_id = p_user_id;

  RETURN json_build_object('balance', COALESCE(v_balance, 0));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. TRIGGER: Auto-credit cashback when order delivered
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_order_delivered_cashback()
RETURNS TRIGGER AS $$
DECLARE
  v_result JSON;
BEGIN
  -- Only fire when status changes to 'delivered'
  IF NEW.order_status = 'delivered'
     AND OLD.order_status IS DISTINCT FROM 'delivered'
     AND NEW.cashback_amount > 0
     AND NEW.cashback_credited = false
  THEN
    -- Credit the wallet
    SELECT public.credit_wallet(
      NEW.user_id,
      NEW.cashback_amount,
      'Coupon cashback — Order #' || LEFT(NEW.id::text, 8),
      NEW.id
    ) INTO v_result;

    -- Mark as credited
    NEW.cashback_credited := true;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_order_delivered_cashback ON public.orders;

CREATE TRIGGER trg_order_delivered_cashback
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_order_delivered_cashback();

-- ============================================================
-- 9. ROW LEVEL SECURITY
-- ============================================================

-- WALLETS
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON public.wallets FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all wallets"
  ON public.wallets FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- No direct INSERT/UPDATE/DELETE for users — only via RPCs (SECURITY DEFINER)

-- WALLET TRANSACTIONS
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions"
  ON public.wallet_transactions FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ============================================================
-- 10. ENABLE REALTIME for wallets table
-- ============================================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.wallets;
