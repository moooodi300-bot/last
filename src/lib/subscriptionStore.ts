import type { Subscription, CustomerSubscription } from './types';
import { SAMPLE_SUBSCRIPTIONS, SAMPLE_CUSTOMER_SUBSCRIPTIONS } from './mockData';
import { getLocalCustomers, mergeCustomerLists } from './customerStore';

export interface SubscriptionUsageLog {
  id: string;
  customerSubscriptionId: string;
  customerId: string;
  customerName: string;
  phone: string;
  packageName: string;
  plateNumber?: string;
  usedAt: string;
  remainingWashes: number;
  notes?: string;
}

function getTenantKey(prefix: string, tenantId?: string): string {
  const cleanId = tenantId ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'org_client_01';
  return `raqam_${prefix}_v2_${cleanId}`;
}

export function getTenantPackages(tenantId?: string): Subscription[] {
  let list: Subscription[] = [];
  try {
    const key = getTenantKey('packages', tenantId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) list = parsed;
    }
  } catch {}
  if (list.length === 0) {
    list = SAMPLE_SUBSCRIPTIONS;
  }
  return list.map(p => ({
    ...p,
    monthly_price: p.monthly_price ?? (p as any).price_monthly ?? 0,
    price_monthly: p.price_monthly ?? p.monthly_price ?? 0,
    duration_days: p.duration_days ?? 30,
    subscription_type: p.subscription_type ?? 'عدد غسلات + مدة',
    vehicle_scope: p.vehicle_scope ?? 'specific_vehicle',
    included_services: p.included_services ?? 'غسيل شامل وساطع',
    active: p.active !== false,
    tenant_id: p.tenant_id || tenantId || 'org_client_01',
  }));
}

export function saveTenantPackage(pkg: Subscription, tenantId?: string): Subscription[] {
  const current = getTenantPackages(tenantId);
  const exists = current.some((p) => p.id === pkg.id);
  const updatedPkg: Subscription = {
    ...pkg,
    monthly_price: pkg.monthly_price ?? pkg.price_monthly ?? 0,
    price_monthly: pkg.price_monthly ?? pkg.monthly_price ?? 0,
    duration_days: pkg.duration_days ?? 30,
    subscription_type: pkg.subscription_type ?? 'عدد غسلات + مدة',
    vehicle_scope: pkg.vehicle_scope ?? 'specific_vehicle',
    included_services: pkg.included_services ?? 'غسيل شامل وساطع',
    active: pkg.active !== false,
    tenant_id: tenantId || 'org_client_01',
  };
  const updated = exists ? current.map((p) => (p.id === pkg.id ? updatedPkg : p)) : [updatedPkg, ...current];
  try {
    const key = getTenantKey('packages', tenantId);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('raqam_data_updated'));
  } catch {}
  return updated;
}

export function togglePackageActive(packageId: string, active: boolean, tenantId?: string): Subscription[] {
  const current = getTenantPackages(tenantId);
  const updated = current.map((p) => (p.id === packageId ? { ...p, active } : p));
  try {
    const key = getTenantKey('packages', tenantId);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('raqam_data_updated'));
  } catch {}
  return updated;
}

export function deleteTenantPackage(packageId: string, tenantId?: string): Subscription[] {
  const current = getTenantPackages(tenantId);
  const updated = current.filter((p) => p.id !== packageId);
  try {
    const key = getTenantKey('packages', tenantId);
    localStorage.setItem(key, JSON.stringify(updated));
    window.dispatchEvent(new Event('raqam_data_updated'));
  } catch {}
  return updated;
}

export function getTenantCustomerSubscriptions(tenantId?: string): (CustomerSubscription & { customer_name?: string; customer_phone?: string; package_name?: string; total_washes?: number })[] {
  let list: CustomerSubscription[] = [];
  try {
    const key = getTenantKey('cust_subs', tenantId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) list = parsed;
    }
  } catch {}

  if (list.length === 0) {
    list = SAMPLE_CUSTOMER_SUBSCRIPTIONS;
  } else if (list.length < 5) {
    // Merge sample subscriptions that are not present by id
    const existingIds = new Set(list.map((s) => s.id));
    for (const sample of SAMPLE_CUSTOMER_SUBSCRIPTIONS) {
      if (!existingIds.has(sample.id)) {
        list.push(sample);
      }
    }
  }

  const packages = getTenantPackages(tenantId);
  const pkgMap = new Map(packages.map((p) => [p.id, p]));
  const customers = mergeCustomerLists([], tenantId);
  const custMap = new Map(customers.map((c) => [c.id, c]));

  return list.map((cs) => {
    const cust = custMap.get(cs.customer_id);
    const pkg = pkgMap.get(cs.subscription_id);
    const pkgName = cs.package_name_snapshot || (cs as any).package_name || (pkg ? pkg.name : 'باقة غسيل');
    const totalWashes = cs.total_washes !== undefined ? cs.total_washes : (pkg ? pkg.washes_included : (cs.washes_used + cs.washes_remaining));
    return {
      ...cs,
      tenant_id: cs.tenant_id || tenantId || 'org_client_01',
      customer_name: cust ? cust.name : ((cs as any).customer_name || 'عميل مشترك'),
      customer_phone: cust ? cust.phone || '' : ((cs as any).customer_phone || ''),
      package_name: pkgName,
      package_name_snapshot: pkgName,
      subscription_type: cs.subscription_type || (pkg ? pkg.subscription_type : 'عدد غسلات + مدة'),
      vehicle_scope: cs.vehicle_scope || (pkg ? pkg.vehicle_scope : 'specific_vehicle'),
      total_washes: totalWashes,
    };
  });
}

export function saveTenantCustomerSubscription(sub: Partial<CustomerSubscription> & { customer_id: string; subscription_id: string }, tenantId?: string): CustomerSubscription {
  const current = getTenantCustomerSubscriptions(tenantId);
  const packages = getTenantPackages(tenantId);
  const pkg = packages.find((p) => p.id === sub.subscription_id);

  const washesIncluded = sub.total_washes !== undefined ? sub.total_washes : (pkg ? pkg.washes_included : 8);
  const durationDays = pkg?.duration_days || 30;
  const pkgName = sub.package_name_snapshot || pkg?.name || 'باقة غسيل';

  const defaultEndDate = new Date(Date.now() + durationDays * 86400000).toISOString().split('T')[0];

  const customers = mergeCustomerLists([], tenantId);
  const cust = customers.find((c) => c.id === sub.customer_id);

  const newSub: CustomerSubscription = {
    id: sub.id || `csub-${Date.now()}`,
    customer_id: sub.customer_id,
    subscription_id: sub.subscription_id,
    tenant_id: tenantId || 'org_client_01',
    package_name_snapshot: pkgName,
    subscription_type: sub.subscription_type || pkg?.subscription_type || 'عدد غسلات + مدة',
    vehicle_scope: sub.vehicle_scope || pkg?.vehicle_scope || 'specific_vehicle',
    vehicle_id: sub.vehicle_id || undefined,
    start_date: sub.start_date || new Date().toISOString().split('T')[0],
    end_date: sub.end_date || defaultEndDate,
    washes_used: sub.washes_used || 0,
    washes_remaining: sub.washes_remaining !== undefined ? sub.washes_remaining : washesIncluded,
    total_washes: washesIncluded,
    status: sub.status || 'active',
    car_type: sub.car_type || cust?.vehicle_type || '',
    car_color: sub.car_color || cust?.vehicle_color || '',
    plate_number: sub.plate_number || cust?.plate_number || '',
    manual_price: sub.manual_price !== undefined && sub.manual_price !== null ? sub.manual_price : (pkg ? pkg.monthly_price : 299),
    payment_method: sub.payment_method || 'cash',
    invoice_id: sub.invoice_id || `inv-${Date.now()}`,
    included_services: sub.included_services || pkg?.included_services || 'غسيل شامل وساطع',
    customer_name: (sub as any).customer_name || cust?.name || 'عميل مشترك',
    customer_phone: (sub as any).customer_phone || cust?.phone || '',
  };

  const updated = [newSub, ...current.filter((s) => s.id !== newSub.id)];
  try {
    const key = getTenantKey('cust_subs', tenantId);
    localStorage.setItem(key, JSON.stringify(updated));

    // Ensure a corresponding Sale record exists for this subscription invoice
    const tid = tenantId || 'org_client_01';
    const salesKeys = [`tenant_sales_${tid}`];
    const cleanId = tid.replace(/[^a-zA-Z0-9_-]/g, '_');
    if (`tenant_sales_${cleanId}` !== `tenant_sales_${tid}`) {
      salesKeys.push(`tenant_sales_${cleanId}`);
    }

    const subPrice = Number(newSub.manual_price ?? (pkg ? pkg.monthly_price : 299));
    const saleId = newSub.invoice_id || `inv-sub-${Date.now()}`;

    salesKeys.forEach((sKey) => {
      let localSales: any[] = [];
      try {
        const raw = localStorage.getItem(sKey);
        if (raw) localSales = JSON.parse(raw);
      } catch {}

      const exists = localSales.some((s: any) => s.id === saleId || (s.notes && s.notes.includes(newSub.id)));
      if (!exists && subPrice >= 0) {
        const pm = newSub.payment_method || 'cash';
        const isCash = pm === 'cash' || pm === 'split';
        const isCard = pm === 'card' || pm === 'transfer' || pm === 'split';

        const autoSale = {
          id: saleId,
          customer_id: newSub.customer_id,
          staff_id: null,
          branch_id: null,
          customer_subscription_id: newSub.id,
          total: subPrice,
          cash_amount: isCash ? subPrice : 0,
          card_amount: isCard ? subPrice : 0,
          payment_method: pm,
          wash_count: 0,
          is_free: false,
          notes: `شراء/تجديد اشتراك - ${newSub.package_name_snapshot || 'باقة غسيل'} (العميل: ${newSub.customer_name || 'عميل'} - ${newSub.customer_phone || ''})`,
          is_refund: false,
          refund_amount: 0,
          refund_method: null,
          created_at: new Date().toISOString(),
          subscription_id: newSub.subscription_id,
          original_sale_id: null,
        };

        const updatedSales = [autoSale, ...localSales.filter((s: any) => s.id !== saleId)];
        try {
          localStorage.setItem(sKey, JSON.stringify(updatedSales));
        } catch {}
      }
    });

    window.dispatchEvent(new Event('raqam_data_updated'));
  } catch {}

  return newSub;
}

export function getSubscriptionUsageLogs(tenantId?: string): SubscriptionUsageLog[] {
  try {
    const key = getTenantKey('sub_usage_logs', tenantId);
    const raw = localStorage.getItem(key);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [
    {
      id: 'ulog-1',
      customerSubscriptionId: 'csub-1',
      customerId: 'c-3',
      customerName: 'سارة محمد',
      phone: '0503333333',
      packageName: 'باقة غسيل شهرية كلاسيك',
      plateNumber: 'ر ك م 9900',
      usedAt: new Date(Date.now() - 86400000 * 1).toISOString(),
      remainingWashes: 4,
      notes: 'خصم غسلة دورية من الباقة',
    },
    {
      id: 'ulog-2',
      customerSubscriptionId: 'csub-2',
      customerId: 'c-6',
      customerName: 'ماجد الشمري',
      phone: '0506666666',
      packageName: 'باقة الأساطيل والشركات',
      plateNumber: 'ك و ب 1122',
      usedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
      remainingWashes: 23,
      notes: 'غسيل مركبة أسطول',
    },
  ];
}

export function validateSubscriptionForVehicle(
  csub: CustomerSubscription,
  vehiclePlate?: string,
  vehicleColor?: string
): { valid: boolean; warning?: string } {
  if (csub.vehicle_scope === 'all_vehicles') {
    return { valid: true };
  }
  const subPlate = (csub.plate_number || '').trim().toLowerCase();
  const reqPlate = (vehiclePlate || '').trim().toLowerCase();
  if (subPlate && reqPlate && subPlate !== reqPlate) {
    return {
      valid: false,
      warning: `⚠️ هذا الاشتراك مرتبط بسيارة أخرى (لوحة: ${csub.plate_number} | لون: ${csub.car_color || 'غير محدد'}). لا ينطبق على السيارة الحالية.`
    };
  }
  return { valid: true };
}

export function consumeSubscriptionWash(
  csubId: string,
  notes?: string,
  tenantId?: string
): { success: boolean; remaining: number; message: string } {
  const currentSubs = getTenantCustomerSubscriptions(tenantId);
  const target = currentSubs.find((s) => s.id === csubId);
  if (!target) return { success: false, remaining: 0, message: 'الاشتراك غير موجود' };
  if (target.washes_remaining <= 0) return { success: false, remaining: 0, message: 'انتهت رصيد الغسلات المتاحة في هذه الباقة' };

  const newRemaining = target.washes_remaining - 1;
  const newUsed = target.washes_used + 1;
  const newStatus = newRemaining === 0 ? 'completed' : target.status;

  const updatedSub: CustomerSubscription = {
    ...target,
    washes_remaining: newRemaining,
    washes_used: newUsed,
    status: newStatus,
  };

  const updatedList = currentSubs.map((s) => (s.id === csubId ? updatedSub : s));
  try {
    const key = getTenantKey('cust_subs', tenantId);
    localStorage.setItem(key, JSON.stringify(updatedList));

    // Save Usage Log
    const currentLogs = getSubscriptionUsageLogs(tenantId);
    const newLog: SubscriptionUsageLog = {
      id: `ulog-${Date.now()}`,
      customerSubscriptionId: csubId,
      customerId: target.customer_id,
      customerName: target.customer_name || 'عميل',
      phone: target.customer_phone || '',
      packageName: target.package_name || 'باقة',
      plateNumber: target.plate_number || '',
      usedAt: new Date().toISOString(),
      remainingWashes: newRemaining,
      notes: notes || 'تم استهلاك غسلة من الباقة',
    };
    localStorage.setItem(getTenantKey('sub_usage_logs', tenantId), JSON.stringify([newLog, ...currentLogs]));

    window.dispatchEvent(new Event('raqam_data_updated'));
  } catch {}

  return { success: true, remaining: newRemaining, message: 'تم استهلاك الغسلة بنجاح' };
}
