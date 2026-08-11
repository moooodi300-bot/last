import { useState, useMemo, useEffect } from 'react';
import { 
  Calendar, FileText, CheckCircle2, ShoppingCart, 
  CreditCard, Activity, Gift, Tag, DollarSign, Wallet, Users, LayoutDashboard, ChevronDown, Target
} from 'lucide-react';
import { formatSAR, formatNumber } from '@/lib/format';
import { Card, CardBody, StatCard } from './ui';
import { useAuth } from '@/lib/auth';
import { getTenantCustomerSubscriptions } from '@/lib/subscriptionStore';

interface Props {
  sourceFilter: 'mobile_pos' | 'job_card';
  title?: string;
}

type RangeKey = 'today' | 'yesterday' | 'last7' | 'thisMonth' | 'lastMonth' | 'ytd' | 'custom';

export function ComprehensiveDashboard({ sourceFilter, title = "لوحة المؤشرات" }: Props) {
  const { organization } = useAuth();
  const currentTenantId = organization?.id || 'org_client_01';
  
  const [sales, setSales] = useState<any[]>([]);
  const [range, setRange] = useState<RangeKey>('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [showRangeMenu, setShowRangeMenu] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`tenant_sales_${currentTenantId}`);
    if (saved) {
      let parsed = JSON.parse(saved);
      // Filter by source
      parsed = parsed.filter((s: any) => s.source === sourceFilter);
      setSales(parsed);
    }
  }, [currentTenantId, sourceFilter]);

  const customerSubs = useMemo(() => getTenantCustomerSubscriptions(currentTenantId), [currentTenantId]);

  const { startDate, endDate, rangeLabel } = useMemo(() => {
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    
    let start = new Date();
    start.setHours(0, 0, 0, 0);
    
    let end = new Date(now);
    let label = 'اليوم';

    if (range === 'today') {
      // already set
    } else if (range === 'yesterday') {
      start.setDate(start.getDate() - 1);
      end = new Date(start);
      end.setHours(23, 59, 59, 999);
      label = 'الأمس';
    } else if (range === 'last7') {
      start.setDate(start.getDate() - 7);
      label = 'آخر 7 أيام';
    } else if (range === 'thisMonth') {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      label = 'هذا الشهر';
    } else if (range === 'lastMonth') {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      label = 'الشهر الماضي';
    } else if (range === 'ytd') {
      start = new Date(now.getFullYear(), 0, 1);
      label = 'بداية العام';
    } else if (range === 'custom') {
      start = customFrom ? new Date(customFrom) : start;
      start.setHours(0,0,0,0);
      end = customTo ? new Date(customTo) : end;
      end.setHours(23,59,59,999);
      label = 'تخصيص';
    }

    return { startDate: start, endDate: end, rangeLabel: label };
  }, [range, customFrom, customTo]);

  const filtered = sales.filter(s => {
    const d = new Date(s.created_at);
    return d >= startDate && d <= endDate;
  });

  const totalRevenue = filtered.reduce((sum, s) => sum + Number(s.total || 0), 0);
  const totalDiscounts = filtered.reduce((sum, s) => sum + Number(s.discount_amount || 0), 0);
  const totalInvoices = filtered.length;
  
  let totalServices = 0;
  let totalProducts = 0;
  
  filtered.forEach(s => {
    if (s.items) {
      s.items.forEach((i: any) => {
        if (i.type === 'product') totalProducts += (i.qty || 1);
        else totalServices += (i.qty || 1);
      });
    }
  });

  const totalVehicles = totalInvoices; // Usually 1 invoice = 1 vehicle in these modules
  const loyaltyWashes = filtered.filter(s => s.is_free).length;
  const membershipTx = filtered.filter(s => s.customer_subscription_id || s.payment_method === 'subscription' || (s.notes && s.notes.includes('اشتراك'))).length;
  
  // Net Revenue = Total - Discounts
  const netRevenue = totalRevenue - totalDiscounts;

  // Subscription metrics for Comprehensive Dashboard
  const activeSubs = customerSubs.filter(s => s.status === 'active' && (!s.end_date || new Date(s.end_date) >= new Date()));
  const activeSubscribersCount = activeSubs.length;

  const totalWashesGranted = activeSubs.reduce((sum, s) => sum + Number(s.total_washes || ((s.washes_remaining || 0) + (s.washes_used || 0)) || 0), 0);
  const totalWashesUsed = activeSubs.reduce((sum, s) => sum + Number(s.washes_used || 0), 0);
  const monthlyUtilizationRate = totalWashesGranted > 0 ? Math.round((totalWashesUsed / totalWashesGranted) * 100) : 0;

  const subWashRate = totalVehicles > 0 ? Math.round((membershipTx / totalVehicles) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-surface-200 shadow-sm">
        <div className="flex items-center gap-2">
           <LayoutDashboard className="w-5 h-5 text-primary-600" />
           <h3 className="font-bold text-surface-800">{title}</h3>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowRangeMenu(!showRangeMenu)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-surface-200 bg-surface-50 hover:bg-surface-100 transition-colors text-sm font-bold text-surface-700"
            >
              <Calendar className="w-4 h-4 text-surface-400" />
              {rangeLabel}
              <ChevronDown className="w-4 h-4 text-surface-400" />
            </button>
            {showRangeMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowRangeMenu(false)} />
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-surface-200 z-50 overflow-hidden">
                  {[
                    { key: 'today', label: 'اليوم' },
                    { key: 'yesterday', label: 'الأمس' },
                    { key: 'last7', label: 'آخر 7 أيام' },
                    { key: 'thisMonth', label: 'هذا الشهر' },
                    { key: 'lastMonth', label: 'الشهر الماضي' },
                    { key: 'ytd', label: 'منذ بداية العام' },
                    { key: 'custom', label: 'تخصيص' },
                  ].map((opt) => (
                    <button
                      key={opt.key}
                      onClick={() => { setRange(opt.key as RangeKey); setShowRangeMenu(false); }}
                      className={`w-full text-right px-4 py-2 text-sm hover:bg-surface-50 transition-colors ${range === opt.key ? 'font-bold text-primary-700 bg-primary-50' : 'text-surface-700'}`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          
          {range === 'custom' && (
            <div className="flex items-center gap-2">
              <input type="date" value={customFrom} onChange={e => setCustomFrom(e.target.value)} className="text-sm border border-surface-200 rounded p-1" />
              <span>إلى</span>
              <input type="date" value={customTo} onChange={e => setCustomTo(e.target.value)} className="text-sm border border-surface-200 rounded p-1" />
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
         <StatCard
           title="إجمالي الإيرادات"
           value={formatSAR(totalRevenue)}
           action={<Wallet className="w-5 h-5 text-emerald-600" />}
           trend="الإيراد الشامل"
           trendUp={true}
           className="border-emerald-100 bg-emerald-50/30"
         />
         <StatCard
           title="صافي الإيرادات"
           value={formatSAR(netRevenue)}
           action={<DollarSign className="w-5 h-5 text-primary-600" />}
           trend="بعد الخصومات"
           trendUp={true}
           className="border-primary-100 bg-primary-50/30"
         />
         <StatCard
           title="عدد المشتركين النشطين"
           value={`${activeSubscribersCount} مشترك`}
           action={<Users className="w-5 h-5 text-emerald-600" />}
           trend="باقات سارية"
           trendUp={true}
           className="border-emerald-100 bg-emerald-50/30"
         />
         <StatCard
           title="معدل غسيل الاشتراكات"
           value={`${subWashRate}%`}
           action={<Activity className="w-5 h-5 text-primary-600" />}
           hint={`${membershipTx} غسلة من إجمالي ${totalVehicles} سيارة`}
           trendUp={true}
           className="border-primary-100 bg-primary-50/30"
         />
         <StatCard
           title="معدل استخدام الاشتراكات"
           value={`${monthlyUtilizationRate}%`}
           action={<Target className="w-5 h-5 text-amber-600" />}
           hint={`تم استهلاك ${totalWashesUsed} من ${totalWashesGranted} غسلة`}
           trendUp={true}
           className="border-amber-100 bg-amber-50/30"
         />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
         <Card className="bg-white border border-surface-100 shadow-sm">
            <CardBody className="p-4 text-center">
               <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
               <p className="text-surface-500 text-xs mb-1">الخدمات المنفذة</p>
               <p className="text-xl font-bold text-surface-800">{formatNumber(totalServices)}</p>
            </CardBody>
         </Card>
         <Card className="bg-white border border-surface-100 shadow-sm">
            <CardBody className="p-4 text-center">
               <ShoppingCart className="w-6 h-6 text-fuchsia-500 mx-auto mb-2" />
               <p className="text-surface-500 text-xs mb-1">المنتجات المباعة</p>
               <p className="text-xl font-bold text-surface-800">{formatNumber(totalProducts)}</p>
            </CardBody>
         </Card>
         <Card className="bg-white border border-surface-100 shadow-sm">
            <CardBody className="p-4 text-center">
               <FileText className="w-6 h-6 text-surface-500 mx-auto mb-2" />
               <p className="text-surface-500 text-xs mb-1">عدد الفواتير</p>
               <p className="text-xl font-bold text-surface-800">{formatNumber(totalInvoices)}</p>
            </CardBody>
         </Card>
         <Card className="bg-white border border-surface-100 shadow-sm">
            <CardBody className="p-4 text-center">
               <Gift className="w-6 h-6 text-amber-500 mx-auto mb-2" />
               <p className="text-surface-500 text-xs mb-1">غسلات الولاء</p>
               <p className="text-xl font-bold text-surface-800">{formatNumber(loyaltyWashes)}</p>
            </CardBody>
         </Card>
         <Card className="bg-white border border-surface-100 shadow-sm">
            <CardBody className="p-4 text-center">
               <CreditCard className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
               <p className="text-surface-500 text-xs mb-1">حركات الاشتراكات</p>
               <p className="text-xl font-bold text-surface-800">{formatNumber(membershipTx)}</p>
            </CardBody>
         </Card>
         <Card className="bg-white border border-surface-100 shadow-sm">
            <CardBody className="p-4 text-center">
               <Tag className="w-6 h-6 text-rose-500 mx-auto mb-2" />
               <p className="text-surface-500 text-xs mb-1">إجمالي الخصومات</p>
               <p className="text-xl font-bold text-surface-800">{formatSAR(totalDiscounts)}</p>
            </CardBody>
         </Card>
      </div>
    </div>
  );
}

