const fs = require('fs');
let code = fs.readFileSync('src/pages/SettingsPage.tsx', 'utf8');

const currentTenantIdVar = "const currentTenantId = organization?.id || 'org_client_01';";
if (!code.includes(currentTenantIdVar)) {
  code = code.replace(
    "const { signOut, user, organization, settings, refreshSettings, setSettings } = useAuth();",
    "const { signOut, user, organization, settings, refreshSettings, setSettings } = useAuth();\n  const currentTenantId = organization?.id || 'org_client_01';"
  );
}

code = code.replace(
  /localStorage\.getItem\('mobile_vehicles'\)/g,
  "localStorage.getItem(`mobile_vehicles_${currentTenantId}`)"
);

code = code.replace(
  /localStorage\.setItem\('mobile_vehicles'/g,
  "localStorage.setItem(`mobile_vehicles_${currentTenantId}`"
);

fs.writeFileSync('src/pages/SettingsPage.tsx', code);
