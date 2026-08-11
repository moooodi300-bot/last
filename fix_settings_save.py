import re

with open('src/pages/SettingsPage.tsx', 'r') as f:
    content = f.read()

# Make sure we import saveTenantPackage from subscriptionStore
if "saveTenantPackage" not in content:
    content = content.replace(
        "import { saveAllLocalProducts, getTenantProducts, type ProductItem } from '@/lib/productStore';",
        "import { saveAllLocalProducts, getTenantProducts, type ProductItem } from '@/lib/productStore';\nimport { saveTenantPackage } from '@/lib/subscriptionStore';"
    )

save_func_start = content.find("saveAllLocalProducts(allItems, organization?.id || 'org_client_01');")
save_func_end = save_func_start + len("saveAllLocalProducts(allItems, organization?.id || 'org_client_01');")

new_save_logic = """saveAllLocalProducts(allItems, organization?.id || 'org_client_01');
      
      subs.forEach(sub => {
          saveTenantPackage({
              id: sub.id,
              key: sub.name,
              name: sub.name,
              price_monthly: sub.price,
              monthly_price: sub.price,
              max_branches: 1,
              max_staff: 5,
              features: [],
              sort_order: 1,
              active: true,
              washes_included: sub.washes
          } as any, organization?.id || 'org_client_01');
      });
"""
content = content[:save_func_start] + new_save_logic + content[save_func_end:]

with open('src/pages/SettingsPage.tsx', 'w') as f:
    f.write(content)
