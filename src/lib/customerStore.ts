import type { Customer } from './types';
import { getSampleCustomersForTenant } from './mockData';

function getTenantStorageKey(tenantId?: string): string {
  const cleanId = tenantId ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'org_client_01';
  return `tenant_customers_${tenantId || 'org_client_01'}`;
}

export function getLocalCustomers(tenantId?: string): Customer[] {
  try {
    const key = getTenantStorageKey(tenantId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {
    // fallback
  }
  return [];
}

export function saveLocalCustomer(cust: Customer, tenantId?: string): Customer[] {
  try {
    const key = getTenantStorageKey(tenantId);
    const current = getLocalCustomers(tenantId);
    const updated = [cust, ...current.filter((c) => c.id !== cust.id && c.name.trim() !== cust.name.trim())];
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function mergeCustomerLists(dbCustomers: Customer[], tenantId?: string): Customer[] {
  const localCusts = getLocalCustomers(tenantId);
  const sampleCusts = getSampleCustomersForTenant(tenantId);
  const map = new Map<string, Customer>();

  // 1. Add tenant-specific sample customers first
  sampleCusts.forEach((c) => map.set(c.id, c));

  // 2. Add local storage customers for this tenant
  localCusts.forEach((c) => {
    for (const [key, val] of map.entries()) {
      if (val.name.trim() === c.name.trim() && key !== c.id) {
        map.delete(key);
      }
    }
    map.set(c.id, c);
  });

  // 3. Add Supabase DB customers
  dbCustomers.forEach((c) => {
    for (const [key, val] of map.entries()) {
      if (val.name.trim() === c.name.trim() && key !== c.id) {
        map.delete(key);
      }
    }
    map.set(c.id, c);
  });

  return Array.from(map.values()).sort((a, b) => {
    const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
    const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
    return dateB - dateA;
  });
}
