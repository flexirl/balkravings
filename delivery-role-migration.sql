-- ============================================================
-- DELIVERY BOY ROLE — Migration
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Update profiles role constraint to allow 'delivery'
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('user', 'admin', 'delivery'));

-- 2. RLS: Delivery boys can view out-for-delivery and delivered orders
CREATE POLICY "Delivery can view assigned orders"
  ON public.orders FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'delivery')
    AND order_status IN ('out-for-delivery', 'delivered')
  );

-- 3. RLS: Delivery boys can update order status (mark delivered)
CREATE POLICY "Delivery can update order status"
  ON public.orders FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'delivery')
    AND order_status = 'out-for-delivery'
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'delivery')
    AND order_status IN ('out-for-delivery', 'delivered')
  );

-- 4. RLS: Delivery boys can view order items for their visible orders
CREATE POLICY "Delivery can view order items"
  ON public.order_items FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders o
      JOIN public.profiles p ON p.id = auth.uid()
      WHERE o.id = order_items.order_id
      AND p.role = 'delivery'
      AND o.order_status IN ('out-for-delivery', 'delivered')
    )
  );
