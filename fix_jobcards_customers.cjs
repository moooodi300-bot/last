const fs = require('fs');
let jc = fs.readFileSync('src/pages/JobCardsPage.tsx', 'utf8');

jc = jc.replace(
  /const storedCustomers = localStorage\.getItem.*?setCustomers\(loadedC\);/s,
  `setCustomers(mergeCustomerLists([], currentTenantId));`
);

fs.writeFileSync('src/pages/JobCardsPage.tsx', jc);
