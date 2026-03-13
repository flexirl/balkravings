-- ============================================================
-- Setup Supabase Storage bucket for food images
-- AND enable Realtime for foods & settings tables
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Create the storage bucket (public so images can be viewed by anyone)
INSERT INTO storage.buckets (id, name, public)
VALUES ('food-images', 'food-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS Policies
CREATE POLICY "Admins can upload food images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'food-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Anyone can view food images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'food-images');

CREATE POLICY "Admins can delete food images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'food-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admins can update food images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'food-images'
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Fix foods table RLS — add WITH CHECK for INSERT
DROP POLICY IF EXISTS "Admins can manage foods" ON public.foods;

CREATE POLICY "Admins can manage foods"
  ON public.foods FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 4. Enable Realtime for foods and settings tables (safe — skips if already added)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'foods'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.foods;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'settings'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.settings;
  END IF;
END $$;

-- 5. Atomic coupon increment function (fixes race condition)
CREATE OR REPLACE FUNCTION public.increment_coupon_usage(coupon_code TEXT)
RETURNS void AS $$
BEGIN
  UPDATE public.coupons
  SET used_count = used_count + 1
  WHERE code = coupon_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
