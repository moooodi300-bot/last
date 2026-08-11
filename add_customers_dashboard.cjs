const fs = require('fs');
let content = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const calcCustomers = `
  const uniqueCustomers = new Set(filteredSales.filter((s: any) => s.customer_id).map((s: any) => s.customer_id)).size;
`;

content = content.replace(
  `const numberOfInvoices = filteredSales.length;`,
  calcCustomers + `\n  const numberOfInvoices = filteredSales.length;`
);

content = content.replace(
  `title="عدد الفواتير"`,
  `title="العملاء (فريد)"
          value={formatNumber(uniqueCustomers)}
          action={<Users className="w-5 h-5 text-amber-600" />}
          trend="عميل خلال الفترة"
          trendUp={true}
          className="border-amber-100 bg-amber-50/30"
        />
        <StatCard
          title="عدد الفواتير"`
);

fs.writeFileSync('src/pages/DashboardPage.tsx', content);
