import re

with open('src/pages/SalesPage.tsx', 'r') as f:
    content = f.read()

# Fix imports to include getTenantPackages, consumeSubscriptionWash
if "from '@/lib/subscriptionStore'" not in content:
    content = content.replace(
        "import { getTenantProducts } from '@/lib/productStore';",
        "import { getTenantProducts } from '@/lib/productStore';\nimport { getTenantPackages, getTenantCustomerSubscriptions, consumeSubscriptionWash } from '@/lib/subscriptionStore';"
    )

# Fix loadData
load_data_start = content.find('const loadData = async () => {')
load_data_end = content.find('  useEffect(() => {', load_data_start)

optimized_load = """const loadData = async () => {
    try {
      const svItems = await getTenantProducts(currentTenantId);
      const loadedCu = mergeCustomerLists([], currentTenantId);
      const storedSales = localStorage.getItem(`tenant_sales_${currentTenantId}`);
      const loadedSa = storedSales ? JSON.parse(storedSales) : [];
      
      const loadedSv = svItems;
      const loadedSt = SAMPLE_STAFF;
      const loadedBr = SAMPLE_BRANCHES;
      
      const finalSubs = getTenantPackages(currentTenantId);
      const loadedCS = getTenantCustomerSubscriptions(currentTenantId);
      
      let openShift = null;
      const storedShifts = localStorage.getItem(`shifts_${currentTenantId}`);
      if (storedShifts) {
         const shifts = JSON.parse(storedShifts);
         openShift = shifts.find((s: any) => s.status === 'open');
      }
      
      if (!openShift) {
        const staffId = loadedSt.find((s) => s.name === staffName)?.id ?? loadedSt[0]?.id ?? null;
        const branchId = loadedBr[0]?.id ?? null;
        openShift = { 
          id: 'shift-' + Date.now(), 
          end_time: null, closing_cash: 0, notes: null,
          staff_id: staffId,
          branch_id: branchId,
          opening_cash: 0,
          shift_date: new Date().toISOString(),
          start_time: new Date().toISOString(),
          status: 'open',
        };
      }

      const mappedSubs = finalSubs.map((s: any) => ({
        id: `sub_${s.id}`,
        name: `اشتراك - ${s.name}`,
        category: 'اشتراكات',
        price: s.monthly_price || s.price || 0,
        cost_estimate: 0,
        duration_min: 0,
        active: true,
        original_sub: s
      }));

      const allServices = [...(loadedSv.length > 0 ? loadedSv : SAMPLE_SERVICES), ...mappedSubs];

      setServices(allServices as any);
      setCustomers(loadedCu);
      setStaff(loadedSt);
      setBranches(loadedBr);
      setSales(loadedSa);
      setSubs(finalSubs);
      setCustSubs(loadedCS as any);
      setActiveShift(openShift);
      setLoading(false);
    } catch (err) {
      console.error('Error loading data in SalesPage:', err);
      setLoading(false);
    }
  };
"""

content = content[:load_data_start] + optimized_load + content[load_data_end:]

with open('src/pages/SalesPage.tsx', 'w') as f:
    f.write(content)
