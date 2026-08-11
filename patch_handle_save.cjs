const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const newHandleSave = `  const handleSave = async () => {
    if (!settings?.id) return;
    setLoading(true);
    try {
      await supabase.from('settings').update({
        phone: facility.phone,
        vat_number: facility.vat,
        cr_number: facility.cr,
        loyalty_enabled: loyaltyEnabled,
        loyalty_target: freeWashThreshold,
        daily_volume_target: expectedDaily
      }).eq('id', settings.id);
      
      if (organization && facility.name !== organization.name) {
        await supabase.from('organizations').update({ name: facility.name }).eq('id', organization.id);
      }
      
      // Save services and products
      // First delete all non-matching, or just delete all and insert? Deleting all can break foreign keys in sales.
      // Better to insert or update. Since it's a simple app, we can do upserts if they have IDs, or just insert new ones and delete missing ones.
      // Assuming we have IDs:
      const allItems = [...services.map(s => ({...s, is_product: false})), ...products.map(p => ({...p, is_product: true}))];
      for (const item of allItems) {
        if (item.id) {
           await supabase.from('services').update({ name: item.name, price: item.price, active: true }).eq('id', item.id);
        } else {
           await supabase.from('services').insert({ name: item.name, price: item.price, active: true, is_product: item.is_product });
        }
      }
      
      await refreshSettings();
      alert('تم حفظ الإعدادات بنجاح');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
      loadServicesAndProducts();
    }
  };`;

content = content.replace(
  /const handleSave = async \(\) => \{[\s\S]*?setLoading\(false\);\n    \}\n  \};/,
  newHandleSave
);

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
