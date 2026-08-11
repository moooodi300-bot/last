-- 1. Disable RLS on all tables
DO $$ 
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'organizations', 'profiles', 'settings', 'branches', 'staff', 'services', 'customers', 'subscriptions',
    'customer_subscriptions', 'sales', 'sale_items', 'inventory_items', 'purchases',
    'expenses', 'shifts', 'chart_of_accounts', 'journal_entries', 'templates', 'cost_config',
    'purchase_invoices', 'purchase_invoice_items', 'mobile_vehicles', 'mobile_services',
    'mobile_subscriptions', 'mobile_bookings', 'subscription_plans'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    BEGIN
      EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', tbl);
    EXCEPTION WHEN OTHERS THEN
      -- Ignore errors for tables that might not exist yet
    END;
  END LOOP;
END $$;

-- 2. Modify get_current_org_id to fallback to Legacy org for demo access
CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1),
    (SELECT id FROM organizations WHERE name = 'بيانات سابقة (Legacy)' LIMIT 1)
  );
$$;
