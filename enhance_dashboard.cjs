const fs = require('fs');
let content = fs.readFileSync('src/pages/DashboardPage.tsx', 'utf8');

const additionalStats = `
  // Calculate Extra Metrics
  const numberOfInvoices = filteredSales.length;
  const averageInvoice = numberOfInvoices > 0 ? (rangeRevenue / numberOfInvoices) : 0;
  
  // Calculate best selling
  const serviceCounts: Record<string, number> = {};
  filteredSales.forEach(s => {
    if (s.items) {
      s.items.forEach((item: any) => {
        serviceCounts[item.name] = (serviceCounts[item.name] || 0) + (item.qty || 1);
      });
    }
  });
  let bestSellingService = '-';
  let maxCount = 0;
  for (const [name, count] of Object.entries(serviceCounts)) {
    if (count > maxCount) {
      maxCount = count;
      bestSellingService = name;
    }
  }
`;

content = content.replace(
  `// Last 14 days chart data`,
  additionalStats + `\n  // Last 14 days chart data`
);

const newStatCards = `
        <StatCard
          title="متوسط قيمة الفاتورة"
          value={formatSAR(averageInvoice)}
          action={<Activity className="w-5 h-5 text-indigo-600" />}
          trend="متوسط الإيراد للعميل"
          trendUp={true}
          className="border-indigo-100 bg-indigo-50/30"
        />
        <StatCard
          title="أفضل خدمة/منتج"
          value={bestSellingService}
          action={<Sparkles className="w-5 h-5 text-fuchsia-600" />}
          trend={\`\${maxCount} مرة\`}
          trendUp={true}
          className="border-fuchsia-100 bg-fuchsia-50/30"
        />
        <StatCard
          title="عدد الفواتير"
          value={formatNumber(numberOfInvoices)}
          action={<FileText className="w-5 h-5 text-slate-600" />}
          trend="إجمالي العمليات"
          trendUp={true}
          className="border-slate-100 bg-slate-50/30"
        />
`;

content = content.replace(
  `{/* Quick Actions / Important Status */}`,
  newStatCards + `\n      {/* Quick Actions / Important Status */}`
);

// We need to make sure FileText is imported
if (!content.includes('FileText')) {
  content = content.replace('Activity', 'Activity, FileText');
}

fs.writeFileSync('src/pages/DashboardPage.tsx', content);
