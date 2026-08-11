import type { DiscountCode } from './types';

function getTenantStorageKey(tenantId?: string): string {
  const cleanId = tenantId ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'org_client_01';
  return `tenant_discounts_${cleanId}`;
}

export function getLocalDiscounts(tenantId?: string): DiscountCode[] {
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

export function saveLocalDiscount(discount: DiscountCode, tenantId?: string): DiscountCode[] {
  try {
    const key = getTenantStorageKey(tenantId);
    const current = getLocalDiscounts(tenantId);
    const updated = [discount, ...current.filter((d) => d.id !== discount.id)];
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function deleteLocalDiscount(discountId: string, tenantId?: string): DiscountCode[] {
  try {
    const key = getTenantStorageKey(tenantId);
    const current = getLocalDiscounts(tenantId);
    const updated = current.filter((d) => d.id !== discountId);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function validateAndCalculateDiscount(code: string, subtotal: number, tenantId?: string) {
  const discounts = getLocalDiscounts(tenantId);
  const discount = discounts.find(d => d.code.toLowerCase() === code.toLowerCase());
  
  if (!discount) return { valid: false, error: 'كود الخصم غير موجود' };
  if (!discount.is_active) return { valid: false, error: 'كود الخصم غير مفعل' };
  
  const today = new Date().toISOString().split('T')[0];
  if (discount.start_date && discount.start_date > today) return { valid: false, error: 'كود الخصم لم يبدأ بعد' };
  if (discount.end_date && discount.end_date < today) return { valid: false, error: 'كود الخصم منتهي الصلاحية' };
  
  if (discount.max_uses > 0 && discount.uses_count >= discount.max_uses) {
    return { valid: false, error: 'تم تجاوز الحد الأقصى لاستخدام كود الخصم' };
  }
  
  if (discount.min_invoice_amount && subtotal < discount.min_invoice_amount) {
    return { valid: false, error: `يجب أن يكون مبلغ الفاتورة على الأقل ${discount.min_invoice_amount} ريال` };
  }
  
  let discountAmount = 0;
  if (discount.type === 'percentage') {
    discountAmount = subtotal * (discount.value / 100);
  } else {
    discountAmount = discount.value;
  }
  
  if (discount.max_discount_amount && discountAmount > discount.max_discount_amount) {
    discountAmount = discount.max_discount_amount;
  }
  
  return { valid: true, discount, discountAmount };
}

export function incrementDiscountUsage(codeStr: string, tenantId?: string) {
  const discounts = getLocalDiscounts(tenantId);
  const discount = discounts.find(d => d.code === codeStr);
  if (discount) {
    discount.uses_count = (discount.uses_count || 0) + 1;
    saveLocalDiscount(discount, tenantId);
  }
}

export type { DiscountCode };
