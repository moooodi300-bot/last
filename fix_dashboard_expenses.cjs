const fs = require('fs');

let content = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

// Replace the mock expenses generation with real calculation from accounts_transactions and appSettings
const newEffect = `
  useEffect(() => {
    (async () => {
      try {
        const storedSales = localStorage.getItem(\`tenant_sales_\${currentTenantId}\`);
        const parsedSales = storedSales ? JSON.parse(storedSales) : [];
        setSales(parsedSales.map((s: any) => ({
          ...s,
          wash_count: s.items ? s.items.length : 1
        })));
        
        const storedPurchases = localStorage.getItem(\`tenant_purchases_\${currentTenantId}\`);
        const parsedPurchases = storedPurchases ? JSON.parse(storedPurchases) : [];
        setPurchases(parsedPurchases);

        // Calculate expenses from settings (Operating Expenses) + accounts_transactions (out)
        let finalExpenses = [];

        // 1. Operating Expenses from Settings
        const appSettingsStr = localStorage.getItem('raqm_app_settings');
        if (appSettingsStr) {
          const appSettings = JSON.parse(appSettingsStr);
          if (appSettings.custom_costs) {
            const { costs2Y, costs1Y, costs1M } = appSettings.custom_costs;
            const totalMonthly = (costs1M || []).reduce((a: any, b: any) => a + Number(b.amount || 0), 0) +
                                 (costs1Y || []).reduce((a: any, b: any) => a + Number(b.amount || 0), 0) / 12 +
                                 (costs2Y || []).reduce((a: any, b: any) => a + Number(b.amount || 0), 0) / 24;
            
            // Distribute this monthly cost over the days
            for(let i=0; i<365; i++) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              finalExpenses.push({
                id: \`opex-\${i}\`,
                amount: totalMonthly / 30, // daily portion
                category: 'مصروفات تشغيلية',
                expense_date: d.toISOString()
              });
            }
          }
        }

        // 2. Additional Recorded Costs (from accounts_transactions)
        const savedTrans = localStorage.getItem('accounts_transactions');
        if (savedTrans) {
          const transactions = JSON.parse(savedTrans);
          transactions.filter((t: any) => t.type === 'out').forEach((t: any) => {
            finalExpenses.push({
              id: \`trans-\${t.id}\`,
              amount: t.amount,
              category: t.description || 'مصروف عام',
              expense_date: t.date
            });
          });
        }
        
        setExpenses(finalExpenses);
        setStaff([]);
      } catch (e) {
        console.error("Failed to load data", e);
      }
      setLoading(false);
    })();
  }, [currentTenantId]);
`;

content = content.replace(
  /useEffect\(\(\) => \{[\s\S]*?\}, \[currentTenantId\]\);/,
  newEffect.trim()
);

fs.writeFileSync('src/pages/DashboardPage.tsx', content);
