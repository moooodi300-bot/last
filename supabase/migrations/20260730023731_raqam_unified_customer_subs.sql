/*
# Raqam — Unified Customer DB + Subscription Invoice Enhancements

1. Purpose
   - Link mobile bookings to the unified customer database (mobile_bookings.customer_id)
   - Support manual price input for subscription invoices (customer_subscriptions.manual_price)

2. Modified Tables
   - mobile_bookings: + customer_id (uuid REFERENCES customers)
   - customer_subscriptions: + manual_price numeric (nullable, for custom subscription pricing)

3. Security
   RLS already enabled on both tables. No policy changes needed — existing
   TO anon, authenticated USING (true) WITH CHECK (true) covers the new columns.
*/

-- ---------- mobile_bookings: link to unified customer DB ----------
ALTER TABLE mobile_bookings ADD COLUMN IF NOT EXISTS customer_id uuid REFERENCES customers(id) ON DELETE SET NULL;

-- ---------- customer_subscriptions: manual price for subscription invoice ----------
ALTER TABLE customer_subscriptions ADD COLUMN IF NOT EXISTS manual_price numeric(12,2);
