const fs = require('fs');
let code = fs.readFileSync('src/pages/CustomersPage.tsx', 'utf8');

code = code.replace(
  /const storedCustomers = localStorage\.getItem.*?JSON\.parse\(storedCustomers\) : \[\];/s,
  `const loadedC = mergeCustomerLists([], currentTenantId);`
);

// We need to import mergeCustomerLists if it's not imported.
if (!code.includes('mergeCustomerLists')) {
  code = code.replace(
    /import \{ saveLocalCustomer \} from '@\/lib\/customerStore';/,
    `import { mergeCustomerLists, saveLocalCustomer } from '@/lib/customerStore';`
  );
}

fs.writeFileSync('src/pages/CustomersPage.tsx', code);
