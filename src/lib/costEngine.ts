import type { Expense, Purchase, Staff, Settings } from './types';

export interface CostBreakdown {
  capexTotal: number;
  opexTotal: number;
  purchasesTotal: number;
  salariesTotal: number;
  annualFixedTotal: number;
  monthlyFixedFromAnnual: number;
  monthlyFixedDirect: number;
  monthlyFixed: number;
  monthlyVariable: number;
  totalMonthlyCost: number;
  dailyCost: number;
  dailyVolume: number;
  workingDays: number;
  totalCarsPerMonth: number;
  costPerCar: number;
  dailyBreakEvenCars: number;
}

const CAPEX_TYPES = ['decorations', 'signage', 'government_fees', 'municipality_license', 'equipment'];

/**
 * Aggregates all CapEx, OpEx, purchases, and salaries into a single
 * cost-per-car figure using the formula:
 *   costPerCar = totalMonthlyCost / (dailyVolume * workingDays)
 * Annual fixed costs are divided by 12 months automatically.
 */
export function computeCostPerCar(
  expenses: Expense[],
  purchases: Purchase[],
  staff: Staff[],
  settings: Settings,
  avgServicePrice: number = 40
): CostBreakdown {
  // Annual fixed expenses (e.g. annual rent, capex, annual licenses)
  const annualFixedTotal = expenses
    .filter((e) => e.recurring_period === 'yearly' || e.recurring_period === 'annual' || e.category === 'capex' || CAPEX_TYPES.includes(e.expense_type))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const monthlyFixedFromAnnual = annualFixedTotal / 12;

  // Monthly direct fixed expenses (e.g. monthly rent, fixed utilities)
  const monthlyFixedDirect = expenses
    .filter((e) => (e.recurring_period === 'monthly' || e.category === 'opex') && e.recurring_period !== 'yearly' && e.recurring_period !== 'annual' && !CAPEX_TYPES.includes(e.expense_type))
    .reduce((sum, e) => sum + Number(e.amount), 0);

  const capexTotal = annualFixedTotal;
  const opexTotal = monthlyFixedDirect;

  const purchasesTotal = purchases.reduce((sum, p) => sum + Number(p.total), 0);
  const salariesTotal = staff
    .filter((s) => s.active)
    .reduce((sum, s) => sum + Number(s.monthly_salary), 0);

  const monthlyFixed = monthlyFixedFromAnnual + monthlyFixedDirect;
  const monthlyVariable = purchasesTotal + salariesTotal;
  const totalMonthlyCost = monthlyFixed + monthlyVariable;

  const dailyVolume = settings.daily_volume_target || 30;
  const workingDays = settings.working_days || 30;
  const totalCarsPerMonth = dailyVolume * workingDays;
  const costPerCar = totalCarsPerMonth > 0 ? totalMonthlyCost / totalCarsPerMonth : 0;

  const dailyCost = workingDays > 0 ? totalMonthlyCost / workingDays : 0;
  const configuredPrice = settings.avg_service_price ? Number(settings.avg_service_price) : 0;
  const price = configuredPrice > 0 ? configuredPrice : (avgServicePrice > 0 ? avgServicePrice : 40);
  const dailyBreakEvenCars = price > 0 ? Math.ceil(dailyCost / price) : 0;

  return {
    capexTotal,
    opexTotal,
    purchasesTotal,
    salariesTotal,
    annualFixedTotal,
    monthlyFixedFromAnnual,
    monthlyFixedDirect,
    monthlyFixed,
    monthlyVariable,
    totalMonthlyCost,
    dailyCost,
    dailyVolume,
    workingDays,
    totalCarsPerMonth,
    costPerCar,
    dailyBreakEvenCars,
  };
}

export interface ProfitMetrics {
  totalRevenue: number;
  totalCost: number;
  grossProfit: number;
  margin: number;
  avgPricePerCar: number;
  costPerCar: number;
  profitPerCar: number;
  breakEvenCars: number;
}

export function computeProfitMetrics(
  totalRevenue: number,
  totalCars: number,
  costBreakdown: CostBreakdown
): ProfitMetrics {
  const totalCost = costBreakdown.totalMonthlyCost;
  const grossProfit = totalRevenue - totalCost;
  const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
  const avgPricePerCar = totalCars > 0 ? totalRevenue / totalCars : 0;
  const costPerCar = costBreakdown.costPerCar;
  const profitPerCar = avgPricePerCar - costPerCar;
  const breakEvenCars =
    costPerCar > 0 && avgPricePerCar > 0
      ? Math.ceil(totalCost / avgPricePerCar)
      : 0;

  return {
    totalRevenue,
    totalCost,
    grossProfit,
    margin,
    avgPricePerCar,
    costPerCar,
    profitPerCar,
    breakEvenCars,
  };
}

export const EXPENSE_TYPES_CAPEX = [
  { value: 'decorations', ar: 'الديكور', en: 'Decorations' },
  { value: 'signage', ar: 'اللوحة الإعلانية', en: 'Signage' },
  { value: 'government_fees', ar: 'المصاريف الحكومية', en: 'Government Fees' },
  { value: 'municipality_license', ar: 'رخصة البلدية', en: 'Municipality License' },
  { value: 'equipment', ar: 'المعدات', en: 'Equipment' },
];

export const EXPENSE_TYPES_OPEX = [
  { value: 'rent', ar: 'الإيجار', en: 'Rent' },
  { value: 'utilities', ar: 'المرافق (كهرباء/ماء)', en: 'Utilities (Electricity/Water)' },
  { value: 'salaries', ar: 'الرواتب', en: 'Salaries' },
  { value: 'chemicals', ar: 'المواد الكيميائية', en: 'Chemicals' },
  { value: 'marketing', ar: 'التسويق', en: 'Marketing' },
  { value: 'maintenance', ar: 'الصيانة', en: 'Maintenance' },
  { value: 'other', ar: 'أخرى', en: 'Other' },
];

export const DEFAULT_LOYALTY_TARGET = 10;
export const LOYALTY_THRESHOLD = 10;

export function getLoyaltyTarget(settings?: Settings | null): number {
  if (settings && typeof settings.loyalty_target === 'number' && settings.loyalty_target > 0) {
    return settings.loyalty_target;
  }
  return DEFAULT_LOYALTY_TARGET;
}
