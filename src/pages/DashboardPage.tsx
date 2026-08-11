import { useEffect, useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Car, Wallet, Users, Target, Coins,
  Calendar, ChevronDown, Sparkles, Activity
} from 'lucide-react';
import { formatSAR, formatNumber } from '@/lib/format';
import { useAuth } from '@/lib/auth';
import type { Expense, Purchase, Staff, Sale } from '@/lib/types';
import { Card, CardBody, CardHeader, PageHeader, Spinner, StatCard } from '@/components/ui';
import { getTenantCustomerSubscriptions } from '@/lib/subscriptionStore';

type RangeKey = 'thisMonth' | 'last14' | 'lastMonth' | 'ytd' | 'custom';

export function DashboardPage() {
  const { settings, organization } = useAuth();
  const currentTenantId = organization?.id || 'org_client_01';
  
  const [loading, setLoading] = useState(true);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [, setStaff] = useState<Staff[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [range, setRange] = useState<RangeKey>('thisMonth');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showRangeMenu, setShowRangeMenu] = useState(false);

  // Unconditional React hooks MUST be placed before conditional early returns
  const customerSubs = useMemo(() => getTenantCustomerSubscriptions(currentTenantId), [currentTenantId]);

  useEffect(() => {
    (async () => {
      try {
        const storedSales = localStorage.getItem(`tenant_sales_${currentTenantId}`);
        const parsedSales = storedSales ? JSON.parse(storedSales) : [];
        setSales(parsedSales.map((s: any) => ({
          ...s,
          wash_count: s.items ? s.items.length : 1
        })));
        
        const storedPurchases = localStorage.getItem(`tenant_purchases_${currentTenantId}`);
        const parsedPurchases = storedPurchases ? JSON.parse(storedPurchases) : [];
        setPurchases(parsedPurchases);

        // Calculate expenses from settings (Operating Expenses) + accounts_transactions (out)
        const finalExpenses = [];

        // 1. Operating Expenses from Settings
        if (settings && (settings as any).custom_costs) {
          const { costs2Y, costs1Y, costs1M } = (settings as any).custom_costs;
            const totalMonthly = (costs1M || []).reduce((a: any, b: any) => a + Number(b.amount || 0), 0) +
                                 (costs1Y || []).reduce((a: any, b: any) => a + Number(b.amount || 0), 0) / 12 +
                                 (costs2Y || []).reduce((a: any, b: any) => a + Number(b.amount || 0), 0) / 24;
            
            // Distribute this monthly cost over the days
            for(let i=0; i<365; i++) {
              const d = new Date();
              d.setDate(d.getDate() - i);
              finalExpenses.push({
                id: `opex-${i}`,
                amount: totalMonthly / 30, // daily portion
                category: 'مصروفات تشغيلية',
                expense_date: d.toISOString()
              });
            }
          }

        // 2. Additional Recorded Costs (from accounts_transactions)
        const savedTrans = localStorage.getItem(`accounts_transactions_${currentTenantId}`);
        if (savedTrans) {
          const transactions = JSON.parse(savedTrans);
          transactions.filter((t: any) => t.type === 'out').forEach((t: any) => {
            finalExpenses.push({
              id: `trans-${t.id}`,
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
  }, [currentTenantId, settings]);

  const { startDate, endDate, rangeLabel } = useMemo(() => {
    const now = new Date();
    if (range === 'thisMonth') {
      const d = new Date(now.getFullYear(), now.getMonth(), 1);
      return { startDate: d, endDate: now, rangeLabel: 'الشهر الحالي' };
    }
    if (range === 'last14') {
      const d = new Date(now);
      d.setDate(d.getDate() - 14);
      return { startDate: d, endDate: now, rangeLabel: 'آخر 14 يوم' };
    }
    if (range === 'lastMonth') {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const e = new Date(now.getFullYear(), now.getMonth(), 0);
      return { startDate: d, endDate: e, rangeLabel: 'الشهر الماضي' };
    }
    if (range === 'ytd') {
      const d = new Date(now.getFullYear(), 0, 1);
      return { startDate: d, endDate: now, rangeLabel: 'منذ بداية العام' };
    }
    return {
      startDate: customFrom ? new Date(customFrom) : new Date(now.getFullYear(), now.getMonth(), 1),
      endDate: customTo ? new Date(customTo) : now,
      rangeLabel: 'تخصيص',
    };
  }, [range, customFrom, customTo]);

  if (loading) return <Spinner label="جاري تحميل المؤشرات..." />;

  // Filter based on selected range
  const filteredSales = sales.filter((s) => {
    const d = new Date(s.created_at);
    return d >= startDate && d <= endDate;
  });
  const filteredExpenses = expenses.filter((e) => {
    const d = new Date(e.expense_date);
    return d >= startDate && d <= endDate;
  });
  const filteredPurchases = purchases.filter((p) => {
    const d = new Date(p.purchase_date);
    return d >= startDate && d <= endDate;
  });

  const rangeRevenue = filteredSales.reduce((sum, s) => sum + Number(s.total), 0);
  const rangeCars = filteredSales.reduce((sum, s) => sum + Number(s.wash_count), 0);
  const rangeExpenses = filteredExpenses.reduce((sum, e) => sum + Number(e.amount), 0) + filteredPurchases.reduce((sum, p) => sum + Number(p.total), 0);
  const rangeProfit = rangeRevenue - rangeExpenses;
  
  // Calculate Cost Per Car (Simplified)
  const costPerCar = rangeCars > 0 ? (rangeExpenses / rangeCars) : 0;

  // Subscription Metrics Calculations
  const activeSubsList = customerSubs.filter((s) => s.status === 'active' && (!s.end_date || new Date(s.end_date) >= new Date()));
  const activeSubscribersCount = activeSubsList.length;

  const todayStr = new Date().toDateString();
  const todaySales = sales.filter((s) => new Date(s.created_at).toDateString() === todayStr);
  const todayTotalCars = todaySales.reduce((sum, s) => sum + Number(s.wash_count || 1), 0);
  const todaySubSales = todaySales.filter(
    (s) => s.customer_subscription_id || s.payment_method === 'subscription' || (s.notes && s.notes.includes('اشتراك'))
  );
  const todaySubCars = todaySubSales.reduce((sum, s) => sum + Number(s.wash_count || 1), 0);
  const todaySubWashRate = todayTotalCars > 0 ? Math.round((todaySubCars / todayTotalCars) * 100) : 0;

  const rangeSubSales = filteredSales.filter(
    (s) => s.customer_subscription_id || s.payment_method === 'subscription' || (s.notes && s.notes.includes('اشتراك'))
  );
  const rangeSubCars = rangeSubSales.reduce((sum, s) => sum + Number(s.wash_count || 1), 0);
  const rangeSubWashRate = rangeCars > 0 ? Math.round((rangeSubCars / rangeCars) * 100) : 0;

  const totalGrantedWashes = activeSubsList.reduce((sum, s) => sum + Number(s.total_washes || ((s.washes_remaining || 0) + (s.washes_used || 0)) || 0), 0);
  const totalUsedWashes = activeSubsList.reduce((sum, s) => sum + Number(s.washes_used || 0), 0);
  const monthlyUtilizationRate = totalGrantedWashes > 0 ? Math.round((totalUsedWashes / totalGrantedWashes) * 100) : 0;

  // Last 14 days chart data
  const days14: { label: string; value: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const daySales = sales.filter((s) => new Date(s.created_at).toDateString() === d.toDateString());
    days14.push({
      label: d.toLocaleDateString('ar-SA', { month: 'numeric', day: 'numeric' }),
      value: daySales.reduce((sum, s) => sum + Number(s.total), 0),
    });
  }
  const maxDay14 = Math.max(...days14.map((d) => d.value), 1);

  return (
    <div className="space-y-6">
      <PageHeader title="الملخص المالي والتشغيلي" subtitle={`نظرة عامة على أداء المنشأة - ${settings?.company_name || 'المغسلة'}`} />

      {/* Date Range Filter */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setShowRangeMenu((v) => !v)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-surface-200 bg-white hover:bg-surface-50 transition-colors text-sm font-bold text-surface-700 shadow-sm"
          >
            <Calendar className="w-4 h-4 text-surface-400" />
            النطاق الزمني: {rangeLabel}
            <ChevronDown className="w-4 h-4 text-surface-400" />
          </button>
          {showRangeMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setShowRangeMenu(false)} />
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-surface-200 z-50 overflow-hidden">
                {[
                  { key: 'thisMonth', label: 'الشهر الحالي (هذا الشهر)' },
                  { key: 'last14', label: 'آخر 14 يوم' },
                  { key: 'lastMonth', label: 'الشهر الماضي' },
                  { key: 'ytd', label: 'منذ بداية العام' },
                  { key: 'custom', label: 'تخصيص' },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    onClick={() => { setRange(opt.key as RangeKey); setShowRangeMenu(false); }}
                    className={`w-full text-right px-4 py-2.5 text-sm hover:bg-surface-50 transition-colors ${range === opt.key ? 'font-bold text-primary-700 bg-primary-50' : 'text-surface-700'}`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
        {range === 'custom' && (
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-surface-200 shadow-sm">
            <input type="date" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} className="bg-transparent border-0 text-sm font-medium outline-none text-surface-700" />
            <span className="text-surface-400 text-sm font-bold">إلى</span>
            <input type="date" value={customTo} onChange={(e) => setCustomTo(e.target.value)} className="bg-transparent border-0 text-sm font-medium outline-none text-surface-700" />
          </div>
        )}
      </div>

      {/* Subscriptions & Member Wash Analytics Section */}
      <div className="bg-gradient-to-br from-emerald-900 via-surface-900 to-primary-950 p-6 rounded-2xl text-white shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h3 className="font-extrabold text-lg text-white">مؤشرات باقات الاشتراكات والغسيل اليومي</h3>
          </div>
          <span className="text-xs font-bold text-emerald-300 bg-emerald-500/20 border border-emerald-500/30 px-3 py-1 rounded-full">
            متابعة فورية
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: عدد المشتركين */}
          <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-surface-300">عدد المشتركين النشطين</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-emerald-400">{activeSubscribersCount} <span className="text-sm font-normal text-surface-300">مشترك</span></p>
              <p className="text-xs text-surface-300 mt-1">باقات اشتراك سارية الصلاحية</p>
            </div>
          </div>

          {/* Card 2: معدل غسيل الاشتراكات اليومي */}
          <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-surface-300">معدل الاشتراكات من الغسيل اليومي</span>
              <div className="w-8 h-8 rounded-lg bg-primary-500/20 text-primary-300 flex items-center justify-center font-bold">
                <Car className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-primary-300">{todaySubWashRate}%</p>
              <p className="text-xs text-surface-300 mt-1">{todaySubCars} غسلة اشتراك من إجمالي {todayTotalCars} غسلة اليوم</p>
            </div>
          </div>

          {/* Card 3: معدل غسيل الاشتراكات بالنطاق المحدد */}
          <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-surface-300">نسبة غسيل الاشتراكات للفترة</span>
              <div className="w-8 h-8 rounded-lg bg-purple-500/20 text-purple-300 flex items-center justify-center font-bold">
                <Activity className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-purple-300">{rangeSubWashRate}%</p>
              <p className="text-xs text-surface-300 mt-1">{rangeSubCars} غسلة اشتراك من إجمالي {rangeCars} غسلة بالفترة</p>
            </div>
          </div>

          {/* Card 4: معدل استخدام الاشتراكات الشهرية */}
          <div className="p-4 rounded-xl bg-white/10 border border-white/10 backdrop-blur-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-surface-300">معدل استخدام الاشتراكات الشهرية</span>
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold">
                <Target className="w-4 h-4" />
              </div>
            </div>
            <div>
              <p className="text-3xl font-black text-amber-400">{monthlyUtilizationRate}%</p>
              <p className="text-xs text-surface-300 mt-1">تم استهلاك {totalUsedWashes} من {totalGrantedWashes} غسلة بالمشتركين</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main KPI Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الإيرادات"
          value={formatSAR(rangeRevenue)}
          action={<TrendingUp className="w-5 h-5 text-emerald-600" />}
          trend={rangeRevenue > 0 ? '+12%' : '0%'}
          trendUp={rangeRevenue > 0}
          className="border-emerald-100 bg-emerald-50/30"
        />
        <StatCard
          title="إجمالي المصاريف"
          value={formatSAR(rangeExpenses)}
          action={<TrendingDown className="w-5 h-5 text-rose-600" />}
          className="border-rose-100 bg-rose-50/30"
        />
        <StatCard
          title="صافي الأرباح"
          value={formatSAR(rangeProfit)}
          action={<Wallet className="w-5 h-5 text-primary-600" />}
          trend={rangeProfit > 0 ? 'ربح' : rangeProfit < 0 ? 'خسارة' : 'تعادل'}
          trendUp={rangeProfit > 0}
          className="border-primary-100 bg-primary-50/30"
        />
        <StatCard
          title="متوسط تكلفة السيارة"
          value={formatSAR(costPerCar)}
          action={<Car className="w-5 h-5 text-purple-600" />}
          hint={`لعدد ${rangeCars} سيارة`}
          className="border-purple-100 bg-purple-50/30"
        />
      </div>

      {/* 14 Days Revenue Trend */}
      <Card>
        <CardHeader title="إيرادات آخر 14 يوم" action={<Activity className="w-5 h-5" />} />
        <CardBody className="p-6">
          <div className="h-64 flex items-end gap-2 md:gap-4">
            {days14.map((day, i) => (
              <div key={i} className="flex-1 flex flex-col items-center group relative">
                {/* Tooltip */}
                <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-10 bg-surface-800 text-white text-[10px] py-1 px-2 rounded font-mono whitespace-nowrap z-10 pointer-events-none">
                  {formatSAR(day.value)}
                </div>
                {/* Bar */}
                <div className="w-full relative flex justify-center">
                  <div className="w-full max-w-[40px] bg-primary-100/50 rounded-t-lg h-[200px] relative overflow-hidden">
                    <div 
                      className="absolute bottom-0 w-full bg-primary-600 rounded-t-lg transition-all duration-700 ease-out group-hover:bg-primary-500"
                      style={{ height: `${(day.value / maxDay14) * 100}%` }}
                    />
                  </div>
                </div>
                {/* Label */}
                <span className="text-[10px] font-medium text-surface-400 mt-2 text-center whitespace-nowrap overflow-hidden text-ellipsis w-full">
                  {day.label}
                </span>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         <Card>
            <CardHeader title="نقطة التعادل التلقائية (شهرياً)" action={<Target className="w-5 h-5 text-amber-500" />} />
            <CardBody className="p-6">
               <div className="flex items-center justify-between mb-4">
                  <div className="space-y-1">
                     <p className="text-sm font-medium text-surface-500">التكاليف الشهرية الإجمالية الثابتة والمتغيرة</p>
                     <p className="text-2xl font-black text-surface-900">{formatSAR(rangeExpenses)}</p>
                  </div>
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
                     <Coins className="w-6 h-6" />
                  </div>
               </div>
               <div className="p-4 rounded-xl bg-surface-50 border border-surface-100 space-y-3 text-sm">
                  <div className="flex justify-between items-center">
                     <span className="text-surface-600 font-medium">متوسط سعر الغسيل (المتوقع)</span>
                     <span className="font-bold text-surface-900">{formatSAR(
                        (() => {
                           const c = (settings as any)?.custom_costs;
                           if (c?.lowWash && c?.highWash) {
                              return (Number(c.lowWash) + Number(c.highWash)) / 2;
                           }
                           return Number(settings?.avg_service_price || 40);
                        })()
                     )}</span>
                  </div>
                  <div className="flex justify-between items-center">
                     <span className="text-surface-600 font-medium">نقطة التعادل بالسيارات (للتغطية)</span>
                     <span className="font-bold text-amber-600">
                        {Math.ceil(rangeExpenses / (() => {
                           const c = (settings as any)?.custom_costs;
                           if (c?.lowWash && c?.highWash) {
                              return (Number(c.lowWash) + Number(c.highWash)) / 2;
                           }
                           return Number(settings?.avg_service_price || 40);
                        })())} سيارة
                     </span>
                  </div>
               </div>
            </CardBody>
         </Card>
         
         <Card className="bg-surface-900 text-white border-0">
            <CardHeader title="خلاصة أداء المنشأة والهدف" action={<Sparkles className="w-5 h-5 text-yellow-400" />} className="border-surface-800 text-white" />
            <CardBody className="p-6">
               <div className="space-y-6">
                  <p className="text-sm text-surface-300 leading-relaxed font-medium">
                     يعكس هذا الملخص الأداء الفعلي لمنشأتك بناءً على المدخلات المالية والمبيعات وحركة المصروفات للفترة المحددة ومقارنتها بالهدف.
                  </p>
                  <div className="grid grid-cols-3 gap-4">
                     <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                        <div className="text-2xl font-black text-primary-400 mb-1">{rangeCars}</div>
                        <div className="text-xs text-surface-400">السيارات المغسولة</div>
                     </div>
                     <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                        <div className="text-2xl font-black text-amber-400 mb-1">{settings?.daily_volume_target || 40}</div>
                        <div className="text-xs text-surface-400">الهدف اليومي</div>
                     </div>
                     <div className="p-4 bg-white/5 rounded-xl border border-white/10 text-center">
                        <div className="text-2xl font-black text-emerald-400 mb-1">{rangeProfit > 0 ? '+' : ''}{formatNumber(rangeProfit)}</div>
                        <div className="text-xs text-surface-400">صافي الربح</div>
                     </div>
                  </div>
               </div>
            </CardBody>
         </Card>
      </div>

    </div>
  );
}
