const fs = require('fs');
let code = fs.readFileSync('src/lib/customerStore.ts', 'utf8');
code = code.replace(
  /return \`raqam_custom_customers_v2_\$\{cleanId\}\`;/,
  "return `tenant_customers_${tenantId || 'org_client_01'}`;"
);
fs.writeFileSync('src/lib/customerStore.ts', code);
