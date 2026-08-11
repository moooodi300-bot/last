import type { Customer } from './types';
import { getLocalCustomers, saveLocalCustomer } from './customerStore';
import { getSampleCustomersForTenant } from './mockData';
import { supabase } from './supabase';

export interface LoyaltyConfig {
  target: number; // e.g. 4 (meaning 4 paid washes, 5th wash free)
  enabled: boolean;
  rewardName: string;
  updatedAt: string;
}

export interface LoyaltyRedemptionLog {
  id: string;
  customerId: string;
  customerName: string;
  phone: string;
  washCountAtRedemption: number;
  redeemedAt: string;
  notes?: string;
}

const DEFAULT_LOYALTY_CONFIG: LoyaltyConfig = {
  target: 4, // 4 paid washes, 5th wash free
  enabled: true,
  rewardName: 'غسيل مجاني بالكامل (الخامسة مجاناً)',
  updatedAt: new Date().toISOString(),
};

function getTenantLoyaltyKey(tenantId?: string): string {
  const cleanId = tenantId ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'org_client_01';
  return `raqam_loyalty_config_v2_${cleanId}`;
}

function getTenantLoyaltyLogsKey(tenantId?: string): string {
  const cleanId = tenantId ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'org_client_01';
  return `raqam_loyalty_logs_v2_${cleanId}`;
}

export function getTenantLoyaltyConfig(tenantId?: string): LoyaltyConfig {
  try {
    const key = getTenantLoyaltyKey(tenantId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed.target === 'number') {
        return parsed;
      }
    }
  } catch {}
  return DEFAULT_LOYALTY_CONFIG;
}

export function saveTenantLoyaltyConfig(config: Partial<LoyaltyConfig>, tenantId?: string): LoyaltyConfig {
  const current = getTenantLoyaltyConfig(tenantId);
  const updated: LoyaltyConfig = {
    ...current,
    ...config,
    updatedAt: new Date().toISOString(),
  };

  try {
    const key = getTenantLoyaltyKey(tenantId);
    localStorage.setItem(key, JSON.stringify(updated));

    // Sync to Supabase settings table if possible
    supabase
      .from('settings')
      .update({
        loyalty_target: updated.target,
        loyalty_enabled: updated.enabled,
      })
      .then(() => {})
      .catch(() => {});
  } catch (e) {
    console.error('Failed to save loyalty config', e);
  }

  // Retroactively sync all existing customer records to match the new target!
  recalculateAllCustomersLoyalty(updated.target, tenantId);

  return updated;
}

/**
 * Recalculates loyalty stamps & earned free washes retroactively for all customers of a tenant
 * when the loyalty target changes.
 */
export function recalculateAllCustomersLoyalty(newTarget: number, tenantId?: string): Customer[] {
  const localCusts = getLocalCustomers(tenantId);
  const sampleCusts = getSampleCustomersForTenant(tenantId);

  const combinedMap = new Map<string, Customer>();

  sampleCusts.forEach((c) => combinedMap.set(c.id, { ...c }));
  localCusts.forEach((c) => combinedMap.set(c.id, { ...c }));

  const updatedCustomers: Customer[] = [];

  combinedMap.forEach((cust) => {
    // Total visits / recorded washes
    const totalWashes = cust.total_visits || cust.loyalty_stamps || 0;
    
    // Calculate how many free washes were earned based on total washes & new target (e.g., target=4 means every 5th wash is free)
    const cycleSize = newTarget + 1;
    const freeWashesEarned = Math.floor(totalWashes / cycleSize);
    const currentStamps = totalWashes % cycleSize;

    const updated: Customer = {
      ...cust,
      loyalty_stamps: currentStamps,
      free_washes_earned: freeWashesEarned > 0 ? freeWashesEarned : (cust.loyalty_stamps >= newTarget ? 1 : cust.free_washes_earned || 0),
    };

    saveLocalCustomer(updated, tenantId);
    updatedCustomers.push(updated);
  });

  return updatedCustomers;
}

export function getLoyaltyRedemptionLogs(tenantId?: string): LoyaltyRedemptionLog[] {
  try {
    const key = getTenantLoyaltyLogsKey(tenantId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 'log-1',
      customerId: 'c-104',
      customerName: 'فهد الدوسري',
      phone: '0544444444',
      washCountAtRedemption: 4,
      redeemedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      notes: 'تم تقديم الغسلة الخامس مجاناً تلقائياً',
    },
    {
      id: 'log-2',
      customerId: 'c-108',
      customerName: 'محمد الشهري',
      phone: '0588888888',
      washCountAtRedemption: 4,
      redeemedAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      notes: 'تم تفعيل الهدية مجاناً عبر الكاشير',
    },
  ];
}

export function logLoyaltyRedemption(
  log: Omit<LoyaltyRedemptionLog, 'id' | 'redeemedAt'>,
  tenantId?: string
): void {
  try {
    const key = getTenantLoyaltyLogsKey(tenantId);
    const current = getLoyaltyRedemptionLogs(tenantId);
    const newLog: LoyaltyRedemptionLog = {
      ...log,
      id: `redemp-${Date.now()}`,
      redeemedAt: new Date().toISOString(),
    };
    localStorage.setItem(key, JSON.stringify([newLog, ...current]));
  } catch (e) {
    console.error('Failed to log redemption', e);
  }
}
