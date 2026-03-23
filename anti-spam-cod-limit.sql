-- ============================================================
-- ANTI-SPAM FIX: Maximum COD Order Limit
-- Run this in your Supabase SQL Editor to apply the ₹3000 limit
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_secure_order(
  p_user_id UUID,
  p_delivery_address TEXT,
  p_customer_name TEXT,
  p_customer_phone TEXT,
  p_freebie_item TEXT DEFAULT NULL,
  p_coupon_code TEXT DEFAULT NULL,
  p_items JSONB DEFAULT '[]'::JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
  v_subtotal NUMERIC(10,2) := 0;
  v_delivery_fee NUMERIC(10,2);
  v_gst_percent NUMERIC(5,2);
  v_free_delivery_above NUMERIC(10,2);
  v_actual_delivery_fee NUMERIC(10,2);
  v_tax NUMERIC(10,2);
  v_coupon_discount NUMERIC(10,2) := 0;
  v_grand_total NUMERIC(10,2);
  v_item JSONB;
  v_food RECORD;
  v_coupon RECORD;
BEGIN
  -- Validate user is not blocked
  IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id AND is_blocked = true) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Your account has been suspended');
  END IF;

  -- Validate items array is not empty
  IF jsonb_array_length(p_items) = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'No items in order');
  END IF;

  -- Calculate subtotal from actual database prices
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, price, availability, image INTO v_food
    FROM public.foods
    WHERE id = (v_item ->> 'food_id')::UUID;

    IF NOT FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'Food item not found: ' || (v_item ->> 'food_id'));
    END IF;

    IF NOT v_food.availability THEN
      RETURN jsonb_build_object('success', false, 'error', v_food.name || ' is currently unavailable');
    END IF;

    -- Validate quantity (1-20)
    IF (v_item ->> 'quantity')::INT < 1 OR (v_item ->> 'quantity')::INT > 20 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Invalid quantity for ' || v_food.name);
    END IF;

    v_subtotal := v_subtotal + (v_food.price * (v_item ->> 'quantity')::INT);
  END LOOP;

  -- Get settings for delivery fee and GST
  SELECT delivery_fee, gst_percent, free_delivery_above
  INTO v_delivery_fee, v_gst_percent, v_free_delivery_above
  FROM public.settings
  LIMIT 1;

  -- Calculate delivery fee
  IF v_free_delivery_above > 0 AND v_subtotal >= v_free_delivery_above THEN
    v_actual_delivery_fee := 0;
  ELSE
    v_actual_delivery_fee := COALESCE(v_delivery_fee, 40);
  END IF;

  -- Calculate tax
  v_tax := ROUND(v_subtotal * (COALESCE(v_gst_percent, 5) / 100));

  -- Validate and apply coupon if provided
  IF p_coupon_code IS NOT NULL AND p_coupon_code != '' THEN
    SELECT * INTO v_coupon
    FROM public.coupons
    WHERE code = UPPER(p_coupon_code)
      AND is_active = true;

    IF FOUND THEN
      IF v_coupon.expires_at IS NULL OR v_coupon.expires_at > now() THEN
        IF v_coupon.usage_limit = 0 OR v_coupon.used_count < v_coupon.usage_limit THEN
          IF v_subtotal >= v_coupon.min_order THEN
            IF v_coupon.reward_type IS DISTINCT FROM 'freebie' THEN
              IF v_coupon.discount_type = 'percent' THEN
                v_coupon_discount := ROUND(v_subtotal * (v_coupon.discount_value / 100));
                IF v_coupon.max_discount > 0 THEN
                  v_coupon_discount := LEAST(v_coupon_discount, v_coupon.max_discount);
                END IF;
              ELSE
                v_coupon_discount := v_coupon.discount_value;
              END IF;
            END IF;
            UPDATE public.coupons SET used_count = used_count + 1 WHERE id = v_coupon.id;
          END IF;
        END IF;
      END IF;
    END IF;
  END IF;

  -- Calculate grand total (never below 0)
  v_grand_total := GREATEST(0, v_subtotal + v_actual_delivery_fee + v_tax - v_coupon_discount);

  -- [ANTI-SPAM FIX]: Reject COD orders above ₹3000
  IF v_subtotal > 3000 THEN
    RETURN jsonb_build_object('success', false, 'error', 'For security reasons, Cash on Delivery orders are limited to ₹3000. For bulk orders, please contact us on WhatsApp!');
  END IF;

  -- Create the order with server-calculated total
  INSERT INTO public.orders (
    user_id, total_amount, payment_status, order_status,
    delivery_address, customer_name, customer_phone,
    phone_verified, payment_method, freebie_item
  ) VALUES (
    p_user_id, v_grand_total, 'pending', 'placed',
    p_delivery_address, p_customer_name, p_customer_phone,
    true, 'cod', p_freebie_item
  )
  RETURNING id INTO v_order_id;

  -- Insert order items with verified prices from DB
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    SELECT id, name, price, image INTO v_food
    FROM public.foods
    WHERE id = (v_item ->> 'food_id')::UUID;

    INSERT INTO public.order_items (order_id, food_id, name, price, quantity, image)
    VALUES (
      v_order_id,
      v_food.id::TEXT,
      v_food.name,
      v_food.price,
      (v_item ->> 'quantity')::INT,
      COALESCE(v_food.image, '')
    );
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'order_id', v_order_id,
    'total', v_grand_total
  );
END;
$$;
