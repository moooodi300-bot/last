import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Wallet,
  TrendingUp,
  Gift,
  CheckCircle2,
  Award,
  CreditCard,
  PieChart,
  Zap,
  Sparkles,
  Calendar,
  ChevronDown,
} from 'lucide-react';
import {
  calculateLoyaltyMetrics,
  calculateSubscriptionsMetrics,
  type TimeFilter,
  type DateRange,
} from '@/lib/analyticsEngine';
import { useAuth } from '@/lib/auth';

const ICON_MAP: Record<string, any> = {
  Users,
  Wallet,
  TrendingUp,
  Gift,
  CheckCircle2,
  Award,
  CreditCard,
  PieChart,
  Zap,
  Sparkles,
};

interface AnalyticsDashboardHeaderProps {
  type: 'loyalty' | 'subscriptions';
  title?: string;
  subtitle?: string;
}

export function AnalyticsDashboardHeader({ type, title, subtitle }: AnalyticsDashboardHeaderProps) {
  const { organization } = useAuth();
  const currentTenantId = organization?.id || 'org_client_01';

  const [filter, setFilter] = useState<TimeFilter>('month');
  const [customRange, setCustomRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 30 * 86400000).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
  });
  const [showCustomRangeModal, setShowCustomRangeModal] = useState(false);

  const [metrics, setMetrics] = useState<any>(null);

  const refreshMetrics = useCallback(() => {
    if (type === 'loyalty') {
      const data = calculateLoyaltyMetrics(filter, currentTenantId, customRange);
      setMetrics(data);
    } else {
      const data = calculateSubscriptionsMetrics(filter, currentTenantId, customRange);
      setMetrics(data);
    }
  }, [type, filter, currentTenantId, customRange]);

  useEffect(() => {
    refreshMetrics();

    const handleUpdate = () => refreshMetrics();
    window.addEventListener('raqam_data_updated', handleUpdate);
    window.addEventListener('storage', handleUpdate);

    return () => {
      window.removeEventListener('raqam_data_updated', handleUpdate);
      window.removeEventListener('storage', handleUpdate);
    };
  }, [refreshMetrics]);

  if (!metrics) return null;

  const metricItems = [
    metrics.benefitingCustomers,
    metrics.totalRevenue,
    metrics.growthRate,
    type === 'loyalty' ? metrics.redemptionRate : metrics.usageRate,
    metrics.consumedTransactions,
    type === 'loyalty' ? metrics.targetEffectiveness : metrics.mostPopularPackage,
  ];

  return (
    <div className="space-y-4 mb-8">
      {/* Top Header & Time Filter Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-surface-200 shadow-sm">
        <div>
          <h2 className="text-xl font-black text-surface-800 flex items-center gap-2">
            {type === 'loyalty' ? (
              <Award className="w-6 h-6 text-amber-500" />
            ) : (
              <Sparkles className="w-6 h-6 text-primary-500" />
            )}
            {title || (type === 'loyalty' ? 'مؤشرات أداء برنامج الولاء' : 'مؤشرات أداء باقات الاشتراكات')}
          </h2>
          <p className="text-xs text-surface-500 mt-0.5">
            {subtitle || (type === 'loyalty' ? 'تحليل رقمي مباشر لتفاعل العملاء واسترداد الغسلات المجانية' : 'تحليل حركة الاشتراكات واستخلاص المؤشرات المالية وتحديثها لحظياً')}
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 bg-surface-100 p-1 rounded-xl self-start sm:self-auto overflow-x-auto">
          <button
            onClick={() => setFilter('today')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'today'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200/60'
            }`}
          >
            اليوم
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'week'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200/60'
            }`}
          >
            هذا الأسبوع
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
              filter === 'month'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200/60'
            }`}
          >
            هذا الشهر
          </button>
          <button
            onClick={() => {
              setFilter('custom');
              setShowCustomRangeModal(true);
            }}
            className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all flex items-center gap-1 ${
              filter === 'custom'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-surface-600 hover:text-surface-900 hover:bg-surface-200/60'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>نطاق مخصص</span>
          </button>
        </div>
      </div>

      {/* Custom Date Range Controls if active */}
      {filter === 'custom' && (
        <div className="bg-primary-50/70 border border-primary-200 rounded-xl p-3 flex flex-wrap items-center gap-3 text-xs text-surface-700">
          <span className="font-bold text-primary-800 flex items-center gap-1">
            <Calendar className="w-4 h-4 text-primary-600" /> الفترة المحددة:
          </span>
          <div className="flex items-center gap-2">
            <label className="text-surface-500">من:</label>
            <input
              type="date"
              value={customRange.startDate || ''}
              onChange={(e) => setCustomRange((prev) => ({ ...prev, startDate: e.target.value }))}
              className="px-2 py-1 bg-white border border-surface-300 rounded-lg focus:outline-none focus:border-primary-500 text-surface-800"
            />
            <label className="text-surface-500">إلى:</label>
            <input
              type="date"
              value={customRange.endDate || ''}
              onChange={(e) => setCustomRange((prev) => ({ ...prev, endDate: e.target.value }))}
              className="px-2 py-1 bg-white border border-surface-300 rounded-lg focus:outline-none focus:border-primary-500 text-surface-800"
            />
          </div>
        </div>
      )}

      {/* Grid of 6 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {metricItems.map((item, idx) => {
          const IconComponent = ICON_MAP[item.icon] || Award;
          const isHighlight = idx === 1 || idx === 0;

          return (
            <div
              key={idx}
              className={`relative overflow-hidden p-4 rounded-2xl border transition-all duration-200 hover:shadow-md ${
                isHighlight
                  ? 'bg-gradient-to-br from-surface-900 to-surface-800 text-white border-surface-800'
                  : 'bg-white text-surface-800 border-surface-200 hover:border-surface-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-xs font-medium truncate max-w-[130px] ${isHighlight ? 'text-surface-300' : 'text-surface-500'}`}>
                  {item.title}
                </span>
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isHighlight
                      ? 'bg-primary-500/20 text-primary-400'
                      : 'bg-primary-50 text-primary-600'
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                </div>
              </div>

              <div className="flex items-baseline justify-between gap-1">
                <div className="text-xl font-black tracking-tight truncate">
                  {item.value}
                </div>
                {item.trend && (
                  <span
                    className={`text-[11px] font-bold px-1.5 py-0.5 rounded-full shrink-0 ${
                      item.trend.isPositive
                        ? isHighlight
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-emerald-100 text-emerald-700'
                        : isHighlight
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {item.trend.value}
                  </span>
                )}
              </div>

              {item.subtext && (
                <p className={`text-[11px] mt-1.5 truncate ${isHighlight ? 'text-surface-400' : 'text-surface-400'}`}>
                  {item.subtext}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
