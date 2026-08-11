const fs = require('fs');

let content = fs.readFileSync('src/pages/JobCardsPage.tsx', 'utf8');
content = content.replace(
  `import { mergeCustomerLists } from '@/lib/customerStore';`,
  `import { mergeCustomerLists, saveLocalCustomer } from '@/lib/customerStore';`
);

content = content.replace(
  `const handleCreate = () => {`,
  `const handleCreate = () => {
    // Sync customer
    const custId = selectedCustomerId || \`cust-\${Date.now()}\`;
    const newCust = {
      id: custId,
      name: form.customerName,
      phone: form.phone,
      plate_number: form.plate,
      vehicle_type: form.carType,
      created_at: new Date().toISOString()
    };
    saveLocalCustomer(newCust, currentTenantId);
    setCustomers(mergeCustomerLists([], currentTenantId));`
);
fs.writeFileSync('src/pages/JobCardsPage.tsx', content);

let contentMobile = fs.readFileSync('src/pages/MobilePage.tsx', 'utf8');
contentMobile = contentMobile.replace(
  `import { mergeCustomerLists } from '@/lib/customerStore';`,
  `import { mergeCustomerLists, saveLocalCustomer } from '@/lib/customerStore';`
);

contentMobile = contentMobile.replace(
  `const handleBook = () => {`,
  `const handleBook = () => {
    // Sync customer
    const custId = selectedCustomerId || \`cust-\${Date.now()}\`;
    const newCust = {
      id: custId,
      name: form.customerName,
      phone: form.phone,
      created_at: new Date().toISOString()
    };
    saveLocalCustomer(newCust as any, currentTenantId);
    setCustomers(mergeCustomerLists([], currentTenantId));`
);
fs.writeFileSync('src/pages/MobilePage.tsx', contentMobile);
