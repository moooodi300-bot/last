const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

// Ensure supabase and settings exist
if (!content.includes('import { supabase }')) {
  content = content.replace("import { useAuth } from '@/lib/auth';", "import { useAuth } from '@/lib/auth';\nimport { supabase } from '@/lib/supabase';");
}

const newHandleSave = `  const { signOut, user, organization, settings, refreshSettings } = useAuth();
  const [activeTab, setActiveTab] = useState<'facility' | 'fleet' | 'billing' | 'backup'>('facility');
  
  const [facility, setFacility] = useState({ name: organization?.name || 'مغسلتي', phone: settings?.phone || '', vat: settings?.vat_number || '', cr: (settings as any)?.cr_number || '' });
  const [loyaltyEnabled, setLoyaltyEnabled] = useState(settings?.loyalty_enabled ?? true);
  const [freeWashThreshold, setFreeWashThreshold] = useState(settings?.loyalty_target ?? 5);
  const [fleetWorker, setFleetWorker] = useState('0559998877');
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!settings?.id) return;
    setLoading(true);
    try {
      await supabase.from('settings').update({
        phone: facility.phone,
        vat_number: facility.vat,
        cr_number: facility.cr,
        loyalty_enabled: loyaltyEnabled,
        loyalty_target: freeWashThreshold
      }).eq('id', settings.id);
      
      // Also update organization name if it changed
      if (organization && facility.name !== organization.name) {
        await supabase.from('organizations').update({ name: facility.name }).eq('id', organization.id);
      }
      
      await refreshSettings();
      alert('تم حفظ الإعدادات بنجاح');
    } catch (e) {
      console.error(e);
      alert('حدث خطأ أثناء الحفظ');
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(/  const \{ signOut, user, organization \} = useAuth\(\);[\s\S]*?alert\('تم حفظ الإعدادات بنجاح \(محاكاة\)'\);\n  \};/, newHandleSave);

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
