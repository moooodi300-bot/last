const fs = require('fs');
let code = fs.readFileSync('src/pages/SalesPage.tsx', 'utf8');

code = code.replace(
  /const storedCustomers = localStorage\.getItem.*?JSON\.parse\(storedCustomers\) : \[\];/s,
  `const loadedCu = mergeCustomerLists([], currentTenantId);`
);

fs.writeFileSync('src/pages/SalesPage.tsx', code);
