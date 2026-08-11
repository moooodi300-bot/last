import type { Lang } from './i18n';
import { tr } from './i18n';

export type Role = string;

export type Permission =
  | 'dashboard.view'
  | 'customers.view' | 'customers.add' | 'customers.edit' | 'customers.delete'
  | 'products.view' | 'products.add' | 'products.edit' | 'products.delete'
  | 'sales.view' | 'sales.create' | 'sales.edit' | 'sales.cancel' | 'sales.discount' | 'sales.refund'
  | 'workcards.view' | 'workcards.create' | 'workcards.edit' | 'workcards.status' | 'workcards.whatsapp'
  | 'purchases.view' | 'purchases.create' | 'purchases.edit' | 'purchases.delete'
  | 'expenses.view' | 'expenses.add' | 'expenses.edit' | 'expenses.delete'
  | 'reports.view' | 'reports.export'
  | 'settings.view' | 'settings.edit' | 'settings.loyalty' | 'settings.memberships' | 'settings.costs' | 'settings.users' | 'settings.roles'
  | 'mobile.view'
  | 'billing.view';

export const ALL_PERMISSIONS: { key: Permission; label: string; group: string }[] = [
  { key: 'dashboard.view', label: 'عرض لوحة القيادة', group: 'Dashboard' },
  { key: 'customers.view', label: 'عرض العملاء', group: 'Customers' },
  { key: 'customers.add', label: 'إضافة عميل', group: 'Customers' },
  { key: 'customers.edit', label: 'تعديل عميل', group: 'Customers' },
  { key: 'customers.delete', label: 'حذف عميل', group: 'Customers' },
  { key: 'products.view', label: 'عرض الخدمات والمنتجات', group: 'Products' },
  { key: 'products.add', label: 'إضافة منتج/خدمة', group: 'Products' },
  { key: 'products.edit', label: 'تعديل منتج/خدمة', group: 'Products' },
  { key: 'products.delete', label: 'حذف منتج/خدمة', group: 'Products' },
  { key: 'sales.view', label: 'عرض المبيعات', group: 'Sales' },
  { key: 'sales.create', label: 'إنشاء فاتورة', group: 'Sales' },
  { key: 'sales.edit', label: 'تعديل فاتورة', group: 'Sales' },
  { key: 'sales.cancel', label: 'إلغاء فاتورة', group: 'Sales' },
  { key: 'sales.discount', label: 'تطبيق خصم', group: 'Sales' },
  { key: 'sales.refund', label: 'استرجاع', group: 'Sales' },
  { key: 'workcards.view', label: 'عرض كروت العمل', group: 'Work Cards' },
  { key: 'workcards.create', label: 'إنشاء كرت عمل', group: 'Work Cards' },
  { key: 'workcards.edit', label: 'تعديل كرت عمل', group: 'Work Cards' },
  { key: 'workcards.status', label: 'تغيير الحالة', group: 'Work Cards' },
  { key: 'workcards.whatsapp', label: 'إرسال واتساب', group: 'Work Cards' },
  { key: 'purchases.view', label: 'عرض المشتريات', group: 'Purchases' },
  { key: 'purchases.create', label: 'إضافة مشتريات', group: 'Purchases' },
  { key: 'purchases.edit', label: 'تعديل مشتريات', group: 'Purchases' },
  { key: 'purchases.delete', label: 'حذف مشتريات', group: 'Purchases' },
  { key: 'expenses.view', label: 'عرض المصروفات', group: 'Expenses' },
  { key: 'expenses.add', label: 'إضافة مصروفات', group: 'Expenses' },
  { key: 'expenses.edit', label: 'تعديل مصروفات', group: 'Expenses' },
  { key: 'expenses.delete', label: 'حذف مصروفات', group: 'Expenses' },
  { key: 'reports.view', label: 'عرض التقارير', group: 'Reports' },
  { key: 'reports.export', label: 'تصدير التقارير', group: 'Reports' },
  { key: 'settings.view', label: 'عرض الإعدادات', group: 'Settings' },
  { key: 'settings.edit', label: 'تعديل الإعدادات', group: 'Settings' },
  { key: 'settings.loyalty', label: 'إدارة الولاء', group: 'Settings' },
  { key: 'settings.memberships', label: 'إدارة الاشتراكات', group: 'Settings' },
  { key: 'settings.costs', label: 'إدارة التكاليف', group: 'Settings' },
  { key: 'settings.users', label: 'إدارة المستخدمين', group: 'Settings' },
  { key: 'settings.roles', label: 'إدارة الصلاحيات', group: 'Settings' },
  { key: 'mobile.view', label: 'عرض النظام المتنقل', group: 'Mobile' },
  { key: 'billing.view', label: 'عرض الفوترة', group: 'Billing' },
];

export interface RoleDef {
  id: string;
  name: string;
  permissions: Permission[];
  is_system?: boolean;
}

export const SYSTEM_ROLES: RoleDef[] = [
  { id: 'owner', name: 'المالك', is_system: true, permissions: ALL_PERMISSIONS.map(p => p.key) },
  { id: 'manager', name: 'مدير النظام', is_system: true, permissions: ALL_PERMISSIONS.map(p => p.key).filter(p => !['billing.view'].includes(p)) },
  { id: 'cashier', name: 'كاشير', is_system: true, permissions: ['dashboard.view', 'sales.view', 'sales.create', 'customers.view', 'customers.add'] },
  { id: 'mobile_cashier', name: 'كاشير متنقل', is_system: true, permissions: ['mobile.view', 'customers.view', 'customers.add'] },
  { id: 'employee', name: 'موظف', is_system: true, permissions: ['workcards.view', 'workcards.status'] }
];

export function getRoles(tenantId?: string): RoleDef[] {
  try {
    const customRoles = localStorage.getItem(`tenant_roles_${tenantId || "default"}`);
    if (customRoles) {
      return [...SYSTEM_ROLES, ...JSON.parse(customRoles)];
    }
  } catch {}
  return SYSTEM_ROLES;
}

export function saveRoles(roles: RoleDef[], tenantId?: string) {
  const customOnly = roles.filter(r => !r.is_system);
  localStorage.setItem(`tenant_roles_${tenantId || "default"}`, JSON.stringify(customOnly));
}

export function hasPermission(roleId: string, permission: Permission, tenantId?: string): boolean {
  const role = getRoles(tenantId).find(r => r.id === roleId);
  if (!role) return false;
  return role.permissions.includes(permission);
}

export function roleLabel(role: string, lang: Lang, tenantId?: string): string {
  const r = getRoles(tenantId).find(x => x.id === role);
  return r ? r.name : role;
}

export type ModuleKey =
  | 'dashboard'
  | 'sales'
  | 'invoices'
  | 'customers'
  | 'purchases'
  | 'jobcards'
  | 'reports'
  | 'settings'
  | 'mobile'
  | 'billing';

export const MODULE_PERMISSIONS: Record<ModuleKey, Permission> = {
  dashboard: 'dashboard.view',
  sales: 'sales.view',
  invoices: 'sales.view', // invoices is part of sales
  customers: 'customers.view',
  purchases: 'purchases.view',
  jobcards: 'workcards.view',
  reports: 'reports.view',
  settings: 'settings.view',
  mobile: 'mobile.view',
  billing: 'billing.view'
};

export interface ModuleDef {
  key: ModuleKey;
  icon: string;
}

export const MODULES: ModuleDef[] = [
  { key: 'dashboard', icon: 'LayoutDashboard' },
  { key: 'sales', icon: 'ShoppingCart' },
  { key: 'invoices', icon: 'FileText' },
  { key: 'customers', icon: 'Users' },
  { key: 'mobile', icon: 'Truck' },
  { key: 'jobcards', icon: 'ClipboardList' },
  { key: 'purchases', icon: 'ShoppingBag' },
  { key: 'reports', icon: 'BarChart3' },
  { key: 'settings', icon: 'Settings' },
  { key: 'billing', icon: 'CreditCard' },
];

export function canAccess(role: string, key: ModuleKey, tenantId?: string): boolean {
  return hasPermission(role, MODULE_PERMISSIONS[key], tenantId);
}
