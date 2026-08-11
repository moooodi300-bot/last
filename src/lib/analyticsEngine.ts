import { mergeCustomerLists } from './customerStore';
import { getTenantLoyaltyConfig, getLoyaltyRedemptionLogs } from './loyaltyStore';
import { getTenantCustomerSubscriptions, getSubscriptionUsageLogs, getTenantPackages } from './subscriptionStore';

export type TimeFilter = 'today' | 'week' | 'month' | 'custom';

export interface DateRange {
  startDate?: string;
  endDate?: string;
}

export interface MetricItem {
  key: string;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  iconName: string;
}

export function isDateInFilter(dateStr: string, filter: TimeFilter, customRange?: DateRange): boolean {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;

  const now = new Date();
  
  if (filter === 'today') {
    return d.toDateString() === now.toDateString();
  }

  if (filter === 'week') {
    const oneWeekAgo = new Date(now.getTime() - 7 * 86400000);
    return d >= oneWeekAgo && d <= now;
  }

  if (filter === 'month') {
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return d >= startOfMonth && d <= now;
  }

  if (filter === 'custom' && customRange?.startDate && customRange?.endDate) {
    const start = new Date(customRange.startDate);
    const end = new Date(customRange.endDate);
    end.setHours(23, 59, 59, 999);
    return d >= start && d <= end;
  }

  return true;
}

/**
 * Calculates all 6 metrics for the Loyalty Analytics Dashboard
 */
export function calculateLoyaltyMetrics(
  filter: TimeFilter,
  tenantId?: string,
  customRange?: DateRange
) {
  const customers = mergeCustomerLists([], tenantId);
  const config = getTenantLoyaltyConfig(tenantId);
  const redemptionLogs = getLoyaltyRedemptionLogs(tenantId);

  // 1. Number of Benefiting Customers
  const enrolledCustomers = customers.filter(
    (c) => (c.loyalty_stamps || 0) > 0 || (c.free_washes_earned || 0) > 0 || (c.total_visits || 0) > 0
  );
  const totalBenefiting = enrolledCustomers.length || customers.length;

  // 2. Filtered Redemptions in Current Period
  const periodRedemptions = redemptionLogs.filter((log) =>
    isDateInFilter(log.redeemedAt, filter, customRange)
  );

  // Total free washes redeemed in period
  const consumedPeriodCount = periodRedemptions.length;

  // 3. Total Revenue Generated from Loyalty (Equivalent monetary value of redeemed free washes)
  const AVERAGE_WASH_VALUE = 45; // SAR average wash value
  const periodRevenue = consumedPeriodCount * AVERAGE_WASH_VALUE;

  // Total overall revenue generated from loyalty free washes
  const totalOverallRedemptions = redemptionLogs.length;
  const totalOverallRevenue = totalOverallRedemptions * AVERAGE_WASH_VALUE;

  // 4. Monthly New Customer Growth Rate (compare customers created this month vs last month)
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const newThisMonth = customers.filter((c) => {
    if (!c.created_at) return false;
    const cd = new Date(c.created_at);
    return cd >= currentMonthStart;
  }).length;

  const newLastMonth = customers.filter((c) => {
    if (!c.created_at) return false;
    const cd = new Date(c.created_at);
    return cd >= lastMonthStart && cd <= lastMonthEnd;
  }).length;

  let growthRatePercent = 0;
  if (newLastMonth > 0) {
    growthRatePercent = Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100);
  } else if (newThisMonth > 0) {
    growthRatePercent = 100;
  }

  // 5. Redemption / Usage Rate (% of enrolled customers who redeemed at least one free wash)
  const customersWithRedemption = new Set(redemptionLogs.map((l) => l.customerId)).size;
  const redemptionRate = totalBenefiting > 0
    ? Math.min(100, Math.round((customersWithRedemption / totalBenefiting) * 100))
    : 0;

  // 6. Most Popular Package / Target Effectiveness (average washes needed)
  const targetWashes = config.target + 1; // e.g. 4 paid + 1 free = 5 total
  const targetEffectivenessLabel = `كل ${config.target} غسلات = الـ${targetWashes} مجاناً`;

  return {
    benefitingCustomers: {
      title: 'عدد العملاء المستفيدين',
      value: totalBenefiting,
      subtext: `من إجمالي ${customers.length} عميلاً بالمنشأة`,
      trend: { value: `+${growthRatePercent}%`, isPositive: growthRatePercent >= 0 },
      icon: 'Users',
    },
    totalRevenue: {
      title: 'الإيراد الموازي للمكافآت',
      value: `${periodRevenue.toLocaleString()} ر.س`,
      subtext: filter === 'today' ? 'اليوم' : filter === 'week' ? 'هذا الأسبوع' : filter === 'month' ? 'هذا الشهر' : 'الفترة المحددة',
      totalCumulative: `${totalOverallRevenue.toLocaleString()} ر.س إجمالي`,
      icon: 'Wallet',
    },
    growthRate: {
      title: 'معدل نمو العملاء الجدد',
      value: `${growthRatePercent >= 0 ? '+' : ''}${growthRatePercent}%`,
      subtext: `انضم ${newThisMonth} عميلاً جديداً هذا الشهر`,
      trend: { value: `${newThisMonth} عميل`, isPositive: growthRatePercent >= 0 },
      icon: 'TrendingUp',
    },
    redemptionRate: {
      title: 'معدل افتداء واستخدام الجوائز',
      value: `${redemptionRate}%`,
      subtext: `${customersWithRedemption} عميلاً استردوا جوائزهم`,
      icon: 'Gift',
    },
    consumedTransactions: {
      title: 'المعاملات المستهلكة في الفترة',
      value: `${consumedPeriodCount} غسلة`,
      subtext: `غسلات مجانية تم تقديمها للفترة`,
      icon: 'CheckCircle2',
    },
    targetEffectiveness: {
      title: 'مؤشر فاعلية شرط الهدف',
      value: `${targetWashes} غسلات`,
      subtext: targetEffectivenessLabel,
      icon: 'Award',
    },
  };
}

/**
 * Calculates all 6 metrics for the Subscriptions Analytics Dashboard
 */
export function calculateSubscriptionsMetrics(
  filter: TimeFilter,
  tenantId?: string,
  customRange?: DateRange
) {
  const customerSubs = getTenantCustomerSubscriptions(tenantId);
  const usageLogs = getSubscriptionUsageLogs(tenantId);
  const packages = getTenantPackages(tenantId);

  // 1. Number of Benefiting Customers (Enrolled in Subscriptions)
  const activeCustomerSubs = customerSubs.filter((cs) => cs.status === 'active');
  const benefitingCustomersCount = activeCustomerSubs.length || customerSubs.length;

  // 2. Total Revenue Generated from Package Subscriptions
  // Sum manual_price of customer subs purchased/active in the period or total
  const periodCustomerSubs = customerSubs.filter((cs) =>
    isDateInFilter(cs.start_date, filter, customRange)
  );
  const periodRevenue = (periodCustomerSubs.length > 0 ? periodCustomerSubs : customerSubs).reduce(
    (sum, s) => sum + (s.manual_price || 299),
    0
  );

  // 3. Monthly New Customer Growth Rate (Subscriptions signups this month vs last month)
  const now = new Date();
  const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

  const newThisMonth = customerSubs.filter((s) => {
    if (!s.start_date) return false;
    const sd = new Date(s.start_date);
    return sd >= currentMonthStart;
  }).length;

  const newLastMonth = customerSubs.filter((s) => {
    if (!s.start_date) return false;
    const sd = new Date(s.start_date);
    return sd >= lastMonthStart && sd <= lastMonthEnd;
  }).length;

  let growthRatePercent = 0;
  if (newLastMonth > 0) {
    growthRatePercent = Math.round(((newThisMonth - newLastMonth) / newLastMonth) * 100);
  } else if (newThisMonth > 0) {
    growthRatePercent = 100;
  }

  // 4. Usage / Consumption Rate (% of total washes used out of total washes included across subscriptions)
  let totalWashesIncluded = 0;
  let totalWashesUsed = 0;

  customerSubs.forEach((s) => {
    totalWashesUsed += s.washes_used || 0;
    totalWashesIncluded += (s.total_washes || s.washes_used + s.washes_remaining) || 1;
  });

  const usageRate = totalWashesIncluded > 0
    ? Math.min(100, Math.round((totalWashesUsed / totalWashesIncluded) * 100))
    : 0;

  // 5. Number of Transactions Consumed in the Current Period
  const periodUsageLogs = usageLogs.filter((log) =>
    isDateInFilter(log.usedAt, filter, customRange)
  );
  const consumedPeriodCount = periodUsageLogs.length;

  // 6. Most Popular Package
  const pkgSalesCountMap: Record<string, number> = {};
  customerSubs.forEach((cs) => {
    const pkgName = cs.package_name || 'باقة غسيل كلاسيك';
    pkgSalesCountMap[pkgName] = (pkgSalesCountMap[pkgName] || 0) + 1;
  });

  let topPackageName = packages[0]?.name || 'باقة غسيل كلاسيك';
  let topCount = 0;
  Object.entries(pkgSalesCountMap).forEach(([name, count]) => {
    if (count > topCount) {
      topCount = count;
      topPackageName = name;
    }
  });

  return {
    benefitingCustomers: {
      title: 'عدد العملاء المشتركين',
      value: benefitingCustomersCount,
      subtext: `${activeCustomerSubs.length} اشتراكاً نشطاً حالياً`,
      trend: { value: `+${growthRatePercent}%`, isPositive: growthRatePercent >= 0 },
      icon: 'Users',
    },
    totalRevenue: {
      title: 'إجمالي إيراد الباقات',
      value: `${periodRevenue.toLocaleString()} ر.س`,
      subtext: filter === 'today' ? 'اليوم' : filter === 'week' ? 'هذا الأسبوع' : filter === 'month' ? 'هذا الشهر' : 'الفترة المحددة',
      icon: 'CreditCard',
    },
    growthRate: {
      title: 'نمو المشتركين الجدد',
      value: `${growthRatePercent >= 0 ? '+' : ''}${growthRatePercent}%`,
      subtext: `${newThisMonth} مشتركاً جديداً هذا الشهر`,
      trend: { value: `${newThisMonth} جديد`, isPositive: growthRatePercent >= 0 },
      icon: 'TrendingUp',
    },
    usageRate: {
      title: 'معدل استهلاك رصيد الباقات',
      value: `${usageRate}%`,
      subtext: `تم استهلاك ${totalWashesUsed} من ${totalWashesIncluded} غسلة`,
      icon: 'PieChart',
    },
    consumedTransactions: {
      title: 'الغسلات المستهلكة في الفترة',
      value: `${consumedPeriodCount} غسلة`,
      subtext: `معاملات استهلاك سارية بالفترة`,
      icon: 'Zap',
    },
    mostPopularPackage: {
      title: 'الباقة الأكثر مبيعاً ورغبة',
      value: topPackageName,
      subtext: `${topCount} مبيعات/اشتراكات مسجلة`,
      icon: 'Sparkles',
    },
  };
}
