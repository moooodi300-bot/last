import re

with open('src/pages/SettingsPage.tsx', 'r') as f:
    content = f.read()

# Add import getTenantPackages
if "getTenantPackages" not in content:
    content = content.replace(
        "import { saveTenantPackage } from '@/lib/subscriptionStore';",
        "import { saveTenantPackage, getTenantPackages } from '@/lib/subscriptionStore';"
    )

# Fix loadSubs
load_subs_start = content.find("const loadSubs = () => {")
load_subs_end = content.find("};", load_subs_start) + 2

new_load_subs = """const loadSubs = () => {
    try {
      const packages = getTenantPackages(currentTenantId);
      setSubs(packages.map(p => ({
         id: p.id,
         name: p.name,
         price: p.monthly_price || p.price_monthly || 0,
         washes: p.washes_included,
         durationDays: 30
      })));
    } catch(e) {}
  };"""
content = content[:load_subs_start] + new_load_subs + content[load_subs_end:]

# Fix handleSaveSubs
handle_save_subs_start = content.find("const handleSaveSubs = () => {")
handle_save_subs_end = content.find("};", handle_save_subs_start) + 2
new_handle_save_subs = """const handleSaveSubs = () => {
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
       } as any, currentTenantId);
    });
    alert('تم حفظ الاشتراكات بنجاح. ستظهر الآن في الكاشير.');
  };"""
content = content[:handle_save_subs_start] + new_handle_save_subs + content[handle_save_subs_end:]

# Add a button in UI to save subs explicitly? Wait, there is no save button for subs in the UI?
# Let's check where handleSaveSubs is used.
with open('src/pages/SettingsPage.tsx', 'w') as f:
    f.write(content)
