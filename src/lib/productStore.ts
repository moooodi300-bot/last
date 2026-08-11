import type { Service } from './types';
import { supabase } from './supabase';

export interface ProductItem extends Service {
  description?: string | null;
  is_product: boolean; // true = retail item (direct sale), false = service
}

export const INITIAL_DEFAULT_PRODUCTS: ProductItem[] = [
  {
    id: 'srv-1',
    name: 'غسيل خارجي بخار ودش ساطع',
    category: 'غسيل ساطع',
    price: 35,
    cost_estimate: 8,
    duration_min: 20,
    active: true,
    is_product: false,
    description: 'غسيل هيكل السيارة الخارجي بالبخار عالي الضغط والتجفيف السريع',
  },
  {
    id: 'srv-2',
    name: 'غسيل شامل وساطع VIP مع تعاطير',
    category: 'غسيل ساطع',
    price: 75,
    cost_estimate: 18,
    duration_min: 35,
    active: true,
    is_product: false,
    description: 'غسيل خارجي وداخلي كامل مع شفط الأتربة وتلميع الديكورات وتطهير بالبخار مع عطر فاخر',
  },
  {
    id: 'srv-3',
    name: 'تلميع ساطع نانو سيراميك H9 كامل',
    category: 'تلميع ساطع',
    price: 350,
    cost_estimate: 85,
    duration_min: 120,
    active: true,
    is_product: false,
    description: 'تلميع مجهري وإزالة الخدوش السطحية مع تطبيق طبقة نانو سيراميك واقية',
  },
  {
    id: 'srv-4',
    name: 'تنظيف وتعقيم المراتب بالبخار الفوري',
    category: 'تلميع ساطع',
    price: 180,
    cost_estimate: 40,
    duration_min: 60,
    active: true,
    is_product: false,
    description: 'إزالة البقع الصعبة والغسيل العميق للمقاعد والفرش الداخلي',
  },
  {
    id: 'prod-1',
    name: 'معطر جو فاخر بالعود الذهبي',
    category: 'صنف للبيع المباشر',
    price: 15,
    cost_estimate: 5,
    duration_min: 0,
    active: true,
    is_product: true,
    description: 'عبوة معطر جو يدوم طويلاً برائحة العود الفاخر للسيارة',
  },
  {
    id: 'prod-2',
    name: 'منشفة ميكروفايبر فاخرة 40x40',
    category: 'صنف للبيع المباشر',
    price: 12,
    cost_estimate: 4,
    duration_min: 0,
    active: true,
    is_product: true,
    description: 'منشفة ميكروفايبر ناعمة عالية الامتصاص لتنظيف وتنشيف السطح بدون خدوش',
  },
  {
    id: 'prod-3',
    name: 'طقم تكييس ودعاسات حماية شفافة',
    category: 'صنف للبيع المباشر',
    price: 5,
    cost_estimate: 1,
    duration_min: 0,
    active: true,
    is_product: true,
    description: 'أكياس بلاستيكية مقواة لحماية أرضية ومقود السيارة بعد الغسيل',
  },
];

function getTenantProductKey(tenantId?: string): string {
  const cleanId = tenantId ? tenantId.replace(/[^a-zA-Z0-9_-]/g, '_') : 'org_client_01';
  return `raqam_products_v2_${cleanId}`;
}

export function getLocalProducts(tenantId?: string): ProductItem[] {
  try {
    const key = getTenantProductKey(tenantId);
    const raw = localStorage.getItem(key);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {
    /* fallback */
  }
  return INITIAL_DEFAULT_PRODUCTS;
}

export function saveLocalProduct(item: ProductItem, tenantId?: string): ProductItem[] {
  try {
    const key = getTenantProductKey(tenantId);
    const current = getLocalProducts(tenantId);
    const updated = [item, ...current.filter((p) => p.id !== item.id)];
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export function saveAllLocalProducts(items: ProductItem[], tenantId?: string): void {
  try {
    const key = getTenantProductKey(tenantId);
    localStorage.setItem(key, JSON.stringify(items));
  } catch (e) {
    console.error('Failed to save products', e);
  }
}

export function deleteLocalProduct(productId: string, tenantId?: string): ProductItem[] {
  try {
    const key = getTenantProductKey(tenantId);
    const current = getLocalProducts(tenantId);
    const updated = current.filter((p) => p.id !== productId);
    localStorage.setItem(key, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

export async function getTenantProducts(tenantId?: string): Promise<ProductItem[]> {
  try {
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    if (data && data.length > 0) {
      const dbItems: ProductItem[] = data.map((d: any) => ({
        id: d.id,
        name: d.name,
        category: d.category || (d.is_product ? 'صنف للبيع المباشر' : 'غسيل ساطع'),
        price: Number(d.price || 0),
        cost_estimate: Number(d.cost_estimate || 0),
        duration_min: Number(d.duration_min || 0),
        active: d.active !== false,
        is_product: !!d.is_product,
        description: d.description || null,
      }));
      // Sync local storage with DB items
      saveAllLocalProducts(dbItems, tenantId);
      return dbItems;
    }
  } catch (e) {
    console.warn('Supabase products fetch fallback to localStorage:', e);
  }
  return getLocalProducts(tenantId);
}
