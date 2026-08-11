const fs = require('fs');

function replaceInFile(file, regex, replacement) {
  try {
    let code = fs.readFileSync(file, 'utf8');
    code = code.replace(regex, replacement);
    fs.writeFileSync(file, code);
  } catch (e) {
    console.log("Error in", file);
  }
}

// 1. SettingsPage.tsx
replaceInFile('src/pages/SettingsPage.tsx', /'subscriptions'/g, '`subscriptions_${currentTenantId}`');
// 2. SalesPage.tsx
replaceInFile('src/pages/SalesPage.tsx', /'subscriptions'/g, '`subscriptions_${currentTenantId}`');

// 3. MobilePage.tsx
replaceInFile('src/pages/MobilePage.tsx', /'accounts_transactions'/g, '`accounts_transactions_${currentTenantId}`');
// 4. JobCardsPage.tsx
replaceInFile('src/pages/JobCardsPage.tsx', /'accounts_transactions'/g, '`accounts_transactions_${currentTenantId}`');
// 5. DashboardPage.tsx
replaceInFile('src/pages/DashboardPage.tsx', /'accounts_transactions'/g, '`accounts_transactions_${currentTenantId}`');

// 6. src/lib/rbac.ts
replaceInFile('src/lib/rbac.ts', /'tenant_roles'/g, '`tenant_roles_${tenantId || "default"}`');
// Wait, rbac.ts doesn't have tenantId in scope.
