/*
# Raqam — Brand, Payment, and Subscription Enhancements

1. Purpose
   Adds dynamic branding fields, split-payment support, and subscription
   wash-tracking columns that the frontend already expects.

2. Modified Tables
   - settings: + brand_color (text), brand_accent (text), language (text)
   - customer_subscriptions: + washes_remaining (int)
   - sales: + cash_amount (numeric), card_amount (numeric),
            customer_subscription_id (uuid FK)

3. Security
   No new tables. Existing RLS policies (TO anon, authenticated, USING true)
   already cover the new columns since they are FOR ALL policies.
*/

-- settings: branding + language
ALTER TABLE settings ADD COLUMN IF NOT EXISTS brand_color text NOT NULL DEFAULT '#0e7490';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS brand_accent text NOT NULL DEFAULT '#2563eb';
ALTER TABLE settings ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'ar';

-- customer_subscriptions: washes_remaining for live deduction tracking
ALTER TABLE customer_subscriptions ADD COLUMN IF NOT EXISTS washes_remaining int NOT NULL DEFAULT 0;

-- sales: split payment + subscription link
ALTER TABLE sales ADD COLUMN IF NOT EXISTS cash_amount numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS card_amount numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS customer_subscription_id uuid REFERENCES customer_subscriptions(id) ON DELETE SET NULL;

-- Backfill washes_remaining from the subscription definition for existing rows
DO $$
BEGIN
  UPDATE customer_subscriptions cs
  SET washes_remaining = GREATEST(
    (SELECT s.washes_included FROM subscriptions s WHERE s.id = cs.subscription_id) - cs.washes_used,
    0
  )
  WHERE cs.washes_remaining = 0;
END $$;
