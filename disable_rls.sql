DO $$ 
DECLARE
  tbl text;
  tables text[] := ARRAY[
    'organizations', 'profiles', 'settings', 'branches', 'staff', 'services', 'customers', 'subscriptions',
    'inventory', 'inventory_transactions', 'sales', 'sale_items', 'expenses', 'reports', 'subscription_plans'
  ];
BEGIN
  FOREACH tbl IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE %I DISABLE ROW LEVEL SECURITY;', tbl);
  END LOOP;
END $$;
