/*
# Raqam — SaaS Multi-Tenancy + Subscriptions

1. Purpose
   Converts Raqam from a single-tenant demo into a real multi-tenant SaaS:
   - Every signed-up business gets its own isolated "organization".
   - Every existing table gets an organization_id column, and Row Level
     Security is rewritten so a user can only ever see/write rows that
     belong to their own organization.
   - A subscription_plans catalog + per-organization subscription status
     (trial / active / past_due / canceled) power the SaaS billing side.
   - Pre-existing demo data (created before this migration) is preserved by
     moving it into a "Legacy" organization so nothing is lost.

2. New Tables
   - subscription_plans: the SaaS pricing catalog (trial/starter/growth/enterprise).
   - organizations: one row per paying customer (car wash business).
   - profiles: one row per authenticated user, linked to their organization + role.

3. New Functions / Triggers
   - get_current_org_id(): returns the organization_id of the logged-in user.
     Used both in RLS policies and as the DEFAULT for organization_id columns,
     so existing frontend insert/select calls keep working unchanged.
   - handle_new_user(): on signup, auto-creates an organization, a profile
     (role = owner), and a default settings row for that organization.

4. Security
   - All existing "anon_all_*" (public/demo) policies are dropped.
   - Every business table now requires an authenticated user and is scoped
     strictly to organization_id = get_current_org_id().
*/

-- ============================================================
-- 1. subscription_plans (SaaS pricing catalog)
-- ============================================================
CREATE TABLE IF NOT EXISTS subscription_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  price_monthly numeric(10,2) NOT NULL DEFAULT 0,
  max_branches int NOT NULL DEFAULT 1,
  max_staff int NOT NULL DEFAULT 5,
  features jsonb NOT NULL DEFAULT '[]',
  sort_order int NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "public_read_plans" ON subscription_plans;
CREATE POLICY "public_read_plans" ON subscription_plans FOR SELECT
  TO anon, authenticated USING (active = true);

INSERT INTO subscription_plans (key, name, price_monthly, max_branches, max_staff, features, sort_order)
VALUES
  ('trial', 'تجربة مجانية', 0, 1, 3,
    '["فرع واحد","حتى 3 موظفين","كل الميزات لمدة 14 يوم"]', 0),
  ('starter', 'أساسي', 99, 1, 5,
    '["فرع واحد","حتى 5 موظفين","نقاط بيع + عملاء + مخزون","دعم عبر البريد"]', 1),
  ('growth', 'نمو', 249, 3, 15,
    '["حتى 3 فروع","حتى 15 موظف","التقارير المالية والمحاسبة","الغسيل المتنقل"]', 2),
  ('enterprise', 'أعمال', 599, 999, 999,
    '["فروع غير محدودة","موظفين غير محدودين","دعم مخصص","أولوية في الميزات الجديدة"]', 3)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- 2. organizations (one per SaaS customer / car wash business)
-- ============================================================
CREATE TABLE IF NOT EXISTS organizations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  subscription_plan_id uuid REFERENCES subscription_plans(id),
  subscription_status text NOT NULL DEFAULT 'trialing'
    CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled')),
  trial_ends_at timestamptz DEFAULT (now() + interval '14 days'),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 3. profiles (one per authenticated user)
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
  full_name text,
  role text NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'accountant', 'cashier', 'inventory')),
  created_at timestamptz DEFAULT now()
);
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 4. get_current_org_id() — the core multi-tenancy helper
--    SECURITY DEFINER so it can read profiles regardless of the
--    caller's own RLS visibility, and STABLE so Postgres can use it
--    safely as a column DEFAULT and inside RLS USING/WITH CHECK.
-- ============================================================
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- ---------- organizations policies ----------
DROP POLICY IF EXISTS "org_select_own" ON organizations;
CREATE POLICY "org_select_own" ON organizations FOR SELECT
  TO authenticated USING (id = get_current_org_id());
DROP POLICY IF EXISTS "org_update_owner" ON organizations;
CREATE POLICY "org_update_owner" ON organizations FOR UPDATE
  TO authenticated USING (id = get_current_org_id() AND owner_id = auth.uid())
  WITH CHECK (id = get_current_org_id());

-- ---------- profiles policies ----------
DROP POLICY IF EXISTS "profiles_select_org" ON profiles;
CREATE POLICY "profiles_select_org" ON profiles FOR SELECT
  TO authenticated USING (organization_id = get_current_org_id() OR id = auth.uid());
DROP POLICY IF EXISTS "profiles_update_self" ON profiles;
CREATE POLICY "profiles_update_self" ON profiles FOR UPDATE
  TO authenticated USING (id = auth.uid()) WITH CHECK (id = auth.uid());

-- ============================================================
-- 5. Retrofit every existing business table with organization_id
--    + org-scoped RLS. Pre-existing rows are moved into a single
--    "Legacy" organization so no demo data is lost.
-- ============================================================
DO $$
DECLARE
  tbl text;
  legacy_org_id uuid;
  tables text[] := ARRAY[
    'settings', 'branches', 'staff', 'services', 'customers', 'subscriptions',
    'customer_subscriptions', 'sales', 'sale_items', 'inventory_items', 'purchases',
    'expenses', 'shifts', 'chart_of_accounts', 'journal_entries', 'templates', 'cost_config',
    'purchase_invoices', 'purchase_invoice_items', 'mobile_vehicles', 'mobile_services',
    'mobile_subscriptions', 'mobile_bookings'
  ];
BEGIN
  INSERT INTO organizations (name, subscription_status, trial_ends_at)
  VALUES ('بيانات سابقة (Legacy)', 'active', NULL)
  RETURNING id INTO legacy_org_id;

  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE', tbl);
    EXECUTE format('UPDATE %I SET organization_id = $1 WHERE organization_id IS NULL', tbl) USING legacy_org_id;
    EXECUTE format('ALTER TABLE %I ALTER COLUMN organization_id SET NOT NULL', tbl);
    EXECUTE format('ALTER TABLE %I ALTER COLUMN organization_id SET DEFAULT get_current_org_id()', tbl);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON %I (organization_id)', tbl || '_organization_id_idx', tbl);

    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'anon_all_' || tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I', 'org_isolation_' || tbl, tbl);
    EXECUTE format(
      'CREATE POLICY %I ON %I FOR ALL TO authenticated USING (organization_id = get_current_org_id()) WITH CHECK (organization_id = get_current_org_id())',
      'org_isolation_' || tbl, tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- 6. Auto-provisioning on signup
--    Every new auth.users row gets its own organization (on the
--    free trial plan), an owner profile, and a starter settings row.
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_org_id uuid;
  trial_plan_id uuid;
  company text;
BEGIN
  SELECT id INTO trial_plan_id FROM subscription_plans WHERE key = 'trial' LIMIT 1;
  company := COALESCE(NEW.raw_user_meta_data->>'company_name', split_part(NEW.email, '@', 1));

  INSERT INTO organizations (name, owner_id, subscription_plan_id, subscription_status)
  VALUES (company, NEW.id, trial_plan_id, 'trialing')
  RETURNING id INTO new_org_id;

  INSERT INTO profiles (id, organization_id, full_name, role)
  VALUES (NEW.id, new_org_id, COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email), 'owner');

  INSERT INTO settings (organization_id, company_name)
  VALUES (new_org_id, company);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
