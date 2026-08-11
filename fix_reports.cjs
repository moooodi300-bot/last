const fs = require('fs');
let code = fs.readFileSync('src/pages/ReportsPage.tsx', 'utf8');

const currentTenantIdVar = "const currentTenantId = organization?.id || 'org_client_01';";
if (!code.includes("currentTenantId")) {
  code = code.replace(
    "const { organization } = useAuth();",
    "const { organization } = useAuth();\n  const currentTenantId = organization?.id || 'org_client_01';"
  );
}

code = code.replace(
  /localStorage\.getItem\('mobile_vehicles'\)/g,
  "localStorage.getItem(`mobile_vehicles_${currentTenantId}`)"
);

fs.writeFileSync('src/pages/ReportsPage.tsx', code);
