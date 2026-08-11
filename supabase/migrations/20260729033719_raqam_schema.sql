/*
# Raqam (رقم) — Car Wash Management SaaS Schema

1. Overview
Raqam is a single-tenant demo SaaS for car wash businesses. It captures all CapEx & OpEx
expenses, computes a real-time cost-per-car, runs a loyalty stamp program, manages
subscriptions, inventory, purchases, shifts, journal entries, employees, reports,
templates, and settings. A role system (owner/admin/accountant/cashier/inventory) gates
module visibility in the frontend.

2. New Tables
- settings: company profile + cost-per-car config (daily volume target, working days).
- branches: car wash branches.
- staff: employees + their system role and monthly salary (feeds OpEx).
- services: wash/service catalog with price and estimated cost.
- customers: CRM with loyalty stamp count and free-wash tracking.
- subscriptions: monthly package definitions.
- customer_subscriptions: active subscriber records with end dates.
- sales: POS transactions (linked to customer, staff, branch, loyalty).
- sale_items: line items per sale.
- inventory_items: chemical/supply stock with reorder thresholds.
- purchases: supplier invoices that feed cost-per-car (capex/opex tagged).
- expenses: standalone expense entries (decor, signage, gov, rent, utilities, etc.).
- shifts: cashier shift management with cash reconciliation.
- chart_of_accounts: COA for general accounts.
- journal_entries: double-entry journal lines.
- templates: quotation/invoice templates.
- cost_config: dynamic cost distribution rules (recurring vs one-time windows).

3. Security
- RLS enabled on every table.
- Single-tenant demo (no sign-in screen): policies use TO anon, authenticated with
  USING (true) / WITH CHECK (true) because all data is intentionally shared for the demo.
*/

-- ---------- settings ----------
CREATE TABLE IF NOT EXISTS settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL DEFAULT 'رقم كار ووش',
  logo_url text,
  currency text NOT NULL DEFAULT 'SAR',
  daily_volume_target int NOT NULL DEFAULT 50,
  working_days int NOT NULL DEFAULT 26,
  phone text,
  address text,
  vat_number text,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_settings" ON settings;
CREATE POLICY "anon_all_settings" ON settings FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- branches ----------
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  location text,
  phone text,
  manager text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_branches" ON branches;
CREATE POLICY "anon_all_branches" ON branches FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- staff ----------
CREATE TABLE IF NOT EXISTS staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  role text NOT NULL DEFAULT 'cashier',
  position text,
  phone text,
  monthly_salary numeric(12,2) NOT NULL DEFAULT 0,
  hire_date date DEFAULT now()::date,
  active boolean NOT NULL DEFAULT true,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_staff" ON staff;
CREATE POLICY "anon_all_staff" ON staff FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- services ----------
CREATE TABLE IF NOT EXISTS services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'wash',
  price numeric(12,2) NOT NULL DEFAULT 0,
  cost_estimate numeric(12,2) NOT NULL DEFAULT 0,
  duration_min int NOT NULL DEFAULT 20,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_services" ON services;
CREATE POLICY "anon_all_services" ON services FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- customers ----------
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text,
  plate_number text,
  loyalty_stamps int NOT NULL DEFAULT 0,
  free_washes_earned int NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_customers" ON customers;
CREATE POLICY "anon_all_customers" ON customers FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- subscriptions ----------
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  monthly_price numeric(12,2) NOT NULL DEFAULT 0,
  washes_included int NOT NULL DEFAULT 0,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_subscriptions" ON subscriptions;
CREATE POLICY "anon_all_subscriptions" ON subscriptions FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- customer_subscriptions ----------
CREATE TABLE IF NOT EXISTS customer_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE SET NULL,
  start_date date NOT NULL DEFAULT now()::date,
  end_date date NOT NULL,
  washes_used int NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_customer_subscriptions" ON customer_subscriptions;
CREATE POLICY "anon_all_customer_subscriptions" ON customer_subscriptions FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- sales ----------
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid REFERENCES customers(id) ON DELETE SET NULL,
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  subscription_id uuid REFERENCES customer_subscriptions(id) ON DELETE SET NULL,
  total numeric(12,2) NOT NULL DEFAULT 0,
  payment_method text NOT NULL DEFAULT 'cash',
  wash_count int NOT NULL DEFAULT 1,
  is_free boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_sales" ON sales;
CREATE POLICY "anon_all_sales" ON sales FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
CREATE INDEX IF NOT EXISTS sales_created_at_idx ON sales (created_at);

-- ---------- sale_items ----------
CREATE TABLE IF NOT EXISTS sale_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sale_id uuid REFERENCES sales(id) ON DELETE CASCADE,
  service_id uuid REFERENCES services(id) ON DELETE SET NULL,
  service_name text NOT NULL,
  qty int NOT NULL DEFAULT 1,
  price numeric(12,2) NOT NULL DEFAULT 0,
  line_total numeric(12,2) NOT NULL DEFAULT 0
);
ALTER TABLE sale_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_sale_items" ON sale_items;
CREATE POLICY "anon_all_sale_items" ON sale_items FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- inventory_items ----------
CREATE TABLE IF NOT EXISTS inventory_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'chemical',
  unit text NOT NULL DEFAULT 'liter',
  current_stock numeric(12,2) NOT NULL DEFAULT 0,
  min_stock numeric(12,2) NOT NULL DEFAULT 0,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  supplier text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE inventory_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_inventory_items" ON inventory_items;
CREATE POLICY "anon_all_inventory_items" ON inventory_items FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- purchases ----------
CREATE TABLE IF NOT EXISTS purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier text NOT NULL,
  inventory_item_id uuid REFERENCES inventory_items(id) ON DELETE SET NULL,
  item_name text,
  qty numeric(12,2) NOT NULL DEFAULT 1,
  unit_cost numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'opex',
  expense_type text NOT NULL DEFAULT 'chemicals',
  purchase_date date NOT NULL DEFAULT now()::date,
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_purchases" ON purchases;
CREATE POLICY "anon_all_purchases" ON purchases FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- expenses ----------
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category text NOT NULL DEFAULT 'opex',
  expense_type text NOT NULL,
  amount numeric(12,2) NOT NULL DEFAULT 0,
  expense_date date NOT NULL DEFAULT now()::date,
  description text,
  recurring boolean NOT NULL DEFAULT false,
  recurring_period text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_expenses" ON expenses;
CREATE POLICY "anon_all_expenses" ON expenses FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- shifts ----------
CREATE TABLE IF NOT EXISTS shifts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid REFERENCES staff(id) ON DELETE SET NULL,
  branch_id uuid REFERENCES branches(id) ON DELETE SET NULL,
  shift_date date NOT NULL DEFAULT now()::date,
  start_time timestamptz,
  end_time timestamptz,
  opening_cash numeric(12,2) NOT NULL DEFAULT 0,
  closing_cash numeric(12,2) NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open',
  notes text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE shifts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_shifts" ON shifts;
CREATE POLICY "anon_all_shifts" ON shifts FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- chart_of_accounts ----------
CREATE TABLE IF NOT EXISTS chart_of_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  name text NOT NULL,
  type text NOT NULL DEFAULT 'expense',
  balance numeric(14,2) NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE chart_of_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_chart_of_accounts" ON chart_of_accounts;
CREATE POLICY "anon_all_chart_of_accounts" ON chart_of_accounts FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- journal_entries ----------
CREATE TABLE IF NOT EXISTS journal_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_date date NOT NULL DEFAULT now()::date,
  account_code text NOT NULL,
  account_name text NOT NULL,
  debit numeric(14,2) NOT NULL DEFAULT 0,
  credit numeric(14,2) NOT NULL DEFAULT 0,
  description text,
  reference text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_journal_entries" ON journal_entries;
CREATE POLICY "anon_all_journal_entries" ON journal_entries FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- templates ----------
CREATE TABLE IF NOT EXISTS templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL DEFAULT 'quotation',
  content text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_templates" ON templates;
CREATE POLICY "anon_all_templates" ON templates FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ---------- cost_config ----------
CREATE TABLE IF NOT EXISTS cost_config (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name text NOT NULL,
  applies_to text NOT NULL DEFAULT 'all',
  period_days int NOT NULL DEFAULT 30,
  weight numeric(5,2) NOT NULL DEFAULT 1.0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE cost_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon_all_cost_config" ON cost_config;
CREATE POLICY "anon_all_cost_config" ON cost_config FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);
