const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

code = code.replace(
  "const [facility, setFacility] = useState({ name: organization?.name || 'مغسلتي', phone: settings?.phone || '', vat: settings?.vat_number || '', cr: (settings as any)?.cr_number || '' });",
  "const [facility, setFacility] = useState({ name: settings?.company_name || organization?.name || 'مغسلتي', phone: settings?.phone || '', vat: settings?.vat_number || '', cr: (settings as any)?.cr_number || '' });"
);

code = code.replace(
  "phone: facility.phone,",
  "company_name: facility.name,\n        phone: facility.phone,"
);

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
