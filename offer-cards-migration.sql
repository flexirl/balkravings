-- Offer Cards Migration
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS offer_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  position INT NOT NULL UNIQUE CHECK (position BETWEEN 1 AND 3),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  coupon_code TEXT,
  cta_text TEXT NOT NULL DEFAULT 'View Menu →',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Insert 3 default cards matching the current hardcoded content
INSERT INTO offer_cards (position, title, description, coupon_code, cta_text) VALUES
  (1, 'Flat 15% OFF', 'On your first order with us. Use code', 'KRAVINGS15', 'Claim Now →'),
  (2, 'Hostel Combo', 'Order for 4 or more and get 750ml Coke bottle absolutely free. Best for match nights!', NULL, 'Order Combo →'),
  (3, 'Free Ice Cream', 'Orders above ₹249 get a free Icecream. No coupon code required.', NULL, 'View Menu →')
ON CONFLICT (position) DO NOTHING;

-- Allow public read access
ALTER TABLE offer_cards ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read" ON offer_cards FOR SELECT USING (true);
CREATE POLICY "Allow admin update" ON offer_cards FOR UPDATE USING (true);
CREATE POLICY "Allow admin insert" ON offer_cards FOR INSERT WITH CHECK (true);
