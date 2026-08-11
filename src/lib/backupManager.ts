export interface BackupData {
  version: number;
  timestamp: string;
  tenant_id: string;
  data: Record<string, any>;
}

export function exportTenantBackup(tenantId: string): string {
  if (!tenantId) throw new Error('Tenant ID is required for backup');

  const keys = [
    `tenant_customers_${tenantId}`,
    `raqam_products_v2_${tenantId}`,
    `tenant_sales_${tenantId}`,
    `tenant_purchases_${tenantId}`,
    `accounts_transactions_${tenantId}`,
    `mobile_appointments_${tenantId}`,
    `mobile_vehicles_${tenantId}`,
    `job_cards_${tenantId}`,
    `subscriptions_${tenantId}`,
    `sub_usage_logs_${tenantId}`,
    `tenant_discounts_${tenantId}`,
    `tenant_discounts_usage_${tenantId}`,
    `tenant_loyalty_settings_${tenantId}`,
    `tenant_loyalty_logs_${tenantId}`,
    `raqm_app_settings_${tenantId}`,
    `tenant_roles_${tenantId || "default"}`
  ];

  const backup: BackupData = {
    version: 1,
    timestamp: new Date().toISOString(),
    tenant_id: tenantId,
    data: {}
  };

  keys.forEach(key => {
    const val = localStorage.getItem(key);
    if (val) {
      try {
        backup.data[key] = JSON.parse(val);
      } catch (e) {
        backup.data[key] = val; // Store as raw string if not JSON
      }
    }
  });

  return JSON.stringify(backup, null, 2);
}

export function importTenantBackup(tenantId: string, backupJson: string): boolean {
  if (!tenantId) throw new Error('Tenant ID is required for restore');

  try {
    const backup: BackupData = JSON.parse(backupJson);
    
    if (backup.tenant_id !== tenantId) {
      throw new Error('لا يمكن استعادة نسخة احتياطية خاصة بمنشأة أخرى (Tenant Mismatch)');
    }
    
    if (backup.version !== 1) {
      throw new Error('إصدار النسخة الاحتياطية غير مدعوم');
    }

    if (backup.data) {
      Object.keys(backup.data).forEach(key => {
        // Double check key belongs to this tenant
        if (key.includes(tenantId)) {
           const val = backup.data[key];
           localStorage.setItem(key, typeof val === 'object' ? JSON.stringify(val) : val);
        }
      });
      return true;
    }
    return false;
  } catch (error) {
    console.error('Import failed', error);
    throw error;
  }
}
