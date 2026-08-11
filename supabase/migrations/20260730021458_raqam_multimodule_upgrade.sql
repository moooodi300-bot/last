/*
# Raqam — Multi-Module SaaS Upgrade

1. Purpose
   Adds infrastructure for: PIN authentication, multi-item purchase invoices
   with yield-per-car, sales refunds, car subscription details, and the
   complete Mobile/Fleet Wash module.

2. Modified Tables
   - staff: + pin_code (text), for POS shift login
   - sales: + refund_amount, is_refund, refund_method, original_sale_id
   - customer_subscriptions: + car_type, car_color, plate_number
   - inventory_items: + yield_per_car (numeric)

3. New Tables
   - purchase_invoices: header for multi-item supplier invoices
   - purchase_invoice_items: up to 10 line items per invoice, each with yield_per_car
   - mobile_vehicles: up to 10 fleet vehicles (plate, driver, phone)
   - mobile_services: up to 10 mobile-specific services with prices
   - mobile_subscriptions: monthly subscription plans for mobile services
   - mobile_bookings: timeline bookings linked to vehicles and services

4. Security
   All new tables get RLS with TO anon, authenticated USING (true) WITH CHECK (true)
   (single-tenant demo, no sign-in screen).
*/

-- ---------- staff: PIN ----------
ALTER TABLE staff ADD COLUMN IF NOT EXISTS pin_code text;

-- ---------- sales: refund fields ----------
ALTER TABLE sales ADD COLUMN IF NOT EXISTS refund_amount numeric(12,2) NOT NULL DEFAULT 0;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS is_refund boolean NOT NULL DEFAULT false;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS refund_method text;
ALTER TABLE sales ADD COLUMN IF NOT EXISTS original_sale_id uuid;

-- ---------- customer_subscriptions: car details ----------
ALTER TABLE customer_subscriptions ADD COLUMN IF NOT EXISTS car_type text;
ALTER TABLE customer_subscriptions ADD COLUMN IF NOT EXISTS car_color text;
ALTER TABLE customer_subscriptions ADD COLUMN IF NOT EXISTS plate_number text;

-- ---------- inventory_items: yield ----------
ALTER TABLE inventory_items ADD COLUMN IF NOT EXISTS yield_per_car numeric(10,2);

-- ---------- purchase_invoices ----------
CREATE TABLE IF NOT EXISTS purchase_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier text NOT NULL,
  invoice_date date NOT NULL DEFAULT now()::date,
  total numeric(14,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'opex',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE purchase_invoices ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_purchase_invoices" ON purchase_invoices;
CREATE POLICY "anon_all_purchase_invoices" ON purchase_invoices FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- purchase_invoice_items ----------
CREATE TABLE IF NOT EXISTS purchase_invoice_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES purchase_invoices(id) ON DELETE CASCADE,
  item_name text NOT NULL,
  qty numeric(12,2) NOT NULL DEFAULT 1,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  line_total numeric(14,2) NOT NULL DEFAULT 0,
  yield_per_car numeric(10,2) NOT NULL DEFAULT 0,
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE purchase_invoice_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_purchase_invoice_items" ON purchase_invoice_items;
CREATE POLICY "anon_all_purchase_invoice_items" ON purchase_invoice_items FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- mobile_vehicles ----------
CREATE TABLE IF NOT EXISTS mobile_vehicles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  plate_number text,
  driver_name text,
  driver_phone text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mobile_vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_mobile_vehicles" ON mobile_vehicles;
CREATE POLICY "anon_all_mobile_vehicles" ON mobile_vehicles FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- mobile_services ----------
CREATE TABLE IF NOT EXISTS mobile_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  price numeric(12,2) NOT NULL DEFAULT 0,
  duration_min int NOT NULL DEFAULT 30,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mobile_services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_mobile_services" ON mobile_services;
CREATE POLICY "anon_all_mobile_services" ON mobile_services FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- mobile_subscriptions ----------
CREATE TABLE IF NOT EXISTS mobile_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  monthly_price numeric(12,2) NOT NULL DEFAULT 0,
  washes_included int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mobile_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_mobile_subscriptions" ON mobile_subscriptions;
CREATE POLICY "anon_all_mobile_subscriptions" ON mobile_subscriptions FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- mobile_bookings ----------
CREATE TABLE IF NOT EXISTS mobile_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id uuid REFERENCES mobile_vehicles(id) ON DELETE CASCADE,
  service_id uuid REFERENCES mobile_services(id) ON DELETE SET NULL,
  customer_name text,
  customer_phone text,
  location text,
  booking_date date NOT NULL DEFAULT now()::date,
  start_hour int NOT NULL,
  end_hour int NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  price numeric(12,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE mobile_bookings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_mobile_bookings" ON mobile_bookings;
CREATE POLICY "anon_all_mobile_bookings" ON mobile_bookings FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
