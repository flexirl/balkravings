-- ============================================================
-- ANTI-SPAM: User Blacklisting
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Add blocked columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS block_reason TEXT DEFAULT NULL;

-- 2. RLS policy: blocked users cannot insert orders
CREATE POLICY "Blocked users cannot place orders"
  ON public.orders FOR INSERT
  WITH CHECK (
    NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND is_blocked = true
    )
  );

-- 3. Allow admins to update any profile (for blocking)
-- Drop if exists to avoid conflict, then recreate
DO $$
BEGIN
  -- Try to create the policy; if it already exists, just skip
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'profiles' AND policyname = 'Admins can update all profiles'
  ) THEN
    EXECUTE 'CREATE POLICY "Admins can update all profiles"
      ON public.profiles FOR UPDATE
      USING (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = ''admin'')
      )';
  END IF;
END $$;
