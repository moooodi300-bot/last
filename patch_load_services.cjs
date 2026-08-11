const fs = require('fs');
let content = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const loadCode = `
  const loadServicesAndProducts = async () => {
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: true });
    if (data) {
      setServices(data.filter(d => !d.is_product));
      setProducts(data.filter(d => d.is_product));
    }
  };
  
  useEffect(() => { loadServicesAndProducts(); }, []);
`;

content = content.replace(
  /useEffect\(\(\) => \{ loadSubs\(\); \}, \[\]\);/,
  "useEffect(() => { loadSubs(); }, []);\n" + loadCode
);

// We need to also load the cost config and other variables if possible, but they are stored in localstorage or db?
// The OnboardingWizard saves them via 'settings' or 'cost_config' - let's check how it saved them.

fs.writeFileSync('src/pages/SettingsPage.tsx', content);
