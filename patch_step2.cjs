const fs = require('fs');

let appCode = fs.readFileSync('src/App.tsx', 'utf8');
appCode = appCode.replace("import { AccountsPage } from '@/pages/AccountsPage';\n", "");
appCode = appCode.replace("      case 'accounts': return <AccountsPage />;\n", "");
fs.writeFileSync('src/App.tsx', appCode);

let rbacCode = fs.readFileSync('src/lib/rbac.ts', 'utf8');
rbacCode = rbacCode.replace("  accounts: 'navAccounts',\n", "");
rbacCode = rbacCode.replace("  | 'accounts'\n", "");
rbacCode = rbacCode.replace("  { key: 'accounts', icon: 'Wallet', roles: ['owner', 'accountant'] },\n", "");
rbacCode = rbacCode.replace("'accounts', ", "");
fs.writeFileSync('src/lib/rbac.ts', rbacCode);

let i18nCode = fs.readFileSync('src/lib/i18n.ts', 'utf8');
i18nCode = i18nCode.replace("  navAccounts: { ar: 'الحسابات العامة', en: 'General Accounts' },\n", "");
fs.writeFileSync('src/lib/i18n.ts', i18nCode);
